import { CLOUD_ENABLED, cloudHooks, newProfileId } from '../supabase/mode';
import { LanguageCode } from '../../res/strings';
import {
  AcademicYear,
  AdmitResult,
  NotificationType,
  ConcessionType,
  ExamAnalytics,
  MarkSubmission,
  MarksProgressRow,
  ResultSubjectLine,
  Gender,
  ImportStudentResult,
  ImportStudentRow,
  ImportFeeResult,
  ImportMarksResult,
  ImportMarksRow,
  ImportFeeRow,
  ImportPaymentResult,
  ImportPaymentRow,
  ImportFileRow,
  ImportClassRow,
  ImportClassResult,
  OpeningFees,
  NewProfileInput,
  NewStudentInput,
  AttendanceReport,
  AttendanceReportFilter,
  AttendanceReportSectionRow,
  AttendanceReportStudentRow,
  CampusComparisonRow,
  ClassAttendanceRow,
  PrincipalDashboard,
  RecentActivityItem,
  StaffComplianceRow,
  UnmarkedSectionInfo,
  AppNotification,
  AppResult,
  AppSettings,
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSubmission,
  AttendanceUnlock,
  ImportAttendanceResult,
  ImportAttendanceRow,
  AuditLogEntry,
  Campus,
  CampusModel,
  ChartSeriesPoint,
  ClassFeeStructure,
  Conversation,
  DashboardSummary,
  Exam,
  ExamStatus,
  ExamType,
  ExamSubject,
  FeeCategory,
  FeeCollectionReport,
  FeeCollectionReportFilter,
  FeeDefaulterSummary,
  FeeHead,
  FeePayment,
  FeeVoucher,
  FeeVoucherItem,
  GradingScaleEntry,
  Mark,
  Message,
  MonthlyAttendancePercentage,
  Notice,
  NoticeAudience,
  ParentAttendanceSummary,
  ParentRelation,
  ParentStudent,
  PaymentAllocation,
  PaymentMethod,
  PrincipalDashboardKpis,
  Profile,
  Role,
  ROLE_PRESETS,
  SchoolClass,
  SchoolHoliday,
  SchoolSettings,
  Section,
  Student,
  StudentConcession,
  StudentFeeSummary,
  StudentResultCard,
  StudentStatus,
  Subject,
  TeacherAssignment,
  UserRole,
  UserSession,
  VoucherGenerationPreview,
  VoucherStatus,
} from '../../domain/models/models';
import {
  AttendanceRepository,
  AuthRepository,
  DashboardRepository,
  RoleActionRow,
  MergeParentsResult,
  ExamRepository,
  FeeRepository,
  MessageRepository,
  NoticeRepository,
  SettingsRepository,
  StudentRepository,
  StudentSearchFilter,
} from '../../domain/repository/repositories';
import {
  buildInitialDemoDatabase,
  computeNetTuition,
  LocalDatabaseSnapshot,
} from '../seed/DemoSeedData';
import {
  checkWeeklyOffOrHoliday,
  currentMonth,
  currentTimeHHMM,
  addDaysIso,
  nowIso,
  shiftYearMonth,
  today,
} from '../../domain/clock';

/** 8 characters, no look-alikes (0/O, 1/l/I). */
function generateReadablePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export const STORAGE_KEYS = {
  LOCAL_DB: 'afs_okara_local_db_v2',
  SESSION: 'afs_okara_session_v1',
  SETTINGS: 'afs_okara_settings_v1',
  PARENT_CHILD_MAP: 'afs_okara_parent_selected_child_v1',
} as const;

export async function simulateLocalDelay(): Promise<number> {
  if (CLOUD_ENABLED) return 0; // real data: no artificial waiting (the delay only imitates a network in the offline demo)
  const ms = Math.floor(200 + Math.random() * 201);
  await new Promise((resolve) => setTimeout(resolve, ms));
  return ms;
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** The parsed school data is kept in memory, so screens do not re-read and re-parse several MB on every call. */
let dbCache: LocalDatabaseSnapshot | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.LOCAL_DB) dbCache = null; // changed by another tab
  });
}

export function writeLocalJson<T>(key: string, value: T): void {
  if (key === STORAGE_KEYS.LOCAL_DB) dbCache = value as unknown as LocalDatabaseSnapshot;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Seeds the local database automatically on first launch only (version 2 with Attendance & Fees).
 */
export function getOrSeedLocalDatabase(): LocalDatabaseSnapshot {
  if (dbCache) return dbCache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.LOCAL_DB);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDatabaseSnapshot;
      if (
        parsed &&
        parsed.seededVersion === 4 &&
        Array.isArray(parsed.profiles) &&
        Array.isArray(parsed.attendanceRecords) &&
        Array.isArray(parsed.feeVouchers)
      ) {
        // Older saved data predates exams: add the new tables instead of re-seeding.
        parsed.attendanceUnlocks ??= [];
        parsed.exams ??= [];
        parsed.examSubjects ??= [];
        parsed.marks ??= [];
        parsed.markSubmissions ??= [];
        parsed.conversations ??= [];
        parsed.messages ??= [];
        parsed.notices ??= [];
        parsed.notifications ??= [];
        // Vice Principal demo account was added after the first release.
        if (!CLOUD_ENABLED && !parsed.profiles.some((p) => p.loginId.toUpperCase() === 'VP01')) {
          parsed.profiles.push({
            id: 'usr_vp01',
            loginId: 'VP01',
            role: Role.VICE_PRINCIPAL,
            fullName: 'Sir Hafiz Imran Saeed',
            fullNameUr: 'جناب حافظ عمران سعید',
            phone: '0300-4411004',
            campusId: null,
            language: 'en',
            isActive: true,
          });
          parsed.passwordsByUserId['usr_vp01'] = 'demo1234';
        }
        // One-time clean start: school data (students, parents, classes, sections, subjects) is entered fresh.
        if (!(parsed as { cleanStart?: boolean }).cleanStart) {
          wipeSchoolData(parsed);
          (parsed as { cleanStart?: boolean }).cleanStart = true;
          writeLocalJson(STORAGE_KEYS.LOCAL_DB, parsed);
        }
        dbCache = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const initial = buildInitialDemoDatabase();
  wipeSchoolData(initial);
  (initial as { cleanStart?: boolean }).cleanStart = true;
  writeLocalJson(STORAGE_KEYS.LOCAL_DB, initial);
  return initial;
}

/** The admin's open unlock for this section and day, if it has not run out. */
function activeUnlockFor(db: LocalDatabaseSnapshot, sectionId: string, date: string): AttendanceUnlock | null {
  const now = Date.now();
  const hits = (db.attendanceUnlocks ?? []).filter(
    (u) => u.date === date && (!u.sectionId || u.sectionId === sectionId) && new Date(u.expiresAt).getTime() > now
  );
  return hits.sort((a, b) => b.expiresAt.localeCompare(a.expiresAt))[0] ?? null;
}

function saveLocalDatabase(db: LocalDatabaseSnapshot): void {
  writeLocalJson(STORAGE_KEYS.LOCAL_DB, db);
  cloudHooks.onLocalSave?.();
}

/** Used by the Supabase sync: stores data WITHOUT telling the sync layer about it. */
export function replaceLocalDatabase(db: LocalDatabaseSnapshot): void {
  writeLocalJson(STORAGE_KEYS.LOCAL_DB, db);
}

export function clearLocalDatabase(): void {
  dbCache = null;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.LOCAL_DB);
    window.localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch {
    // Ignore
  }
}

export function mapDomainRoleToUserRole(role: Role): UserRole {
  switch (role) {
    case Role.PARENT:
      return UserRole.PARENT;
    case Role.TEACHER:
      return UserRole.TEACHER;
    case Role.PRINCIPAL:
      return UserRole.PRINCIPAL;
    case Role.VICE_PRINCIPAL:
      return UserRole.VICE_PRINCIPAL;
    case Role.ACCOUNTANT:
      return UserRole.ACCOUNTANT;
    case Role.ATTENDANCE_COORDINATOR:
      return UserRole.ATTENDANCE_COORDINATOR;
    case Role.ADMIN:
      return UserRole.ADMIN;
  }
}

export function mapCampusIdToEnum(campusId: string | null): Campus {
  if (campusId === 'campus_b') return Campus.BOYS;
  if (campusId === 'campus_g') return Campus.GIRLS;
  return Campus.BOTH;
}

function getTodayKarachiIsoDate(): string {
  return today();
}

function getCurrentKarachiTimeHHMM(): string {
  return currentTimeHHMM();
}

function isSundayOrHoliday(
  dateStr: string,
  holidays: SchoolHoliday[]
): boolean {
  return checkWeeklyOffOrHoliday(dateStr, holidays).isOff;
}

/**
 * Builds the line items of one student's monthly voucher (shared by generate + preview).
 * RULE: monthly vouchers NEVER include the Admission Fee; it belongs only to the admission voucher.
 */
function buildMonthlyVoucherItems(
  db: LocalDatabaseSnapshot,
  studentId: string,
  classId: string,
  billingMonth: string
): FeeVoucherItem[] {
  const monthNumber = Number(billingMonth.split('-')[1] ?? '0');
  const admissionHeadIds = new Set(
    db.feeHeads
      .filter(
        (fh) => fh.category === FeeCategory.ADMISSION || fh.id === 'fh_admission'
      )
      .map((fh) => fh.id)
  );
  const classStructures = db.classFeeStructures.filter(
    (cfs) => cfs.classId === classId && !admissionHeadIds.has(cfs.feeHeadId)
  );
  const tuitionStructure = classStructures.find(
    (cfs) => cfs.feeHeadId === 'fh_tuition'
  );
  const annualStructure = classStructures.find(
    (cfs) => cfs.feeHeadId === 'fh_annual' && cfs.chargeMonth === monthNumber
  );

  const items: FeeVoucherItem[] = [];
  if (annualStructure) {
    items.push({
      feeHeadId: 'fh_annual',
      description: `Annual Charges (${billingMonth})`,
      amount: annualStructure.amount,
      waivedAmount: 0,
      paidAmount: 0,
    });
  }

  const baseTuition = tuitionStructure?.amount ?? 2000;
  const concession = db.studentConcessions.find(
    (c) => c.studentId === studentId && c.feeHeadId === 'fh_tuition'
  );
  items.push({
    feeHeadId: 'fh_tuition',
    description: `Monthly Tuition Fee (${billingMonth})`,
    amount: computeNetTuition(baseTuition, concession),
    waivedAmount: 0,
    paidAmount: 0,
  });
  return items;
}

// ----------------------------------------------------------------------------
// Admin helpers shared by single admission, bulk import and createProfile.
// They mutate the given snapshot and NEVER save it; the caller decides.
// ----------------------------------------------------------------------------

type Fail = { ok: false; message: string };

function auditId(): string {
  return `aud_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Excel drops the leading 0 of Pakistani mobiles (3001234567) - put it back. */
function normalizePkPhone(raw: string): string {
  const d = raw.replace(/[\s\-()]/g, '');
  return /^3\d{9}$/.test(d) ? `0${d}` : d;
}

function createProfileInDb(
  db: LocalDatabaseSnapshot,
  input: NewProfileInput,
  actorId: string
): { ok: true; profile: Profile; password: string } | Fail {
  const fail = (message: string): Fail => ({ ok: false, message });
  const fullName = input.fullName.trim();
  const fullNameUr = input.fullNameUr.trim();
  const phone = normalizePkPhone(input.phone);
  if (fullName.length < 3) return fail('Full name (English) is required.');
  if (fullNameUr.length < 2) return fail('Full name (Urdu) is required.');
  if (!/^\+?\d{10,13}$/.test(phone) && !(input.relaxed && phone === '')) return fail('Enter a valid phone number.');
  const needsCampus =
    input.role === Role.PARENT ||
    input.role === Role.TEACHER ||
    input.role === Role.ACCOUNTANT;
  if (needsCampus && !input.campusId) return fail('Campus is required for this role.');

  let loginId: string;
  const custom = input.loginId?.trim();
  if (custom) {
    if (!(input.relaxed ? /^[A-Za-z0-9_.@-]{3,30}$/ : /^[A-Za-z0-9_.-]{3,20}$/).test(custom)) {
      return fail('User name must be 3-20 letters, digits, dot, dash or underscore.');
    }
    loginId = custom.toUpperCase();
    if (db.profiles.some((p) => p.loginId.toUpperCase() === loginId)) {
      return fail(`User name ${loginId} is already taken.`);
    }
  } else {
    const spec: Record<string, { prefix: string; digits: number }> = {
      [Role.PARENT]: { prefix: 'P', digits: 5 },
      [Role.TEACHER]: { prefix: 'T', digits: 4 },
      [Role.PRINCIPAL]: { prefix: 'PR', digits: 2 },
      [Role.VICE_PRINCIPAL]: { prefix: 'VP', digits: 2 },
      [Role.ACCOUNTANT]: { prefix: 'AC', digits: 2 },
      [Role.ATTENDANCE_COORDINATOR]: { prefix: 'CO', digits: 2 },
      [Role.ADMIN]: { prefix: 'AD', digits: 2 },
    };
    const { prefix, digits } = spec[input.role];
    let maxNum = 0;
    db.profiles.forEach((p) => {
      const m = new RegExp(`^${prefix}(\\d{${digits}})$`).exec(p.loginId);
      if (m) maxNum = Math.max(maxNum, Number(m[1]));
    });
    loginId = `${prefix}${String(maxNum + 1).padStart(digits, '0')}`;
  }

  const customPw = input.password?.trim();
  if (customPw && customPw.length < (input.relaxed ? 4 : 6)) return fail(`Password must be at least ${input.relaxed ? 4 : 6} characters.`);
  const password = customPw || generateReadablePassword();
  const id = CLOUD_ENABLED ? newProfileId() : `usr_${loginId.toLowerCase()}`;
  const profile: Profile = {
    id,
    loginId,
    role: input.role,
    fullName,
    fullNameUr,
    phone,
    campusId: input.campusId ?? null,
    language: 'ur',
    isActive: true,
  };
  db.profiles.push(profile);
  db.passwordsByUserId[id] = password;
  db.auditLogs.unshift({
    id: auditId(),
    action: 'CREATE_PROFILE',
    tableName: 'profiles',
    recordId: id,
    oldValue: null,
    newValue: `${loginId} (${input.role})`,
    reason: 'User created by admin',
    changedBy: actorId,
    changedAt: new Date().toISOString(),
  });
  return { ok: true, profile, password };
}

/** Current-month voucher holding tuition + annual + admission, so reports and defaulters see it. */
function addOpeningVoucher(
  db: LocalDatabaseSnapshot,
  student: Student,
  classId: string,
  campusCode: string,
  o: OpeningFees
): void {
  const month = today().slice(0, 7);
  const classTuition =
    db.classFeeStructures.find((c) => c.classId === classId && c.feeHeadId === 'fh_tuition')
      ?.amount ?? 2000;
  if (o.netFee !== classTuition) {
    db.studentConcessions.push({
      studentId: student.id,
      feeHeadId: 'fh_tuition',
      type: ConcessionType.OVERRIDE,
      value: o.netFee,
      reason: `Set at admission (actual fee ${o.actualFee}, net fee ${o.netFee})`,
    });
  }
  const items: FeeVoucherItem[] = [
    {
      feeHeadId: 'fh_tuition',
      description: `Monthly Tuition Fee (${month})`,
      amount: o.netFee,
      waivedAmount: 0,
      paidAmount: 0,
    },
  ];
  if (o.annualCharges > 0) {
    items.push({
      feeHeadId: 'fh_annual',
      description: `Annual Charges (${month})`,
      amount: o.annualCharges,
      waivedAmount: 0,
      paidAmount: o.annualPaid ? o.annualCharges : 0,
    });
  }
  if (o.admissionFee > 0) {
    items.push({
      feeHeadId: 'fh_admission',
      description: 'Admission Fee',
      amount: o.admissionFee,
      waivedAmount: 0,
      paidAmount: o.admissionPaid ? o.admissionFee : 0,
    });
  }
  const prefix = campusCode === 'G' ? 'G-' : 'B-';
  const maxSeq = db.feeVouchers
    .filter((v) => v.voucherNo.startsWith(prefix))
    .reduce((m, v) => Math.max(m, Number(v.voucherNo.slice(2)) || 0), 0);
  const voucherNo = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
  const total = items.reduce((s, i) => s + i.amount, 0);
  const paid = items.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
  db.feeVouchers.push({
    id: `vch_${voucherNo.toLowerCase()}`,
    voucherNo,
    studentId: student.id,
    campusId: student.campusId,
    billingMonth: month,
    issueDate: `${month}-01`,
    dueDate: `${month}-10`,
    items,
    status: paid >= total ? VoucherStatus.PAID : paid > 0 ? VoucherStatus.PARTIAL : VoucherStatus.UNPAID,
  });
}

// ----------------------------------------------------------------------------
// Clean start + bulk-import helpers
// ----------------------------------------------------------------------------

/** Removes students, parents, classes, sections, subjects and everything that hangs off them. Staff, campuses and settings stay. */
function wipeSchoolData(db: LocalDatabaseSnapshot): void {
  const parentIds = new Set(db.profiles.filter((p) => p.role === Role.PARENT).map((p) => p.id));
  db.profiles = db.profiles.filter((p) => p.role !== Role.PARENT);
  parentIds.forEach((id) => delete db.passwordsByUserId[id]);
  db.students = [];
  db.parentStudents = [];
  db.classes = [];
  db.sections = [];
  db.subjects = [];
  db.classSubjects = [];
  db.teacherAssignments = [];
  db.attendanceRecords = [];
  db.attendanceSubmissions = [];
  db.classFeeStructures = [];
  db.studentConcessions = [];
  db.feeVouchers = [];
  db.feePayments = [];
  db.paymentAllocations = [];
  db.exams = [];
  db.examSubjects = [];
  db.marks = [];
  db.markSubmissions = [];
  db.conversations = [];
  db.messages = [];
  db.notifications = [];
  db.auditLogs = [];
}

let importIdCounter = 0;
const importId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(importIdCounter++).toString(36)}`;

function findCampusByText(db: LocalDatabaseSnapshot, text: string) {
  const v = text.trim().toLowerCase();
  if (!v) return undefined;
  return db.campuses.find(
    (c) =>
      c.code.toLowerCase() === v ||
      c.nameEn.toLowerCase() === v ||
      c.nameEn.toLowerCase().replace(/\s*campus$/, '') === v ||
      c.nameUr === text.trim()
  );
}

function findClassByText(db: LocalDatabaseSnapshot, campusId: string, text: string) {
  const v = text.trim().toLowerCase();
  if (!v) return undefined;
  return db.classes.find(
    (c) =>
      c.campusId === campusId &&
      (c.nameEn.toLowerCase() === v ||
        c.nameEn.toLowerCase() === `class ${v}` ||
        c.nameEn.toLowerCase() === `grade ${v}` ||
        c.nameUr === text.trim())
  );
}

function addSubjectsToClass(db: LocalDatabaseSnapshot, classId: string, subjects: string[]) {
  subjects.forEach((raw) => {
    const [enRaw, urRaw] = raw.split('|');
    const en = (enRaw ?? '').trim();
    if (!en) return;
    let sub = db.subjects.find((x) => x.nameEn.toLowerCase() === en.toLowerCase());
    if (!sub) {
      sub = { id: importId('sub'), nameEn: en, nameUr: (urRaw ?? '').trim() || en };
      db.subjects.push(sub);
    }
    if (!db.classSubjects.some((cs) => cs.classId === classId && cs.subjectId === sub!.id)) {
      db.classSubjects.push({ classId, subjectId: sub.id });
    }
  });
}

function ensureClassInDb(
  db: LocalDatabaseSnapshot,
  campusId: string,
  nameEn: string,
  nameUr: string,
  subjects: string[]
): { cls: SchoolClass; created: boolean } {
  const found = findClassByText(db, campusId, nameEn);
  if (found) {
    addSubjectsToClass(db, found.id, subjects);
    return { cls: found, created: false };
  }
  const sort = db.classes.filter((c) => c.campusId === campusId).reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1;
  const cls: SchoolClass = { id: importId('cls'), campusId, nameEn, nameUr, sortOrder: sort };
  db.classes.push(cls);
  addSubjectsToClass(db, cls.id, subjects);
  return { cls, created: true };
}

function ensureSectionInDb(db: LocalDatabaseSnapshot, classId: string, name: string): { section: Section; created: boolean } {
  const found = db.sections.find((x) => x.classId === classId && x.name.toLowerCase() === name.toLowerCase());
  if (found) return { section: found, created: false };
  const section: Section = { id: importId('sec'), classId, name, classTeacherId: null };
  db.sections.push(section);
  return { section, created: true };
}

/** "6" -> Class 6 / جماعت 6 ; a name like "Nursery" is kept as typed. */
function defaultClassNames(text: string): { en: string; ur: string } {
  const t = text.trim();
  if (/^\d+$/.test(t)) return { en: `Class ${t}`, ur: `جماعت ${t}` };
  return { en: t, ur: t };
}


function admitStudentInDb(
  db: LocalDatabaseSnapshot,
  input: NewStudentInput,
  actor: Profile
): { ok: true; data: AdmitResult; warnings: string[] } | Fail {
  const fail = (message: string): Fail => ({ ok: false, message });
  const warnings: string[] = [];
  const lenient = input.lenient === true;
  let name = input.name.trim();
  let nameUr = input.nameUr.trim();
  let fatherName = input.fatherName.trim();
  let phone = normalizePkPhone(input.guardianPhone);
  let phone2 = normalizePkPhone(input.guardianPhone2 ?? '');
  const dob = input.dateOfBirth.trim();
  let noFather = false;
  if (lenient) {
    if (!name && nameUr) name = nameUr;
    if (!nameUr) { nameUr = name; if (name) warnings.push('No Urdu name: English name used.'); }
    if (fatherName.length < 3) { fatherName = 'No Parent'; noFather = true; warnings.push('No father name: saved as "No Parent".'); }
    if (!/^\+?\d{10,13}$/.test(phone)) {
      warnings.push(phone ? `Contact "${phone}" is not a valid number: saved as typed.` : 'No contact number: saved as "No Contact".');
      phone = phone || 'No Contact';
    }
    if (phone2 && !/^\+?\d{10,13}$/.test(phone2)) phone2 = '';
  }
  const phoneOk = /^\+?\d{10,13}$/.test(phone);
  if (name.length < 3) return fail('Student name (English) is required.');
  if (nameUr.length < 2) return fail('Student name (Urdu) is required.');
  if (fatherName.length < 3) return fail("Father's name is required.");
  if (!lenient && !phoneOk) return fail('Enter a valid guardian phone number.');
  if (phone2 && !/^\+?\d{10,13}$/.test(phone2)) return fail('Phone 2 is not a valid number.');
  if (dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return fail('Date of birth is not valid.');
    if (dob >= today()) return fail('Date of birth must be in the past.');
    const age = Number(today().slice(0, 4)) - Number(dob.slice(0, 4));
    if (age < 2 || age > 25) return fail('Date of birth looks wrong for a student.');
  }
  if (!input.admissionDate || input.admissionDate > today()) {
    return fail('Admission date cannot be in the future.');
  }
  const section = db.sections.find((x) => x.id === input.sectionId);
  const cls = section ? db.classes.find((c) => c.id === section.classId) : undefined;
  if (!section || !cls) return fail('Choose a class and section.');
  const campus = db.campuses.find((c) => c.id === cls.campusId);
  if (!campus) return fail('Campus not found for this section.');

  const duplicate = !noFather && db.students.some(
    (s) =>
      s.status === StudentStatus.ACTIVE &&
      s.name.trim().toLowerCase() === name.toLowerCase() &&
      s.fatherName.trim().toLowerCase() === fatherName.toLowerCase() &&
      (s.dateOfBirth === dob || !s.dateOfBirth || !dob)
  );
  if (duplicate) return fail('A student with the same name and father already exists.');

  let opening: OpeningFees | undefined;
  if (input.opening) {
    const o = input.opening;
    const nums = [o.actualFee, o.netFee, o.annualCharges, o.admissionFee];
    if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
      return fail('Fee amounts must be whole numbers, zero or more.');
    }
    if (o.netFee > o.actualFee) return fail('Net fee cannot be more than the actual fee.');
    opening = o;
  }

  const earlyNo = input.admissionNo?.trim();
  if (earlyNo && db.students.some((x) => x.admissionNo.toLowerCase() === earlyNo.toLowerCase())) {
    return fail(`Admission number ${earlyNo} already exists.`);
  }

  // Parent account is resolved BEFORE anything is written so a failure leaves no half-admission.
  let parent: Profile | null = null;
  let parentPassword: string | null = null;
  if (input.parent?.mode === 'link') {
    const wantedId = input.parent.parentId;
    parent = db.profiles.find((p) => p.id === wantedId && p.role === Role.PARENT) ?? null;
    if (!parent) return fail('Selected parent account was not found.');
  } else if (input.parent?.mode === 'create' && lenient && noFather && !input.parent.loginId?.trim()) {
    // no father and no user name given: the student is added without a parent account
    warnings.push('No parent account created for this student.');
  } else if (input.parent?.mode === 'create') {
    const spec = { ...input.parent, fatherNameUr: input.parent.fatherNameUr.trim() || (lenient ? (noFather ? `Parent of ${name}` : fatherName) : '') };
    if (spec.fatherNameUr.trim().length < 2) return fail("Father's name (Urdu) is required.");
    const wanted = spec.loginId?.trim().toUpperCase();
    // Same father (name + contact number) = same account, whatever user name the file gives.
    const sameName = (a: string, b: string) => a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase();
    const myPhones = [phone, phone2].filter((x) => /^\+?\d{10,13}$/.test(String(x))).map((x) => normalizePkPhone(String(x)));
    const sameFather = noFather ? undefined : db.profiles.find((p) => {
      if (p.role !== Role.PARENT || !sameName(p.fullName, fatherName)) return false;
      const theirs = [p.phone, ...db.parentStudents
        .filter((l) => l.parentId === p.id)
        .flatMap((l) => {
          const st = db.students.find((x) => x.id === l.studentId);
          return st ? [st.guardianPhone, st.guardianPhone2 ?? ''] : [];
        })].filter(Boolean).map((x) => normalizePkPhone(String(x)));
      return myPhones.some((m) => theirs.includes(m));
    });
    const existing = sameFather ?? (wanted ? db.profiles.find((p) => p.loginId.toUpperCase() === wanted) : undefined);
    if (sameFather && wanted && sameFather.loginId.toUpperCase() !== wanted) {
      warnings.push(`Same father and phone as ${sameFather.loginId}: linked to that account (user name ${spec.loginId} not created).`);
    }
    if (existing) {
      if (existing.role !== Role.PARENT) {
        return fail(`User name ${wanted} belongs to a non-parent account.`);
      }
      parent = existing;
      warnings.push(`Linked to existing parent account ${existing.loginId}`);
    } else {
      const created = createProfileInDb(
        db,
        {
          role: Role.PARENT,
          fullName: noFather ? `Parent of ${name}` : fatherName,
          fullNameUr: spec.fatherNameUr,
          phone: phoneOk ? phone : '',
          campusId: campus.id,
          loginId: spec.loginId,
          password: spec.password,
          relaxed: spec.relaxed,
        },
        actor.id
      );
      if (!created.ok) return created;
      parent = created.profile;
      parentPassword = created.password;
    }
  }

  const seqOf = (id: string) => Number(/(\d+)$/.exec(id)?.[1] ?? 0);
  const nextSeq =
    db.students
      .filter((s) => s.campusId === campus.id)
      .reduce((m, s) => Math.max(m, seqOf(s.admissionNo)), 0) + 1;
  const nextIdNum = db.students.reduce((m, s) => Math.max(m, seqOf(s.id)), 0) + 1;
  const roll =
    db.students
      .filter((s) => s.sectionId === section.id)
      .reduce((m, s) => Math.max(m, s.rollNo), 0) + 1;

  const customNo = input.admissionNo?.trim();
  if (customNo && db.students.some((x) => x.admissionNo.toLowerCase() === customNo.toLowerCase())) {
    return fail(`Admission number ${customNo} already exists.`);
  }
  const student: Student = {
    id: `stu_${String(nextIdNum).padStart(3, '0')}`,
    admissionNo: customNo || `AFS-${campus.code}-${input.admissionDate.slice(0, 4)}-${String(nextSeq).padStart(3, '0')}`,
    name,
    nameUr,
    fatherName,
    gender: input.gender,
    dateOfBirth: dob,
    campusId: campus.id,
    sectionId: section.id,
    rollNo: roll,
    admissionDate: input.admissionDate,
    status: StudentStatus.ACTIVE,
    guardianPhone: phone,
    ...(phone2 ? { guardianPhone2: phone2 } : {}),
  };
  db.students.push(student);
  if (parent && !db.parentStudents.some((ps) => ps.parentId === parent!.id && ps.studentId === student.id)) {
    db.parentStudents.push({ parentId: parent.id, studentId: student.id, relation: ParentRelation.FATHER });
  }
  if (opening) addOpeningVoucher(db, student, cls.id, campus.code, opening);
  db.auditLogs.unshift({
    id: auditId(),
    action: 'CREATE_STUDENT',
    tableName: 'students',
    recordId: student.id,
    oldValue: null,
    newValue: `${student.admissionNo} - ${student.name}`,
    reason: 'New student admission',
    changedBy: actor.id,
    changedAt: new Date().toISOString(),
  });
  return { ok: true, data: { student, parent, parentPassword }, warnings };
}


