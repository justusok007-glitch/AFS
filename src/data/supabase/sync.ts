import type { LocalDatabaseSnapshot } from '../seed/DemoSeedData';
import {
  clearLocalDatabase,
  getOrSeedLocalDatabase,
  replaceLocalDatabase,
} from '../repository/FakeRepositories';
import { Role } from '../../domain/models/models';
import {
  deleteWhere,
  patchRows,
  readTokens,
  rpc,
  selectAll,
  SupabaseError,
  insertRows,
  upsertRows,
} from './client';
import { cloudHooks } from './mode';
import { clearBaseline, loadBaseline, saveBaseline } from './baselineStore';

type Row = Record<string, unknown>;

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

interface TableSpec {
  /** key in LocalDatabaseSnapshot */
  snap: keyof LocalDatabaseSnapshot;
  table: string;
  /** primary key, camelCase field names */
  pk: string[];
  /** extra query for the pull (order / filters) */
  query?: string;
  /** model fields that are NOT columns */
  omit?: string[];
  /** columns that are not model fields */
  drop?: string[];
  /** null from the database becomes "missing" on the model */
  nullToMissing?: string[];
  /** model value '' is stored as null */
  emptyToNull?: string[];
  /** only the newest N rows are pulled (older rows are simply not held locally) */
  windowed?: 'attendance';
  /** new rows are inserted (not upserted): the writer may not be allowed to read them back */
  insertOnly?: boolean;
}

/** Parents first, children after: the order rows must be written in. */
const SPECS: TableSpec[] = [
  { snap: 'campuses', table: 'campuses', pk: ['id'] },
  { snap: 'academicYears', table: 'academic_years', pk: ['id'] },
  { snap: 'classes', table: 'classes', pk: ['id'], query: 'order=sort_order,id' },
  { snap: 'subjects', table: 'subjects', pk: ['id'] },
  { snap: 'classSubjects', table: 'class_subjects', pk: ['classId', 'subjectId'] },
  // profiles are handled separately (accounts are created through RPC)
  { snap: 'sections', table: 'sections', pk: ['id'], query: 'order=id' },
  { snap: 'teacherAssignments', table: 'teacher_assignments', pk: ['id'] },
  {
    snap: 'students', table: 'students', pk: ['id'], query: 'order=id',
    nullToMissing: ['guardianPhone2'], emptyToNull: ['dateOfBirth'],
  },
  { snap: 'parentStudents', table: 'parent_students', pk: ['parentId', 'studentId'] },
  { snap: 'gradingScale', table: 'grading_scale', pk: ['minPercent'], query: 'order=min_percent.desc', nullToMissing: ['remarksEn', 'remarksUr'] },
  { snap: 'holidays', table: 'holidays', pk: ['id'] },
  { snap: 'attendanceRecords', table: 'attendance_records', pk: ['studentId', 'date'], windowed: 'attendance' },
  { snap: 'attendanceSubmissions', table: 'attendance_submissions', pk: ['sectionId', 'date'], windowed: 'attendance' },
  { snap: 'attendanceUnlocks', table: 'attendance_unlocks', pk: ['id'], query: 'order=expires_at.desc&limit=100', emptyToNull: ['sectionId'] },
  { snap: 'feeHeads', table: 'fee_heads', pk: ['id'], query: 'order=priority' },
  { snap: 'classFeeStructures', table: 'class_fee_structures', pk: ['classId', 'feeHeadId'] },
  { snap: 'studentConcessions', table: 'student_concessions', pk: ['studentId', 'feeHeadId'] },
  { snap: 'feeVouchers', table: 'fee_vouchers', pk: ['id'], query: 'order=billing_month,id' },
  { snap: 'feePayments', table: 'fee_payments', pk: ['id'], query: 'order=paid_on,id', omit: ['allocations'] },
  { snap: 'paymentAllocations', table: 'payment_allocations', pk: ['id'] },
  { snap: 'exams', table: 'exams', pk: ['id'] },
  { snap: 'examSubjects', table: 'exam_subjects', pk: ['examId', 'classId', 'subjectId'] },
  { snap: 'marks', table: 'marks', pk: ['examId', 'studentId', 'subjectId'] },
  { snap: 'markSubmissions', table: 'mark_submissions', pk: ['examId', 'sectionId', 'subjectId'] },
  { snap: 'conversations', table: 'conversations', pk: ['id'], query: 'order=last_message_at.desc' },
  { snap: 'messages', table: 'messages', pk: ['id'], query: 'order=created_at' },
  { snap: 'notices', table: 'notices', pk: ['id'], query: 'order=created_at.desc' },
  {
    snap: 'notifications', table: 'notifications', pk: ['id'], query: 'order=created_at.desc&limit=300', insertOnly: true,
    nullToMissing: ['titleUr', 'bodyUr'],
  },
  { snap: 'auditLogs', table: 'audit_logs', pk: ['id'], query: 'order=changed_at.desc&limit=400', insertOnly: true },
];

