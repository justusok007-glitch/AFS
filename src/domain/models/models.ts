import { LanguageCode, StringKey } from '../../res/strings';

// ============================================================================
// CORE ENUMS (Mirrors pk.edu.alfurqanokara.domain.model.*)
// ============================================================================

export enum Role {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  PRINCIPAL = 'PRINCIPAL',
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN = 'ADMIN',
}

export enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  ACCOUNTANT = 'accountant',
  ADMIN = 'admin',
}

export enum Campus {
  BOYS = 'BOYS',
  GIRLS = 'GIRLS',
  BOTH = 'BOTH',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT',
}

export enum ParentRelation {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  LATE = 'LATE',
}

export enum FeeCategory {
  ARREARS = 'ARREARS',
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
  ADMISSION = 'ADMISSION',
  EXAM = 'EXAM',
  LATE = 'LATE',
  OTHER = 'OTHER',
}

export enum ConcessionType {
  FIXED_OFF = 'FIXED_OFF',
  PERCENT_OFF = 'PERCENT_OFF',
  OVERRIDE = 'OVERRIDE',
}

export enum VoucherStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK = 'BANK',
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
}

export enum ExamType {
  MONTHLY_TEST = 'MONTHLY_TEST',
  MID_TERM = 'MID_TERM',
  FINAL_TERM = 'FINAL_TERM',
}

export enum ExamStatus {
  DRAFT = 'DRAFT',
  MARKS_ENTRY = 'MARKS_ENTRY',
  PUBLISHED = 'PUBLISHED',
}

export enum NoticeAudience {
  ALL = 'ALL',
  CAMPUS = 'CAMPUS',
  CLASS = 'CLASS',
  STAFF = 'STAFF',
  PARENTS = 'PARENTS',
}

export enum NotificationType {
  ATTENDANCE = 'ATTENDANCE',
  FEE = 'FEE',
  EXAM = 'EXAM',
  MESSAGE = 'MESSAGE',
  NOTICE = 'NOTICE',
  SYSTEM = 'SYSTEM',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

// ============================================================================
// SEALED DOMAIN RESULT & ERRORS
// ============================================================================

export type DomainError =
  | { kind: 'InvalidCredentials'; message: string }
  | { kind: 'AccountInactive'; message: string }
  | { kind: 'UnauthorizedRole'; message: string }
  | {
      kind: 'SectionNotAssignedToTeacher';
      teacherId: string;
      sectionId: string;
      message: string;
    }
  | { kind: 'AttendanceDateLocked'; date: string; message: string }
  | { kind: 'AttendancePastCutoffTime'; lockTime: string; message: string }
  | {
      kind: 'SubjectMarksNotAssigned';
      teacherId: string;
      sectionId: string;
      subjectId: string;
      message: string;
    }
  | {
      kind: 'ExamLockedForMarks';
      examId: string;
      status: ExamStatus;
      message: string;
    }
  | { kind: 'NotFound'; entity: string; id: string; message: string }
  | { kind: 'ValidationFailed'; message: string };

export type AppResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DomainError };

export const AppResult = {
  success<T>(data: T): AppResult<T> {
    return { ok: true, data };
  },
  failure<T = never>(error: DomainError): AppResult<T> {
    return { ok: false, error };
  },
};

// ============================================================================
// 1. CAMPUS, ACADEMIC YEAR, CLASSES, SECTIONS & SUBJECTS
// ============================================================================

export interface CampusModel {
  id: string;
  code: 'B' | 'G';
  nameEn: string;
  nameUr: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2026-27"
  startDate: string; // LocalDate "YYYY-MM-DD"
  endDate: string; // LocalDate "YYYY-MM-DD"
  isCurrent: boolean;
}

export interface SchoolClass {
  id: string;
  campusId: string;
  nameEn: string;
  nameUr: string;
  sortOrder: number;
}

export interface Section {
  id: string;
  classId: string;
  name: string;
  classTeacherId: string | null;
}

export interface Subject {
  id: string;
  nameEn: string;
  nameUr: string;
}

export interface ClassSubject {
  classId: string;
  subjectId: string;
}

// ============================================================================
// 2. PROFILES, STUDENTS & TEACHER ASSIGNMENTS
// ============================================================================

export interface Profile {
  id: string;
  loginId: string;
  role: Role;
  fullName: string;
  fullNameUr: string;
  phone: string;
  campusId: string | null; // null means all campuses
  language: LanguageCode;
  isActive: boolean;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  nameUr: string;
  fatherName: string;
  gender: Gender;
  dateOfBirth: string; // LocalDate
  campusId: string;
  sectionId: string;
  rollNo: number;
  admissionDate: string; // LocalDate
  status: StudentStatus;
  guardianPhone: string;
}

export interface ParentStudent {
  parentId: string;
  studentId: string;
  relation: ParentRelation;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  sectionId: string;
  subjectId: string | null;
  canMarkAttendance: boolean;
  canEnterMarks: boolean;
}