// ----------------------------------------------------------------------------
// In-app notifications. They are written inside the same save as the event that causes them.
// ----------------------------------------------------------------------------

function pushNotification(
  db: LocalDatabaseSnapshot,
  userId: string,
  type: NotificationType,
  title: string,
  titleUr: string,
  body: string,
  bodyUr: string
): void {
  db.notifications.unshift({
    id: `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    type,
    title,
    titleUr,
    body,
    bodyUr,
    createdAt: new Date().toISOString(),
    readAt: null,
  });
  // keep the list short so local storage does not grow forever
  let seen = 0;
  db.notifications = db.notifications.filter((n) => (n.userId === userId ? ++seen <= 100 : true));
}

function parentIdsOfStudent(db: LocalDatabaseSnapshot, studentId: string): string[] {
  return db.parentStudents.filter((ps) => ps.studentId === studentId).map((ps) => ps.parentId);
}

function notifyParents(
  db: LocalDatabaseSnapshot,
  studentId: string,
  type: NotificationType,
  title: string,
  titleUr: string,
  body: string,
  bodyUr: string
): void {
  parentIdsOfStudent(db, studentId).forEach((pid) =>
    pushNotification(db, pid, type, title, titleUr, body, bodyUr)
  );
}

/** Class-level audience rules shared by notices and notifications. */
function userSeesNotice(db: LocalDatabaseSnapshot, user: Profile, n: Notice): boolean {
  if (user.role === Role.ADMIN || user.role === Role.PRINCIPAL || user.role === Role.VICE_PRINCIPAL) return true;
  const isStaff = user.role !== Role.PARENT;
  switch (n.audience) {
    case NoticeAudience.ALL:
      return true;
    case NoticeAudience.STAFF:
      return isStaff;
    case NoticeAudience.PARENTS:
      return !isStaff;
    case NoticeAudience.CAMPUS:
      return user.campusId === n.audienceId;
    case NoticeAudience.CLASS: {
      if (user.role === Role.PARENT) {
        const kids = db.parentStudents.filter((ps) => ps.parentId === user.id).map((ps) => ps.studentId);
        return db.students.some((st) => kids.includes(st.id) && db.sections.find((x) => x.id === st.sectionId)?.classId === n.audienceId);
      }
      if (user.role === Role.TEACHER) {
        return db.teacherAssignments.some((a) => a.teacherId === user.id && db.sections.find((x) => x.id === a.sectionId)?.classId === n.audienceId);
      }
      return false;
    }
  }
}

// ============================================================================
// 1. FAKE AUTH REPOSITORY
// ============================================================================

export class FakeAuthRepository implements AuthRepository {
  async currentUser(): Promise<Profile | null> {
    const session = await this.getCurrentSession();
    return session?.profile ?? null;
  }

  async login(loginId: string, password: string): Promise<AppResult<Profile>> {
    try {
      const session = await this.loginWithId(loginId, password);
      return AppResult.success(session.profile);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'INVALID_CREDENTIALS';
      if (code === 'ACCOUNT_INACTIVE') {
        return AppResult.failure({
          kind: 'AccountInactive',
          message:
            'This account is inactive. Please contact the school administrator.',
        });
      }
      return AppResult.failure({
        kind: 'InvalidCredentials',
        message: 'Invalid Login ID or password.',
      });
    }
  }

  async logout(): Promise<AppResult<void>> {
    await simulateLocalDelay();
    try {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch {
      // Ignore
    }
    return AppResult.success(undefined);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Profile',
        id: userId,
        message: 'User profile not found.',
      });
    }
    const storedPassword = db.passwordsByUserId[userId] ?? 'demo1234';
    if (storedPassword !== oldPassword) {
      return AppResult.failure({
        kind: 'InvalidCredentials',
        message: 'Current password is incorrect.',
      });
    }
    if (newPassword.trim().length < 4) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'New password must be at least 4 characters.',
      });
    }
    db.passwordsByUserId[userId] = newPassword;
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getCurrentSession(): Promise<UserSession | null> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const saved = readLocalJson<UserSession | null>(STORAGE_KEYS.SESSION, null);
    if (!saved) return null;

    const freshProfile = db.profiles.find(
      (p) => p.loginId.toUpperCase() === saved.loginId.toUpperCase()
    );
    if (!freshProfile || !freshProfile.isActive) {
      try {
        window.localStorage.removeItem(STORAGE_KEYS.SESSION);
      } catch {
        // Ignore
      }
      return null;
    }

    const updatedSession: UserSession = {
      loginId: freshProfile.loginId,
      role: mapDomainRoleToUserRole(freshProfile.role),
      campus: mapCampusIdToEnum(freshProfile.campusId),
      authenticatedAtIso: saved.authenticatedAtIso,
      profile: freshProfile,
    };
    writeLocalJson(STORAGE_KEYS.SESSION, updatedSession);
    return updatedSession;
  }

  async loginWithId(loginId: string, password: string): Promise<UserSession> {
    await simulateLocalDelay();
    const normalizedId = loginId.trim().toUpperCase();
    if (!normalizedId || !password.trim()) {
      throw new Error('EMPTY_CREDENTIALS');
    }

    const db = getOrSeedLocalDatabase();
    const profile = db.profiles.find(
      (p) => p.loginId.toUpperCase() === normalizedId
    );

    if (!profile) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const expectedPassword = db.passwordsByUserId[profile.id] ?? 'demo1234';
    if (password !== expectedPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (!profile.isActive) {
      throw new Error('ACCOUNT_INACTIVE');
    }

    const session: UserSession = {
      loginId: profile.loginId,
      role: mapDomainRoleToUserRole(profile.role),
      campus: mapCampusIdToEnum(profile.campusId),
      authenticatedAtIso: new Date().toISOString(),
      profile,
    };

    writeLocalJson(STORAGE_KEYS.SESSION, session);
    return session;
  }

  async switchRoleSession(role: UserRole): Promise<UserSession> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const preset =
      ROLE_PRESETS.find((p) => p.role === role) ?? ROLE_PRESETS[0];
    const profile =
      db.profiles.find(
        (p) => p.loginId.toUpperCase() === preset.loginId.toUpperCase()
      ) ?? db.profiles[0];

    const session: UserSession = {
      loginId: profile.loginId,
      role: mapDomainRoleToUserRole(profile.role),
      campus: mapCampusIdToEnum(profile.campusId),
      authenticatedAtIso: new Date().toISOString(),
      profile,
    };
    writeLocalJson(STORAGE_KEYS.SESSION, session);
    return session;
  }
}

// ============================================================================
// 2. FAKE STUDENT REPOSITORY
// ============================================================================

export class FakeStudentRepository implements StudentRepository {
  async search(filter: StudentSearchFilter): Promise<AppResult<Student[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const q = (filter.query ?? '').trim().toLowerCase();

    let allowedSectionIdsByClass: Set<string> | null = null;
    if (filter.classId) {
      allowedSectionIdsByClass = new Set(
        db.sections
          .filter((s) => s.classId === filter.classId)
          .map((s) => s.id)
      );
    }

    const results = db.students.filter((stu) => {
      if (filter.campusId && stu.campusId !== filter.campusId) return false;
      if (filter.sectionId && stu.sectionId !== filter.sectionId) return false;
      if (
        allowedSectionIdsByClass &&
        !allowedSectionIdsByClass.has(stu.sectionId)
      ) {
        return false;
      }
      if (filter.status && stu.status !== filter.status) return false;

      if (q) {
        const matchesQuery =
          stu.name.toLowerCase().includes(q) ||
          stu.nameUr.includes(q) ||
          stu.admissionNo.toLowerCase().includes(q) ||
          stu.fatherName.toLowerCase().includes(q) ||
          stu.guardianPhone.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }
      return true;
    });

    return AppResult.success(results);
  }

  async getById(studentId: string): Promise<AppResult<Student>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const student = db.students.find((s) => s.id === studentId);
    if (!student) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: studentId,
        message: `Student (${studentId}) was not found.`,
      });
    }
    return AppResult.success(student);
  }

  async admitStudent(
    input: NewStudentInput,
    actor: Profile
  ): Promise<AppResult<AdmitResult>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can admit students.',
      });
    }
    const db = getOrSeedLocalDatabase();
    const r = admitStudentInDb(db, input, actor);
    if (!r.ok) return AppResult.failure({ kind: 'ValidationFailed', message: r.message });
    saveLocalDatabase(db);
    return AppResult.success(r.data);
  }

  async importStudents(
    sectionId: string,
    rows: ImportStudentRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportStudentResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can import students.',
      });
    }
    const stored = getOrSeedLocalDatabase();
    const db = dryRun ? structuredClone(stored) : stored;
    const section = db.sections.find((x) => x.id === sectionId);
    const cls = section ? db.classes.find((c) => c.id === section.classId) : undefined;
    const campus = cls ? db.campuses.find((c) => c.id === cls.campusId) : undefined;
    if (!section || !cls || !campus) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Choose a class and section.' });
    }
    const classTuition =
      db.classFeeStructures.find((c) => c.classId === cls.id && c.feeHeadId === 'fh_tuition')
        ?.amount ?? 2000;
    const results: ImportStudentResult[] = rows.map((row) => {
      const actual = row.actualFee ?? classTuition;
      const net = row.netFee ?? actual;
      const r = admitStudentInDb(
        db,
        {
          name: row.name,
          nameUr: row.nameUr,
          fatherName: row.fatherName,
          gender: campus.code === 'G' ? Gender.FEMALE : Gender.MALE,
          dateOfBirth: '',
          sectionId,
          admissionDate: today(),
          guardianPhone: row.phone1,
          guardianPhone2: row.phone2,
          parent: {
            mode: 'create',
            fatherNameUr: row.fatherNameUr,
            loginId: row.username.trim() || undefined,
            password: row.password.trim() || undefined,
          },
          opening: {
            actualFee: actual,
            netFee: net,
            annualCharges: row.annualCharges ?? 0,
            annualPaid: row.annualPaid,
            admissionFee: row.admissionFee ?? 0,
            admissionPaid: row.admissionPaid,
          },
        },
        actor
      );
      if (!r.ok) {
        return {
          line: row.line,
          ok: false,
          error: r.message,
          warnings: [],
          studentName: row.name,
          admissionNo: null,
          parentLoginId: null,
          parentCreated: false,
          profile: null,
          password: null,
        };
      }
      return {
        line: row.line,
        ok: true,
        error: null,
        warnings: r.warnings,
        studentName: r.data.student.name,
        admissionNo: r.data.student.admissionNo,
        parentLoginId: r.data.parent?.loginId ?? null,
        parentCreated: r.data.parentPassword !== null,
        profile: r.data.parentPassword !== null ? r.data.parent : null,
        password: r.data.parentPassword,
      };
    });
    if (!dryRun) {
      const okCount = results.filter((x) => x.ok).length;
      if (okCount > 0) {
        db.auditLogs.unshift({
          id: auditId(),
          action: 'BULK_IMPORT_STUDENTS',
          tableName: 'students',
          recordId: sectionId,
          oldValue: null,
          newValue: `${okCount} students imported`,
          reason: 'Bulk student import',
          changedBy: actor.id,
          changedAt: new Date().toISOString(),
        });
        saveLocalDatabase(db);
      }
    }
    return AppResult.success(results);
  }

  async removeStudents(
    ids: string[] | 'ALL',
    actor: Profile
  ): Promise<AppResult<{ students: number; parents: number }>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can remove students.' });
    }
    const db = getOrSeedLocalDatabase();
    const gone = new Set(ids === 'ALL' ? db.students.map((x) => x.id) : ids);
    const linked = new Set(db.parentStudents.filter((l) => gone.has(l.studentId)).map((l) => l.parentId));
    const vouchers = new Set(db.feeVouchers.filter((v) => gone.has(v.studentId)).map((v) => v.id));
    const payments = new Set(db.feePayments.filter((p) => gone.has(p.studentId)).map((p) => p.id));
    const convs = new Set(db.conversations.filter((c) => gone.has(c.studentId)).map((c) => c.id));
    const before = db.students.length;
    db.students = db.students.filter((x) => !gone.has(x.id));
    db.parentStudents = db.parentStudents.filter((l) => !gone.has(l.studentId));
    db.attendanceRecords = db.attendanceRecords.filter((r) => !gone.has(r.studentId));
    db.studentConcessions = db.studentConcessions.filter((c) => !gone.has(c.studentId));
    db.paymentAllocations = db.paymentAllocations.filter((a) => !payments.has(a.paymentId) && !vouchers.has(a.voucherId));
    db.feePayments = db.feePayments.filter((p) => !payments.has(p.id));
    db.feeVouchers = db.feeVouchers.filter((v) => !vouchers.has(v.id));
    db.marks = db.marks.filter((m) => !gone.has(m.studentId));
    db.messages = db.messages.filter((m) => !convs.has(m.conversationId));
    db.conversations = db.conversations.filter((c) => !convs.has(c.id));
    // parents that no longer have any student
    const stillLinked = new Set(db.parentStudents.map((l) => l.parentId));
    const orphans = new Set(
      db.profiles
        .filter((p) => p.role === Role.PARENT && (ids === 'ALL' ? true : linked.has(p.id) && !stillLinked.has(p.id)))
        .map((p) => p.id)
    );
    db.profiles = db.profiles.filter((p) => !orphans.has(p.id));
    orphans.forEach((id) => delete db.passwordsByUserId[id]);
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`, action: 'REMOVE_STUDENTS', tableName: 'students', recordId: 'bulk',
      oldValue: `${before - db.students.length} students, ${orphans.size} parents`, newValue: null,
      reason: ids === 'ALL' ? 'All students and parents removed by Admin' : 'Students removed by Admin',
      changedBy: actor.id, changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success({ students: before - db.students.length, parents: orphans.size });
  }

  async removeParentsWithoutStudents(actor: Profile): Promise<AppResult<{ parents: number }>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can remove parents.' });
    }
    const db = getOrSeedLocalDatabase();
    const linked = new Set(db.parentStudents.map((l) => l.parentId));
    const orphans = new Set(db.profiles.filter((p) => p.role === Role.PARENT && !linked.has(p.id)).map((p) => p.id));
    db.profiles = db.profiles.filter((p) => !orphans.has(p.id));
    orphans.forEach((id) => delete db.passwordsByUserId[id]);
    saveLocalDatabase(db);
    return AppResult.success({ parents: orphans.size });
  }

  async importStudentFile(
    rows: ImportFileRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportStudentResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can import students.' });
    }
    const stored = getOrSeedLocalDatabase();
    const db = dryRun ? structuredClone(stored) : stored;
    const blank = (row: ImportFileRow, error: string): ImportStudentResult => ({
      line: row.line,
      ok: false,
      error,
      warnings: [],
      studentName: row.name,
      admissionNo: row.admissionNo || null,
      parentLoginId: null,
      parentCreated: false,
      profile: null,
      password: null,
    });
    const seenNos = new Set<string>();
    const results: ImportStudentResult[] = rows.map((row) => {
      if (row.status && row.status.trim().toLowerCase() !== 'active') {
        return blank(row, `Status "${row.status}" - only Active students can be imported.`);
      }
      const campus = findCampusByText(db, row.campus);
      if (!campus) return blank(row, `Campus "${row.campus}" not found (use Boys or Girls).`);
      if (!row.className.trim()) return blank(row, 'Class is required.');
      // Already imported earlier (same student name + father in this campus)? Keep it, only correct the admission no.
      const wantedNo = row.admissionNo.trim();
      const loginUp = row.username.trim().toUpperCase();
      const sameText = (x: string, y: string) => x.trim().toLowerCase() === y.trim().toLowerCase();
      const existing = db.students.find(
        (st) => st.campusId === campus.id && sameText(st.name, row.name) && sameText(st.fatherName, row.fatherName)
      );
      if (existing) {
        const taken = wantedNo && db.students.some((o) => o.id !== existing.id && o.campusId === campus.id && o.admissionNo.toLowerCase() === wantedNo.toLowerCase());
        if (taken) return blank(row, `Adm No ${wantedNo} already belongs to another student.`);
        const link = db.parentStudents.find((l) => l.studentId === existing.id);
        const parent = link ? db.profiles.find((p) => p.id === link.parentId) : undefined;
        const warnings = ['Already in the app - existing student kept.'];
        if (wantedNo && existing.admissionNo !== wantedNo) {
          warnings.push(`Admission number changed ${existing.admissionNo} -> ${wantedNo}.`);
          existing.admissionNo = wantedNo;
        }
        if (parent && loginUp && parent.loginId.toUpperCase() !== loginUp) {
          warnings.push(`Parent user name stays ${parent.loginId} (file says ${row.username}); change it in Users if needed.`);
        }
        if (row.netFee !== undefined && row.netFee > 0) {
          db.studentConcessions = db.studentConcessions.filter((c) => !(c.studentId === existing.id && c.feeHeadId === 'fh_tuition'));
          db.studentConcessions.push({ studentId: existing.id, feeHeadId: 'fh_tuition', type: ConcessionType.OVERRIDE, value: row.netFee, reason: `From student file (actual fee ${row.actualFee ?? row.netFee}, net fee ${row.netFee})` });
        }
        return {
          line: row.line, ok: true, error: null, warnings,
          studentName: existing.name, admissionNo: existing.admissionNo,
          parentLoginId: parent?.loginId ?? null, parentCreated: false, profile: null, password: null,
        };
      }
      if (!row.sectionName.trim()) return blank(row, 'Section is required.');
      if (row.admissionNo) {
        const key = row.admissionNo.toLowerCase();
        if (seenNos.has(key)) return blank(row, `Admission number ${row.admissionNo} appears twice in the file.`);
        seenNos.add(key);
      }
      const names = defaultClassNames(row.className);
      const { cls, created: classCreated } = ensureClassInDb(db, campus.id, names.en, names.ur, row.subjects);
      const { section, created: sectionCreated } = ensureSectionInDb(db, cls.id, row.sectionName.trim());
      const r = admitStudentInDb(
        db,
        {
          name: row.name,
          nameUr: row.nameUr,
          fatherName: row.fatherName,
          gender: campus.code === 'G' ? Gender.FEMALE : Gender.MALE,
          dateOfBirth: '',
          sectionId: section.id,
          admissionDate: today(),
          guardianPhone: row.phone1,
          guardianPhone2: row.phone2,
          admissionNo: row.admissionNo || undefined,
          lenient: true,
          parent: {
            mode: 'create',
            fatherNameUr: row.fatherNameUr,
            loginId: row.username.trim() || undefined,
            password: row.password.trim() || undefined,
            relaxed: true,
          },
        },
        actor
      );
      if (!r.ok) return blank(row, r.message);
      // The student's own monthly fee (net fee) is kept as a fee override; billed months come from the fee file.
      if (row.netFee !== undefined && row.netFee > 0) {
        db.studentConcessions.push({
          studentId: r.data.student.id,
          feeHeadId: 'fh_tuition',
          type: ConcessionType.OVERRIDE,
          value: row.netFee,
          reason: `From student file (actual fee ${row.actualFee ?? row.netFee}, net fee ${row.netFee})`,
        });
      }
      const warnings = [...r.warnings];
      if (classCreated) warnings.push(`New class created: ${cls.nameEn}`);
      else if (sectionCreated) warnings.push(`New section created: ${cls.nameEn} - ${section.name}`);
      return {
        line: row.line,
        ok: true,
        error: null,
        warnings,
        studentName: r.data.student.name,
        admissionNo: r.data.student.admissionNo,
        parentLoginId: r.data.parent?.loginId ?? null,
        parentCreated: r.data.parentPassword !== null,
        profile: r.data.parentPassword !== null ? r.data.parent : null,
        password: r.data.parentPassword,
      };
    });
    if (!dryRun) {
      const okCount = results.filter((x) => x.ok).length;
      if (okCount > 0) {
        db.auditLogs.unshift({
          id: auditId(),
          action: 'BULK_IMPORT_STUDENTS',
          tableName: 'students',
          recordId: 'file',
          oldValue: null,
          newValue: `${okCount} students imported`,
          reason: 'Bulk student import (file)',
          changedBy: actor.id,
          changedAt: new Date().toISOString(),
        });
        saveLocalDatabase(db);
      }
    }
    return AppResult.success(results);
  }

  async parentsOfStudent(studentId: string): Promise<AppResult<Profile[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const ids = new Set(
      db.parentStudents.filter((ps) => ps.studentId === studentId).map((ps) => ps.parentId)
    );
    return AppResult.success(db.profiles.filter((p) => ids.has(p.id)));
  }

  async transferStudent(
    studentId: string,
    newSectionId: string,
    reason: string,
    actor: Profile
  ): Promise<AppResult<Student>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can transfer students.',
      });
    }
    if (!reason.trim()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'A reason is required for a transfer.',
      });
    }
    const db = getOrSeedLocalDatabase();
    const idx = db.students.findIndex((s) => s.id === studentId);
    const section = db.sections.find((x) => x.id === newSectionId);
    const cls = section ? db.classes.find((c) => c.id === section.classId) : undefined;
    if (idx === -1 || !section || !cls) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: studentId,
        message: 'Student or section not found.',
      });
    }
    const prev = db.students[idx];
    if (prev.sectionId === newSectionId) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'The student is already in this section.',
      });
    }
    const roll =
      db.students
        .filter((s) => s.sectionId === newSectionId)
        .reduce((m, s) => Math.max(m, s.rollNo), 0) + 1;
    const updated: Student = {
      ...prev,
      sectionId: newSectionId,
      campusId: cls.campusId,
      rollNo: roll,
    };
    db.students[idx] = updated;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'TRANSFER_STUDENT',
      tableName: 'students',
      recordId: studentId,
      oldValue: `${prev.sectionId} (${prev.campusId})`,
      newValue: `${newSectionId} (${cls.campusId})`,
      reason: reason.trim(),
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(updated);
  }

  async create(student: Student, createdBy: string): Promise<AppResult<Student>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    db.students.push(student);
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'CREATE_STUDENT',
      tableName: 'students',
      recordId: student.id,
      oldValue: null,
      newValue: `${student.admissionNo} - ${student.name}`,
      reason: 'New student admission',
      changedBy: createdBy,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(student);
  }

  async update(student: Student, updatedBy: string): Promise<AppResult<Student>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.students.findIndex((s) => s.id === student.id);
    if (idx === -1) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: student.id,
        message: `Student (${student.id}) was not found.`,
      });
    }
    const previous = db.students[idx];
    db.students[idx] = student;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'UPDATE_STUDENT',
      tableName: 'students',
      recordId: student.id,
      oldValue: previous.name,
      newValue: student.name,
      reason: 'Student record updated',
      changedBy: updatedBy,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(student);
  }

  async markLeft(
    studentId: string,
    leftDate: string,
    reason: string,
    markedBy: string
  ): Promise<AppResult<Student>> {
    await simulateLocalDelay();
    if (!reason.trim()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'Reason is required when marking a student as LEFT.',
      });
    }
    const db = getOrSeedLocalDatabase();
    const idx = db.students.findIndex((s) => s.id === studentId);
    if (idx === -1) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: studentId,
        message: `Student (${studentId}) was not found.`,
      });
    }
    const updated: Student = {
      ...db.students[idx],
      status: StudentStatus.LEFT,
    };
    db.students[idx] = updated;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'MARK_STUDENT_LEFT',
      tableName: 'students',
      recordId: studentId,
      oldValue: StudentStatus.ACTIVE,
      newValue: `${StudentStatus.LEFT} (${leftDate})`,
      reason: reason.trim(),
      changedBy: markedBy,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(updated);
  }

  async linkParent(
    parentId: string,
    studentId: string,
    relation: ParentRelation
  ): Promise<AppResult<ParentStudent>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const existingIdx = db.parentStudents.findIndex(
      (ps) => ps.parentId === parentId && ps.studentId === studentId
    );
    const link: ParentStudent = { parentId, studentId, relation };
    if (existingIdx >= 0) {
      db.parentStudents[existingIdx] = link;
    } else {
      db.parentStudents.push(link);
    }
    saveLocalDatabase(db);
    return AppResult.success(link);
  }

  async unlinkParent(
    parentId: string,
    studentId: string
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    db.parentStudents = db.parentStudents.filter(
      (ps) => !(ps.parentId === parentId && ps.studentId === studentId)
    );
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async childrenOfParent(parentId: string): Promise<AppResult<Student[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const normalizedParentId = parentId.toLowerCase();
    const matchedProfile = db.profiles.find(
      (p) =>
        p.id.toLowerCase() === normalizedParentId ||
        p.loginId.toLowerCase() === normalizedParentId
    );
    const resolvedParentId = matchedProfile ? matchedProfile.id : parentId;

    const studentIds = new Set(
      db.parentStudents
        .filter((ps) => ps.parentId === resolvedParentId)
        .map((ps) => ps.studentId)
    );
    const children = db.students.filter((s) => studentIds.has(s.id));
    return AppResult.success(children);
  }

  async promoteClass(
    fromSectionId: string,
    toSectionId: string,
    studentIds: string[],
    promotedBy: string
  ): Promise<AppResult<number>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idSet = new Set(studentIds);
    let promotedCount = 0;

    let maxRollInTarget = db.students
      .filter((s) => s.sectionId === toSectionId)
      .reduce((max, s) => Math.max(max, s.rollNo), 0);

    db.students = db.students.map((s) => {
      if (s.sectionId === fromSectionId && idSet.has(s.id)) {
        promotedCount++;
        maxRollInTarget++;
        return {
          ...s,
          sectionId: toSectionId,
          rollNo: maxRollInTarget,
        };
      }
      return s;
    });

    if (promotedCount > 0) {
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        action: 'PROMOTE_CLASS',
        tableName: 'students',
        recordId: `${fromSectionId}->${toSectionId}`,
        oldValue: fromSectionId,
        newValue: `${toSectionId} (${promotedCount} students)`,
        reason: 'Annual class promotion',
        changedBy: promotedBy,
        changedAt: new Date().toISOString(),
      });
      saveLocalDatabase(db);
    }

    return AppResult.success(promotedCount);
  }

  async getStudentsByCampus(campus: Campus): Promise<Student[]> {
    const campusId =
      campus === Campus.BOTH
        ? null
        : campus === Campus.BOYS
        ? 'campus_b'
        : 'campus_g';
    const res = await this.search({ campusId, status: StudentStatus.ACTIVE });
    return res.ok ? res.data : [];
  }
}