const ATTENDANCE_WINDOW_DAYS = 45;

function toDbRow(spec: TableSpec, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (spec.omit?.includes(k)) continue;
    let val = v === undefined ? null : v;
    if (spec.emptyToNull?.includes(k) && val === '') val = null;
    out[snake(k)] = val;
  }
  return out;
}

function fromDbRow(spec: TableSpec, row: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    if (spec.drop?.includes(k)) continue;
    const key = camel(k);
    if (v === null && spec.nullToMissing?.includes(key)) continue;
    if (v === null && spec.emptyToNull?.includes(key)) {
      out[key] = '';
      continue;
    }
    out[key] = v;
  }
  return out;
}

const keyOf = (spec: TableSpec, row: Row) => spec.pk.map((p) => String(row[p])).join('|');
const sig = (spec: TableSpec, row: Row) => JSON.stringify(toDbRow(spec, row));

// ---------------------------------------------------------------- settings (single row) and profiles
function settingsToDb(s: Row): Row {
  const out: Row = { id: 1 };
  for (const [k, v] of Object.entries(s)) out[snake(k)] = v === undefined ? null : v;
  return out;
}
function settingsFromDb(r: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(r)) if (k !== 'id') out[camel(k)] = v;
  return out;
}
function profileToDb(p: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(p)) out[snake(k)] = v === undefined ? null : v;
  return out;
}

