import { LanguageCode, StringKey } from '../../res/strings';

// ============================================================================
// CORE ENUMS (Mirrors pk.edu.alfurqanokara.domain.model.*)
// ============================================================================

export enum Role {
  PARENT = 'PARENT',
  TEACHER = 'TEACHER',
  PRINCIPAL = 'PRINCIPAL',
  VICE_PRINCIPAL = 'VICE_PRINCIPAL',
  ACCOUNTANT = 'ACCOUNTANT',
  ATTENDANCE_COORDINATOR = 'ATTENDANCE_COORDINATOR',
  ADMIN = 'ADMIN',
}

export enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher',
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  ACCOUNTANT = 'accountant',
  ATTENDANCE_COORDINATOR = 'attendance_coordinator',
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

/** Fees recorded at admission / bulk import. Paid flags mean "already collected before this app". */
export interface OpeningFees {
  actualFee: number;
  netFee: number;
  annualCharges: number;
  annualPaid: boolean;
  admissionFee: number;
  admissionPaid: boolean;
}

export type ParentSpec =
  | { mode: 'create'; fatherNameUr: string; loginId?: string; password?: string; relaxed?: boolean }
  | { mode: 'link'; parentId: string };

export interface NewStudentInput {
  name: string;
  nameUr: string;
  fatherName: string;
  gender: Gender;
  /** Optional: empty string when unknown. */
  dateOfBirth: string;
  sectionId: string;
  admissionDate: string;
  guardianPhone: string;
  guardianPhone2?: string;
  /** Bulk import: keep the admission number from the file instead of generating one. */
  admissionNo?: string;
  /** Bulk import: missing Urdu name / father / phone are filled with placeholders instead of rejecting the student. */
  lenient?: boolean;
  parent?: ParentSpec;
  opening?: OpeningFees;
}

export interface AdmitResult {
  student: Student;
  /** Set when a parent account was created or reused through ParentSpec. */
  parent: Profile | null;
  /** Only set when a NEW account was created (show the credential slip). */
  parentPassword: string | null;
}

export interface ImportStudentRow {
  line: number;
  name: string;
  nameUr: string;
  fatherName: string;
  fatherNameUr: string;
  phone1: string;
  phone2: string;
  username: string;
  password: string;
  actualFee: number | null;
  netFee: number | null;
  annualCharges: number | null;
  annualPaid: boolean;
  admissionFee: number | null;
  admissionPaid: boolean;
}

/** One row of the combined student file (class, section and campus come from the file). */
export interface ImportFileRow {
  line: number;
  admissionNo: string;
  name: string;
  nameUr: string;
  fatherName: string;
  fatherNameUr: string;
  phone1: string;
  phone2: string;
  campus: string;
  className: string;
  sectionName: string;
  status: string;
  username: string;
  password: string;
  /** Subject columns found in the file header; used only when a new class is created. */
  subjects: string[];
  /** Fee columns of the student file (whole rupees); undefined when blank. */
  actualFee?: number;
  netFee?: number;
  prevArrears?: number;
  admissionFee?: number;
  annualCharges?: number;
}

export interface ImportClassRow {
  line: number;
  campus: string;
  classEn: string;
  classUr: string;
  sections: string[];
  /** "English" or "English|اردو" */
  subjects: string[];
}

/** One student line of the accountant's fee file (whole rupees). */
export interface ImportFeeRow {
  line: number;
  admissionNo: string;
  name: string;
  campus: string;
  monthlyFee?: number;
  prevArrears: number;
  admissionFee: number;
  annualCharges: number;
  /** Month the previous arrears are booked to (the month before the first column). */
  arrearsMonth: string;
  /** Billed amount per month, "YYYY-MM"; blank months are left out. */
  months: { month: string; amount: number }[];
  totalDue?: number;
  totalPaid: number;
  arrears?: number;
  /** Opening-balance sheet: Total Due must equal the columns, and students who already have payments are refused. */
  strict?: boolean;
}

/** One line of the daily fee entry sheet. */
export interface ImportPaymentRow {
  line: number;
  receiptNo: string;
  /** yyyy-mm-dd, '' when missing or unreadable. */
  date: string;
  admissionNo: string;
  name: string;
  campus: string;
  /** "Oct-2026" -> "2026-10", "Previous Arrears" -> 'ARREARS', '' when missing. */
  feeFor: string;
  amount?: number;
  /** Where the money was received: 'Boys' | 'Girls' | '' (not stated). */
  collectedAt?: string;
}

export interface ImportPaymentResult {
  line: number;
  ok: boolean;
  error: string | null;
  warnings: string[];
  studentName: string;
  admissionNo: string;
  receiptNo: string;
  amount: number;
}

export interface ImportFeeResult {
  line: number;
  ok: boolean;
  error: string | null;
  warnings: string[];
  studentName: string;
  admissionNo: string;
  due: number;
  paid: number;
}

/** One student line of the exam team's results file. */
export interface ImportResultRow {
  line: number;
  admissionNo: string;
  campus: string;
  examName: string;
  /** Subjects from the heading "English/80"; value null = blank, absent = marked A/AB. */
  marks: { subject: string; total: number; obtained: number | null; absent: boolean; bad: boolean }[];
}

export interface ImportResultResult {
  line: number;
  ok: boolean;
  error: string | null;
  warnings: string[];
  studentName: string;
  admissionNo: string;
  examName: string;
  subjectsCount: number;
}

export interface ImportClassResult {
  line: number;
  ok: boolean;
  error: string | null;
  className: string;
  created: boolean;
  sectionsAdded: number;
}