// ============================================================================
// 3. FAKE ATTENDANCE REPOSITORY (Fully Implemented + Real Business Rules)
// ============================================================================

export class FakeAttendanceRepository implements AttendanceRepository {
  async sectionsForTeacher(teacherId: string): Promise<AppResult<Section[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const normalizedId = teacherId.toLowerCase();
    const profile = db.profiles.find(
      (p) =>
        p.id.toLowerCase() === normalizedId ||
        p.loginId.toLowerCase() === normalizedId
    );
    const resolvedTeacherId = profile ? profile.id : teacherId;

    const assignedSectionIds = new Set(
      db.teacherAssignments
        .filter(
          (ta) => ta.teacherId === resolvedTeacherId && ta.canMarkAttendance
        )
        .map((ta) => ta.sectionId)
    );
    if (profile?.role === Role.ADMIN) {
      return AppResult.success([...db.sections]);
    }
    return AppResult.success(
      db.sections.filter((sec) => assignedSectionIds.has(sec.id))
    );
  }

  async studentsOfSection(sectionId: string): Promise<AppResult<Student[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.students
        .filter(
          (s) => s.sectionId === sectionId && s.status === StudentStatus.ACTIVE
        )
        .sort((a, b) => a.rollNo - b.rollNo)
    );
  }

  async getForSectionAndDate(
    sectionId: string,
    date: string
  ): Promise<AppResult<AttendanceRecord[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.attendanceRecords.filter(
        (r) => r.sectionId === sectionId && r.date === date
      )
    );
  }

  async getActiveUnlock(sectionId: string, date: string): Promise<AppResult<AttendanceUnlock | null>> {
    const db = getOrSeedLocalDatabase();
    return AppResult.success(activeUnlockFor(db, sectionId, date));
  }

  async listActiveUnlocks(): Promise<AppResult<AttendanceUnlock[]>> {
    const db = getOrSeedLocalDatabase();
    const now = Date.now();
    return AppResult.success((db.attendanceUnlocks ?? []).filter((u) => new Date(u.expiresAt).getTime() > now));
  }

  async openUnlock(
    actor: Profile,
    input: { sectionId: string | null; date: string; minutes: number }
  ): Promise<AppResult<AttendanceUnlock>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can open attendance for editing.' });
    }
    if (!Number.isFinite(input.minutes) || input.minutes < 1 || input.minutes > 240) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Minutes must be between 1 and 240.' });
    }
    const db = getOrSeedLocalDatabase();
    db.attendanceUnlocks ??= [];
    const now = Date.now();
    // forget unlocks that ended more than a day ago
    db.attendanceUnlocks = db.attendanceUnlocks.filter((u) => new Date(u.expiresAt).getTime() > now - 86400000);
    const unlock: AttendanceUnlock = {
      id: `unl_${now}`,
      sectionId: input.sectionId,
      date: input.date,
      expiresAt: new Date(now + input.minutes * 60000).toISOString(),
      createdBy: actor.id,
      createdAt: new Date(now).toISOString(),
    };
    db.attendanceUnlocks.push(unlock);
    db.auditLogs.unshift({
      id: `aud_${now}`, action: 'ATTENDANCE_UNLOCK', tableName: 'attendance_unlocks', recordId: unlock.id,
      oldValue: null, newValue: `${input.sectionId ?? 'ALL'} ${input.date} ${input.minutes}min`, reason: 'Admin opened attendance for editing',
      changedBy: actor.id, changedAt: new Date(now).toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(unlock);
  }

  async closeUnlock(actor: Profile, unlockId: string): Promise<AppResult<void>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can lock attendance.' });
    }
    const db = getOrSeedLocalDatabase();
    const u = (db.attendanceUnlocks ?? []).find((x) => x.id === unlockId);
    if (u) u.expiresAt = new Date().toISOString();
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getSubmission(
    sectionId: string,
    date: string
  ): Promise<AppResult<AttendanceSubmission | null>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const found =
      db.attendanceSubmissions.find(
        (s) => s.sectionId === sectionId && s.date === date
      ) ?? null;
    return AppResult.success(found);
  }

  /**
   * ATTENDANCE RULES:
   * - A teacher can submit or edit attendance ONLY for sections where canMarkAttendance is true,
   *   ONLY for today (Asia/Karachi), and ONLY before the lock time.
   * - Otherwise return a clear DomainError.
   */
  async submit(
    actor: Profile,
    sectionId: string,
    date: string,
    records: AttendanceRecord[]
  ): Promise<AppResult<AttendanceSubmission>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const todayKarachi = getTodayKarachiIsoDate();
    const lockTime = db.schoolSettings.attendanceLockTime || '23:59';
    const nowTime = getCurrentKarachiTimeHHMM();
    const unlocked = activeUnlockFor(db, sectionId, date) !== null;

    if (actor.role === Role.TEACHER || actor.role === Role.ATTENDANCE_COORDINATOR || actor.role === Role.ADMIN) {
      // Check assigned section with canMarkAttendance == true (the admin may mark any section, under the same lock rules)
      const isAssigned = actor.role === Role.ADMIN || db.teacherAssignments.some(
        (ta) =>
          ta.teacherId === actor.id &&
          ta.sectionId === sectionId &&
          ta.canMarkAttendance
      );
      if (!isAssigned) {
        return AppResult.failure({
          kind: 'SectionNotAssignedToTeacher',
          teacherId: actor.loginId,
          sectionId,
          message: `Teacher ${actor.loginId} (${actor.fullName}) is not assigned to mark attendance for section ${sectionId}.`,
        });
      }

      // Check date == today (Asia/Karachi)
      if (date !== todayKarachi && !unlocked) {
        return AppResult.failure({
          kind: 'AttendanceDateLocked',
          date: todayKarachi,
          message: `Teachers can only submit or edit attendance for today (${todayKarachi}). Past dates require ADMIN correction with a reason.`,
        });
      }

      // Check weekly off / holiday
      const offStatus = checkWeeklyOffOrHoliday(
        date,
        db.holidays,
        db.schoolSettings.weeklyOffDays
      );
      if (offStatus.isOff) {
        return AppResult.failure({
          kind: 'ValidationFailed',
          message: 'Holiday / weekly off - no attendance today',
        });
      }

      // Check lock time
      if (nowTime > lockTime && !unlocked) {
        return AppResult.failure({
          kind: 'AttendancePastCutoffTime',
          lockTime,
          message: `Attendance submission is locked after ${lockTime} (Asia/Karachi).`,
        });
      }
    } else {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: `Role ${actor.role} is not permitted to submit attendance.`,
      });
    }

    const previousStatus = new Map(
      db.attendanceRecords
        .filter((r) => r.sectionId === sectionId && r.date === date)
        .map((r) => [r.studentId, r.status])
    );

    // Replace existing records for sectionId + date
    db.attendanceRecords = db.attendanceRecords.filter(
      (r) => !(r.sectionId === sectionId && r.date === date)
    );
    db.attendanceRecords.push(...records);

    const submission: AttendanceSubmission = {
      sectionId,
      date,
      submittedBy: actor.id,
      submittedAt: nowIso(),
    };
    db.attendanceSubmissions = db.attendanceSubmissions.filter(
      (s) => !(s.sectionId === sectionId && s.date === date)
    );
    db.attendanceSubmissions.push(submission);
    records.forEach((r) => {
      if (r.status !== AttendanceStatus.ABSENT && r.status !== AttendanceStatus.LATE) return;
      if (previousStatus.get(r.studentId) === r.status) return;
      const stu = db.students.find((x) => x.id === r.studentId);
      if (!stu) return;
      const absent = r.status === AttendanceStatus.ABSENT;
      notifyParents(
        db,
        stu.id,
        NotificationType.ATTENDANCE,
        absent ? `${stu.name} was absent today` : `${stu.name} was late today`,
        absent ? `${stu.nameUr || stu.name} آج غیر حاضر تھا/تھی` : `${stu.nameUr || stu.name} آج دیر سے آیا/آئی`,
        date,
        date
      );
    });
    saveLocalDatabase(db);

    return AppResult.success(submission);
  }

  /**
   * Attendance percentage = (PRESENT + LATE) divided by days marked,
   * excluding LEAVE days, Sundays and holidays. Leave days are reported separately.
   */
  async getParentSummary(
    studentId: string,
    month: string
  ): Promise<AppResult<ParentAttendanceSummary>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();

    // Filter all valid working day records for this student (excluding Sundays and holidays)
    const studentRecords = db.attendanceRecords
      .filter(
        (r) =>
          r.studentId === studentId && !isSundayOrHoliday(r.date, db.holidays)
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const dailyRecords = studentRecords.filter((r) =>
      r.date.startsWith(`${month}-`)
    );

    // Group by YearMonth ("YYYY-MM")
    const recordsByMonth: Record<string, AttendanceRecord[]> = {};
    for (const r of studentRecords) {
      const ym = r.date.slice(0, 7);
      if (!recordsByMonth[ym]) recordsByMonth[ym] = [];
      recordsByMonth[ym].push(r);
    }

    const monthlyPercentages: MonthlyAttendancePercentage[] = Object.keys(
      recordsByMonth
    )
      .sort()
      .map((ym) => {
        const list = recordsByMonth[ym];
        const presentDays = list.filter(
          (r) => r.status === AttendanceStatus.PRESENT
        ).length;
        const absentDays = list.filter(
          (r) => r.status === AttendanceStatus.ABSENT
        ).length;
        const leaveDays = list.filter(
          (r) => r.status === AttendanceStatus.LEAVE
        ).length;
        const lateDays = list.filter(
          (r) => r.status === AttendanceStatus.LATE
        ).length;
        const daysMarkedExclLeave = presentDays + lateDays + absentDays;
        const percentage =
          daysMarkedExclLeave > 0
            ? Number(
                (((presentDays + lateDays) / daysMarkedExclLeave) * 100).toFixed(
                  1
                )
              )
            : 0;
        return {
          month: ym,
          totalDays: daysMarkedExclLeave,
          presentDays,
          absentDays,
          leaveDays,
          lateDays,
          percentage,
        };
      });

    const allTimePresentDays = studentRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT
    ).length;
    const allTimeAbsentDays = studentRecords.filter(
      (r) => r.status === AttendanceStatus.ABSENT
    ).length;
    const allTimeLeaveDays = studentRecords.filter(
      (r) => r.status === AttendanceStatus.LEAVE
    ).length;
    const allTimeLateDays = studentRecords.filter(
      (r) => r.status === AttendanceStatus.LATE
    ).length;
    const allTimeTotalDays =
      allTimePresentDays + allTimeLateDays + allTimeAbsentDays;
    const allTimePercentage =
      allTimeTotalDays > 0
        ? Number(
            (
              ((allTimePresentDays + allTimeLateDays) / allTimeTotalDays) *
              100
            ).toFixed(1)
          )
        : 0;

    return AppResult.success({
      studentId,
      dailyRecords,
      monthlyPercentages,
      allTimeTotalDays,
      allTimePresentDays,
      allTimeAbsentDays,
      allTimeLeaveDays,
      allTimeLateDays,
      allTimePercentage,
    });
  }

  /**
   * After lock time, or for past days, ONLY ADMIN may change records through adminCorrect,
   * which needs a reason and writes an AuditLogEntry.
   */
  async adminMarkStudentDays(
    actor: Profile,
    studentId: string,
    changes: { date: string; status: AttendanceStatus | null }[]
  ): Promise<AppResult<number>> {
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only ADMIN can change attendance this way.' });
    }
    const db = getOrSeedLocalDatabase();
    const stu = db.students.find((s) => s.id === studentId);
    if (!stu) return AppResult.failure({ kind: 'NotFound', entity: 'Student', id: studentId, message: 'Student not found.' });
    const todayStr = today();
    const nowIso2 = new Date().toISOString();
    let n = 0;
    for (const ch of changes) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ch.date) || ch.date > todayStr) continue;
      const idx = db.attendanceRecords.findIndex((r) => r.studentId === studentId && r.date === ch.date);
      if (ch.status === null) {
        if (idx >= 0) db.attendanceRecords.splice(idx, 1);
      } else {
        const rec: AttendanceRecord = { studentId, sectionId: stu.sectionId, date: ch.date, status: ch.status, remarks: null, markedBy: actor.id };
        if (idx >= 0) db.attendanceRecords[idx] = rec;
        else db.attendanceRecords.push(rec);
        if (!db.attendanceSubmissions.some((s) => s.sectionId === stu.sectionId && s.date === ch.date)) {
          db.attendanceSubmissions.push({ sectionId: stu.sectionId, date: ch.date, submittedBy: actor.id, submittedAt: nowIso2 });
        }
      }
      n += 1;
    }
    if (n > 0) {
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        action: 'ADMIN_CORRECT_ATTENDANCE',
        tableName: 'attendance_records',
        recordId: `${studentId}_${changes[0].date}`,
        oldValue: null,
        newValue: changes.length === 1 ? String(changes[0].status) : `${n} days`,
        reason: 'Student-by-student calendar',
        changedBy: actor.id,
        changedAt: nowIso2,
      });
      saveLocalDatabase(db);
    }
    return AppResult.success(n);
  }

  async importMonthlyAttendance(
    rows: ImportAttendanceRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportAttendanceResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only ADMIN can import attendance.' });
    }
    const db = getOrSeedLocalDatabase();
    const todayStr = today();
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const byNo = new Map(db.students.map((s) => [norm(s.admissionNo), s]));
    const codes: Record<string, AttendanceStatus> = {
      p: AttendanceStatus.PRESENT,
      a: AttendanceStatus.ABSENT,
      l: AttendanceStatus.LATE,
      le: AttendanceStatus.LEAVE,
    };
    // H = holiday / off day: nothing is saved for that day
    const HOLIDAY = 'h';
    const out: ImportAttendanceResult[] = [];
    const nowIso = new Date().toISOString();
    for (const row of rows) {
      const res: ImportAttendanceResult = { line: row.line, ok: false, studentName: row.name, daysMarked: 0, error: null, warnings: [] };
      out.push(res);
      const stu = byNo.get(norm(row.admissionNo));
      if (!row.admissionNo.trim()) { res.error = 'Admission No is empty.'; continue; }
      if (!stu) { res.error = `No student with Admission No ${row.admissionNo}.`; continue; }
      res.studentName = stu.name;
      if (!(row.month >= 1 && row.month <= 12) || !(row.year >= 2000 && row.year <= 2100)) { res.error = 'Month or Year is not readable.'; continue; }
      if (row.name.trim() && norm(row.name) !== norm(stu.name)) res.warnings.push(`File name "${row.name}" differs from "${stu.name}"; matched by Admission No.`);
      const sec = db.sections.find((x) => x.id === stu.sectionId);
      const cls = sec ? db.classes.find((c) => c.id === sec.classId) : undefined;
      const campus = db.campuses.find((c) => c.id === stu.campusId);
      if (row.className?.trim() && cls) {
        const given = norm(row.className.replace(/^class\s*/i, ''));
        const ok = [cls.nameEn, `${cls.nameEn}${sec?.name ?? ''}`, sec?.name ?? ''].some((x) => norm(x.replace(/^class\s*/i, '')) === given);
        if (!ok) res.warnings.push(`Class "${row.className}" differs from ${cls.nameEn}${sec ? `-${sec.name}` : ''} in the app.`);
      }
      if (row.campus?.trim() && campus) {
        const c = norm(row.campus);
        if (!(norm(campus.nameEn).includes(c) || c.includes(norm(campus.nameEn).slice(0, 4)) || (c[0] === campus.code.toLowerCase() && c.length <= 2))) {
          res.warnings.push(`Campus "${row.campus}" differs from ${campus.nameEn} in the app.`);
        }
      }
      const dim = new Date(row.year, row.month, 0).getDate();
      const mm = `${row.year}-${String(row.month).padStart(2, '0')}`;
      const todo: { date: string; status: AttendanceStatus }[] = [];
      let bad: string | null = null;
      let future = 0;
      for (const [dayStr, raw] of Object.entries(row.cells)) {
        const v = raw.trim();
        if (!v) continue;
        const day = Number(dayStr);
        if (v.toLowerCase() === HOLIDAY) continue;
        const status = codes[v.toLowerCase()];
        if (!status) { bad = `Day ${day}: "${v}" is not P, A, L, Le or H.`; break; }
        if (day < 1 || day > dim) { bad = `Day ${day} does not exist in ${mm}.`; break; }
        const date = `${mm}-${String(day).padStart(2, '0')}`;
        if (date > todayStr) { future += 1; continue; }
        todo.push({ date, status });
      }
      if (bad) { res.error = bad; continue; }
      if (future) res.warnings.push(`${future} future day(s) skipped.`);
      if (todo.length === 0) { res.error = 'No attendance marks in this row.'; continue; }
      res.ok = true;
      res.daysMarked = todo.length;
      if (dryRun) continue;
      for (const { date, status } of todo) {
        const rec: AttendanceRecord = { studentId: stu.id, sectionId: stu.sectionId, date, status, remarks: null, markedBy: actor.id };
        const idx = db.attendanceRecords.findIndex((r) => r.studentId === stu.id && r.date === date);
        if (idx >= 0) db.attendanceRecords[idx] = rec;
        else db.attendanceRecords.push(rec);
        if (!db.attendanceSubmissions.some((s) => s.sectionId === stu.sectionId && s.date === date)) {
          db.attendanceSubmissions.push({ sectionId: stu.sectionId, date, submittedBy: actor.id, submittedAt: nowIso });
        }
      }
    }
    if (!dryRun) {
      const done = out.filter((r) => r.ok);
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        action: 'ADMIN_IMPORT_ATTENDANCE',
        tableName: 'attendance_records',
        recordId: `import_${nowIso}`,
        oldValue: null,
        newValue: `${done.length} students, ${done.reduce((a, r) => a + r.daysMarked, 0)} days`,
        reason: 'Monthly attendance CSV import',
        changedBy: actor.id,
        changedAt: nowIso,
      });
      saveLocalDatabase(db);
    }
    return AppResult.success(out);
  }

  async adminCorrect(
    actor: Profile,
    studentId: string,
    sectionId: string,
    date: string,
    newStatus: AttendanceStatus,
    reason: string
  ): Promise<AppResult<AttendanceRecord>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only ADMIN can correct attendance records via adminCorrect.',
      });
    }
    if (!reason.trim()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'A reason is mandatory for attendance correction audit log.',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'Choose a date that is not in the future.',
      });
    }
    const db = getOrSeedLocalDatabase();
    if (!db.students.some((s) => s.id === studentId)) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: studentId,
        message: 'Student not found.',
      });
    }
    const existingIdx = db.attendanceRecords.findIndex(
      (r) =>
        r.studentId === studentId &&
        r.sectionId === sectionId &&
        r.date === date
    );
    const oldStatus =
      existingIdx >= 0 ? db.attendanceRecords[existingIdx].status : 'NONE';

    const updatedRecord: AttendanceRecord = {
      studentId,
      sectionId,
      date,
      status: newStatus,
      remarks: reason.trim(),
      markedBy: actor.id,
    };

    if (existingIdx >= 0) {
      db.attendanceRecords[existingIdx] = updatedRecord;
    } else {
      db.attendanceRecords.push(updatedRecord);
    }

    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'ADMIN_CORRECT_ATTENDANCE',
      tableName: 'attendance_records',
      recordId: `${studentId}_${date}`,
      oldValue: String(oldStatus),
      newValue: newStatus,
      reason: reason.trim(),
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);

    return AppResult.success(updatedRecord);
  }

  async sectionsNotMarked(
    date: string,
    campusId: string | null
  ): Promise<AppResult<Section[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const markedSet = new Set(
      db.attendanceSubmissions
        .filter((s) => s.date === date)
        .map((s) => s.sectionId)
    );

    const classCampusMap: Record<string, string> = {};
    db.classes.forEach((c) => {
      classCampusMap[c.id] = c.campusId;
    });

    const unmarked = db.sections.filter((sec) => {
      if (campusId && classCampusMap[sec.classId] !== campusId) return false;
      return !markedSet.has(sec.id);
    });
    return AppResult.success(unmarked);
  }

  async clearAttendanceForSectionAndDate(
    sectionId: string,
    date: string
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    db.attendanceSubmissions = db.attendanceSubmissions.filter(
      (s) => !(s.sectionId === sectionId && s.date === date)
    );
    db.attendanceRecords = db.attendanceRecords.filter(
      (r) => !(r.sectionId === sectionId && r.date === date)
    );
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getTotalRecordsCount(): Promise<
    AppResult<{ recordsCount: number; submissionsCount: number }>
  > {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success({
      recordsCount: db.attendanceRecords.length,
      submissionsCount: db.attendanceSubmissions.length,
    });
  }
}

// ============================================================================
// 4. FAKE FEE REPOSITORY (Fully Implemented + Real Business Rules)
// ============================================================================

export class FakeFeeRepository implements FeeRepository {
  async importFeeFile(
    rows: ImportFeeRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportFeeResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can import fees.' });
    }
    const stored = getOrSeedLocalDatabase();
    const db = dryRun ? structuredClone(stored) : stored;
    const priority: Record<string, number> = {};
    db.feeHeads.forEach((h) => (priority[h.id] = h.priority));

