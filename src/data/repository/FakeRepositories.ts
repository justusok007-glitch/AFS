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
  AuditLogEntry,
  Campus,
  CampusModel,
  ChartSeriesPoint,
  ClassFeeStructure,
  Conversation,
  DashboardSummary,
  Exam,
  ExamStatus,
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

const STORAGE_KEYS = {
  LOCAL_DB: 'afs_okara_local_db_v2',
  SESSION: 'afs_okara_session_v1',
  SETTINGS: 'afs_okara_settings_v1',
  PARENT_CHILD_MAP: 'afs_okara_parent_selected_child_v1',
} as const;

export async function simulateLocalDelay(): Promise<number> {
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

function writeLocalJson<T>(key: string, value: T): void {
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
        parsed.exams ??= [];
        parsed.examSubjects ??= [];
        parsed.marks ??= [];
        parsed.markSubmissions ??= [];
        parsed.conversations ??= [];
        parsed.messages ??= [];
        parsed.notices ??= [];
        parsed.notifications ??= [];
        return parsed;
      }
    }
  } catch {
    // Fallback to initial seed
  }
  const initial = buildInitialDemoDatabase();
  writeLocalJson(STORAGE_KEYS.LOCAL_DB, initial);
  return initial;
}

function saveLocalDatabase(db: LocalDatabaseSnapshot): void {
  writeLocalJson(STORAGE_KEYS.LOCAL_DB, db);
}

function mapDomainRoleToUserRole(role: Role): UserRole {
  switch (role) {
    case Role.PARENT:
      return UserRole.PARENT;
    case Role.TEACHER:
      return UserRole.TEACHER;
    case Role.PRINCIPAL:
      return UserRole.PRINCIPAL;
    case Role.ACCOUNTANT:
      return UserRole.ACCOUNTANT;
    case Role.ADMIN:
      return UserRole.ADMIN;
  }
}