// ---------------------------------------------------------------- status for the UI
export type SyncState = 'idle' | 'pending' | 'saving' | 'error';
export interface SyncStatus {
  state: SyncState;
  message: string;
}
let status: SyncStatus = { state: 'idle', message: '' };
const listeners = new Set<(s: SyncStatus) => void>();
function setStatus(s: SyncStatus) {
  status = s;
  listeners.forEach((l) => l(s));
}
export function getSyncStatus(): SyncStatus {
  return status;
}
export function subscribeSyncStatus(l: (s: SyncStatus) => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

// ---------------------------------------------------------------- pull
let lastSynced: LocalDatabaseSnapshot | null = null;
let lastPullChanged = true;
let editVersion = 0;
let myRole: string | null = null;

function emptySnapshot(): LocalDatabaseSnapshot {
  return {
    seededVersion: 4,
    campuses: [], academicYears: [], classes: [], sections: [], subjects: [], classSubjects: [],
    profiles: [], passwordsByUserId: {}, teacherAssignments: [], students: [], parentStudents: [],
    gradingScale: [],
    schoolSettings: {
      nameEn: 'Al Furqan School Okara', nameUr: '', officePhones: [], address: '',
      attendanceLockTime: '23:59', weeklyOffDays: [], showClassPosition: true,
    } as LocalDatabaseSnapshot['schoolSettings'],
    holidays: [], attendanceRecords: [], attendanceSubmissions: [], attendanceUnlocks: [], feeHeads: [],
    classFeeStructures: [], studentConcessions: [], feeVouchers: [], feePayments: [],
    paymentAllocations: [], auditLogs: [], exams: [], examSubjects: [], marks: [], markSubmissions: [],
    conversations: [], messages: [], notices: [], notifications: [],
  };
}

function isoDaysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Replaces the local copy with what the signed-in user is allowed to see on the server. */
export async function pullAll(userId: string): Promise<LocalDatabaseSnapshot> {
  const versionAtStart = editVersion;
  const profileRows = await selectAll<Row>('profiles', 'order=login_id');
  const mine = profileRows.find((p) => p.id === userId);
  myRole = (mine?.role as string) ?? null;

  const snap = emptySnapshot();
  snap.profiles = profileRows.map((r) => {
    const p = fromDbRow({ snap: 'profiles', table: 'profiles', pk: ['id'], drop: ['created_at'] }, r);
    return p as unknown as LocalDatabaseSnapshot['profiles'][number];
  });

  const windowFrom = myRole === Role.PARENT ? null : isoDaysAgo(ATTENDANCE_WINDOW_DAYS);
  const [settingsRows, ...tables] = await Promise.all([
    selectAll<Row>('school_settings'),
    ...SPECS.map((spec) => {
      let q = spec.query ?? '';
      if (spec.windowed && windowFrom) q += `${q ? '&' : ''}date=gte.${windowFrom}`;
      return selectAll<Row>(spec.table, q);
    }),
  ]);
  if (settingsRows[0]) {
    snap.schoolSettings = settingsFromDb(settingsRows[0]) as unknown as LocalDatabaseSnapshot['schoolSettings'];
  }
  SPECS.forEach((spec, i) => {
    (snap[spec.snap] as unknown as Row[]) = tables[i].map((r) => fromDbRow(spec, r));
  });
  (snap as unknown as { cleanStart: boolean }).cleanStart = true;

  if (versionAtStart !== editVersion) return currentLocal(); // user edited while loading: keep their edit
  // nothing new on the server: skip the heavy work (saving copies on the phone) and do not reload any screen
  if (lastSynced && JSON.stringify(snap) === JSON.stringify(lastSynced)) {
    lastPullChanged = false;
    setStatus({ state: 'idle', message: '' });
    return currentLocal();
  }
  lastPullChanged = true;
  lastSynced = structuredClone(snap);
  void saveBaseline(userId, lastSynced);
  if (dropJunkSubjects(snap)) {
    replaceLocalDatabase(snap);
    schedulePush(); // removes the junk subjects on the server too
    return snap;
  }
  replaceLocalDatabase(snap);
  setStatus({ state: 'idle', message: '' });
  return snap;
}

/** Older imports turned file columns such as "Adm No" into subjects; remove them. */
const JUNK_SUBJECT_NAMES = new Set([
  'admno', 'admissionno', 'actualfee', 'netfee', 'previousarrears', 'prevarrears', 'admissionfee',
  'annualcharges', 'totaldue', 'totalpaid', 'arrears', 'monthlyfee', 'userid', 'password',
  'studentname', 'fathername', 'contact1', 'contact2', 'campus', 'class', 'section', 'status',
]);
function dropJunkSubjects(snap: LocalDatabaseSnapshot): boolean {
  const bad = new Set(
    snap.subjects
      .filter((s) => JUNK_SUBJECT_NAMES.has(s.nameEn.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '')))
      .map((s) => s.id)
  );
  if (!bad.size) return false;
  snap.subjects = snap.subjects.filter((s) => !bad.has(s.id));
  snap.classSubjects = snap.classSubjects.filter((c) => !bad.has(c.subjectId));
  snap.teacherAssignments = snap.teacherAssignments.filter((a) => !a.subjectId || !bad.has(a.subjectId));
  return true;
}

export function forgetCloudData() {
  lastSynced = null;
  void clearBaseline();
  myRole = null;
  clearLocalDatabase();
  setStatus({ state: 'idle', message: '' });
}

// ---------------------------------------------------------------- push
interface TableDiff {
  spec: TableSpec;
  upserts: Row[];
  deletes: Row[];
}

function diffTable(spec: TableSpec, cur: Row[], prev: Row[]): TableDiff {
  const prevMap = new Map<string, string>();
  prev.forEach((r) => prevMap.set(keyOf(spec, r), sig(spec, r)));
  const seen = new Set<string>();
  const upserts: Row[] = [];
  cur.forEach((r) => {
    const k = keyOf(spec, r);
    seen.add(k);
    if (prevMap.get(k) !== sig(spec, r)) upserts.push(r);
  });
  const deletes = prev.filter((r) => !seen.has(keyOf(spec, r)));
  return { spec, upserts, deletes };
}

const eq = (v: unknown) => `eq.${encodeURIComponent(String(v))}`;