    // 1. match every line to a student
    const seen = new Set<string>();
    const fail = (row: ImportFeeRow, error: string): ImportFeeResult => ({
      line: row.line, ok: false, error, warnings: [], studentName: row.name, admissionNo: row.admissionNo, due: 0, paid: 0,
    });
    const plan: { row: ImportFeeRow; student: Student; warnings: string[]; due: number; paid: number; extra: number; collapse: boolean }[] = [];
    const results: ImportFeeResult[] = [];
    const byLine = new Map<number, ImportFeeResult>();
    for (const row of rows) {
      const no = row.admissionNo.trim().toLowerCase();
      if (!no) { byLine.set(row.line, fail(row, 'Adm No is empty.')); continue; }
      const campus = row.campus.trim() ? findCampusByText(db, row.campus) : undefined;
      if (row.campus.trim() && !campus) { byLine.set(row.line, fail(row, `Campus "${row.campus}" not found (use Boys or Girls).`)); continue; }
      const matches = db.students.filter(
        (s) => s.admissionNo.toLowerCase() === no && (!campus || s.campusId === campus.id)
      );
      if (matches.length === 0) { byLine.set(row.line, fail(row, `No student with Adm No ${row.admissionNo}${campus ? ` in ${campus.nameEn}` : ''}. Import students first.`)); continue; }
      if (matches.length > 1) { byLine.set(row.line, fail(row, `Adm No ${row.admissionNo} exists in both campuses - add the Campus column.`)); continue; }
      const student = matches[0];
      if (seen.has(student.id)) { byLine.set(row.line, fail(row, `Adm No ${row.admissionNo} appears twice in the file.`)); continue; }
      seen.add(student.id);
      const warnings: string[] = [];
      const billed = row.months.reduce((s, m) => s + m.amount, 0);
      const colSum = row.prevArrears + row.admissionFee + row.annualCharges + billed;
      if (row.strict) {
        if (row.totalDue !== undefined && row.totalDue !== colSum) {
          byLine.set(row.line, fail(row, `Total Due ${row.totalDue} does not match Monthly Fee + Previous Arrears + Admission + Annual = ${colSum}. Correct the sheet.`));
          continue;
        }
        if (db.feePayments.some((p) => p.studentId === student.id && !p.isVoid)) {
          byLine.set(row.line, fail(row, 'This student already has payments recorded, so the opening balance cannot be applied again.'));
          continue;
        }
      }
      // The accountant's own Total Due / Arrears figures are the master record; the columns only give the breakdown.
      let due = colSum;
      if (row.totalDue !== undefined) due = row.totalDue;
      else if (row.arrears !== undefined) due = row.arrears + row.totalPaid;
      let paid = row.totalPaid;
      if (row.arrears !== undefined) {
        const fromFile = Math.max(0, Math.min(due, due - row.arrears));
        if (fromFile !== paid) {
          warnings.push(`Total Paid in file is ${paid}, but Total Due ${due} - Arrears ${row.arrears} = ${fromFile}. Using ${fromFile}.`);
          paid = fromFile;
        }
      }
      if (paid > due) { warnings.push(`Total Paid ${paid} is more than Total Due ${due}; only ${due} is recorded.`); paid = due; }
      const gap = due - colSum;
      let extra = 0;
      let collapse = false;
      if (gap > 0) {
        extra = gap;
        warnings.push(`Fee columns add up to ${colSum} but Total Due is ${due}. The extra ${gap} is shown as previous arrears.`);
      } else if (gap < 0) {
        collapse = true;
        warnings.push(`Fee columns add up to ${colSum} but Total Due is ${due}. Saved as one balance of ${due}.`);
      }
      plan.push({ row, student, warnings, due, paid, extra, collapse });
    }

    // 2. remove the old records of these students (the file is the master record)
    const ids = new Set(plan.map((p) => p.student.id));
    const oldPayments = new Set(db.feePayments.filter((p) => ids.has(p.studentId)).map((p) => p.id));
    const oldVouchers = new Set(db.feeVouchers.filter((v) => ids.has(v.studentId)).map((v) => v.id));
    db.paymentAllocations = db.paymentAllocations.filter((a) => !oldPayments.has(a.paymentId) && !oldVouchers.has(a.voucherId));
    db.feePayments = db.feePayments.filter((p) => !oldPayments.has(p.id));
    db.feeVouchers = db.feeVouchers.filter((v) => !oldVouchers.has(v.id));
    db.studentConcessions = db.studentConcessions.filter((c) => !(ids.has(c.studentId) && c.feeHeadId === 'fh_tuition'));

    const nextVoucher: Record<string, number> = {};
    const nextReceipt: Record<string, number> = {};
    const seqFrom = (list: { no: string }[], prefix: string, cut: number) =>
      list.filter((x) => x.no.startsWith(prefix)).reduce((m, x) => Math.max(m, Number(x.no.slice(cut)) || 0), 0);
    ['B-', 'G-'].forEach((pre) => {
      nextVoucher[pre] = seqFrom(db.feeVouchers.map((v) => ({ no: v.voucherNo })), pre, 2);
      nextReceipt[pre] = seqFrom(db.feePayments.map((p) => ({ no: p.receiptNo })), `${pre}R-`, 4);
    });
    let allocSeq = db.paymentAllocations.reduce((m, a) => Math.max(m, Number(/(\d+)$/.exec(a.id)?.[1] ?? 0)), 0);