export interface ImportStudentResult {
  line: number;
  ok: boolean;
  error: string | null;
  warnings: string[];
  studentName: string;
  admissionNo: string | null;
  parentLoginId: string | null;
  parentCreated: boolean;
  profile: Profile | null;
  password: string | null;
}

export interface NewProfileInput {
  role: Role;
  fullName: string;
  fullNameUr: string;
  phone: string;
  campusId: string | null;
  /** Admin-chosen Login ID / password (bulk import); generated when omitted. */
  loginId?: string;
  password?: string;
  /** Bulk import: allow '@' in the user name and passwords of 4+ characters. */
  relaxed?: boolean;
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
  guardianPhone2?: string;
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
  /** Money by the campus counter that received it ('Boys' / 'Girls'). */
  byCollectedAt?: Record<string, number>;
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
  startDate?: string | null;
  endDate?: string | null;
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

export interface ResultSubjectLine {
  subjectId: string;
  totalMarks: number;
  passMarks: number;
  obtained: number;
  isAbsent: boolean;
  /** false when the teacher has not entered this mark yet. */
  entered: boolean;
  passed: boolean;
  percent: number;
  grade?: string;
}

export interface StudentResultCard {
  exam: Exam;
  student: Student;
  subjectMarks: Mark[];
  subjectLines: ResultSubjectLine[];
  totalMaxMarks: number;
  totalObtainedMarks: number;
  percentage: number;
  grade: string;
  gradeRemarksEn: string;
  gradeRemarksUr: string;
  /** Passed every subject (absent or below pass marks fails). */
  passed: boolean;
  /** At least one subject mark is missing. */
  incomplete: boolean;
  rankInSection: number | null;
  sectionSize: number;
  sessionName?: string;
}

export interface MarkSubmission {
  examId: string;
  sectionId: string;
  subjectId: string;
  submittedBy: string;
  submittedAt: string;
}

export interface MarksProgressRow {
  sectionId: string;
  classId: string;
  subjectId: string;
  entered: number;
  expected: number;
  submitted: boolean;
}

export interface ExamAnalytics {
  studentsCount: number;
  averagePercent: number;
  passPercent: number;
  incompleteCount: number;
  gradeDistribution: { grade: string; count: number }[];
  topStudents: { student: Student; percentage: number; grade: string }[];
  subjectAverages: { subjectId: string; averagePercent: number }[];
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
  titleUr?: string;
  bodyUr?: string;
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
  /** Show class position on parent report cards (default true). */
  showClassPosition?: boolean;
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

export interface UnmarkedSectionInfo {
  sectionId: string;
  classId: string;
  campusId: string;
  sectionName: string;
  teacherNamesEn: string[];
  teacherNamesUr: string[];
}

export interface CampusComparisonRow {
  campusId: string;
  students: number;
  attendancePercent: number;
  collectedThisMonthRupees: number;
  outstandingRupees: number;
}

export interface ClassAttendanceRow {
  classId: string;
  present: number;
  absent: number;
  leave: number;
  late: number;
  percent: number;
}

export interface RecentActivityItem {
  id: string;
  kind: 'PAYMENT' | 'CORRECTION' | 'VOID';
  date: string;
  studentId: string | null;
  amountRupees: number | null;
  text: string;
}

export interface PrincipalDashboard {
  campusId: string | null;
  date: string;
  totalStudents: number;
  boysCount: number;
  girlsCount: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  attendancePercent: number;
  unmarkedSections: UnmarkedSectionInfo[];
  feeCollectedTodayRupees: number;
  feeCollectedMonthRupees: number;
  totalOutstandingRupees: number;
  defaultersCount: number;
  attendanceTrend30: ChartSeriesPoint[];
  monthlyCollection12: ChartSeriesPoint[];
  expectedVsCollected6: { month: string; expected: number; collected: number }[];
  collectionByCategory: Partial<Record<FeeCategory, number>>;
  campusComparison: CampusComparisonRow[];
  classAttendance: ClassAttendanceRow[];
  recentActivity: RecentActivityItem[];
}

export interface AttendanceReportFilter {
  campusId?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  fromDate: string;
  toDate: string;
}

export interface AttendanceReportStudentRow {
  student: Student;
  present: number;
  absent: number;
  leave: number;
  late: number;
  percent: number;
}

export interface AttendanceReportSectionRow {
  sectionId: string;
  classId: string;
  students: number;
  present: number;
  absent: number;
  leave: number;
  late: number;
  percent: number;
}

export interface AttendanceReport {
  filter: AttendanceReportFilter;
  overallPercent: number;
  daysCovered: number;
  sectionRows: AttendanceReportSectionRow[];
  studentRows: AttendanceReportStudentRow[];
}

export interface StaffComplianceRow {
  sectionId: string;
  classId: string;
  campusId: string;
  sectionName: string;
  teacherNamesEn: string[];
  teacherNamesUr: string[];
  daysMarked: number;
  daysExpected: number;
  percent: number;
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
    role: UserRole.VICE_PRINCIPAL,
    domainRole: Role.VICE_PRINCIPAL,
    loginId: 'VP01',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_vice_principal',
    descKey: 'role_vice_principal_desc',
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
    role: UserRole.ATTENDANCE_COORDINATOR,
    domainRole: Role.ATTENDANCE_COORDINATOR,
    loginId: 'CO01',
    defaultPassword: 'demo1234',
    campus: Campus.BOTH,
    titleKey: 'role_attendance_coordinator',
    descKey: 'role_attendance_coordinator_desc',
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