async function deleteRows(spec: TableSpec, rows: Row[]) {
  if (rows.length === 0) return;
  const cols = spec.pk;
  const last = cols[cols.length - 1];
  const groups = new Map<string, Row[]>();
  rows.forEach((r) => {
    const g = cols.slice(0, -1).map((c) => String(r[c])).join('|');
    (groups.get(g) ?? groups.set(g, []).get(g)!).push(r);
  });
  for (const group of groups.values()) {
    const head = cols.slice(0, -1).map((c) => `${snake(c)}=${eq(group[0][c])}`);
    for (let i = 0; i < group.length; i += 80) {
      const ids = group.slice(i, i + 80).map((r) => `"${String(r[last]).replace(/"/g, '\\"')}"`).join(',');
      const filter = [...head, `${snake(last)}=in.(${encodeURIComponent(ids)})`].join('&');
      await deleteWhere(spec.table, filter);
    }
  }
}

async function inBatches<T>(items: T[], size: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const x = items[i++];
      await fn(x);
    }
  });
  await Promise.all(workers);
}

let running = false;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

function currentLocal(): LocalDatabaseSnapshot {
  return getOrSeedLocalDatabase();
}

async function pushOnce(): Promise<boolean> {
  if (!lastSynced || !readTokens()) return false;
  const snap = structuredClone(currentLocal());
  const base = lastSynced;
  let changed = false;
  const isAdmin = myRole === Role.ADMIN;
  const sentPw: string[] = [];

  // ---- accounts
  const prevProfiles = new Map(base.profiles.map((p) => [p.id, p]));
  const curIds = new Set(snap.profiles.map((p) => p.id));
  const created = snap.profiles.filter((p) => !prevProfiles.has(p.id));
  const removed = base.profiles.filter((p) => !curIds.has(p.id));
  const updated = snap.profiles.filter((p) => {
    const old = prevProfiles.get(p.id);
    return old && JSON.stringify(profileToDb(old as unknown as Row)) !== JSON.stringify(profileToDb(p as unknown as Row));
  });

  if (created.length) {
    changed = true;
    await inBatches(created, 4, async (p) => {
      const pw = snap.passwordsByUserId[p.id];
      if (!pw) throw new SupabaseError(400, `No password for new account ${p.loginId}`);
      await rpc('admin_create_account', {
        p_login: p.loginId, p_password: pw, p_role: p.role, p_full_name: p.fullName,
        p_full_name_ur: p.fullNameUr, p_phone: p.phone, p_campus: p.campusId ?? '',
        p_language: p.language, p_id: p.id,
      });
      sentPw.push(p.id);
      base.profiles.push(structuredClone(p));
    });
  }
  for (const p of updated) {
    changed = true;
    const old = prevProfiles.get(p.id)!;
    if (isAdmin && old.loginId.toUpperCase() !== p.loginId.toUpperCase()) {
      await rpc('admin_set_login', { p_profile: p.id, p_login: p.loginId });
    }
    const body = profileToDb(p as unknown as Row);
    delete body.id;
    delete body.login_id;
    await patchRows('profiles', `id=${eq(p.id)}`, body);
    const idx = base.profiles.findIndex((x) => x.id === p.id);
    if (idx >= 0) base.profiles[idx] = structuredClone(p);
  }
  // password resets / changes by the admin
  if (isAdmin) {
    for (const [id, pw] of Object.entries(snap.passwordsByUserId)) {
      if (!pw || created.some((c) => c.id === id) || !curIds.has(id)) continue;
      changed = true;
      await rpc('admin_set_password', { p_profile: id, p_password: pw });
      sentPw.push(id);
    }
  }

  // ---- ordinary tables: writes in parent-first order
  const diffs = SPECS.map((spec) =>
    diffTable(spec, snap[spec.snap] as unknown as Row[], base[spec.snap] as unknown as Row[])
  );
  for (const d of diffs) {
    if (!d.upserts.length) continue;
    changed = true;
    if (d.spec.insertOnly) {
      const known = new Set((base[d.spec.snap] as unknown as Row[]).map((r) => keyOf(d.spec, r)));
      const fresh = d.upserts.filter((r) => !known.has(keyOf(d.spec, r)));
      const edited = d.upserts.filter((r) => known.has(keyOf(d.spec, r)));
      if (fresh.length) await insertRows(d.spec.table, fresh.map((r) => toDbRow(d.spec, r)));
      for (const r of edited) {
        const body = toDbRow(d.spec, r);
        d.spec.pk.forEach((k) => delete body[snake(k)]);
        await patchRows(d.spec.table, d.spec.pk.map((k) => `${snake(k)}=${eq(r[k])}`).join('&'), body);
      }
    } else {
      await upsertRows(d.spec.table, d.upserts.map((r) => toDbRow(d.spec, r)), d.spec.pk.map(snake).join(','));
    }
    const prevRows = base[d.spec.snap] as unknown as Row[];
    const map = new Map(prevRows.map((r) => [keyOf(d.spec, r), r]));
    d.upserts.forEach((r) => map.set(keyOf(d.spec, r), structuredClone(r)));
    (base[d.spec.snap] as unknown as Row[]) = [...map.values()];
  }
  // school settings
  if (JSON.stringify(settingsToDb(snap.schoolSettings as unknown as Row)) !== JSON.stringify(settingsToDb(base.schoolSettings as unknown as Row))) {
    changed = true;
    await upsertRows('school_settings', [settingsToDb(snap.schoolSettings as unknown as Row)], 'id');
    base.schoolSettings = structuredClone(snap.schoolSettings);
  }
  // deletes: children before parents
  for (const d of [...diffs].reverse()) {
    if (!d.deletes.length) continue;
    changed = true;
    await deleteRows(d.spec, d.deletes);
    const gone = new Set(d.deletes.map((r) => keyOf(d.spec, r)));
    (base[d.spec.snap] as unknown as Row[]) = (base[d.spec.snap] as unknown as Row[]).filter(
      (r) => !gone.has(keyOf(d.spec, r))
    );
  }
  // removed accounts last (cascades to links)
  for (const p of removed) {
    changed = true;
    await rpc('admin_delete_account', { p_profile: p.id });
    base.profiles = base.profiles.filter((x) => x.id !== p.id);
  }

  if (sentPw.length) {
    // forget the one-time passwords that were sent (re-read: the user may have edited meanwhile)
    const fresh = getOrSeedLocalDatabase();
    sentPw.forEach((id) => delete fresh.passwordsByUserId[id]);
    replaceLocalDatabase(fresh);
  }
  return changed;
}