    // 3. write the new records
    for (const { row, student, warnings, due, paid: paidAmt, extra, collapse } of plan) {
      const pre = student.campusId === 'campus_g' ? 'G-' : 'B-';
      const items = new Map<string, FeeVoucherItem[]>(); // month -> items
      const add = (month: string, item: FeeVoucherItem) => items.set(month, [...(items.get(month) ?? []), item]);
      const billedMonths = row.months.filter((m) => m.amount > 0).sort((a, b) => a.month.localeCompare(b.month));
      if (collapse) {
        if (due > 0) add(row.arrearsMonth, { feeHeadId: 'fh_arrears', description: 'Balance as per fee file', amount: due, waivedAmount: 0, paidAmount: 0 });
      } else if (row.prevArrears + extra > 0) {
        add(row.arrearsMonth, { feeHeadId: 'fh_arrears', description: 'Previous Arrears', amount: row.prevArrears + extra, waivedAmount: 0, paidAmount: 0 });
      }
      if (!collapse) billedMonths.forEach((m) =>
        add(m.month, { feeHeadId: 'fh_tuition', description: `Monthly Tuition Fee (${m.month})`, amount: m.amount, waivedAmount: 0, paidAmount: 0 })
      );
      const extraMonth = billedMonths[0]?.month ?? `${row.arrearsMonth.slice(0, 4)}-${String(Number(row.arrearsMonth.slice(5)) % 12 + 1).padStart(2, '0')}`;
      if (!collapse && row.admissionFee > 0) add(extraMonth, { feeHeadId: 'fh_admission', description: 'Admission Fee', amount: row.admissionFee, waivedAmount: 0, paidAmount: 0 });
      if (!collapse && row.annualCharges > 0) add(extraMonth, { feeHeadId: 'fh_annual', description: 'Annual Charges', amount: row.annualCharges, waivedAmount: 0, paidAmount: 0 });

      const vouchers: FeeVoucher[] = [...items.keys()].sort().map((month) => {
        nextVoucher[pre] += 1;
        const voucherNo = `${pre}${String(nextVoucher[pre]).padStart(4, '0')}`;
        return {
          id: `vch_${voucherNo.toLowerCase()}`, voucherNo, studentId: student.id, campusId: student.campusId,
          billingMonth: month, issueDate: `${month}-01`, dueDate: `${month}-10`, items: items.get(month)!, status: VoucherStatus.UNPAID,
        };
      });

      let remaining = paidAmt;
      if (remaining > 0) {
        nextReceipt[pre] += 1;
        const receiptNo = `${pre}R-${String(nextReceipt[pre]).padStart(4, '0')}`;
        const paymentId = `pay_${receiptNo.toLowerCase()}`;
        db.feePayments.push({
          id: paymentId, receiptNo, studentId: student.id, amount: remaining, paidOn: today(),
          method: PaymentMethod.CASH, receivedBy: actor.id, isVoid: false, reference: null,
          remarks: 'Imported from the accountant\'s fee file (total paid)',
        });
        for (const v of vouchers) {
          for (const item of [...v.items].sort((a, b) => (priority[a.feeHeadId] ?? 99) - (priority[b.feeHeadId] ?? 99))) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, item.amount);
            item.paidAmount = take;
            remaining -= take;
            allocSeq += 1;
            db.paymentAllocations.push({ id: `alloc_imp_${allocSeq}`, paymentId, voucherId: v.id, feeHeadId: item.feeHeadId, allocatedAmount: take });
          }
        }
      }
      vouchers.forEach((v) => {
        const total = v.items.reduce((s, i) => s + i.amount, 0);
        const paid = v.items.reduce((s, i) => s + (i.paidAmount ?? 0), 0);
        v.status = paid >= total ? VoucherStatus.PAID : paid > 0 ? VoucherStatus.PARTIAL : VoucherStatus.UNPAID;
        db.feeVouchers.push(v);
      });
      if (row.monthlyFee && row.monthlyFee > 0) {
        db.studentConcessions.push({
          studentId: student.id, feeHeadId: 'fh_tuition', type: ConcessionType.OVERRIDE, value: row.monthlyFee,
          reason: 'Monthly fee from the accountant\'s fee file',
        });
      }
      byLine.set(row.line, {
        line: row.line, ok: true, error: null, warnings, studentName: student.name, admissionNo: student.admissionNo,
        due, paid: paidAmt,
      });
    }
    if (!dryRun) {
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`, action: 'IMPORT_FEES', tableName: 'fee_vouchers', recordId: 'bulk',
        oldValue: null, newValue: `${plan.length} students`, reason: 'Fee file imported by Admin',
        changedBy: actor.id, changedAt: new Date().toISOString(),
      });
      saveLocalDatabase(db);
    }
    rows.forEach((r) => { const x = byLine.get(r.line); if (x) results.push(x); });
    return AppResult.success(results);
  }

  async importDailyPayments(
    rows: ImportPaymentRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportPaymentResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN && actor.role !== Role.ACCOUNTANT) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin or Accountant can import fee payments.' });
    }
    const stored = getOrSeedLocalDatabase();
    const db = dryRun ? structuredClone(stored) : stored;
    const results: ImportPaymentResult[] = [];
    const paymentTags = (ls: ImportPaymentRow[]) => {
      const by: Record<string, number> = {};
      ls.forEach((r) => {
        const k = r.feeFor === 'ARREARS' ? 'ARREARS' : r.feeFor === 'ADMISSION' ? 'ADMISSION' : r.feeFor === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
        by[k] = (by[k] ?? 0) + (r.amount ?? 0);
      });
      const at = ls.find((r) => r.collectedAt)?.collectedAt;
      return `[by:${Object.entries(by).map(([k, v]) => `${k}=${v}`).join(',')}]${at ? `[at:${at}]` : ''}`;
    };
    const seenReceipts = new Set(db.feePayments.map((p) => p.receiptNo.toLowerCase()));
    const priority: Record<string, number> = {};
    db.feeHeads.forEach((h) => (priority[h.id] = h.priority));
    let allocSeq = db.paymentAllocations.reduce((m, a) => Math.max(m, Number(/(\d+)$/.exec(a.id)?.[1] ?? 0)), 0);
    const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nextVoucherNo = (pre: string) => {
      const max = db.feeVouchers.filter((v) => v.voucherNo.startsWith(pre)).reduce((m, v) => Math.max(m, Number(v.voucherNo.slice(2)) || 0), 0);
      return `${pre}${String(max + 1).padStart(4, '0')}`;
    };

    // One receipt may be written on several lines (monthly fee + arrears ...): they are one payment.
    const groups = new Map<string, ImportPaymentRow[]>();
    rows.forEach((r) => {
      const key = r.receiptNo.trim().toLowerCase() || `__line${r.line}`;
      groups.set(key, [...(groups.get(key) ?? []), r]);
    });
    const ordered = [...groups.values()].sort((x, y) => (x[0].date || '').localeCompare(y[0].date || '') || x[0].line - y[0].line);

    for (const lines of ordered) {
      const head = lines[0];
      const out = (ok: boolean, error: string | null, warnings: string[], studentName: string) =>
        lines.forEach((r, i) =>
          results.push({
            line: r.line, ok, error, warnings: i === 0 ? warnings : [], studentName, admissionNo: r.admissionNo,
            receiptNo: r.receiptNo, amount: r.amount ?? 0,
          })
        );
      const bad = (m: string) => out(false, m, [], head.name);
      if (!head.receiptNo.trim()) { bad('Receipt No is empty.'); continue; }
      const lineErr = lines.find((r) => !r.date || !r.amount || r.amount <= 0 || !r.feeFor || !r.admissionNo.trim());
      if (lineErr) {
        bad(!lineErr.date ? 'Payment Date is missing or not a valid date (use 02-Oct-2026).'
          : !lineErr.amount || lineErr.amount <= 0 ? 'Amount is missing or zero.'
          : !lineErr.feeFor ? 'Fee For must be a month (e.g. Oct-2026), Previous Arrears, Admission Fee or Annual Charges.'
          : 'Adm No is empty.');
        continue;
      }
      if (lines.some((r) => r.admissionNo.trim().toLowerCase() !== head.admissionNo.trim().toLowerCase() || r.date !== head.date || r.campus.trim().toLowerCase() !== head.campus.trim().toLowerCase())) {
        bad(`Receipt ${head.receiptNo} is used for different students or dates. One receipt number must belong to one student and one day.`);
        continue;
      }
      const campus = head.campus.trim() ? findCampusByText(db, head.campus) : undefined;
      const no = head.admissionNo.trim().toLowerCase();
      const matches = db.students.filter((st) => st.admissionNo.toLowerCase() === no && (!campus || st.campusId === campus.id));
      if (matches.length === 0) { bad(`No student with Adm No ${head.admissionNo}.`); continue; }
      if (matches.length > 1) { bad(`Adm No ${head.admissionNo} exists in both campuses - add the Campus column.`); continue; }
      const student = matches[0];
      const warnings: string[] = [];
      if (head.name.trim() && norm(head.name) !== norm(student.name)) warnings.push(`Name in file "${head.name}" differs from "${student.name}".`);

      const tags = paymentTags(lines);
      if (seenReceipts.has(head.receiptNo.trim().toLowerCase())) {
        // already saved: only fill in the missing fee-type / counter details, never change money
        const old = db.feePayments.find((x) => x.receiptNo.toLowerCase() === head.receiptNo.trim().toLowerCase());
        const total = lines.reduce((sum, r) => sum + (r.amount ?? 0), 0);
        if (old && old.studentId === student.id && old.amount === total && !(old.remarks ?? '').includes('[by:')) {
          old.remarks = `${old.remarks ?? 'Daily fee file'} ${tags}`;
          out(true, null, ['Receipt details updated (amounts unchanged).'], student.name);
        } else {
          bad(`Receipt ${head.receiptNo} is already recorded.`);
        }
        continue;
      }

      const realVouchers = db.feeVouchers.filter((v) => v.studentId === student.id);
      if (realVouchers.length === 0) { bad('This student has no opening balance yet. Upload the opening balance sheet first.'); continue; }
      // work on copies; only saved when every line of the receipt fits
      const work: FeeVoucher[] = structuredClone(realVouchers).sort((x, y) => x.billingMonth.localeCompare(y.billingMonth));
      const pre = student.campusId === 'campus_g' ? 'G-' : 'B-';
      const created: FeeVoucher[] = [];
      const allocs = new Map<string, number>(); // voucherId|feeHeadId -> amount
      const addAlloc = (v: FeeVoucher, feeHeadId: string, amount: number) =>
        allocs.set(`${v.id}|${feeHeadId}`, (allocs.get(`${v.id}|${feeHeadId}`) ?? 0) + amount);
      type Slot = { v: FeeVoucher; item: FeeVoucherItem; open: number };
      const openSlots = (): Slot[] =>
        work.flatMap((v) => v.items.map((item) => ({ v, item, open: item.amount - (item.waivedAmount ?? 0) - (item.paidAmount ?? 0) }))).filter((x) => x.open > 0);
      const pay = (x: Slot, amt: number) => { x.item.paidAmount = (x.item.paidAmount ?? 0) + amt; addAlloc(x.v, x.item.feeHeadId, amt); };
      const newPaidItem = (v: FeeVoucher, feeHeadId: string, description: string, amount: number) => {
        v.items.push({ feeHeadId, description, amount, waivedAmount: 0, paidAmount: amount });
        addAlloc(v, feeHeadId, amount);
      };
      const summary: string[] = [];
      let failed: string | null = null;

      for (const line of lines) {
        let left = line.amount ?? 0;
        const label = line.feeFor === 'ARREARS' ? 'Previous Arrears' : line.feeFor === 'ADMISSION' ? 'Admission Fee' : line.feeFor === 'ANNUAL' ? 'Annual Charges' : line.feeFor;
        const isMonth = /^\d{4}-\d{2}$/.test(line.feeFor);
        const takeFrom = (slots: Slot[]) => {
          for (const x of slots) {
            if (left <= 0) break;
            const take = Math.min(left, x.open);
            pay(x, take);
            left -= take;
          }
        };
        const byAge = (x: Slot, y: Slot) => x.v.billingMonth.localeCompare(y.v.billingMonth) || (priority[x.item.feeHeadId] ?? 99) - (priority[y.item.feeHeadId] ?? 99);

        if (isMonth && !work.some((v) => v.billingMonth === line.feeFor) && line.feeFor > work[work.length - 1].billingMonth) {
          // a month that is not billed yet: the fee is paid in advance
          const no2 = nextVoucherNo(pre);
          const v: FeeVoucher = {
            id: `vch_${no2.toLowerCase()}`, voucherNo: no2, studentId: student.id, campusId: student.campusId, billingMonth: line.feeFor,
            issueDate: `${line.feeFor}-01`, dueDate: `${line.feeFor}-10`, items: [], status: VoucherStatus.PAID,
          };
          db.feeVouchers.push(v); // reserves the number while this file is processed
          created.push(v);
          work.push(v);
          newPaidItem(v, 'fh_tuition', `Monthly Tuition Fee (${line.feeFor})`, left);
          summary.push(`${label}: Rs ${left} paid in advance`);
          left = 0;
        } else if (isMonth) {
          const m = openSlots().filter((x) => x.v.billingMonth === line.feeFor && x.item.feeHeadId === 'fh_tuition');
          const before = left;
          takeFrom(m);
          const toMonth = before - left;
          if (m.length === 0) warnings.push(`No unpaid ${line.feeFor} monthly fee found; ${label} went to the oldest dues.`);
          takeFrom(openSlots().filter((x) => x.item.feeHeadId === 'fh_arrears').sort(byAge));
          const toArrears = before - toMonth - left;
          takeFrom(openSlots().sort(byAge));
          summary.push(`${label}: Rs ${toMonth} monthly fee` + (toArrears ? `, Rs ${toArrears} arrears` : ''));
        } else if (line.feeFor === 'ARREARS') {
          const before = left;
          takeFrom(openSlots().filter((x) => x.item.feeHeadId === 'fh_arrears').sort(byAge));
          takeFrom(openSlots().sort(byAge));
          summary.push(`${label}: Rs ${before - left}`);
        } else {
          const head2 = line.feeFor === 'ADMISSION' ? 'fh_admission' : 'fh_annual';
          takeFrom(openSlots().filter((x) => x.item.feeHeadId === head2).sort(byAge));
          if (left > 0) {
            newPaidItem(work[work.length - 1], head2, label, left); // a charge paid on the spot
            left = 0;
          }
          summary.push(`${label}: Rs ${line.amount}`);
        }
        if (left > 0) { failed = `${label}: Rs ${left} is more than the student owes.`; break; }
      }

      if (failed) {
        created.forEach((v) => { db.feeVouchers = db.feeVouchers.filter((x) => x.id !== v.id); });
        bad(failed);
        continue;
      }
      // save
      work.forEach((v) => {
        const total = v.items.reduce((sum, i) => sum + i.amount - (i.waivedAmount ?? 0), 0);
        const paid = v.items.reduce((sum, i) => sum + (i.paidAmount ?? 0), 0);
        v.status = paid >= total ? VoucherStatus.PAID : paid > 0 ? VoucherStatus.PARTIAL : VoucherStatus.UNPAID;
        const at = db.feeVouchers.findIndex((x) => x.id === v.id);
        if (at >= 0) db.feeVouchers[at] = v; else db.feeVouchers.push(v);
      });
      const amount = lines.reduce((sum, r) => sum + (r.amount ?? 0), 0);
      const paymentId = `pay_${head.receiptNo.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${student.id}`;
      db.feePayments.push({
        id: paymentId, receiptNo: head.receiptNo.trim(), studentId: student.id, amount, paidOn: head.date,
        method: PaymentMethod.CASH, receivedBy: actor.id, isVoid: false, reference: null,
        remarks: `Daily fee file (${lines.map((r) => (r.feeFor === 'ARREARS' ? 'Previous Arrears' : r.feeFor)).join(' + ')}) ${tags}`,
      });
      allocs.forEach((amt, key) => {
        const [voucherId, feeHeadId] = key.split('|');
        allocSeq += 1;
        db.paymentAllocations.push({ id: `alloc_day_${allocSeq}`, paymentId, voucherId, feeHeadId, allocatedAmount: amt });
      });
      seenReceipts.add(head.receiptNo.trim().toLowerCase());
      out(true, null, [...warnings, summary.join(' · ')], student.name);
    }
    if (!dryRun) {
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`, action: 'IMPORT_PAYMENTS', tableName: 'fee_payments', recordId: 'bulk',
        oldValue: null, newValue: `${results.filter((r) => r.ok).length} payment lines`, reason: 'Daily fee file imported',
        changedBy: actor.id, changedAt: new Date().toISOString(),
      });
      saveLocalDatabase(db);
    }
    return AppResult.success(results.sort((x, y) => x.line - y.line));
  }

  async getFeeHeads(): Promise<AppResult<FeeHead[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      [...db.feeHeads].sort((a, b) => a.priority - b.priority)
    );
  }

  async saveFeeHead(
    feeHead: FeeHead,
    _actorId: string
  ): Promise<AppResult<FeeHead>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.feeHeads.findIndex((fh) => fh.id === feeHead.id);
    if (idx >= 0) {
      db.feeHeads[idx] = feeHead;
    } else {
      db.feeHeads.push(feeHead);
    }
    saveLocalDatabase(db);
    return AppResult.success(feeHead);
  }

  async getClassFeeStructures(
    classId: string | null
  ): Promise<AppResult<ClassFeeStructure[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const list = classId
      ? db.classFeeStructures.filter((cfs) => cfs.classId === classId)
      : db.classFeeStructures;
    return AppResult.success(list);
  }

  async saveClassFeeStructure(
    structure: ClassFeeStructure,
    actorId: string
  ): Promise<AppResult<ClassFeeStructure>> {
    await simulateLocalDelay();
    if (!Number.isInteger(structure.amount) || structure.amount < 0) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Fee amount must be a whole number, zero or more.' });
    }
    const db = getOrSeedLocalDatabase();
    const before = db.classFeeStructures.find(
      (c) => c.classId === structure.classId && c.feeHeadId === structure.feeHeadId
    );
    db.auditLogs.unshift({
      id: auditId(),
      action: 'UPDATE_CLASS_FEE',
      tableName: 'class_fee_structures',
      recordId: `${structure.classId}/${structure.feeHeadId}`,
      oldValue: before ? String(before.amount) : null,
      newValue: String(structure.amount),
      reason: 'Fee structure changed',
      changedBy: actorId,
      changedAt: new Date().toISOString(),
    });
    const idx = db.classFeeStructures.findIndex(
      (cfs) =>
        cfs.classId === structure.classId &&
        cfs.feeHeadId === structure.feeHeadId
    );
    if (idx >= 0) {
      db.classFeeStructures[idx] = structure;
    } else {
      db.classFeeStructures.push(structure);
    }
    saveLocalDatabase(db);
    return AppResult.success(structure);
  }

  async getConcessionsForStudent(
    studentId: string
  ): Promise<AppResult<StudentConcession[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.studentConcessions.filter((c) => c.studentId === studentId)
    );
  }

  async saveConcession(
    concession: StudentConcession,
    _actorId: string
  ): Promise<AppResult<StudentConcession>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.studentConcessions.findIndex(
      (c) =>
        c.studentId === concession.studentId &&
        c.feeHeadId === concession.feeHeadId
    );
    if (idx >= 0) {
      db.studentConcessions[idx] = concession;
    } else {
      db.studentConcessions.push(concession);
    }
    saveLocalDatabase(db);
    return AppResult.success(concession);
  }

  async removeConcession(
    studentId: string,
    feeHeadId: string,
    _actorId: string
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    db.studentConcessions = db.studentConcessions.filter(
      (c) => !(c.studentId === studentId && c.feeHeadId === feeHeadId)
    );
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  /**
   * FEE RULE:
   * generateMonthlyVouchers(campusId, classId, billingMonth, dueDate) is safe to run twice
   * (skips students who already have that month's voucher), applies class fees and concessions,
   * and adds annual charges in the configured month (August = 08).
   */
  async generateMonthlyVouchers(
    campusId: string | null,
    classId: string | null,
    billingMonth: string,
    dueDate: string,
    _actorId = 'usr_ac01'
  ): Promise<AppResult<FeeVoucher[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();

    const sectionMap: Record<string, Section> = {};
    db.sections.forEach((s) => {
      sectionMap[s.id] = s;
    });

    const existingStudentIdsForMonth = new Set(
      db.feeVouchers
        .filter((v) => v.billingMonth === billingMonth)
        .map((v) => v.studentId)
    );

    let maxBoysSeq = db.feeVouchers
      .filter((v) => v.voucherNo.startsWith('B-'))
      .reduce(
        (max, v) => Math.max(max, Number(v.voucherNo.replace('B-', '')) || 0),
        0
      );
    let maxGirlsSeq = db.feeVouchers
      .filter((v) => v.voucherNo.startsWith('G-'))
      .reduce(
        (max, v) => Math.max(max, Number(v.voucherNo.replace('G-', '')) || 0),
        0
      );

    const createdVouchers: FeeVoucher[] = [];

    for (const stu of db.students) {
      if (stu.status !== StudentStatus.ACTIVE) continue;
      if (campusId && stu.campusId !== campusId) continue;

      const sec = sectionMap[stu.sectionId];
      if (!sec) continue;
      if (classId && sec.classId !== classId) continue;

      // Safe to run twice: skip if student already has a voucher for billingMonth
      if (existingStudentIdsForMonth.has(stu.id)) {
        continue;
      }

      const items: FeeVoucherItem[] = buildMonthlyVoucherItems(
        db,
        stu.id,
        sec.classId,
        billingMonth
      );

      const isBoys = stu.campusId === 'campus_b';
      const voucherNo = isBoys
        ? `B-${String(++maxBoysSeq).padStart(4, '0')}`
        : `G-${String(++maxGirlsSeq).padStart(4, '0')}`;

      const voucher: FeeVoucher = {
        id: `vch_${voucherNo.toLowerCase()}`,
        voucherNo,
        studentId: stu.id,
        campusId: stu.campusId,
        billingMonth,
        issueDate: `${billingMonth}-01`,
        dueDate,
        items,
        status: VoucherStatus.UNPAID,
      };

      db.feeVouchers.push(voucher);
      createdVouchers.push(voucher);
    }

    if (createdVouchers.length > 0) {
      createdVouchers.forEach((v) => {
        const stu = db.students.find((x) => x.id === v.studentId);
        const total = v.items.reduce((sum, it) => sum + Math.max(0, it.amount - it.waivedAmount), 0);
        notifyParents(
          db,
          v.studentId,
          NotificationType.FEE,
          `New fee voucher ${v.voucherNo}`,
          `نیا فیس واؤچر ${v.voucherNo}`,
          `${stu?.name ?? ''} · ${v.billingMonth} · Rs ${total.toLocaleString('en-US')}`,
          `${stu?.nameUr || stu?.name || ''} · ${v.billingMonth} · Rs ${total.toLocaleString('en-US')}`
        );
      });
      saveLocalDatabase(db);
    }

    return AppResult.success(createdVouchers);
  }

  async deleteUnpaidVouchers(
    campusId: string | null,
    classId: string | null,
    billingMonth: string,
    dryRun: boolean,
    actorId: string
  ): Promise<AppResult<{ willDelete: number; keptWithPayments: number }>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    if (!/^\d{4}-\d{2}$/.test(billingMonth)) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Choose a month.' });
    }
    const paidVoucherIds = new Set(
      db.paymentAllocations
        .filter((a) => {
          const p = db.feePayments.find((x) => x.id === a.paymentId);
          return p && !p.isVoid && a.allocatedAmount > 0;
        })
        .map((a) => a.voucherId)
    );
    const inScope = db.feeVouchers.filter((v) => {
      if (v.billingMonth !== billingMonth) return false;
      if (campusId && v.campusId !== campusId) return false;
      if (classId) {
        const stu = db.students.find((s) => s.id === v.studentId);
        const sec = stu ? db.sections.find((s) => s.id === stu.sectionId) : undefined;
        if (!sec || sec.classId !== classId) return false;
      }
      return true;
    });
    const deletable = inScope.filter((v) => !paidVoucherIds.has(v.id) && v.status === VoucherStatus.UNPAID);
    const result = { willDelete: deletable.length, keptWithPayments: inScope.length - deletable.length };
    if (dryRun || deletable.length === 0) return AppResult.success(result);
    const gone = new Set(deletable.map((v) => v.id));
    const goneNos = new Set(deletable.map((v) => v.voucherNo));
    db.feeVouchers = db.feeVouchers.filter((v) => !gone.has(v.id));
    db.paymentAllocations = db.paymentAllocations.filter((a) => !gone.has(a.voucherId));
    // the "New fee voucher ..." alerts that parents already received
    db.notifications = db.notifications.filter((n) => !(n.type === NotificationType.FEE && [...goneNos].some((no) => n.title === `New fee voucher ${no}`)));
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'DELETE_VOUCHERS',
      tableName: 'fee_vouchers',
      recordId: billingMonth,
      oldValue: `${deletable.length} vouchers`,
      newValue: null,
      reason: `Unpaid vouchers of ${billingMonth} deleted`,
      changedBy: actorId,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(result);
  }

  /**
   * Dry run of generateMonthlyVouchers: same eligibility rules, saves nothing.
   */
  async previewMonthlyVouchers(
    campusId: string | null,
    classId: string | null,
    billingMonth: string
  ): Promise<AppResult<VoucherGenerationPreview>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();

    const sectionMap: Record<string, Section> = {};
    db.sections.forEach((s) => {
      sectionMap[s.id] = s;
    });
    const alreadyHave = new Set(
      db.feeVouchers
        .filter((v) => v.billingMonth === billingMonth)
        .map((v) => v.studentId)
    );

    let willCreate = 0;
    let skipped = 0;
    let totalExpectedRupees = 0;

    for (const stu of db.students) {
      if (stu.status !== StudentStatus.ACTIVE) continue;
      if (campusId && stu.campusId !== campusId) continue;
      const sec = sectionMap[stu.sectionId];
      if (!sec) continue;
      if (classId && sec.classId !== classId) continue;

      if (alreadyHave.has(stu.id)) {
        skipped++;
        continue;
      }
      willCreate++;
      totalExpectedRupees += buildMonthlyVoucherItems(
        db,
        stu.id,
        sec.classId,
        billingMonth
      ).reduce((s, it) => s + it.amount, 0);
    }

    return AppResult.success({
      billingMonth,
      willCreate,
      skippedAlreadyHaveVoucher: skipped,
      totalExpectedRupees,
    });
  }

  /**
   * FEE RULE:
   * recordPayment allocates oldest voucher first (by billingMonth ascending),
   * and inside a voucher by fee-head priority (arrears first), and updates voucher status UNPAID / PARTIAL / PAID.
   */
  async recordPayment(
    studentId: string,
    amountRupees: number,
    paidOn: string,
    method: PaymentMethod,
    receivedBy: string,
    reference: string | null = null,
    remarks: string | null = null
  ): Promise<
    AppResult<{ payment: FeePayment; allocations: PaymentAllocation[] }>
  > {
    await simulateLocalDelay();
    const roundedAmount = Math.round(amountRupees);
    if (!Number.isFinite(roundedAmount) || roundedAmount <= 0) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'Payment amount must be greater than Rs 0.',
      });
    }
    const cleanReference = (reference ?? '').trim();
    if (method !== PaymentMethod.CASH && cleanReference.length === 0) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'A reference number is required for Bank, JazzCash and Easypaisa payments.',
      });
    }

    const db = getOrSeedLocalDatabase();
    const student = db.students.find((s) => s.id === studentId);
    if (!student) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Student',
        id: studentId,
        message: `Student (${studentId}) not found.`,
      });
    }

    // A payment may not exceed what the student currently owes (no unallocated money).
    const totalOutstanding = db.feeVouchers
      .filter((v) => v.studentId === studentId)
      .reduce(
        (sum, v) =>
          sum +
          v.items.reduce((s, it) => {
            const net = Math.max(0, it.amount - it.waivedAmount);
            return s + Math.max(0, net - (it.paidAmount ?? 0));
          }, 0),
        0
      );
    if (roundedAmount > totalOutstanding) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: `Payment (Rs ${roundedAmount}) is more than the pending balance (Rs ${totalOutstanding}).`,
      });
    }

    const priorityByHeadId: Record<string, number> = {};
    db.feeHeads.forEach((fh) => {
      priorityByHeadId[fh.id] = fh.priority;
    });

    const isBoys = student.campusId === 'campus_b';
    const prefix = isBoys ? 'B-R-' : 'G-R-';
    const maxReceiptSeq = db.feePayments
      .filter((p) => p.receiptNo.startsWith(prefix))
      .reduce(
        (max, p) =>
          Math.max(max, Number(p.receiptNo.replace(prefix, '')) || 0),
        0
      );
    const receiptNo = `${prefix}${String(maxReceiptSeq + 1).padStart(4, '0')}`;
    const paymentId = `pay_${receiptNo.toLowerCase()}`;

    const payment: FeePayment = {
      id: paymentId,
      receiptNo,
      studentId,
      amount: roundedAmount,
      paidOn,
      method,
      receivedBy,
      isVoid: false,
      reference: cleanReference || null,
      remarks: (remarks ?? '').trim() || null,
    };

    // Sort student's unpaid/partial vouchers oldest billingMonth first
    const studentVouchers = db.feeVouchers
      .filter(
        (v) => v.studentId === studentId && v.status !== VoucherStatus.PAID
      )
      .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));

    let remainingToAllocate = roundedAmount;
    const allocations: PaymentAllocation[] = [];

    for (const voucher of studentVouchers) {
      if (remainingToAllocate <= 0) break;

      // Sort items inside voucher by FeeHead priority ascending (arrears = 1 first)
      const sortedItems = [...voucher.items].sort(
        (a, b) =>
          (priorityByHeadId[a.feeHeadId] ?? 99) -
          (priorityByHeadId[b.feeHeadId] ?? 99)
      );

      for (const item of sortedItems) {
        if (remainingToAllocate <= 0) break;
        const alreadyPaid = item.paidAmount ?? 0;
        const netPayable = Math.max(0, item.amount - item.waivedAmount);
        const itemRemainingDue = Math.max(0, netPayable - alreadyPaid);
        if (itemRemainingDue <= 0) continue;

        const allocAmount = Math.min(remainingToAllocate, itemRemainingDue);
        item.paidAmount = alreadyPaid + allocAmount;
        remainingToAllocate -= allocAmount;

        const alloc: PaymentAllocation = {
          id: `alloc_${Date.now()}_${allocations.length + 1}`,
          paymentId,
          voucherId: voucher.id,
          feeHeadId: item.feeHeadId,
          allocatedAmount: allocAmount,
        };
        allocations.push(alloc);
        db.paymentAllocations.push(alloc);
      }

      // Recompute voucher status
      const totalNet = voucher.items.reduce(
        (s, it) => s + Math.max(0, it.amount - it.waivedAmount),
        0
      );
      const totalPaidOnVoucher = voucher.items.reduce(
        (s, it) => s + (it.paidAmount ?? 0),
        0
      );
      if (totalPaidOnVoucher >= totalNet) {
        voucher.status = VoucherStatus.PAID;
      } else if (totalPaidOnVoucher > 0) {
        voucher.status = VoucherStatus.PARTIAL;
      } else {
        voucher.status = VoucherStatus.UNPAID;
      }
    }

    db.feePayments.push(payment);
    notifyParents(
      db,
      studentId,
      NotificationType.FEE,
      `Payment received Rs ${payment.amount.toLocaleString('en-US')}`,
      `ادائیگی موصول Rs ${payment.amount.toLocaleString('en-US')}`,
      `Receipt ${payment.receiptNo}`,
      `رسید ${payment.receiptNo}`
    );
    saveLocalDatabase(db);

    return AppResult.success({ payment, allocations });
  }

  /**
   * FEE RULE: voidPayment is ADMIN only, needs a reason and writes AuditLogEntry.
   */
  async voidPayment(
    actor: Profile,
    paymentId: string,
    reason: string
  ): Promise<AppResult<FeePayment>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only ADMIN is permitted to void a fee payment.',
      });
    }
    if (!reason.trim()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'A reason is required to void a payment receipt.',
      });
    }

    const db = getOrSeedLocalDatabase();
    const payment = db.feePayments.find((p) => p.id === paymentId);
    if (!payment) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'FeePayment',
        id: paymentId,
        message: `FeePayment (${paymentId}) not found.`,
      });
    }

    if (payment.isVoid) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'This payment is already voided.',
      });
    }
    payment.isVoid = true;
    payment.voidReason = reason.trim();

    // Reverse allocations on vouchers
    const relatedAllocations = db.paymentAllocations.filter(
      (a) => a.paymentId === paymentId
    );
    for (const alloc of relatedAllocations) {
      const voucher = db.feeVouchers.find((v) => v.id === alloc.voucherId);
      if (voucher) {
        const item = voucher.items.find(
          (it) => it.feeHeadId === alloc.feeHeadId
        );
        if (item) {
          item.paidAmount = Math.max(
            0,
            (item.paidAmount ?? 0) - alloc.allocatedAmount
          );
        }
        const totalNet = voucher.items.reduce(
          (s, it) => s + Math.max(0, it.amount - it.waivedAmount),
          0
        );
        const totalPaid = voucher.items.reduce(
          (s, it) => s + (it.paidAmount ?? 0),
          0
        );
        voucher.status =
          totalPaid >= totalNet
            ? VoucherStatus.PAID
            : totalPaid > 0
            ? VoucherStatus.PARTIAL
            : VoucherStatus.UNPAID;
      }
    }

    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'VOID_PAYMENT',
      tableName: 'fee_payments',
      recordId: paymentId,
      oldValue: `isVoid=false (Rs ${payment.amount})`,
      newValue: 'isVoid=true',
      reason: reason.trim(),
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);

    return AppResult.success(payment);
  }

  /**
   * FEE RULE: waiveItem is ADMIN only, needs a reason and writes AuditLogEntry.
   */
  async waiveItem(
    actor: Profile,
    voucherId: string,
    feeHeadId: string,
    waivedAmountRupees: number,
    reason: string
  ): Promise<AppResult<FeeVoucher>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only ADMIN is permitted to waive a fee voucher item.',
      });
    }
    if (!reason.trim()) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'A reason is required to waive a fee item.',
      });
    }

    const db = getOrSeedLocalDatabase();
    const voucher = db.feeVouchers.find((v) => v.id === voucherId);
    if (!voucher) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'FeeVoucher',
        id: voucherId,
        message: `FeeVoucher (${voucherId}) not found.`,
      });
    }

    const item = voucher.items.find((it) => it.feeHeadId === feeHeadId);
    if (!item) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'FeeVoucherItem',
        id: feeHeadId,
        message: `Fee head (${feeHeadId}) not found on voucher ${voucher.voucherNo}.`,
      });
    }

    const oldWaived = item.waivedAmount;
    const maxWaive = Math.max(0, item.amount - (item.paidAmount ?? 0));
    if (
      !Number.isInteger(waivedAmountRupees) ||
      waivedAmountRupees < 0 ||
      waivedAmountRupees > maxWaive
    ) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: `Waived amount must be a whole number between 0 and ${maxWaive} (what is already paid cannot be waived).`,
      });
    }
    item.waivedAmount = waivedAmountRupees;

    const totalNet = voucher.items.reduce(
      (s, it) => s + Math.max(0, it.amount - it.waivedAmount),
      0
    );
    const totalPaid = voucher.items.reduce(
      (s, it) => s + (it.paidAmount ?? 0),
      0
    );
    voucher.status =
      totalPaid >= totalNet
        ? VoucherStatus.PAID
        : totalPaid > 0
        ? VoucherStatus.PARTIAL
        : VoucherStatus.UNPAID;

    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'WAIVE_VOUCHER_ITEM',
      tableName: 'fee_vouchers',
      recordId: `${voucher.voucherNo}:${feeHeadId}`,
      oldValue: `waived=Rs ${oldWaived}`,
      newValue: `waived=Rs ${item.waivedAmount}`,
      reason: reason.trim(),
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);

    return AppResult.success(voucher);
  }

  /**
   * FEE RULE:
   * feeSummaryForStudent must return:
   * 1. Monthly Fee (this month's tuition after concessions)
   * 2. Paid This Month (valid non-voided payments received in the current calendar month by payment date, Asia/Karachi timezone)
   *    + totalPaid (all-year valid payments total, kept for Accountant, Admin & Principal screens)
   * 3. Pending (total outstanding across all vouchers)
   * 4. Previous Arrears (outstanding from months before the current month)
   * 5. Annual Charges (amount + paid/unpaid)
   * 6. Admission Fee (amount + paid/unpaid)
   */
  async feeSummaryForStudent(
    studentId: string
  ): Promise<AppResult<StudentFeeSummary>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const studentVouchers = db.feeVouchers.filter(
      (v) => v.studentId === studentId
    );
    const studentPayments = db.feePayments.filter(
      (p) => p.studentId === studentId && !p.isVoid
    );

    const todayKarachi = getTodayKarachiIsoDate();
    const currentMonth = todayKarachi.slice(0, 7);

    const getPaymentYearMonthKarachi = (paidOn: string): string => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(paidOn)) {
        return paidOn.slice(0, 7);
      }
      const parsed = new Date(paidOn);
      if (Number.isNaN(parsed.getTime())) {
        return paidOn.slice(0, 7);
      }
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
      }).formatToParts(parsed);
      const y = parts.find((pt) => pt.type === 'year')?.value ?? '2026';
      const m = parts.find((pt) => pt.type === 'month')?.value ?? '10';
      return `${y}-${m}`;
    };

    const currentMonthVoucher = studentVouchers.find(
      (v) => v.billingMonth === currentMonth
    );
    const currentTuitionItem = currentMonthVoucher?.items.find(
      (it) => it.feeHeadId === 'fh_tuition'
    );
    const monthlyFee = currentTuitionItem
      ? Math.max(0, currentTuitionItem.amount - currentTuitionItem.waivedAmount)
      : 0;

    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidThisMonth = studentPayments
      .filter((p) => getPaymentYearMonthKarachi(p.paidOn) === currentMonth)
      .reduce((sum, p) => sum + p.amount, 0);

    let pending = 0;
    let previousArrears = 0;
    let annualChargesAmount = 0;
    let annualChargesPaid = 0;
    let admissionFeeAmount = 0;
    let admissionFeePaid = 0;

    for (const v of studentVouchers) {
      for (const it of v.items) {
        const net = Math.max(0, it.amount - it.waivedAmount);
        const itemPaid = it.paidAmount ?? 0;
        const itemUnpaid = Math.max(0, net - itemPaid);

        pending += itemUnpaid;
        if (v.billingMonth < currentMonth || it.feeHeadId === 'fh_arrears') {
          previousArrears += itemUnpaid;
        }

        if (it.feeHeadId === 'fh_annual') {
          annualChargesAmount += net;
          annualChargesPaid += itemPaid;
        }
        if (it.feeHeadId === 'fh_admission') {
          admissionFeeAmount += net;
          admissionFeePaid += itemPaid;
        }
      }
    }

    const annualChargesStatus: VoucherStatus =
      annualChargesAmount > 0 && annualChargesPaid >= annualChargesAmount
        ? VoucherStatus.PAID
        : annualChargesPaid > 0
        ? VoucherStatus.PARTIAL
        : VoucherStatus.UNPAID;

    const admissionFeeStatus: VoucherStatus =
      admissionFeeAmount > 0 && admissionFeePaid >= admissionFeeAmount
        ? VoucherStatus.PAID
        : admissionFeePaid > 0
        ? VoucherStatus.PARTIAL
        : VoucherStatus.UNPAID;

    return AppResult.success({
      studentId,
      monthlyFee,
      paidThisMonth,
      totalPaid,
      paid: totalPaid,
      pending,
      previousArrears,
      annualChargesAmount,
      annualChargesStatus,
      admissionFeeAmount,
      admissionFeeStatus,
    });
  }

  async getVouchersForStudent(
    studentId: string
  ): Promise<AppResult<FeeVoucher[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.feeVouchers
        .filter((v) => v.studentId === studentId)
        .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))
    );
  }

  async getPaymentsForStudent(
    studentId: string
  ): Promise<AppResult<FeePayment[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.feePayments
        .filter((p) => p.studentId === studentId)
        .map((p) => ({
          ...p,
          allocations: db.paymentAllocations.filter(
            (a) => a.paymentId === p.id
          ),
        }))
        .sort((a, b) => b.paidOn.localeCompare(a.paidOn))
    );
  }

  async getAllVouchers(): Promise<AppResult<FeeVoucher[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.feeVouchers);
  }

  async getAllPayments(): Promise<AppResult<FeePayment[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const byPayment: Record<string, PaymentAllocation[]> = {};
    db.paymentAllocations.forEach((a) => (byPayment[a.paymentId] ??= []).push(a));
    return AppResult.success(db.feePayments.map((p) => ({ ...p, allocations: byPayment[p.id] ?? [] })));
  }

  /**
   * getDefaulters returns every student with an unpaid or partly paid bill (this month included),
   * along with their unpaid months and total amount due.
   */
  async getDefaulters(
    campusId: string | null
  ): Promise<AppResult<FeeDefaulterSummary[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const defaulters: FeeDefaulterSummary[] = [];

    for (const stu of db.students) {
      if (stu.status !== StudentStatus.ACTIVE) continue;
      if (campusId && stu.campusId !== campusId) continue;

      const unpaidVouchers = db.feeVouchers
        .filter(
          (v) => v.studentId === stu.id && v.status !== VoucherStatus.PAID
        )
        .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));

      const monthsUnpaid = unpaidVouchers.map((v) => v.billingMonth);
      const amountDue = unpaidVouchers.reduce((sum, v) => {
        const vUnpaid = v.items.reduce((s, it) => {
          const net = Math.max(0, it.amount - it.waivedAmount);
          return s + Math.max(0, net - (it.paidAmount ?? 0));
        }, 0);
        return sum + vUnpaid;
      }, 0);

      if (amountDue <= 0) continue;
      defaulters.push({
        student: stu,
        monthsUnpaid,
        unpaidVouchersCount: unpaidVouchers.length,
        amountDue,
      });
    }

    return AppResult.success(defaulters);
  }

  /**
   * getCollectionReport supports filters: date range, fee category, campus, class, payment method,
   * and returns totals grouped by category and by day.
   */
  async getCollectionReport(
    filter: FeeCollectionReportFilter
  ): Promise<AppResult<FeeCollectionReport>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();

    const studentMap: Record<string, Student> = {};
    db.students.forEach((s) => {
      studentMap[s.id] = s;
    });

    const sectionMap: Record<string, Section> = {};
    db.sections.forEach((sec) => {
      sectionMap[sec.id] = sec;
    });

    const headCategoryMap: Record<string, FeeCategory> = {};
    db.feeHeads.forEach((fh) => {
      headCategoryMap[fh.id] = fh.category;
    });

    const allocationsByPaymentId: Record<string, PaymentAllocation[]> = {};
    db.paymentAllocations.forEach((alloc) => {
      if (!allocationsByPaymentId[alloc.paymentId]) {
        allocationsByPaymentId[alloc.paymentId] = [];
      }
      allocationsByPaymentId[alloc.paymentId].push(alloc);
    });

    const byCategory: Partial<Record<FeeCategory, number>> = {};
    const byDay: Record<string, number> = {};
    const byMethod: Partial<Record<PaymentMethod, number>> = {};
    const byCollectedAt: Record<string, number> = {};
    let totalCollectedRupees = 0;
    let receiptsCount = 0;
    let voidedCount = 0;

    for (const payment of db.feePayments) {
      if (payment.paidOn < filter.fromDate || payment.paidOn > filter.toDate) {
        continue;
      }

      const stu = studentMap[payment.studentId];
      if (!stu) continue;
      if (filter.campusId && stu.campusId !== filter.campusId) continue;

      const sec = sectionMap[stu.sectionId];
      if (filter.classId && (!sec || sec.classId !== filter.classId)) continue;
      if (filter.method && payment.method !== filter.method) continue;

      if (payment.isVoid) {
        voidedCount++;
        continue;
      }

      const pAllocations = allocationsByPaymentId[payment.id] ?? [];
      let paymentMatchedAmount = 0;

      // Imported daily-sheet receipts carry the fee type the cashier wrote; use it for the by-type split.
      const declared = /\[by:([^\]]+)\]/.exec(payment.remarks ?? '');
      if (declared) {
        for (const part of declared[1].split(',')) {
          const [k, v] = part.split('=');
          const cat = (FeeCategory as Record<string, FeeCategory>)[k] ?? FeeCategory.OTHER;
          if (filter.category && cat !== filter.category) continue;
          byCategory[cat] = (byCategory[cat] ?? 0) + Number(v);
          paymentMatchedAmount += Number(v);
        }
      } else {
        for (const alloc of pAllocations) {
          const cat = alloc.feeHeadId
            ? headCategoryMap[alloc.feeHeadId] ?? FeeCategory.OTHER
            : FeeCategory.OTHER;
          if (filter.category && cat !== filter.category) continue;

          byCategory[cat] = (byCategory[cat] ?? 0) + alloc.allocatedAmount;
          paymentMatchedAmount += alloc.allocatedAmount;
        }
      }

      if (paymentMatchedAmount > 0) {
        receiptsCount++;
        totalCollectedRupees += paymentMatchedAmount;
        byDay[payment.paidOn] =
          (byDay[payment.paidOn] ?? 0) + paymentMatchedAmount;
        byMethod[payment.method] =
          (byMethod[payment.method] ?? 0) + paymentMatchedAmount;
        const at = /\[at:([^\]]+)\]/.exec(payment.remarks ?? '')?.[1] ?? (stu.campusId === 'campus_g' ? 'Girls' : 'Boys');
        byCollectedAt[at] = (byCollectedAt[at] ?? 0) + paymentMatchedAmount;
      }
    }

    return AppResult.success({
      filter,
      totalCollectedRupees,
      byCategory,
      byDay,
      byMethod,
      byCollectedAt,
      receiptsCount,
      voidedCount,
    });
  }
}

// ============================================================================
// 5. FAKE EXAM REPOSITORY (Empty Fake for now)
// ============================================================================

function roundOne(n: number): number {
  return Math.round(n * 10) / 10;
}

function gradeEntryFor(db: LocalDatabaseSnapshot, pct: number): GradingScaleEntry | undefined {
  return [...db.gradingScale]
    .sort((x, y) => y.minPercent - x.minPercent)
    .find((g) => pct >= g.minPercent);
}

/** Builds a result card from stored marks (no rank). */
function buildCardInDb(
  db: LocalDatabaseSnapshot,
  exam: Exam,
  student: Student
): StudentResultCard | null {
  const sec = db.sections.find((x) => x.id === student.sectionId);
  if (!sec) return null;
  const configured = db.examSubjects.filter((es) => es.examId === exam.id && es.classId === sec.classId);
  if (configured.length === 0) return null;
  const marks = db.marks.filter((m) => m.examId === exam.id && m.studentId === student.id);
  let totalMax = 0;
  let totalObt = 0;
  let incomplete = false;
  let passedAll = true;
  const lines: ResultSubjectLine[] = configured.map((es) => {
    const m = marks.find((x) => x.subjectId === es.subjectId);
    const entered = !!m;
    const obtained = m && !m.isAbsent ? m.obtained : 0;
    const isAbsent = !!m?.isAbsent;
    const passed = entered && !isAbsent && obtained >= es.passMarks;
    if (!entered) incomplete = true;
    if (!passed) passedAll = false;
    totalMax += es.totalMarks;
    totalObt += obtained;
    return {
      subjectId: es.subjectId,
      totalMarks: es.totalMarks,
      passMarks: es.passMarks,
      obtained,
      isAbsent,
      entered,
      passed,
      percent: es.totalMarks > 0 ? roundOne((obtained / es.totalMarks) * 100) : 0,
      grade: gradeEntryFor(db, es.totalMarks > 0 ? roundOne((obtained / es.totalMarks) * 100) : 0)?.grade ?? '-',
    };
  });
  const percentage = totalMax > 0 ? roundOne((totalObt / totalMax) * 100) : 0;
  const g = gradeEntryFor(db, percentage);
  return {
    exam,
    student,
    subjectMarks: marks,
    subjectLines: lines,
    totalMaxMarks: totalMax,
    totalObtainedMarks: roundOne(totalObt),
    percentage,
    grade: g?.grade ?? '-',
    gradeRemarksEn: g?.remarksEn ?? '',
    gradeRemarksUr: g?.remarksUr ?? '',
    passed: passedAll && !incomplete,
    incomplete,
    rankInSection: null,
    sectionSize: 0,
    sessionName: (db.academicYears.find((ay) => ay.isCurrent) ?? db.academicYears[0])?.name,
  };
}