function mapCampusIdToEnum(campusId: string | null): Campus {
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
  if (!/^\+?\d{10,13}$/.test(phone)) return fail('Enter a valid phone number.');
  const needsCampus =
    input.role === Role.PARENT ||
    input.role === Role.TEACHER ||
    input.role === Role.ACCOUNTANT;
  if (needsCampus && !input.campusId) return fail('Campus is required for this role.');

  let loginId: string;
  const custom = input.loginId?.trim();
  if (custom) {
    if (!/^[A-Za-z0-9_.-]{3,20}$/.test(custom)) {
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
      [Role.ACCOUNTANT]: { prefix: 'AC', digits: 2 },
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
  if (customPw && customPw.length < 6) return fail('Password must be at least 6 characters.');
  const password = customPw || generateReadablePassword();
  const id = `usr_${loginId.toLowerCase()}`;
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

function admitStudentInDb(
  db: LocalDatabaseSnapshot,
  input: NewStudentInput,
  actor: Profile
): { ok: true; data: AdmitResult; warnings: string[] } | Fail {
  const fail = (message: string): Fail => ({ ok: false, message });
  const warnings: string[] = [];
  const name = input.name.trim();
  const nameUr = input.nameUr.trim();
  const fatherName = input.fatherName.trim();
  const phone = normalizePkPhone(input.guardianPhone);
  const phone2 = normalizePkPhone(input.guardianPhone2 ?? '');
  const dob = input.dateOfBirth.trim();
  if (name.length < 3) return fail('Student name (English) is required.');
  if (nameUr.length < 2) return fail('Student name (Urdu) is required.');
  if (fatherName.length < 3) return fail("Father's name is required.");
  if (!/^\+?\d{10,13}$/.test(phone)) return fail('Enter a valid guardian phone number.');
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

  const duplicate = db.students.some(
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

  // Parent account is resolved BEFORE anything is written so a failure leaves no half-admission.
  let parent: Profile | null = null;
  let parentPassword: string | null = null;
  if (input.parent?.mode === 'link') {
    const wantedId = input.parent.parentId;
    parent = db.profiles.find((p) => p.id === wantedId && p.role === Role.PARENT) ?? null;
    if (!parent) return fail('Selected parent account was not found.');
  } else if (input.parent?.mode === 'create') {
    const spec = input.parent;
    if (spec.fatherNameUr.trim().length < 2) return fail("Father's name (Urdu) is required.");
    const wanted = spec.loginId?.trim().toUpperCase();
    const existing = wanted
      ? db.profiles.find((p) => p.loginId.toUpperCase() === wanted)
      : undefined;
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
          fullName: fatherName,
          fullNameUr: spec.fatherNameUr,
          phone,
          campusId: campus.id,
          loginId: spec.loginId,
          password: spec.password,
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

  const student: Student = {
    id: `stu_${String(nextIdNum).padStart(3, '0')}`,
    admissionNo: `AFS-${campus.code}-${input.admissionDate.slice(0, 4)}-${String(nextSeq).padStart(3, '0')}`,
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
  if (user.role === Role.ADMIN || user.role === Role.PRINCIPAL) return true;
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

    if (actor.role === Role.TEACHER) {
      // Check assigned section with canMarkAttendance == true
      const isAssigned = db.teacherAssignments.some(
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
      if (date !== todayKarachi) {
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
      if (nowTime > lockTime) {
        return AppResult.failure({
          kind: 'AttendancePastCutoffTime',
          lockTime,
          message: `Attendance submission is locked after ${lockTime} (Asia/Karachi).`,
        });
      }
    } else if (actor.role !== Role.ADMIN) {
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
    return AppResult.success(db.feePayments);
  }

  /**
   * getDefaulters returns students who have unpaid/partial past months (before currentMonth()),
   * along with their unpaid months and total amount due.
   */
  async getDefaulters(
    campusId: string | null
  ): Promise<AppResult<FeeDefaulterSummary[]>> {
    await simulateLocalDelay();
    const db = getOrSeedLocalDatabase();
    const curMonth = currentMonth();

    const defaulters: FeeDefaulterSummary[] = [];

    for (const stu of db.students) {
      if (stu.status !== StudentStatus.ACTIVE) continue;
      if (campusId && stu.campusId !== campusId) continue;

      const unpaidVouchers = db.feeVouchers
        .filter(
          (v) => v.studentId === stu.id && v.status !== VoucherStatus.PAID
        )
        .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));

      const hasPastUnpaidMonth = unpaidVouchers.some(
        (v) => v.billingMonth < curMonth
      );
      if (!hasPastUnpaidMonth) continue;

      const monthsUnpaid = unpaidVouchers.map((v) => v.billingMonth);
      const amountDue = unpaidVouchers.reduce((sum, v) => {
        const vUnpaid = v.items.reduce((s, it) => {
          const net = Math.max(0, it.amount - it.waivedAmount);
          return s + Math.max(0, net - (it.paidAmount ?? 0));
        }, 0);
        return sum + vUnpaid;
      }, 0);

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

      for (const alloc of pAllocations) {
        const cat = alloc.feeHeadId
          ? headCategoryMap[alloc.feeHeadId] ?? FeeCategory.OTHER
          : FeeCategory.OTHER;
        if (filter.category && cat !== filter.category) continue;

        byCategory[cat] = (byCategory[cat] ?? 0) + alloc.allocatedAmount;
        paymentMatchedAmount += alloc.allocatedAmount;
      }

      if (paymentMatchedAmount > 0) {
        receiptsCount++;
        totalCollectedRupees += paymentMatchedAmount;
        byDay[payment.paidOn] =
          (byDay[payment.paidOn] ?? 0) + paymentMatchedAmount;
        byMethod[payment.method] =
          (byMethod[payment.method] ?? 0) + paymentMatchedAmount;
      }
    }

    return AppResult.success({
      filter,
      totalCollectedRupees,
      byCategory,
      byDay,
      byMethod,
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
        .slice(0, 10)
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
    const all = role === Role.ADMIN || role === Role.PRINCIPAL;
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
    const allowed = viewer.role === Role.ADMIN || viewer.role === Role.PRINCIPAL || viewer.id === conv.parentId || viewer.id === conv.teacherId;
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
    if (reader && (reader.role === Role.ADMIN || reader.role === Role.PRINCIPAL)) {
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
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN) {
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
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN) {
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
      .filter((p) => p.role !== Role.ADMIN && p.role !== Role.PRINCIPAL)
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
    if (actor.role !== Role.PRINCIPAL && actor.role !== Role.ADMIN) {
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
    cls: { id?: string; campusId: string; nameEn: string; nameUr: string },
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