// ============================================================================
// 3. ATTENDANCE MODELS & SUMMARIES
// ============================================================================

export interface AttendanceRecord {
  studentId: string;
  sectionId: string;
  date: string; // LocalDate "YYYY-MM-DD"
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: string;
}

export interface AttendanceSubmission {
  sectionId: string;
  date: string; // LocalDate "YYYY-MM-DD"
  submittedBy: string;
  submittedAt: string; // Instant ISO
}

export interface MonthlyAttendancePercentage {
  month: string; // YearMonth "YYYY-MM"
  totalDays: number; // Marked days excluding LEAVE, Sundays & holidays
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  lateDays: number;
  percentage: number; // (PRESENT + LATE) / (PRESENT + LATE + ABSENT) * 100
}

export interface ParentAttendanceSummary {
  studentId: string;
  dailyRecords: AttendanceRecord[];
  monthlyPercentages: MonthlyAttendancePercentage[];
  allTimeTotalDays: number; // Marked days excluding LEAVE
  allTimePresentDays: number;
  allTimeAbsentDays: number;
  allTimeLeaveDays: number;
  allTimeLateDays: number;
  allTimePercentage: number; // (PRESENT + LATE) / (PRESENT + LATE + ABSENT) * 100
}

// ============================================================================
// 4. FEES, VOUCHERS, CONCESSIONS & PAYMENTS (Whole Long Rupees)
// ============================================================================

export interface FeeHead {
  id: string;
  code: string;
  nameEn: string;
  nameUr: string;
  category: FeeCategory;
  priority: number; // 1 = highest priority (Previous Arrears first)
}

export interface ClassFeeStructure {
  classId: string;
  feeHeadId: string;
  amount: number; // Long whole rupees
  chargeMonth: number | null; // 8 for August Annual Charges, null for monthly/admission
}

export interface StudentConcession {
  studentId: string;
  feeHeadId: string;
  type: ConcessionType; // [FIXED_OFF, PERCENT_OFF, OVERRIDE]
  value: number; // Long
  reason: string;
}

export interface FeeVoucherItem {
  feeHeadId: string;
  description: string;
  amount: number; // Long whole rupees (gross after concession or base)
  waivedAmount: number; // Long whole rupees
  paidAmount?: number; // Long whole rupees allocated to this item
}

export interface FeeVoucher {
  id: string;
  voucherNo: string; // e.g. B-0001, G-0001
  studentId: string;
  campusId: string;
  billingMonth: string; // YearMonth "YYYY-MM"
  issueDate: string; // LocalDate
  dueDate: string; // LocalDate
  items: FeeVoucherItem[];
  status: VoucherStatus; // [UNPAID, PARTIAL, PAID]
}

export interface FeePayment {
  id: string;
  receiptNo: string; // e.g. B-R-0001, G-R-0001
  studentId: string;
  amount: number; // Long whole rupees
  paidOn: string; // LocalDate
  method: PaymentMethod; // [CASH, BANK, JAZZCASH, EASYPAISA]
  receivedBy: string;
  isVoid: boolean;
  voidReason?: string | null;
  /** Bank / JazzCash / Easypaisa transaction reference (required for non-cash methods). */
  reference?: string | null;
  remarks?: string | null;
  allocations?: PaymentAllocation[];
}

/** Dry-run result for generateMonthlyVouchers (nothing is saved). */
export interface VoucherGenerationPreview {
  billingMonth: string;
  willCreate: number;
  skippedAlreadyHaveVoucher: number;
  totalExpectedRupees: number;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  voucherId: string;
  feeHeadId: string | null;
  allocatedAmount: number; // Long whole rupees
}

/**
 * Six mandatory values for feeSummaryForStudent:
 * 1. monthlyFee (this month's tuition after concessions)
 * 2. paidThisMonth (valid payments received in the current calendar month, Asia/Karachi)
 *    + totalPaid / paid (total paid this academic year, kept for Accountant, Admin & Principal)
 * 3. pending (total outstanding across all vouchers)
 * 4. previousArrears (outstanding from months before the current month)
 * 5. annualCharges (amount + paid/unpaid status)
 * 6. admissionFee (amount + paid/unpaid status)
 */
export interface StudentFeeSummary {
  studentId: string;
  monthlyFee: number;
  paidThisMonth: number;
  totalPaid: number;
  paid: number;
  pending: number;
  previousArrears: number;
  annualChargesAmount: number;
  annualChargesStatus: VoucherStatus;
  admissionFeeAmount: number;
  admissionFeeStatus: VoucherStatus;
}

export interface FeeDefaulterSummary {
  student: Student;
  monthsUnpaid: string[]; // e.g. ["2026-08", "2026-09"]
  unpaidVouchersCount: number;
  amountDue: number; // Total unpaid amount across unpaid vouchers
}

export interface FeeCollectionReportFilter {
  fromDate: string;
  toDate: string;
  category?: FeeCategory | null;
  campusId?: string | null;
  classId?: string | null;
  method?: PaymentMethod | null;
}