/** Cards for all active students of a section, with class position (equal percentages share a rank). */
function buildSectionCardsInDb(
  db: LocalDatabaseSnapshot,
  exam: Exam,
  sectionId: string
): StudentResultCard[] {
  const cards: StudentResultCard[] = [];
  db.students
    .filter((s) => s.sectionId === sectionId && s.status === StudentStatus.ACTIVE)
    .sort((a, b) => a.rollNo - b.rollNo)
    .forEach((s) => {
      const c = buildCardInDb(db, exam, s);
      if (c) cards.push(c);
    });
  const complete = cards.filter((c) => !c.incomplete);
  cards.forEach((c) => {
    c.sectionSize = cards.length;
    c.rankInSection = c.incomplete ? null : 1 + complete.filter((o) => o.percentage > c.percentage).length;
  });
  return cards;
}

function examAudit(
  db: LocalDatabaseSnapshot,
  actorId: string,
  action: string,
  recordId: string,
  oldValue: string | null,
  newValue: string | null,
  reason: string
): void {
  db.auditLogs.unshift({
    id: auditId(),
    action,
    tableName: 'exams',
    recordId,
    oldValue,
    newValue,
    reason,
    changedBy: actorId,
    changedAt: new Date().toISOString(),
  });
}

export class FakeExamRepository implements ExamRepository {
  async deleteExam(examId: string, actorId: string): Promise<AppResult<{ marksRemoved: number }>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const actor = db.profiles.find((p) => p.id === actorId);
    if (!actor || actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can delete an exam.' });
    }
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) return AppResult.failure({ kind: 'NotFound', entity: 'Exam', id: examId, message: 'Exam not found.' });
    if (exam.status === ExamStatus.PUBLISHED) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'This exam is published. Unpublish it first, then delete it.' });
    }
    const marksRemoved = db.marks.filter((m) => m.examId === examId).length;
    db.marks = db.marks.filter((m) => m.examId !== examId);
    db.markSubmissions = db.markSubmissions.filter((m) => m.examId !== examId);
    db.examSubjects = db.examSubjects.filter((m) => m.examId !== examId);
    db.exams = db.exams.filter((e) => e.id !== examId);
    examAudit(db, actorId, 'DELETE_EXAM', examId, `${exam.nameEn} (${marksRemoved} marks)`, null, 'Exam deleted by Admin');
    saveLocalDatabase(db);
    return AppResult.success({ marksRemoved });
  }

  async getAllExamSubjects(): Promise<AppResult<ExamSubject[]>> {
    const db = getOrSeedLocalDatabase();
    return AppResult.success([...db.examSubjects]);
  }

  async importExamMarks(
    actor: Profile,
    examId: string,
    classId: string,
    rows: ImportMarksRow[],
    dryRun: boolean
  ): Promise<AppResult<ImportMarksResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can upload marks.' });
    }
    const db = getOrSeedLocalDatabase();
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) return AppResult.failure({ kind: 'NotFound', entity: 'Exam', id: examId, message: 'Exam not found.' });
    if (exam.status === ExamStatus.PUBLISHED) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'This exam is published. Unpublish it before uploading marks.' });
    }
    const subjects = db.examSubjects.filter((es) => es.examId === examId && es.classId === classId);
    if (subjects.length === 0) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Set the subjects and total marks of this exam for the class first.' });
    }
    const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const sectionIds = new Set(db.sections.filter((x) => x.classId === classId).map((x) => x.id));
    const students = db.students.filter((x) => sectionIds.has(x.sectionId) && x.status === StudentStatus.ACTIVE);
    const byNo = new Map(students.map((x) => [norm(x.admissionNo), x]));
    const out: ImportMarksResult[] = [];
    const plan: { studentId: string; sectionId: string; ops: { subjectId: string; mark: Mark | null }[] }[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      const res: ImportMarksResult = { line: row.line, ok: false, studentName: row.name, admissionNo: row.admissionNo, entries: 0, error: null, warnings: [] };
      out.push(res);
      const stu = byNo.get(norm(row.admissionNo));
      if (!row.admissionNo.trim()) { res.error = 'Admission No is empty.'; continue; }
      if (!stu) { res.error = `Admission No ${row.admissionNo} is not an active student of this class.`; continue; }
      if (seen.has(stu.id)) { res.error = 'This student appears twice in the file.'; continue; }
      seen.add(stu.id);
      res.studentName = stu.name;
      if (row.name.trim() && norm(row.name) !== norm(stu.name)) res.warnings.push(`File name "${row.name}" differs from "${stu.name}"; matched by Admission No.`);
      const ops: { subjectId: string; mark: Mark | null }[] = [];
      let bad: string | null = null;
      for (const es of subjects) {
        const raw = row.cells[es.subjectId];
        if (raw === undefined) continue; // column not in the file: leave as it is
        const subj = db.subjects.find((x) => x.id === es.subjectId);
        const label = subj?.nameEn ?? es.subjectId;
        const v = raw.trim();
        if (v === '' || /^[-—–]+$/.test(v)) { ops.push({ subjectId: es.subjectId, mark: null }); continue; }
        if (/^(a|ab|abs|absent)$/i.test(v)) {
          ops.push({ subjectId: es.subjectId, mark: { examId, studentId: stu.id, subjectId: es.subjectId, obtained: 0, isAbsent: true } });
          continue;
        }
        const n = Number(v.replace(/,/g, ''));
        if (!Number.isFinite(n)) { bad = `${label}: "${v}" is not a number (use A for absent).`; break; }
        if (n < 0 || n > es.totalMarks) { bad = `${label}: ${n} is outside 0 to ${es.totalMarks}.`; break; }
        if (Math.round(n * 2) !== n * 2) { bad = `${label}: use whole or half marks only.`; break; }
        ops.push({ subjectId: es.subjectId, mark: { examId, studentId: stu.id, subjectId: es.subjectId, obtained: n, isAbsent: false } });
      }
      if (bad) { res.error = bad; continue; }
      if (ops.length === 0) { res.error = 'No subject columns found for this exam.'; continue; }
      res.ok = true;
      res.entries = ops.filter((o) => o.mark !== null).length;
      plan.push({ studentId: stu.id, sectionId: stu.sectionId, ops });
    }
    if (dryRun || plan.length === 0) return AppResult.success(out);
    const touched = new Set<string>(); // sectionId|subjectId
    for (const p of plan) {
      for (const op of p.ops) {
        db.marks = db.marks.filter((m) => !(m.examId === examId && m.studentId === p.studentId && m.subjectId === op.subjectId));
        if (op.mark) db.marks.push(op.mark);
        touched.add(`${p.sectionId}|${op.subjectId}`);
      }
    }
    for (const key of touched) {
      const [sectionId, subjectId] = key.split('|');
      const secStudents = students.filter((x) => x.sectionId === sectionId);
      const complete = secStudents.length > 0 && secStudents.every((x) => db.marks.some((m) => m.examId === examId && m.studentId === x.id && m.subjectId === subjectId));
      db.markSubmissions = db.markSubmissions.filter((x) => !(x.examId === examId && x.sectionId === sectionId && x.subjectId === subjectId));
      if (complete) db.markSubmissions.push({ examId, sectionId, subjectId, submittedBy: actor.id, submittedAt: new Date().toISOString() });
    }
    examAudit(db, actor.id, 'IMPORT_EXAM_MARKS', `${examId}/${classId}`, null, `${plan.length} students`, 'Marks CSV uploaded by Admin');
    saveLocalDatabase(db);
    return AppResult.success(out);
  }

  async getExams(campusId: string | null): Promise<AppResult<Exam[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const list = db.exams.filter((e) => !campusId || e.campusId === null || e.campusId === campusId);
    return AppResult.success([...list].reverse());
  }

  async createExam(exam: Exam, actorId: string): Promise<AppResult<Exam>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const actor = db.profiles.find((p) => p.id === actorId);
    if (!actor || actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can create exams.' });
    }
    const fail = (message: string) => AppResult.failure<Exam>({ kind: 'ValidationFailed', message });
    if (exam.nameEn.trim().length < 3) return fail('Exam name (English) is required.');
    if (exam.nameUr.trim().length < 2) return fail('Exam name (Urdu) is required.');
    if (exam.campusId && !db.campuses.some((c) => c.id === exam.campusId)) return fail('Campus not found.');
    const start = exam.startDate || null;
    const end = exam.endDate || null;
    if (start && end && end < start) return fail('End date cannot be before the start date.');
    const created: Exam = {
      id: `exam_${Date.now().toString(36)}`,
      nameEn: exam.nameEn.trim(),
      nameUr: exam.nameUr.trim(),
      type: exam.type,
      status: ExamStatus.DRAFT,
      campusId: exam.campusId,
      startDate: start,
      endDate: end,
    };
    db.exams.push(created);
    examAudit(db, actorId, 'CREATE_EXAM', created.id, null, created.nameEn, 'Exam created');
    saveLocalDatabase(db);
    return AppResult.success(created);
  }

  async updateExamStatus(
    examId: string,
    status: ExamStatus,
    actorId: string
  ): Promise<AppResult<Exam>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const actor = db.profiles.find((p) => p.id === actorId);
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Exam', id: examId, message: `Exam (${examId}) not found.` });
    }
    const fail = (message: string) => AppResult.failure<Exam>({ kind: 'ValidationFailed', message });
    if (!actor || (actor.role !== Role.ADMIN && actor.role !== Role.PRINCIPAL)) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only Admin or Principal can change exam status.' });
    }
    const from = exam.status;
    if (from === status) return AppResult.success(exam);
    if (from === ExamStatus.DRAFT && status === ExamStatus.MARKS_ENTRY) {
      if (actor.role !== Role.ADMIN) {
        return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can open marks entry.' });
      }
      if (!db.examSubjects.some((es) => es.examId === examId)) {
        return fail('Set the subjects and marks for at least one class first.');
      }
    } else if (from === ExamStatus.MARKS_ENTRY && status === ExamStatus.PUBLISHED) {
      let missing = 0;
      const classIds = new Set(db.examSubjects.filter((es) => es.examId === examId).map((es) => es.classId));
      for (const sec of db.sections.filter((x) => classIds.has(x.classId))) {
        const subs = db.examSubjects.filter((es) => es.examId === examId && es.classId === sec.classId);
        for (const stu of db.students.filter((x) => x.sectionId === sec.id && x.status === StudentStatus.ACTIVE)) {
          for (const es of subs) {
            if (!db.marks.some((m) => m.examId === examId && m.studentId === stu.id && m.subjectId === es.subjectId)) missing++;
          }
        }
      }
      if (missing > 0) return fail(`${missing} marks are still missing. Every student needs a mark (or Absent) in every subject before publishing.`);
    } else if (from === ExamStatus.PUBLISHED && status === ExamStatus.MARKS_ENTRY) {
      // unpublish: allowed
    } else {
      return fail('This status change is not allowed.');
    }
    exam.status = status;
    if (status === ExamStatus.PUBLISHED) {
      const classIds = new Set(db.examSubjects.filter((es) => es.examId === examId).map((es) => es.classId));
      db.students
        .filter((stu) => stu.status === StudentStatus.ACTIVE && classIds.has(db.sections.find((x) => x.id === stu.sectionId)?.classId ?? ''))
        .forEach((stu) =>
          notifyParents(db, stu.id, NotificationType.EXAM, `Result published: ${exam.nameEn}`, `نتیجہ شائع: ${exam.nameUr || exam.nameEn}`, stu.name, stu.nameUr || stu.name)
        );
    }
    examAudit(db, actorId, 'EXAM_STATUS', examId, from, status, `Exam ${exam.nameEn}: ${from} -> ${status}`);
    saveLocalDatabase(db);
    return AppResult.success(exam);
  }

  async configureExamSubjects(
    examId: string,
    classId: string,
    subjects: ExamSubject[],
    actorId: string
  ): Promise<AppResult<ExamSubject[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const actor = db.profiles.find((p) => p.id === actorId);
    if (!actor || actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can set exam subjects.' });
    }
    const fail = (message: string) => AppResult.failure<ExamSubject[]>({ kind: 'ValidationFailed', message });
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Exam', id: examId, message: `Exam (${examId}) not found.` });
    }
    if (exam.status === ExamStatus.PUBLISHED) return fail('Unpublish the exam before changing its subjects.');
    const cls = db.classes.find((c) => c.id === classId);
    if (!cls) return fail('Class not found.');
    if (exam.campusId && cls.campusId !== exam.campusId) return fail('This class belongs to another campus than the exam.');
    const allowed = new Set(db.classSubjects.filter((cs) => cs.classId === classId).map((cs) => cs.subjectId));
    const seen = new Set<string>();
    for (const sub of subjects) {
      if (!allowed.has(sub.subjectId)) return fail('A subject is not taught in this class.');
      if (seen.has(sub.subjectId)) return fail('A subject is listed twice.');
      seen.add(sub.subjectId);
      if (!Number.isInteger(sub.totalMarks) || sub.totalMarks <= 0) return fail('Total marks must be a whole number above 0.');
      if (!Number.isInteger(sub.passMarks) || sub.passMarks < 0 || sub.passMarks > sub.totalMarks) {
        return fail('Pass marks must be between 0 and the total marks.');
      }
    }
    // Do not drop or shrink a subject that already has marks.
    const sectionIds = new Set(db.sections.filter((x) => x.classId === classId).map((x) => x.id));
    const classStudentIds = new Set(db.students.filter((x) => sectionIds.has(x.sectionId)).map((x) => x.id));
    const existingMarks = db.marks.filter((m) => m.examId === examId && classStudentIds.has(m.studentId));
    for (const m of existingMarks) {
      const next = subjects.find((x) => x.subjectId === m.subjectId);
      if (!next) return fail('A subject that already has marks cannot be removed.');
      if (!m.isAbsent && m.obtained > next.totalMarks) return fail('Total marks cannot be lower than a mark already entered.');
    }
    db.examSubjects = db.examSubjects.filter((es) => !(es.examId === examId && es.classId === classId));
    const saved = subjects.map((x) => ({ examId, classId, subjectId: x.subjectId, totalMarks: x.totalMarks, passMarks: x.passMarks }));
    db.examSubjects.push(...saved);
    examAudit(db, actorId, 'EXAM_SUBJECTS', `${examId}/${classId}`, null, `${saved.length} subjects`, 'Exam subjects configured');
    saveLocalDatabase(db);
    return AppResult.success(saved);
  }

  async getExamSubjectsForClass(
    examId: string,
    classId: string
  ): Promise<AppResult<ExamSubject[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.examSubjects.filter((es) => es.examId === examId && es.classId === classId));
  }

  async enterMarks(
    actor: Profile,
    examId: string,
    sectionId: string,
    subjectId: string,
    marks: Mark[],
    finalize: boolean,
    reason?: string
  ): Promise<AppResult<Mark[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const fail = (message: string) => AppResult.failure<Mark[]>({ kind: 'ValidationFailed', message });
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Exam', id: examId, message: `Exam (${examId}) not found.` });
    }
    const section = db.sections.find((x) => x.id === sectionId);
    if (!section) return fail('Section not found.');
    if (actor.role === Role.TEACHER) {
      const canEnter = db.teacherAssignments.some(
        (ta) =>
          ta.teacherId === actor.id &&
          ta.sectionId === sectionId &&
          (ta.subjectId === null || ta.subjectId === subjectId) &&
          ta.canEnterMarks
      );
      if (!canEnter) {
        return AppResult.failure({
          kind: 'SubjectMarksNotAssigned',
          teacherId: actor.id,
          sectionId,
          subjectId,
          message: `Teacher ${actor.loginId} is not assigned to enter marks for subject ${subjectId}.`,
        });
      }
      if (exam.status !== ExamStatus.MARKS_ENTRY) return fail('Marks entry is not open for this exam.');
    } else if (actor.role === Role.ADMIN) {
      if (exam.status === ExamStatus.DRAFT) return fail('Marks entry is not open for this exam.');
      if (exam.status === ExamStatus.PUBLISHED && !reason?.trim()) {
        return fail('A reason is required to change marks of a published exam.');
      }
    } else {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only teachers and the Admin can enter marks.' });
    }
    const es = db.examSubjects.find((x) => x.examId === examId && x.classId === section.classId && x.subjectId === subjectId);
    if (!es) return fail('This subject is not part of the exam for this class.');

    const students = db.students.filter((x) => x.sectionId === sectionId && x.status === StudentStatus.ACTIVE);
    const ids = new Set(students.map((x) => x.id));
    const seen = new Set<string>();
    const clean: Mark[] = [];
    for (const m of marks) {
      if (!ids.has(m.studentId)) return fail('A student does not belong to this section.');
      if (seen.has(m.studentId)) return fail('A student appears twice.');
      seen.add(m.studentId);
      if (m.isAbsent) {
        clean.push({ examId, studentId: m.studentId, subjectId, obtained: 0, isAbsent: true });
        continue;
      }
      if (!Number.isFinite(m.obtained) || m.obtained < 0 || m.obtained > es.totalMarks) {
        return fail(`Marks must be between 0 and ${es.totalMarks}.`);
      }
      if (Math.round(m.obtained * 2) !== m.obtained * 2) return fail('Marks can use whole or half numbers only.');
      clean.push({ examId, studentId: m.studentId, subjectId, obtained: m.obtained, isAbsent: false });
    }
    if (finalize && clean.length !== students.length) {
      return fail(`Enter a mark (or Absent) for every student. ${students.length - clean.length} still missing.`);
    }

    const before = db.marks.filter((m) => m.examId === examId && m.subjectId === subjectId && ids.has(m.studentId));
    db.marks = db.marks.filter((m) => !(m.examId === examId && m.subjectId === subjectId && ids.has(m.studentId)));
    db.marks.push(...clean);

    if (finalize) {
      db.markSubmissions = db.markSubmissions.filter(
        (x) => !(x.examId === examId && x.sectionId === sectionId && x.subjectId === subjectId)
      );
      db.markSubmissions.push({ examId, sectionId, subjectId, submittedBy: actor.id, submittedAt: new Date().toISOString() });
    }
    if (exam.status === ExamStatus.PUBLISHED) {
      examAudit(
        db,
        actor.id,
        'EDIT_PUBLISHED_MARKS',
        `${examId}/${sectionId}/${subjectId}`,
        `${before.length} marks`,
        `${clean.length} marks`,
        reason!.trim()
      );
    }
    saveLocalDatabase(db);
    return AppResult.success(clean);
  }

  async getMarksForSectionSubject(
    examId: string,
    sectionId: string,
    subjectId: string
  ): Promise<AppResult<Mark[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const ids = new Set(db.students.filter((x) => x.sectionId === sectionId).map((x) => x.id));
    return AppResult.success(db.marks.filter((m) => m.examId === examId && m.subjectId === subjectId && ids.has(m.studentId)));
  }

  async getMarkSubmission(
    examId: string,
    sectionId: string,
    subjectId: string
  ): Promise<AppResult<MarkSubmission | null>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      db.markSubmissions.find((x) => x.examId === examId && x.sectionId === sectionId && x.subjectId === subjectId) ?? null
    );
  }

  async getMarksProgress(examId: string): Promise<AppResult<MarksProgressRow[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const rows: MarksProgressRow[] = [];
    for (const es of db.examSubjects.filter((x) => x.examId === examId)) {
      for (const sec of db.sections.filter((x) => x.classId === es.classId)) {
        const ids = new Set(db.students.filter((x) => x.sectionId === sec.id && x.status === StudentStatus.ACTIVE).map((x) => x.id));
        rows.push({
          sectionId: sec.id,
          classId: es.classId,
          subjectId: es.subjectId,
          expected: ids.size,
          entered: db.marks.filter((m) => m.examId === examId && m.subjectId === es.subjectId && ids.has(m.studentId)).length,
          submitted: db.markSubmissions.some((x) => x.examId === examId && x.sectionId === sec.id && x.subjectId === es.subjectId),
        });
      }
    }
    return AppResult.success(rows);
  }

  async getStudentResultCard(
    examId: string,
    studentId: string,
    actor?: Profile
  ): Promise<AppResult<StudentResultCard>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const notFound = AppResult.failure<StudentResultCard>({
      kind: 'NotFound',
      entity: 'StudentResultCard',
      id: `${examId}/${studentId}`,
      message: 'Result card not found.',
    });
    const exam = db.exams.find((e) => e.id === examId);
    const student = db.students.find((s) => s.id === studentId);
    if (!exam || !student) return notFound;
    if (actor?.role === Role.PARENT) {
      const linked = db.parentStudents.some((ps) => ps.parentId === actor.id && ps.studentId === studentId);
      if (!linked || exam.status !== ExamStatus.PUBLISHED) return notFound;
    }
    const card = buildSectionCardsInDb(db, exam, student.sectionId).find((c) => c.student.id === studentId);
    return card ? AppResult.success(card) : notFound;
  }

  async getSectionResultCards(
    examId: string,
    sectionId: string
  ): Promise<AppResult<StudentResultCard[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const exam = db.exams.find((e) => e.id === examId);
    if (!exam) return AppResult.success([]);
    return AppResult.success(buildSectionCardsInDb(db, exam, sectionId));
  }

  async getExamAnalytics(
    examId: string,
    campusId: string | null,
    classId: string | null
  ): Promise<AppResult<ExamAnalytics>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const exam = db.exams.find((e) => e.id === examId);
    const empty: ExamAnalytics = {
      studentsCount: 0,
      averagePercent: 0,
      passPercent: 0,
      incompleteCount: 0,
      gradeDistribution: [],
      topStudents: [],
      subjectAverages: [],
    };
    if (!exam) return AppResult.success(empty);
    const classIds = new Set(
      db.examSubjects
        .filter((es) => es.examId === examId)
        .map((es) => es.classId)
        .filter((cid) => {
          const c = db.classes.find((x) => x.id === cid);
          return c && (!classId || cid === classId) && (!campusId || c.campusId === campusId);
        })
    );
    const cards: StudentResultCard[] = [];
    db.sections.filter((x) => classIds.has(x.classId)).forEach((sec) => cards.push(...buildSectionCardsInDb(db, exam, sec.id)));
    const complete = cards.filter((c) => !c.incomplete);
    const dist = new Map<string, number>();
    complete.forEach((c) => dist.set(c.grade, (dist.get(c.grade) ?? 0) + 1));
    const order = [...db.gradingScale].sort((a, b) => b.minPercent - a.minPercent).map((g) => g.grade);
    const subj = new Map<string, { sum: number; n: number }>();
    complete.forEach((c) =>
      c.subjectLines.forEach((l) => {
        const cur = subj.get(l.subjectId) ?? { sum: 0, n: 0 };
        subj.set(l.subjectId, { sum: cur.sum + l.percent, n: cur.n + 1 });
      })
    );
    return AppResult.success({
      studentsCount: complete.length,
      averagePercent: complete.length ? roundOne(complete.reduce((s, c) => s + c.percentage, 0) / complete.length) : 0,
      passPercent: complete.length ? roundOne((complete.filter((c) => c.passed).length / complete.length) * 100) : 0,
      incompleteCount: cards.length - complete.length,
      gradeDistribution: order.filter((g) => dist.has(g)).map((g) => ({ grade: g, count: dist.get(g)! })),
      topStudents: [...complete]
        .sort((a, b) => b.percentage - a.percentage)
        .map((c) => ({ student: c.student, percentage: c.percentage, grade: c.grade })),
      subjectAverages: [...subj.entries()].map(([subjectId, v]) => ({ subjectId, averagePercent: roundOne(v.sum / v.n) })),
    });
  }
}

// ============================================================================
// 6. FAKE MESSAGE REPOSITORY (Empty Fake for now)
// ============================================================================