async function flush() {
  if (running) {
    again = true;
    return;
  }
  running = true;
  try {
    do {
      again = false;
      setStatus({ state: 'saving', message: '' });
      await pushOnce();
      retryCount = 0;
    } while (again);
    setStatus({ state: 'idle', message: '' });
  } catch (e) {
    const err = e instanceof SupabaseError ? e : new SupabaseError(0, e instanceof Error ? e.message : 'Unknown error');
    setStatus({ state: 'error', message: err.message });
    if (err.transient && retryCount < 5) {
      retryCount += 1;
      retryTimer = setTimeout(() => void flush(), Math.min(60000, 3000 * retryCount * retryCount));
    }
  } finally {
    running = false;
    const t = readTokens();
    if (t && lastSynced) void saveBaseline(t.userId, lastSynced);
  }
}

export function schedulePush() {
  if (!lastSynced) return;
  editVersion += 1;
  if (retryTimer) clearTimeout(retryTimer);
  if (timer) clearTimeout(timer);
  setStatus({ state: 'pending', message: '' });
  timer = setTimeout(() => void flush(), 700);
}

/** Saves right now (used before logout / manual retry). */
export async function pushNow(): Promise<void> {
  if (timer) clearTimeout(timer);
  retryCount = 0;
  await flush();
}

export function hasUnsavedChanges(): boolean {
  return status.state === 'pending' || status.state === 'saving' || status.state === 'error';
}

/** Gives up local edits and reloads everything from the server. */
export async function discardAndReload(): Promise<void> {
  const t = readTokens();
  if (!t) return;
  await pullAll(t.userId);
}

/**
 * Called when the app starts with a saved sign-in. If the app was closed with edits that were never sent,
 * the saved baseline lets us send them now (and keep them) instead of replacing them with the server's data.
 * Returns true when unsent edits were found and a send was started.
 */