export interface FeeCollectionReport {
  filter: FeeCollectionReportFilter;
  totalCollectedRupees: number;
  byCategory: Partial<Record<FeeCategory, number>>;
  byDay: Record<string, number>;
  byMethod: Partial<Record<PaymentMethod, number>>;
  receiptsCount: number;
  voidedCount: number;
}

// ============================================================================
// 5. EXAMS, SUBJECT MARKS & GRADING SCALE
// ============================================================================

export interface Exam {
  id: string;
  nameEn: string;
  nameUr: string;
  type: ExamType;
  status: ExamStatus;
  campusId: string | null;
}

export interface ExamSubject {
  examId: string;
  classId: string;
  subjectId: string;
  totalMarks: number;
  passMarks: number;
}

export interface Mark {
  examId: string;
  studentId: string;
  subjectId: string;
  obtained: number;
  isAbsent: boolean;
}

export interface GradingScaleEntry {
  minPercent: number;
  grade: string;
  remarksEn?: string;
  remarksUr?: string;
}

export interface StudentResultCard {
  exam: Exam;
  student: Student;
  subjectMarks: Mark[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  grade: string;
  rankInSection: number | null;
}

// ============================================================================
// 6. MESSAGING, NOTICES & NOTIFICATIONS
// ============================================================================

export interface Conversation {
  id: string;
  studentId: string;
  parentId: string;
  teacherId: string;
  lastMessageAt: string; // Instant ISO
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string; // Instant ISO
  readAt: string | null; // Instant ISO
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  audienceId: string | null;
  createdBy: string;
  createdAt: string; // Instant ISO
  expiresAt: string | null; // Instant ISO
}

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string; // Instant ISO
  readAt: string | null; // Instant ISO
}

// ============================================================================
// 7. AUDIT LOG, SCHOOL SETTINGS & DASHBOARD KPIs
// ============================================================================

export interface AuditLogEntry {
  id: string;
  action: string;
  tableName: string;
  recordId: string;
  oldValue: string | null;
  newValue: string | null;
  reason: string;
  changedBy: string;
  changedAt: string; // Instant ISO
}

export interface SchoolSettings {
  nameEn: string;
  nameUr: string;
  officePhones: string[];
  address: string;
  attendanceLockTime: string; // LocalTime "23:59"
  weeklyOffDays: DayOfWeek[];
}

export interface SchoolHoliday {
  id: string;
  titleEn: string;
  titleUr: string;
  date: string; // LocalDate
  campusId: string | null;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface PrincipalDashboardKpis {
  campusId: string | null;
  activeStudentsCount: number;
  boysCount: number;
  girlsCount: number;
  todayAttendancePercent: number;
  unmarkedSectionsCount: number;
  currentMonthFeeBilledRupees: number;
  currentMonthFeeCollectedRupees: number;
  totalArrearsRupees: number;
  attendanceTrendLast7Days: ChartSeriesPoint[];
  feeCollectionTrendLast6Months: ChartSeriesPoint[];
}

// ============================================================================
// UI SKELETON SESSION & PRESETS
// ============================================================================

export interface UserSession {
  loginId: string;
  role: UserRole;
  campus: Campus;
  authenticatedAtIso: string;
  profile: Profile;
}

export interface DashboardSummary {
  role: UserRole;
  campus: Campus;
  maxCapacityStudents: number;
  activeCampusesCount: number;
  sampleMonthlyFeeRupees: number;
  referenceDateIso: string;
}

export interface AppSettings {
  language: LanguageCode;
  selectedCampus: Campus;
  forceLightTheme: true;
  timezone: 'Asia/Karachi';
}

export interface RolePreset {
  role: UserRole;
  domainRole: Role;
  loginId: string;
  defaultPassword: string;
  campus: Campus;
  titleKey: StringKey;
  descKey: StringKey;
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    role: UserRole.PARENT,
    domainRole: Role.PARENT,
    loginId: 'P00001',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_parent',
    descKey: 'role_parent_desc',
  },
  {
    role: UserRole.TEACHER,
    domainRole: Role.TEACHER,
    loginId: 'T0001',
    defaultPassword: 'demo1234',
    campus: Campus.BOYS,
    titleKey: 'role_teacher',
    descKey: 'role_teacher_desc',
  },
  {
    role: UserRole.PRINCIPAL,
    domainRole: Role.PRINCIPAL,
    loginId: 'PR01',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_principal',
    descKey: 'role_principal_desc',
  },
  {
    role: UserRole.ACCOUNTANT,
    domainRole: Role.ACCOUNTANT,
    loginId: 'AC01',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_accountant',
    descKey: 'role_accountant_desc',
  },
  {
    role: UserRole.ADMIN,
    domainRole: Role.ADMIN,
    loginId: 'AD01',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_admin',
    descKey: 'role_admin_desc',
  },
];