export class FakeMessageRepository implements MessageRepository {
  async getConversationsForUser(
    userId: string,
    role: Role
  ): Promise<AppResult<Conversation[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const all = role === Role.ADMIN || role === Role.PRINCIPAL || role === Role.VICE_PRINCIPAL;
    const list = db.conversations.filter((c) => all || c.parentId === userId || c.teacherId === userId);
    return AppResult.success([...list].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)));
  }

  async getOrCreateConversation(
    studentId: string,
    parentId: string,
    teacherId: string
  ): Promise<AppResult<Conversation>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const fail = (message: string) => AppResult.failure<Conversation>({ kind: 'ValidationFailed', message });
    const student = db.students.find((x) => x.id === studentId);
    if (!student) return fail('Student not found.');
    if (!db.parentStudents.some((ps) => ps.parentId === parentId && ps.studentId === studentId)) {
      return fail('This parent is not linked to the student.');
    }
    const teaches = teacherIdsOfSection(db, student.sectionId).includes(teacherId);
    if (!teaches) return fail('This teacher does not teach the student.');
    const existing = db.conversations.find((c) => c.studentId === studentId && c.parentId === parentId && c.teacherId === teacherId);
    if (existing) return AppResult.success(existing);
    const conv: Conversation = {
      id: `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      studentId,
      parentId,
      teacherId,
      lastMessageAt: new Date().toISOString(),
    };
    db.conversations.push(conv);
    saveLocalDatabase(db);
    return AppResult.success(conv);
  }

  async getMessages(conversationId: string, viewer: Profile): Promise<AppResult<Message[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Conversation', id: conversationId, message: 'Conversation not found.' });
    }
    const allowed = viewer.role === Role.ADMIN || viewer.role === Role.PRINCIPAL || viewer.role === Role.VICE_PRINCIPAL || viewer.id === conv.parentId || viewer.id === conv.teacherId;
    if (!allowed) return AppResult.failure({ kind: 'UnauthorizedRole', message: 'You cannot open this conversation.' });
    return AppResult.success(
      db.messages.filter((m) => m.conversationId === conversationId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    );
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    body: string
  ): Promise<AppResult<Message>> {
    await simulateLocalDelay();
    const text = body.trim();
    if (!text) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Message body cannot be empty.' });
    }
    if (text.length > 1000) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Message is too long (1000 characters at most).' });
    }
    const db = getOrSeedLocalDatabase();
    const conv = db.conversations.find((c) => c.id === conversationId);
    if (!conv) {
      return AppResult.failure({ kind: 'NotFound', entity: 'Conversation', id: conversationId, message: 'Conversation not found.' });
    }
    if (senderId !== conv.parentId && senderId !== conv.teacherId) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the parent or the teacher can write in this conversation.' });
    }
    const sender = db.profiles.find((p) => p.id === senderId);
    if (!sender || !sender.isActive) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'This account cannot send messages.' });
    }
    const now = new Date().toISOString();
    const msg: Message = {
      id: `msg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      senderId,
      body: text,
      createdAt: now,
      readAt: null,
    };
    db.messages.push(msg);
    conv.lastMessageAt = now;
    const student = db.students.find((x) => x.id === conv.studentId);
    const to = senderId === conv.parentId ? conv.teacherId : conv.parentId;
    pushNotification(
      db,
      to,
      NotificationType.MESSAGE,
      `New message from ${sender.fullName}`,
      `${sender.fullNameUr || sender.fullName} کی طرف سے نیا پیغام`,
      student ? `About ${student.name}: ${text.slice(0, 80)}` : text.slice(0, 80),
      student ? `${student.nameUr || student.name} کے بارے میں: ${text.slice(0, 80)}` : text.slice(0, 80)
    );
    saveLocalDatabase(db);
    return AppResult.success(msg);
  }

  async markConversationRead(
    conversationId: string,
    readerUserId: string
  ): Promise<AppResult<number>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const now = new Date().toISOString();
    let n = 0;
    db.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId !== readerUserId && !m.readAt) {
        m.readAt = now;
        n++;
      }
    });
    const reader = db.profiles.find((p) => p.id === readerUserId);
    // Principal/Admin only look; they must not mark messages as read for the real participants.
    if (reader && (reader.role === Role.ADMIN || reader.role === Role.PRINCIPAL || reader.role === Role.VICE_PRINCIPAL)) {
      return AppResult.success(0);
    }
    if (n > 0) saveLocalDatabase(db);
    return AppResult.success(n);
  }

  async getUnreadMessageCount(userId: string, studentId?: string): Promise<AppResult<number>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const mine = new Set(
      db.conversations
        .filter((c) => (c.parentId === userId || c.teacherId === userId) && (!studentId || c.studentId === studentId))
        .map((c) => c.id)
    );
    return AppResult.success(db.messages.filter((m) => mine.has(m.conversationId) && m.senderId !== userId && !m.readAt).length);
  }

  async teachersOfStudent(studentId: string): Promise<AppResult<Profile[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const student = db.students.find((x) => x.id === studentId);
    if (!student) return AppResult.success([]);
    const ids = teacherIdsOfSection(db, student.sectionId);
    return AppResult.success(db.profiles.filter((p) => ids.includes(p.id) && p.isActive));
  }

  async studentsForTeacher(teacherId: string): Promise<AppResult<Student[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const secIds = new Set<string>();
    db.teacherAssignments.filter((a) => a.teacherId === teacherId).forEach((a) => secIds.add(a.sectionId));
    db.sections.filter((x) => x.classTeacherId === teacherId).forEach((x) => secIds.add(x.id));
    return AppResult.success(
      db.students.filter((x) => secIds.has(x.sectionId) && x.status === StudentStatus.ACTIVE).sort((a, b) => a.name.localeCompare(b.name))
    );
  }
}

function teacherIdsOfSection(db: LocalDatabaseSnapshot, sectionId: string): string[] {
  const ids = new Set<string>();
  db.teacherAssignments.filter((a) => a.sectionId === sectionId).forEach((a) => ids.add(a.teacherId));
  const sec = db.sections.find((x) => x.id === sectionId);
  if (sec?.classTeacherId) ids.add(sec.classTeacherId);
  return [...ids];
}

// ============================================================================
// 7. FAKE NOTICE REPOSITORY
// ============================================================================

export class FakeNoticeRepository implements NoticeRepository {
  async getNoticesForUser(user: Profile): Promise<AppResult<Notice[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const nowIso = new Date().toISOString();
    return AppResult.success(
      db.notices
        .filter((n) => (!n.expiresAt || n.expiresAt > nowIso) && userSeesNotice(db, user, n))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  }

  async getAllNotices(actor: Profile): Promise<AppResult<Notice[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN && actor.role !== Role.VICE_PRINCIPAL) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only Principal or Admin can manage notices.' });
    }
    const db = getOrSeedLocalDatabase();
    return AppResult.success([...db.notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  async createNotice(
    notice: Notice,
    actor: Profile
  ): Promise<AppResult<Notice>> {
    await simulateLocalDelay();
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN && actor.role !== Role.VICE_PRINCIPAL) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only Principal or Admin can publish school notices.',
      });
    }
    const fail = (message: string) => AppResult.failure<Notice>({ kind: 'ValidationFailed', message });
    const title = notice.title.trim();
    const body = notice.body.trim();
    if (title.length < 3) return fail('Notice title is required.');
    if (body.length < 3) return fail('Notice text is required.');
    if (body.length > 2000) return fail('Notice text is too long.');
    const db = getOrSeedLocalDatabase();
    if (notice.audience === NoticeAudience.CAMPUS && !db.campuses.some((c) => c.id === notice.audienceId)) {
      return fail('Choose a campus.');
    }
    if (notice.audience === NoticeAudience.CLASS && !db.classes.some((c) => c.id === notice.audienceId)) {
      return fail('Choose a class.');
    }
    const nowIso = new Date().toISOString();
    if (notice.expiresAt && notice.expiresAt <= nowIso) return fail('Expiry must be in the future.');
    const created: Notice = {
      id: `ntc_${Date.now().toString(36)}`,
      title,
      body,
      audience: notice.audience,
      audienceId: notice.audience === NoticeAudience.CAMPUS || notice.audience === NoticeAudience.CLASS ? notice.audienceId : null,
      createdBy: actor.id,
      createdAt: nowIso,
      expiresAt: notice.expiresAt || null,
    };
    db.notices.push(created);
    db.profiles
      .filter((p) => p.isActive && p.id !== actor.id && userSeesNotice(db, p, created))
      .filter((p) => p.role !== Role.ADMIN && p.role !== Role.PRINCIPAL && p.role !== Role.VICE_PRINCIPAL)
      .forEach((p) =>
        pushNotification(db, p.id, NotificationType.NOTICE, `Notice: ${title}`, `نوٹس: ${title}`, body.slice(0, 100), body.slice(0, 100))
      );
    db.auditLogs.unshift({
      id: auditId(),
      action: 'CREATE_NOTICE',
      tableName: 'notices',
      recordId: created.id,
      oldValue: null,
      newValue: `${created.audience}: ${title}`,
      reason: 'Notice published',
      changedBy: actor.id,
      changedAt: nowIso,
    });
    saveLocalDatabase(db);
    return AppResult.success(created);
  }

  async deleteNotice(
    noticeId: string,
    actor: Profile
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN && actor.role !== Role.VICE_PRINCIPAL) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only Principal or Admin can delete notices.' });
    }
    const db = getOrSeedLocalDatabase();
    const old = db.notices.find((n) => n.id === noticeId);
    db.notices = db.notices.filter((n) => n.id !== noticeId);
    db.auditLogs.unshift({
      id: auditId(),
      action: 'DELETE_NOTICE',
      tableName: 'notices',
      recordId: noticeId,
      oldValue: old ? old.title : null,
      newValue: null,
      reason: 'Notice deleted',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getNotificationsForUser(
    userId: string
  ): Promise<AppResult<AppNotification[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.notifications.filter((n) => n.userId === userId));
  }

  async markNotificationRead(
    notificationId: string,
    userId: string
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const n = db.notifications.find((x) => x.id === notificationId && x.userId === userId);
    if (n && !n.readAt) {
      n.readAt = new Date().toISOString();
      saveLocalDatabase(db);
    }
    return AppResult.success(undefined);
  }

  async markAllNotificationsRead(userId: string): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const now = new Date().toISOString();
    let changed = false;
    db.notifications.forEach((n) => {
      if (n.userId === userId && !n.readAt) {
        n.readAt = now;
        changed = true;
      }
    });
    if (changed) saveLocalDatabase(db);
    return AppResult.success(undefined);
  }
}

// ============================================================================
// 8. FAKE DASHBOARD REPOSITORY
// ============================================================================

export class FakeDashboardRepository implements DashboardRepository {
  async getRoleActions(sinceDate: string): Promise<AppResult<RoleActionRow[]>> {
    const db = getOrSeedLocalDatabase();
    const tally = new Map<string, number>();
    const add = (userId: string | undefined | null, kind: RoleActionRow['kind']) => {
      if (!userId) return;
      const k = `${userId}|${kind}`;
      tally.set(k, (tally.get(k) ?? 0) + 1);
    };
    db.attendanceSubmissions.filter((s) => s.submittedAt.slice(0, 10) >= sinceDate).forEach((s) => add(s.submittedBy, 'attendance'));
    db.feePayments.filter((p) => !p.isVoid && p.paidOn >= sinceDate).forEach((p) => add(p.receivedBy, 'payments'));
    db.markSubmissions.filter((m) => m.submittedAt.slice(0, 10) >= sinceDate).forEach((m) => add(m.submittedBy, 'marks'));
    db.auditLogs.filter((a) => a.changedAt.slice(0, 10) >= sinceDate).forEach((a) => add(a.changedBy, 'admin'));
    const out: RoleActionRow[] = [...tally.entries()].map(([k, count]) => {
      const [userId, kind] = k.split('|');
      return { userId, kind: kind as RoleActionRow['kind'], count };
    });
    return AppResult.success(out);
  }

  async getPrincipalDashboardKpis(
    campusId: string | null,
    referenceDate: string
  ): Promise<AppResult<PrincipalDashboardKpis>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const activeStudents = db.students.filter(
      (s) =>
        s.status === StudentStatus.ACTIVE &&
        (!campusId || s.campusId === campusId)
    );
    const boysCount = activeStudents.filter(
      (s) => s.campusId === 'campus_b'
    ).length;
    const girlsCount = activeStudents.filter(
      (s) => s.campusId === 'campus_g'
    ).length;

    const todayRecs = db.attendanceRecords.filter(
      (r) => r.date === referenceDate
    );
    const presentToday = todayRecs.filter(
      (r) =>
        r.status === AttendanceStatus.PRESENT ||
        r.status === AttendanceStatus.LATE
    ).length;
    const denomToday = todayRecs.filter(
      (r) => r.status !== AttendanceStatus.LEAVE
    ).length;
    const todayAttendancePercent =
      denomToday > 0
        ? Number(((presentToday / denomToday) * 100).toFixed(1))
        : 0;

    const markedToday = new Set(
      db.attendanceSubmissions
        .filter((s) => s.date === referenceDate)
        .map((s) => s.sectionId)
    );
    const unmarkedSectionsCount = db.sections.filter(
      (sec) => !markedToday.has(sec.id)
    ).length;

    return AppResult.success({
      campusId,
      activeStudentsCount: activeStudents.length,
      boysCount,
      girlsCount,
      todayAttendancePercent,
      unmarkedSectionsCount,
      currentMonthFeeBilledRupees: 0,
      currentMonthFeeCollectedRupees: 0,
      totalArrearsRupees: 0,
      attendanceTrendLast7Days: [],
      feeCollectionTrendLast6Months: [],
    });
  }

  async getAttendanceTrendChart(
    _campusId: string | null,
    _days: number
  ): Promise<AppResult<ChartSeriesPoint[]>> {
    await simulateLocalDelay();
    return AppResult.success([]);
  }

  async getFeeCollectionChart(
    _campusId: string | null,
    _months: number
  ): Promise<AppResult<ChartSeriesPoint[]>> {
    await simulateLocalDelay();
    return AppResult.success([]);
  }

  async getClassStrengthDistribution(
    _campusId: string | null
  ): Promise<AppResult<ChartSeriesPoint[]>> {
    await simulateLocalDelay();
    return AppResult.success([]);
  }


  async getPrincipalDashboard(
    campusId: string | null,
    date: string
  ): Promise<AppResult<PrincipalDashboard>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const month = date.slice(0, 7);

    const inCampus = (cid: string) => !campusId || cid === campusId;
    const studentById: Record<string, Student> = {};
    db.students.forEach((st) => (studentById[st.id] = st));
    const sectionById: Record<string, Section> = {};
    db.sections.forEach((sec) => (sectionById[sec.id] = sec));
    const classById: Record<string, SchoolClass> = {};
    db.classes.forEach((c) => (classById[c.id] = c));
    const headCategory: Record<string, FeeCategory> = {};
    db.feeHeads.forEach((h) => (headCategory[h.id] = h.category));
    const allocsByPayment: Record<string, PaymentAllocation[]> = {};
    db.paymentAllocations.forEach((a) => {
      (allocsByPayment[a.paymentId] ??= []).push(a);
    });

    const activeStudents = db.students.filter(
      (st) => st.status === StudentStatus.ACTIVE && inCampus(st.campusId)
    );

    const attPercent = (recs: AttendanceRecord[]) => {
      const pr = recs.filter(
        (r) =>
          r.status === AttendanceStatus.PRESENT ||
          r.status === AttendanceStatus.LATE
      ).length;
      const ab = recs.filter((r) => r.status === AttendanceStatus.ABSENT).length;
      return pr + ab > 0 ? Number(((pr / (pr + ab)) * 100).toFixed(1)) : 0;
    };
    const recordInScope = (r: AttendanceRecord) => {
      const st = studentById[r.studentId];
      return !!st && inCampus(st.campusId);
    };

    // ----- attendance for the chosen date -----
    const todayRecs = db.attendanceRecords.filter(
      (r) => r.date === date && recordInScope(r)
    );
    const count = (status: AttendanceStatus) =>
      todayRecs.filter((r) => r.status === status).length;

    // ----- sections that have not marked -----
    const markedSet = new Set(
      db.attendanceSubmissions.filter((x) => x.date === date).map((x) => x.sectionId)
    );
    const unmarkedSections: UnmarkedSectionInfo[] = db.sections
      .filter((sec) => {
        const cls = classById[sec.classId];
        return cls && inCampus(cls.campusId) && !markedSet.has(sec.id);
      })
      .map((sec) => {
        const cls = classById[sec.classId];
        const teachers = db.teacherAssignments
          .filter((ta) => ta.sectionId === sec.id && ta.canMarkAttendance)
          .map((ta) => db.profiles.find((p) => p.id === ta.teacherId))
          .filter((p): p is Profile => !!p);
        const uniq = Array.from(new Map(teachers.map((p) => [p.id, p])).values());
        return {
          sectionId: sec.id,
          classId: sec.classId,
          campusId: cls.campusId,
          sectionName: sec.name,
          teacherNamesEn: uniq.map((p) => p.fullName),
          teacherNamesUr: uniq.map((p) => p.fullNameUr || p.fullName),
        };
      });

    // ----- fee numbers -----
    const livePayments = db.feePayments.filter((p) => {
      const st = studentById[p.studentId];
      return !p.isVoid && !!st && inCampus(st.campusId);
    });
    const sumPayments = (from: string, to: string) =>
      livePayments
        .filter((p) => p.paidOn >= from && p.paidOn <= to)
        .reduce((sum, p) => sum + p.amount, 0);
    const voucherBalance = (v: FeeVoucher) =>
      v.items.reduce(
        (sum, it) =>
          sum + Math.max(0, it.amount - it.waivedAmount - (it.paidAmount ?? 0)),
        0
      );
    const voucherNet = (v: FeeVoucher) =>
      v.items.reduce((sum, it) => sum + Math.max(0, it.amount - it.waivedAmount), 0);
    const scopedVouchers = db.feeVouchers.filter((v) => inCampus(v.campusId));

    const defaulterIds = new Set<string>();
    scopedVouchers.forEach((v) => {
      const st = studentById[v.studentId];
      if (
        st &&
        st.status === StudentStatus.ACTIVE &&
        v.status !== VoucherStatus.PAID &&
        v.billingMonth < month
      ) {
        defaulterIds.add(v.studentId);
      }
    });

    const trend30: ChartSeriesPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDaysIso(date, -i);
      const recs = db.attendanceRecords.filter(
        (r) => r.date === d && recordInScope(r)
      );
      if (recs.length > 0) trend30.push({ label: d, value: attPercent(recs) });
    }

    const monthlyCollection12: ChartSeriesPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = shiftYearMonth(month, -i);
      monthlyCollection12.push({
        label: m,
        value: sumPayments(`${m}-01`, `${m}-31`),
      });
    }

    const expectedVsCollected6 = [];
    for (let i = 5; i >= 0; i--) {
      const m = shiftYearMonth(month, -i);
      expectedVsCollected6.push({
        month: m,
        expected: scopedVouchers
          .filter((v) => v.billingMonth === m)
          .reduce((sum, v) => sum + voucherNet(v), 0),
        collected: sumPayments(`${m}-01`, `${m}-31`),
      });
    }

    const collectionByCategory: Partial<Record<FeeCategory, number>> = {};
    livePayments
      .filter((p) => p.paidOn >= `${month}-01` && p.paidOn <= `${month}-31`)
      .forEach((p) => {
        const declared = /\[by:([^\]]+)\]/.exec(p.remarks ?? '');
        if (declared) {
          for (const part of declared[1].split(',')) {
            const [k, v] = part.split('=');
            const cat = (FeeCategory as Record<string, FeeCategory>)[k] ?? FeeCategory.OTHER;
            collectionByCategory[cat] = (collectionByCategory[cat] ?? 0) + (Number(v) || 0);
          }
          return;
        }
        (allocsByPayment[p.id] ?? []).forEach((a) => {
          const cat = a.feeHeadId
            ? headCategory[a.feeHeadId] ?? FeeCategory.OTHER
            : FeeCategory.OTHER;
          collectionByCategory[cat] =
            (collectionByCategory[cat] ?? 0) + a.allocatedAmount;
        });
      });

    // ----- campus comparison (always both campuses) -----
    const campusComparison: CampusComparisonRow[] = db.campuses.map((c) => {
      const recs = db.attendanceRecords.filter((r) => {
        const st = studentById[r.studentId];
        return r.date === date && st && st.campusId === c.id;
      });
      return {
        campusId: c.id,
        students: db.students.filter(
          (st) => st.status === StudentStatus.ACTIVE && st.campusId === c.id
        ).length,
        attendancePercent: attPercent(recs),
        collectedThisMonthRupees: db.feePayments
          .filter((p) => {
            const st = studentById[p.studentId];
            return (
              !p.isVoid &&
              st &&
              st.campusId === c.id &&
              p.paidOn >= `${month}-01` &&
              p.paidOn <= `${month}-31`
            );
          })
          .reduce((sum, p) => sum + p.amount, 0),
        outstandingRupees: db.feeVouchers
          .filter((v) => v.campusId === c.id)
          .reduce((sum, v) => sum + voucherBalance(v), 0),
      };
    });

    // ----- class-wise attendance -----
    const byClass: Record<string, AttendanceRecord[]> = {};
    todayRecs.forEach((r) => {
      const cid = sectionById[r.sectionId]?.classId;
      if (cid) (byClass[cid] ??= []).push(r);
    });
    const classAttendance: ClassAttendanceRow[] = Object.keys(byClass)
      .map((cid) => {
        const recs = byClass[cid];
        const n = (st: AttendanceStatus) =>
          recs.filter((r) => r.status === st).length;
        return {
          classId: cid,
          present: n(AttendanceStatus.PRESENT),
          absent: n(AttendanceStatus.ABSENT),
          leave: n(AttendanceStatus.LEAVE),
          late: n(AttendanceStatus.LATE),
          percent: attPercent(recs),
        };
      })
      .sort(
        (a, b) =>
          (classById[a.classId]?.sortOrder ?? 0) -
          (classById[b.classId]?.sortOrder ?? 0)
      );

    // ----- recent activity -----
    const recentActivity: RecentActivityItem[] = [];
    [...db.feePayments]
      .filter((p) => {
        const st = studentById[p.studentId];
        return st && inCampus(st.campusId);
      })
      .sort((a, b) => b.paidOn.localeCompare(a.paidOn) || b.receiptNo.localeCompare(a.receiptNo))
      .slice(0, 8)
      .forEach((p) =>
        recentActivity.push({
          id: p.id,
          kind: p.isVoid ? 'VOID' : 'PAYMENT',
          date: p.paidOn,
          studentId: p.studentId,
          amountRupees: p.amount,
          text: p.receiptNo,
        })
      );
    db.auditLogs
      .filter((a) => a.tableName === 'attendance' || a.action.includes('ATTENDANCE'))
      .slice(0, 4)
      .forEach((a) =>
        recentActivity.push({
          id: a.id,
          kind: 'CORRECTION',
          date: a.changedAt.slice(0, 10),
          studentId: null,
          amountRupees: null,
          text: a.reason,
        })
      );

    return AppResult.success({
      campusId,
      date,
      totalStudents: activeStudents.length,
      boysCount: activeStudents.filter((st) => st.campusId === 'campus_b').length,
      girlsCount: activeStudents.filter((st) => st.campusId === 'campus_g').length,
      present: count(AttendanceStatus.PRESENT),
      absent: count(AttendanceStatus.ABSENT),
      leave: count(AttendanceStatus.LEAVE),
      late: count(AttendanceStatus.LATE),
      attendancePercent: attPercent(todayRecs),
      unmarkedSections,
      feeCollectedTodayRupees: sumPayments(date, date),
      feeCollectedMonthRupees: sumPayments(`${month}-01`, `${month}-31`),
      totalOutstandingRupees: scopedVouchers.reduce(
        (sum, v) => sum + voucherBalance(v),
        0
      ),
      defaultersCount: defaulterIds.size,
      attendanceTrend30: trend30,
      monthlyCollection12,
      expectedVsCollected6,
      collectionByCategory,
      campusComparison,
      classAttendance,
      recentActivity,
    });
  }

  async getAttendanceReport(
    filter: AttendanceReportFilter
  ): Promise<AppResult<AttendanceReport>> {
    await simulateLocalDelay();
    if (filter.fromDate > filter.toDate) {
      return AppResult.failure({
        kind: 'ValidationFailed',
        message: 'From date must not be after To date',
      });
    }
    const db = getOrSeedLocalDatabase();
    const sectionById: Record<string, Section> = {};
    db.sections.forEach((sec) => (sectionById[sec.id] = sec));

    const students = db.students.filter((st) => {
      if (st.status !== StudentStatus.ACTIVE) return false;
      if (filter.campusId && st.campusId !== filter.campusId) return false;
      if (filter.sectionId && st.sectionId !== filter.sectionId) return false;
      if (
        filter.classId &&
        sectionById[st.sectionId]?.classId !== filter.classId
      ) {
        return false;
      }
      return true;
    });
    const ids = new Set(students.map((st) => st.id));
    const recs = db.attendanceRecords.filter(
      (r) => r.date >= filter.fromDate && r.date <= filter.toDate && ids.has(r.studentId)
    );
    const dates = new Set(recs.map((r) => r.date));

    const pct = (pr: number, ab: number) =>
      pr + ab > 0 ? Number(((pr / (pr + ab)) * 100).toFixed(1)) : 0;
    const tally = (list: AttendanceRecord[]) => {
      const n = (st: AttendanceStatus) =>
        list.filter((r) => r.status === st).length;
      const present = n(AttendanceStatus.PRESENT);
      const late = n(AttendanceStatus.LATE);
      const absent = n(AttendanceStatus.ABSENT);
      return {
        present,
        late,
        absent,
        leave: n(AttendanceStatus.LEAVE),
        percent: pct(present + late, absent),
      };
    };

    const byStudent: Record<string, AttendanceRecord[]> = {};
    recs.forEach((r) => (byStudent[r.studentId] ??= []).push(r));
    const studentRows: AttendanceReportStudentRow[] = students.map((st) => ({
      student: st,
      ...tally(byStudent[st.id] ?? []),
    }));

    const bySection: Record<string, AttendanceReportStudentRow[]> = {};
    studentRows.forEach((row) => (bySection[row.student.sectionId] ??= []).push(row));
    const sectionRows: AttendanceReportSectionRow[] = Object.keys(bySection).map(
      (secId) => {
        const t = tally(recs.filter((r) => sectionById[r.sectionId]?.id === secId));
        return {
          sectionId: secId,
          classId: sectionById[secId]?.classId ?? '',
          students: bySection[secId].length,
          ...t,
        };
      }
    );

    return AppResult.success({
      filter,
      overallPercent: tally(recs).percent,
      daysCovered: dates.size,
      sectionRows,
      studentRows,
    });
  }

  async getStaffCompliance(
    campusId: string | null,
    fromDate: string,
    toDate: string
  ): Promise<AppResult<StaffComplianceRow[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const classById: Record<string, SchoolClass> = {};
    db.classes.forEach((c) => (classById[c.id] = c));
    const subs = db.attendanceSubmissions.filter(
      (x) => x.date >= fromDate && x.date <= toDate
    );
    // days the school actually took attendance in this range
    const schoolDays = new Set(subs.map((x) => x.date));
    const rows: StaffComplianceRow[] = [];
    for (const sec of db.sections) {
      const cls = classById[sec.classId];
      if (!cls || (campusId && cls.campusId !== campusId)) continue;
      const teachers = db.teacherAssignments
        .filter((ta) => ta.sectionId === sec.id && ta.canMarkAttendance)
        .map((ta) => db.profiles.find((p) => p.id === ta.teacherId))
        .filter((p): p is Profile => !!p);
      const uniq = Array.from(new Map(teachers.map((p) => [p.id, p])).values());
      const marked = new Set(
        subs.filter((x) => x.sectionId === sec.id).map((x) => x.date)
      ).size;
      rows.push({
        sectionId: sec.id,
        classId: sec.classId,
        campusId: cls.campusId,
        sectionName: sec.name,
        teacherNamesEn: uniq.map((p) => p.fullName),
        teacherNamesUr: uniq.map((p) => p.fullNameUr || p.fullName),
        daysMarked: marked,
        daysExpected: schoolDays.size,
        percent:
          schoolDays.size > 0
            ? Number(((marked / schoolDays.size) * 100).toFixed(1))
            : 0,
      });
    }
    return AppResult.success(rows);
  }

  async getRoleDashboardSummary(
    role: UserRole,
    campus: Campus
  ): Promise<DashboardSummary> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const activeCount = db.students.filter(
      (s) => s.status === StudentStatus.ACTIVE
    ).length;
    return {
      role,
      campus,
      maxCapacityStudents: activeCount,
      activeCampusesCount: db.campuses.length,
      sampleMonthlyFeeRupees: 2500,
      referenceDateIso: nowIso(),
    };
  }
}