export async function restoreUnsentEdits(userId: string): Promise<boolean> {
  if (lastSynced) return false;
  const base = await loadBaseline(userId);
  if (!base) return false;
  const local = currentLocal();
  if (JSON.stringify(local) === JSON.stringify(base)) return false;
  lastSynced = structuredClone(base);
  schedulePush();
  return true;
}

type RefreshSource = 'auto' | 'manual';
const refreshListeners = new Set<(src: RefreshSource) => void>();
/** Called after fresh data from the server has replaced the local copy (screens can then reload). */
export function subscribeDataRefreshed(l: (src: RefreshSource) => void): () => void {
  refreshListeners.add(l);
  return () => refreshListeners.delete(l);
}

/** Pull-to-refresh: sends unsent edits first, then loads the latest data. */
export async function forceRefresh(): Promise<'ok' | 'unsaved' | 'failed'> {
  const t = readTokens();
  if (!t || !lastSynced) return 'failed';
  if (hasUnsavedChanges()) {
    await pushNow().catch(() => undefined);
    if (hasUnsavedChanges()) return 'unsaved';
  }
  try {
    await pullAll(t.userId);
    lastPullAt = Date.now();
    if (lastPullChanged) refreshListeners.forEach((l) => l('manual'));
    return 'ok';
  } catch {
    return 'failed';
  }
}

/** Pulls fresh data unless there are unsaved edits. */
let lastPullAt = 0;
export async function refreshIfIdle(minGapMs = 30000): Promise<boolean> {
  const t = readTokens();
  if (!t || !lastSynced || hasUnsavedChanges() || running) return false;
  if (Date.now() - lastPullAt < minGapMs) return false;
  lastPullAt = Date.now();
  try {
    await pullAll(t.userId);
    if (lastPullChanged) refreshListeners.forEach((l) => l('auto'));
    return true;
  } catch {
    return false;
  }
}
export function markPulled() {
  lastPullAt = Date.now();
}

cloudHooks.onLocalSave = schedulePush;

/** Light check used while an attendance screen is open: fetches only the open unlocks (works even if other edits are unsaved). */
export async function fetchUnlocks(): Promise<void> {
  const t = readTokens();
  if (!t) return;
  const spec = SPECS.find((s) => s.table === 'attendance_unlocks')!;
  const rows = await selectAll<Row>('attendance_unlocks', `expires_at=gt.${encodeURIComponent(new Date().toISOString())}&order=expires_at.desc`);
  const db = getOrSeedLocalDatabase();
  const fresh = rows.map((r) => fromDbRow(spec, r) as unknown as NonNullable<LocalDatabaseSnapshot['attendanceUnlocks']>[number]);
  const localOnly = (db.attendanceUnlocks ?? []).filter((u) => new Date(u.expiresAt).getTime() > Date.now() && !fresh.some((f) => f.id === u.id));
  db.attendanceUnlocks = [...fresh, ...localOnly];
  replaceLocalDatabase(db);
  if (lastSynced) lastSynced.attendanceUnlocks = structuredClone(fresh);
}

/** Loads one student's attendance of a month from the server (the app only keeps the last weeks locally). */
export async function fetchStudentMonth(studentId: string, month: string): Promise<void> {
  if (!readTokens()) return;
  const [y, m] = month.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const spec = SPECS.find((s) => s.table === 'attendance_records')!;
  const rows = await selectAll<Row>('attendance_records', `student_id=eq.${encodeURIComponent(studentId)}&date=gte.${month}-01&date=lt.${next}`);
  const db = getOrSeedLocalDatabase();
  const have = new Set(db.attendanceRecords.filter((r) => r.studentId === studentId).map((r) => r.date));
  const fresh = rows
    .map((r) => fromDbRow(spec, r) as unknown as LocalDatabaseSnapshot['attendanceRecords'][number])
    .filter((r) => !have.has(r.date));
  if (fresh.length === 0) return;
  db.attendanceRecords = [...db.attendanceRecords, ...fresh];
  replaceLocalDatabase(db);
  if (lastSynced) lastSynced.attendanceRecords = [...lastSynced.attendanceRecords, ...structuredClone(fresh)];
}