// ============================================================================
// 9. FAKE SETTINGS REPOSITORY
// ============================================================================

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  selectedCampus: Campus.BOTH,
  forceLightTheme: true,
  timezone: 'Asia/Karachi',
};

export class FakeSettingsRepository implements SettingsRepository {
  async getSchoolSettings(): Promise<AppResult<SchoolSettings>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.schoolSettings);
  }

  async updateSchoolSettings(
    settings: SchoolSettings,
    actor: Profile
  ): Promise<AppResult<SchoolSettings>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can update school settings.',
      });
    }
    const fail = (message: string) =>
      AppResult.failure<SchoolSettings>({ kind: 'ValidationFailed', message });
    if (settings.nameEn.trim().length < 3) return fail('School name (English) is required.');
    if (settings.nameUr.trim().length < 2) return fail('School name (Urdu) is required.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.attendanceLockTime)) {
      return fail('Attendance lock time must look like 23:59.');
    }
    const phones = settings.officePhones.map((x) => x.replace(/[\s-]/g, '')).filter(Boolean);
    if (phones.some((x) => !/^\+?\d{7,13}$/.test(x))) return fail('An office phone number is not valid.');
    const db = getOrSeedLocalDatabase();
    const next: SchoolSettings = {
      ...settings,
      nameEn: settings.nameEn.trim(),
      nameUr: settings.nameUr.trim(),
      address: settings.address.trim(),
      officePhones: phones,
    };
    db.auditLogs.unshift({
      id: auditId(),
      action: 'UPDATE_SCHOOL_SETTINGS',
      tableName: 'school_settings',
      recordId: 'school',
      oldValue: JSON.stringify(db.schoolSettings),
      newValue: JSON.stringify(next),
      reason: 'School settings changed',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    db.schoolSettings = next;
    saveLocalDatabase(db);
    return AppResult.success(next);
  }

  async getCampuses(): Promise<AppResult<CampusModel[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.campuses);
  }

  async getCurrentAcademicYear(): Promise<AppResult<AcademicYear | null>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const current = db.academicYears.find((ay) => ay.isCurrent) ?? null;
    return AppResult.success(current);
  }

  async getClasses(campusId: string | null): Promise<AppResult<SchoolClass[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const list = campusId
      ? db.classes.filter((c) => c.campusId === campusId)
      : db.classes;
    return AppResult.success(
      [...list].sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  async getSections(classId: string | null): Promise<AppResult<Section[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const list = classId
      ? db.sections.filter((s) => s.classId === classId)
      : db.sections;
    return AppResult.success(list);
  }

  async getSubjects(): Promise<AppResult<Subject[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.subjects);
  }

  async getClassSubjects(classId: string): Promise<AppResult<Subject[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const ids = new Set(db.classSubjects.filter((cs) => cs.classId === classId).map((cs) => cs.subjectId));
    return AppResult.success(db.subjects.filter((x) => ids.has(x.id)));
  }

  async saveClass(
    cls: { id?: string; campusId: string; nameEn: string; nameUr: string; subjects?: { nameEn: string; nameUr: string }[] },
    actor: Profile
  ): Promise<AppResult<SchoolClass>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change classes.' });
    }
    const fail = (message: string) =>
      AppResult.failure<SchoolClass>({ kind: 'ValidationFailed', message });
    const nameEn = cls.nameEn.trim();
    const nameUr = cls.nameUr.trim();
    if (nameEn.length < 2) return fail('Class name (English) is required.');
    if (nameUr.length < 2) return fail('Class name (Urdu) is required.');
    const db = getOrSeedLocalDatabase();
    if (!db.campuses.some((c) => c.id === cls.campusId)) return fail('Campus not found.');
    if (
      db.classes.some(
        (c) =>
          c.id !== cls.id &&
          c.campusId === cls.campusId &&
          c.nameEn.toLowerCase() === nameEn.toLowerCase()
      )
    ) {
      return fail('This campus already has a class with that name.');
    }
    let saved: SchoolClass;
    const idx = cls.id ? db.classes.findIndex((c) => c.id === cls.id) : -1;
    if (idx >= 0) {
      saved = { ...db.classes[idx], nameEn, nameUr };
      db.classes[idx] = saved;
    } else {
      const sort = db.classes.filter((c) => c.campusId === cls.campusId).reduce((m, c) => Math.max(m, c.sortOrder), 0) + 1;
      saved = { id: `cls_${Date.now().toString(36)}`, campusId: cls.campusId, nameEn, nameUr, sortOrder: sort };
      db.classes.push(saved);
    }
    // Subjects typed by the admin (when provided): reuse a subject with the same English name, otherwise create it.
    if (cls.subjects) {
      const wanted: { nameEn: string; nameUr: string }[] = [];
      const seenNames = new Set<string>();
      for (const sub of cls.subjects) {
        const en = sub.nameEn.trim();
        if (!en) continue;
        const key = en.toLowerCase();
        if (seenNames.has(key)) return fail(`Subject "${en}" is listed twice.`);
        seenNames.add(key);
        wanted.push({ nameEn: en, nameUr: sub.nameUr.trim() || en });
      }
      const nextIds: string[] = [];
      wanted.forEach((w, i) => {
        let existing = db.subjects.find((x) => x.nameEn.toLowerCase() === w.nameEn.toLowerCase());
        if (!existing) {
          existing = { id: `sub_${Date.now().toString(36)}${i}`, nameEn: w.nameEn, nameUr: w.nameUr };
          db.subjects.push(existing);
        }
        nextIds.push(existing.id);
      });
      const current = db.classSubjects.filter((cs) => cs.classId === saved.id).map((cs) => cs.subjectId);
      const removed = current.filter((id) => !nextIds.includes(id));
      for (const id of removed) {
        const inUse =
          db.examSubjects.some((es) => es.classId === saved.id && es.subjectId === id) ||
          db.teacherAssignments.some((ta) => ta.subjectId === id && db.sections.find((x) => x.id === ta.sectionId)?.classId === saved.id);
        if (inUse) {
          const nm = db.subjects.find((x) => x.id === id)?.nameEn ?? id;
          return fail(`Subject "${nm}" is already used in an exam or teacher assignment and cannot be removed.`);
        }
      }
      db.classSubjects = db.classSubjects.filter((cs) => cs.classId !== saved.id);
      nextIds.forEach((subjectId) => db.classSubjects.push({ classId: saved.id, subjectId }));
    }
    db.auditLogs.unshift({
      id: auditId(),
      action: idx >= 0 ? 'UPDATE_CLASS' : 'CREATE_CLASS',
      tableName: 'classes',
      recordId: saved.id,
      oldValue: null,
      newValue: nameEn,
      reason: 'Class setup',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(saved);
  }

  async importClasses(
    rows: ImportClassRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportClassResult[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change classes.' });
    }
    const stored = getOrSeedLocalDatabase();
    const db = dryRun ? structuredClone(stored) : stored;
    const results: ImportClassResult[] = rows.map((row) => {
      const bad = (error: string): ImportClassResult => ({ line: row.line, ok: false, error, className: row.classEn, created: false, sectionsAdded: 0 });
      const campus = findCampusByText(db, row.campus);
      if (!campus) return bad(`Campus "${row.campus}" not found (use Boys or Girls).`);
      const en = row.classEn.trim();
      if (en.length < 1) return bad('Class name (English) is required.');
      const names = /^\d+$/.test(en) ? defaultClassNames(en) : { en, ur: row.classUr.trim() || en };
      const ur = row.classUr.trim() || names.ur;
      const { cls, created } = ensureClassInDb(db, campus.id, names.en, ur, row.subjects);
      let added = 0;
      row.sections.forEach((sn) => {
        const name = sn.trim();
        if (!name) return;
        if (ensureSectionInDb(db, cls.id, name).created) added++;
      });
      return { line: row.line, ok: true, error: null, className: cls.nameEn, created, sectionsAdded: added };
    });
    if (!dryRun && results.some((x) => x.ok)) {
      db.auditLogs.unshift({
        id: auditId(),
        action: 'BULK_IMPORT_CLASSES',
        tableName: 'classes',
        recordId: 'file',
        oldValue: null,
        newValue: `${results.filter((x) => x.ok).length} classes imported`,
        reason: 'Bulk class import',
        changedBy: actor.id,
        changedAt: new Date().toISOString(),
      });
      saveLocalDatabase(db);
    }
    return AppResult.success(results);
  }

  async saveSection(
    section: { id?: string; classId: string; name: string; classTeacherId: string | null },
    actor: Profile
  ): Promise<AppResult<Section>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change sections.' });
    }
    const fail = (message: string) =>
      AppResult.failure<Section>({ kind: 'ValidationFailed', message });
    const name = section.name.trim();
    if (!name) return fail('Section name is required.');
    const db = getOrSeedLocalDatabase();
    if (!db.classes.some((c) => c.id === section.classId)) return fail('Class not found.');
    if (
      db.sections.some(
        (x) => x.id !== section.id && x.classId === section.classId && x.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return fail('This class already has a section with that name.');
    }
    if (section.classTeacherId) {
      const teacher = db.profiles.find((p) => p.id === section.classTeacherId);
      if (!teacher || teacher.role !== Role.TEACHER) return fail('Class teacher must be a teacher account.');
    }
    const idx = section.id ? db.sections.findIndex((x) => x.id === section.id) : -1;
    const saved: Section = {
      id: idx >= 0 ? db.sections[idx].id : `sec_${Date.now().toString(36)}`,
      classId: section.classId,
      name,
      classTeacherId: section.classTeacherId,
    };
    if (idx >= 0) db.sections[idx] = saved;
    else db.sections.push(saved);
    db.auditLogs.unshift({
      id: auditId(),
      action: idx >= 0 ? 'UPDATE_SECTION' : 'CREATE_SECTION',
      tableName: 'sections',
      recordId: saved.id,
      oldValue: idx >= 0 ? null : null,
      newValue: `${name}${saved.classTeacherId ? ` / ${saved.classTeacherId}` : ''}`,
      reason: 'Section setup',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(saved);
  }

  async deleteSection(sectionId: string, actor: Profile): Promise<AppResult<void>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change sections.' });
    }
    const db = getOrSeedLocalDatabase();
    if (db.students.some((s) => s.sectionId === sectionId)) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'This section still has students. Move them first.' });
    }
    if (db.teacherAssignments.some((a) => a.sectionId === sectionId)) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Remove teacher assignments of this section first.' });
    }
    db.sections = db.sections.filter((x) => x.id !== sectionId);
    db.auditLogs.unshift({
      id: auditId(),
      action: 'DELETE_SECTION',
      tableName: 'sections',
      recordId: sectionId,
      oldValue: sectionId,
      newValue: null,
      reason: 'Section setup',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getHolidays(
    year: number,
    campusId: string | null
  ): Promise<AppResult<SchoolHoliday[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const prefix = `${year}-`;
    const list = db.holidays.filter(
      (h) =>
        h.date.startsWith(prefix) &&
        (!campusId || h.campusId === null || h.campusId === campusId)
    );
    return AppResult.success(list);
  }

  async saveHoliday(
    holiday: SchoolHoliday,
    actor: Profile
  ): Promise<AppResult<SchoolHoliday>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change holidays.' });
    }
    if (holiday.titleEn.trim().length < 2 || holiday.titleUr.trim().length < 2) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Holiday title is required in English and Urdu.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) {
      return AppResult.failure({ kind: 'ValidationFailed', message: 'Holiday date is required.' });
    }
    const db = getOrSeedLocalDatabase();
    const idx = db.holidays.findIndex((h) => h.id === holiday.id);
    if (idx >= 0) {
      db.holidays[idx] = holiday;
    } else {
      db.holidays.push(holiday);
    }
    db.auditLogs.unshift({
      id: auditId(),
      action: idx >= 0 ? 'UPDATE_HOLIDAY' : 'CREATE_HOLIDAY',
      tableName: 'holidays',
      recordId: holiday.id,
      oldValue: null,
      newValue: `${holiday.date} ${holiday.titleEn}`,
      reason: 'Holiday setup',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(holiday);
  }

  async deleteHoliday(
    holidayId: string,
    actor: Profile
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change holidays.' });
    }
    const db = getOrSeedLocalDatabase();
    const old = db.holidays.find((h) => h.id === holidayId);
    db.holidays = db.holidays.filter((h) => h.id !== holidayId);
    db.auditLogs.unshift({
      id: auditId(),
      action: 'DELETE_HOLIDAY',
      tableName: 'holidays',
      recordId: holidayId,
      oldValue: old ? `${old.date} ${old.titleEn}` : null,
      newValue: null,
      reason: 'Holiday setup',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getGradingScale(): Promise<AppResult<GradingScaleEntry[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(
      [...db.gradingScale].sort((a, b) => b.minPercent - a.minPercent)
    );
  }

  async saveGradingScale(
    entries: GradingScaleEntry[],
    actor: Profile
  ): Promise<AppResult<GradingScaleEntry[]>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can change the grading scale.' });
    }
    const fail = (message: string) =>
      AppResult.failure<GradingScaleEntry[]>({ kind: 'ValidationFailed', message });
    if (entries.length === 0) return fail('Add at least one grade.');
    if (entries.some((e) => !e.grade.trim())) return fail('Every row needs a grade name.');
    if (entries.some((e) => !Number.isFinite(e.minPercent) || e.minPercent < 0 || e.minPercent > 100)) {
      return fail('Minimum percent must be between 0 and 100.');
    }
    if (new Set(entries.map((e) => e.minPercent)).size !== entries.length) {
      return fail('Two grades cannot start at the same percent.');
    }
    if (!entries.some((e) => e.minPercent === 0)) return fail('The lowest grade must start at 0%.');
    const db = getOrSeedLocalDatabase();
    const next = entries.map((e) => ({ ...e, grade: e.grade.trim() }));
    db.auditLogs.unshift({
      id: auditId(),
      action: 'UPDATE_GRADING_SCALE',
      tableName: 'grading_scale',
      recordId: 'scale',
      oldValue: JSON.stringify(db.gradingScale),
      newValue: JSON.stringify(next),
      reason: 'Grading scale changed',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    db.gradingScale = [...next].sort((a, b) => b.minPercent - a.minPercent);
    saveLocalDatabase(db);
    return AppResult.success(db.gradingScale);
  }

  async getProfiles(
    role: Role | null,
    campusId: string | null
  ): Promise<AppResult<Profile[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const filtered = db.profiles.filter((p) => {
      if (role && p.role !== role) return false;
      if (campusId && p.campusId !== null && p.campusId !== campusId) {
        return false;
      }
      return true;
    });
    return AppResult.success(filtered);
  }

  async createProfile(
    input: NewProfileInput,
    actor: Profile
  ): Promise<AppResult<{ profile: Profile; password: string }>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can create users.',
      });
    }
    const db = getOrSeedLocalDatabase();
    const r = createProfileInDb(db, input, actor.id);
    if (!r.ok) return AppResult.failure({ kind: 'ValidationFailed', message: r.message });
    saveLocalDatabase(db);
    return AppResult.success({ profile: r.profile, password: r.password });
  }

  async resetPassword(
    profileId: string,
    actor: Profile
  ): Promise<AppResult<{ profile: Profile; password: string }>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({
        kind: 'UnauthorizedRole',
        message: 'Only the Admin can reset passwords.',
      });
    }
    const db = getOrSeedLocalDatabase();
    const profile = db.profiles.find((p) => p.id === profileId);
    if (!profile) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Profile',
        id: profileId,
        message: 'User not found.',
      });
    }
    const password = generateReadablePassword();
    db.passwordsByUserId[profileId] = password;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'RESET_PASSWORD',
      tableName: 'profiles',
      recordId: profileId,
      oldValue: null,
      newValue: null,
      reason: `Password reset for ${profile.loginId}`,
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success({ profile, password });
  }

  async saveProfile(
    profile: Profile,
    initialPassword: string | null,
    actor: Profile
  ): Promise<AppResult<Profile>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      db.profiles[idx] = profile;
    } else {
      db.profiles.push(profile);
    }
    if (initialPassword && initialPassword.trim()) {
      db.passwordsByUserId[profile.id] = initialPassword.trim();
    } else if (!db.passwordsByUserId[profile.id]) {
      db.passwordsByUserId[profile.id] = 'demo1234';
    }
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: idx >= 0 ? 'UPDATE_PROFILE' : 'CREATE_PROFILE',
      tableName: 'profiles',
      recordId: profile.id,
      oldValue: null,
      newValue: `${profile.loginId} (${profile.role})`,
      reason: 'User management update',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(profile);
  }

  async updateAccount(
    profileId: string,
    changes: { fullName?: string; fullNameUr?: string; phone?: string; loginId?: string; password?: string },
    actor: Profile
  ): Promise<AppResult<Profile>> {
    await simulateLocalDelay();
    if (actor.role !== Role.ADMIN) {
      return AppResult.failure({ kind: 'UnauthorizedRole', message: 'Only the Admin can edit accounts.' });
    }
    const fail = (message: string) => AppResult.failure<Profile>({ kind: 'ValidationFailed', message });
    const db = getOrSeedLocalDatabase();
    const idx = db.profiles.findIndex((p) => p.id === profileId);
    if (idx === -1) return fail('User not found.');
    const cur = db.profiles[idx];
    const next: Profile = { ...cur };
    if (changes.fullName !== undefined) {
      if (changes.fullName.trim().length < 3) return fail('Name (English) is required.');
      next.fullName = changes.fullName.trim();
    }
    if (changes.fullNameUr !== undefined) {
      if (changes.fullNameUr.trim().length < 2) return fail('Name (Urdu) is required.');
      next.fullNameUr = changes.fullNameUr.trim();
    }
    if (changes.phone !== undefined) {
      const ph = changes.phone.replace(/[\s-]/g, '');
      if (!/^\+?\d{10,13}$/.test(ph)) return fail('Enter a valid phone number.');
      next.phone = ph;
    }
    if (changes.loginId !== undefined) {
      const lid = changes.loginId.trim();
      if (lid.length < 3 || /\s/.test(lid)) return fail('User name must be at least 3 characters with no spaces.');
      if (db.profiles.some((p) => p.id !== profileId && p.loginId.toLowerCase() === lid.toLowerCase())) {
        return fail('This user name is already taken.');
      }
      next.loginId = lid;
    }
    const pw = changes.password?.trim();
    if (pw && pw.length < 6) return fail('Password must be at least 6 characters.');
    db.profiles[idx] = next;
    if (pw) db.passwordsByUserId[profileId] = pw;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: 'UPDATE_ACCOUNT',
      tableName: 'profiles',
      recordId: profileId,
      oldValue: cur.loginId,
      newValue: next.loginId,
      reason: pw ? 'Account details and password changed by Admin' : 'Account details changed by Admin',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(next);
  }

  async setProfileActive(
    profileId: string,
    isActive: boolean,
    actor: Profile
  ): Promise<AppResult<Profile>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.profiles.findIndex((p) => p.id === profileId);
    if (idx === -1) {
      return AppResult.failure({
        kind: 'NotFound',
        entity: 'Profile',
        id: profileId,
        message: `Profile (${profileId}) not found.`,
      });
    }
    const updated: Profile = { ...db.profiles[idx], isActive };
    db.profiles[idx] = updated;
    db.auditLogs.unshift({
      id: `aud_${Date.now()}`,
      action: isActive ? 'ACTIVATE_PROFILE' : 'DEACTIVATE_PROFILE',
      tableName: 'profiles',
      recordId: profileId,
      oldValue: String(!isActive),
      newValue: String(isActive),
      reason: 'Admin toggled user active state',
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success(updated);
  }

  async getTeacherAssignments(
    teacherId: string | null
  ): Promise<AppResult<TeacherAssignment[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const list = teacherId
      ? db.teacherAssignments.filter((ta) => ta.teacherId === teacherId)
      : db.teacherAssignments;
    return AppResult.success(list);
  }

  async saveTeacherAssignment(
    assignment: TeacherAssignment,
    _actor: Profile
  ): Promise<AppResult<TeacherAssignment>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const idx = db.teacherAssignments.findIndex(
      (ta) => ta.id === assignment.id
    );
    if (idx >= 0) {
      db.teacherAssignments[idx] = assignment;
    } else {
      db.teacherAssignments.push(assignment);
    }
    saveLocalDatabase(db);
    return AppResult.success(assignment);
  }

  async mergeParentAccounts(
    keepId: string,
    removeId: string,
    actor: Profile
  ): Promise<AppResult<MergeParentsResult>> {
    await simulateLocalDelay();
    const fail = (message: string) => AppResult.failure({ kind: 'ValidationFailed', message });
    if (actor.role !== Role.ADMIN) return fail('Only the Admin can merge accounts.');
    if (keepId === removeId) return fail('Choose two different accounts.');
    const db = getOrSeedLocalDatabase();
    const keep = db.profiles.find((p) => p.id === keepId);
    const dup = db.profiles.find((p) => p.id === removeId);
    if (!keep || !dup) return fail('Account not found.');
    if (keep.role !== Role.PARENT || dup.role !== Role.PARENT) return fail('Only parent accounts can be merged.');

    // children
    let childrenMoved = 0;
    const keepKids = new Set(db.parentStudents.filter((l) => l.parentId === keepId).map((l) => l.studentId));
    for (const l of db.parentStudents.filter((x) => x.parentId === removeId)) {
      if (!keepKids.has(l.studentId)) {
        db.parentStudents.push({ parentId: keepId, studentId: l.studentId, relation: l.relation });
        keepKids.add(l.studentId);
        childrenMoved++;
      }
    }
    db.parentStudents = db.parentStudents.filter((l) => l.parentId !== removeId);

    // chats: move them; when the account to keep already has a chat with the same teacher about the same child, join them
    let chatsMoved = 0;
    for (const c of db.conversations.filter((x) => x.parentId === removeId)) {
      const twin = db.conversations.find(
        (x) => x.parentId === keepId && x.studentId === c.studentId && x.teacherId === c.teacherId
      );
      if (twin) {
        db.messages.forEach((m) => {
          if (m.conversationId === c.id) m.conversationId = twin.id;
        });
        if (c.lastMessageAt > twin.lastMessageAt) twin.lastMessageAt = c.lastMessageAt;
        db.conversations = db.conversations.filter((x) => x.id !== c.id);
      } else {
        c.parentId = keepId;
      }
      chatsMoved++;
    }
    db.messages.forEach((m) => {
      if (m.senderId === removeId) m.senderId = keepId;
    });
    db.notifications.forEach((n) => {
      if (n.userId === removeId) n.userId = keepId;
    });

    // the duplicate account itself
    db.profiles = db.profiles.filter((p) => p.id !== removeId);
    delete db.passwordsByUserId[removeId];
    db.auditLogs.unshift({
      id: auditId(),
      action: 'MERGE_PARENT_ACCOUNTS',
      tableName: 'profiles',
      recordId: removeId,
      oldValue: `${dup.loginId} (${dup.fullName})`,
      newValue: `${keep.loginId} (${keep.fullName})`,
      reason: `Duplicate parent account merged; ${childrenMoved} child link(s) and ${chatsMoved} chat(s) moved`,
      changedBy: actor.id,
      changedAt: new Date().toISOString(),
    });
    saveLocalDatabase(db);
    return AppResult.success({ childrenMoved, chatsMoved });
  }

  async deleteTeacherAssignment(
    assignmentId: string,
    _actor: Profile
  ): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    db.teacherAssignments = db.teacherAssignments.filter(
      (ta) => ta.id !== assignmentId
    );
    saveLocalDatabase(db);
    return AppResult.success(undefined);
  }

  async getAuditLogs(limit = 100): Promise<AppResult<AuditLogEntry[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    return AppResult.success(db.auditLogs.slice(0, limit));
  }

  async resetDemoData(): Promise<AppResult<void>> {
    await simulateLocalDelay();
    const freshDb = buildInitialDemoDatabase();
    saveLocalDatabase(freshDb);
    try {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION);
      window.localStorage.removeItem(STORAGE_KEYS.PARENT_CHILD_MAP);
    } catch {
      // Ignore
    }
    return AppResult.success(undefined);
  }

  async getSettings(): Promise<AppSettings> {
    await simulateLocalDelay();
    getOrSeedLocalDatabase();
    return readLocalJson<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  async setLanguage(language: LanguageCode): Promise<AppSettings> {
    await simulateLocalDelay();
    const current = readLocalJson<AppSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
    const updated: AppSettings = {
      ...current,
      language,
      forceLightTheme: true,
      timezone: 'Asia/Karachi',
    };
    writeLocalJson(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  async setCampus(selectedCampus: Campus): Promise<AppSettings> {
    await simulateLocalDelay();
    const current = readLocalJson<AppSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
    const updated: AppSettings = {
      ...current,
      selectedCampus,
      forceLightTheme: true,
      timezone: 'Asia/Karachi',
    };
    writeLocalJson(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  async getSelectedChildId(parentId: string): Promise<string | null> {
    const map = readLocalJson<Record<string, string>>(
      STORAGE_KEYS.PARENT_CHILD_MAP,
      {}
    );
    return map[parentId] ?? null;
  }

  async setSelectedChildId(parentId: string, studentId: string): Promise<void> {
    const map = readLocalJson<Record<string, string>>(
      STORAGE_KEYS.PARENT_CHILD_MAP,
      {}
    );
    map[parentId] = studentId;
    writeLocalJson(STORAGE_KEYS.PARENT_CHILD_MAP, map);
  }

  async clearAllLocalData(): Promise<AppSettings> {
    await this.resetDemoData();
    writeLocalJson(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
}
