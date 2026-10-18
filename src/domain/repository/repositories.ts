import { LanguageCode } from '../../res/strings';
import {
  AcademicYear,
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
  AttendanceReport,
  NewProfileInput,
  NewStudentInput,
  AdmitResult,
  ExamAnalytics,
  MarkSubmission,
  MarksProgressRow,
  ImportStudentRow,
  ImportStudentResult,
  AttendanceReportFilter,
  FeeCollectionReport,
  PrincipalDashboard,
  StaffComplianceRow,
  FeeCollectionReportFilter,
  FeeDefaulterSummary,
  FeeHead,
  FeePayment,
  FeeVoucher,
  GradingScaleEntry,
  Mark,
  Message,
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
} from '../models/models';

export interface StudentSearchFilter {
  query?: string;
  campusId?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  status?: StudentStatus | null;
}

// ============================================================================
// 1. AUTH REPOSITORY
// ============================================================================

export interface AuthRepository {
  currentUser(): Promise<Profile | null>;
  login(loginId: string, password: string): Promise<AppResult<Profile>>;
  logout(): Promise<AppResult<void>>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<AppResult<void>>;

  // Skeleton UI Session helpers
  getCurrentSession(): Promise<UserSession | null>;
  loginWithId(loginId: string, password: string): Promise<UserSession>;
  switchRoleSession(role: UserRole): Promise<UserSession>;
}

// ============================================================================
// 2. STUDENT REPOSITORY
// ============================================================================

export interface StudentRepository {
  search(filter: StudentSearchFilter): Promise<AppResult<Student[]>>;
  getById(studentId: string): Promise<AppResult<Student>>;
  /** Validates, auto-generates admission no. (AFS-B-2026-031) and roll no., writes an audit entry. */
  admitStudent(
    input: NewStudentInput,
    actor: Profile
  ): Promise<AppResult<AdmitResult>>;
  /** Bulk admit into one section. dryRun validates everything and saves nothing. */
  importStudents(
    sectionId: string,
    rows: ImportStudentRow[],
    actor: Profile,
    dryRun: boolean
  ): Promise<AppResult<ImportStudentResult[]>>;
  /** Parent accounts linked to a student. */
  parentsOfStudent(studentId: string): Promise<AppResult<Profile[]>>;
  /** Moves a student to another section (and campus when the section belongs to the other campus). */
  transferStudent(
    studentId: string,
    newSectionId: string,
    reason: string,
    actor: Profile
  ): Promise<AppResult<Student>>;
  create(student: Student, createdBy: string): Promise<AppResult<Student>>;
  update(student: Student, updatedBy: string): Promise<AppResult<Student>>;
  markLeft(
    studentId: string,
    leftDate: string,
    reason: string,
    markedBy: string
  ): Promise<AppResult<Student>>;
  linkParent(
    parentId: string,
    studentId: string,
    relation: ParentRelation
  ): Promise<AppResult<ParentStudent>>;
  unlinkParent(parentId: string, studentId: string): Promise<AppResult<void>>;
  childrenOfParent(parentId: string): Promise<AppResult<Student[]>>;
  promoteClass(
    fromSectionId: string,
    toSectionId: string,
    studentIds: string[],
    promotedBy: string
  ): Promise<AppResult<number>>;

  // Skeleton helper
  getStudentsByCampus(campus: Campus): Promise<Student[]>;
}

// ============================================================================
// 3. ATTENDANCE REPOSITORY
// ============================================================================

export interface AttendanceRepository {
  sectionsForTeacher(teacherId: string): Promise<AppResult<Section[]>>;
  studentsOfSection(sectionId: string): Promise<AppResult<Student[]>>;
  getForSectionAndDate(
    sectionId: string,
    date: string
  ): Promise<AppResult<AttendanceRecord[]>>;
  getSubmission(
    sectionId: string,
    date: string
  ): Promise<AppResult<AttendanceSubmission | null>>;
  submit(
    actor: Profile,
    sectionId: string,
    date: string,
    records: AttendanceRecord[]
  ): Promise<AppResult<AttendanceSubmission>>;
  getParentSummary(
    studentId: string,
    month: string
  ): Promise<AppResult<ParentAttendanceSummary>>;
  adminCorrect(
    actor: Profile,
    studentId: string,
    sectionId: string,
    date: string,
    newStatus: AttendanceStatus,
    reason: string
  ): Promise<AppResult<AttendanceRecord>>;
  sectionsNotMarked(
    date: string,
    campusId: string | null
  ): Promise<AppResult<Section[]>>;
  clearAttendanceForSectionAndDate(
    sectionId: string,
    date: string
  ): Promise<AppResult<void>>;
  getTotalRecordsCount(): Promise<
    AppResult<{ recordsCount: number; submissionsCount: number }>
  >;
}

// ============================================================================
// 4. FEE REPOSITORY
// ============================================================================

export interface FeeRepository {
  getFeeHeads(): Promise<AppResult<FeeHead[]>>;
  saveFeeHead(feeHead: FeeHead, actorId: string): Promise<AppResult<FeeHead>>;
  getClassFeeStructures(
    classId: string | null
  ): Promise<AppResult<ClassFeeStructure[]>>;
  saveClassFeeStructure(
    structure: ClassFeeStructure,
    actorId: string
  ): Promise<AppResult<ClassFeeStructure>>;
  getConcessionsForStudent(
    studentId: string
  ): Promise<AppResult<StudentConcession[]>>;
  saveConcession(
    concession: StudentConcession,
    actorId: string
  ): Promise<AppResult<StudentConcession>>;
  removeConcession(
    studentId: string,
    feeHeadId: string,
    actorId: string
  ): Promise<AppResult<void>>;

  /**
   * Safe to run twice (idempotent): skips students who already have that month's voucher,
   * applies class fees and concessions, and adds annual charges in August (month 08).
   */
  generateMonthlyVouchers(
    campusId: string | null,
    classId: string | null,
    billingMonth: string,
    dueDate: string,
    actorId?: string
  ): Promise<AppResult<FeeVoucher[]>>;

  /** Dry run of generateMonthlyVouchers: counts what would be created, saves nothing. */
  previewMonthlyVouchers(
    campusId: string | null,
    classId: string | null,
    billingMonth: string
  ): Promise<AppResult<VoucherGenerationPreview>>;

  /**
   * Allocates oldest unpaid voucher first, and inside a voucher by FeeHead.priority (arrears first),
   * and updates voucher status UNPAID / PARTIAL / PAID.
   */
  recordPayment(
    studentId: string,
    amountRupees: number,
    paidOn: string,
    method: PaymentMethod,
    receivedBy: string,
    reference?: string | null,
    remarks?: string | null
  ): Promise<
    AppResult<{ payment: FeePayment; allocations: PaymentAllocation[] }>
  >;

  /** ADMIN only, requires reason and writes AuditLogEntry. */
  voidPayment(
    actor: Profile,
    paymentId: string,
    reason: string
  ): Promise<AppResult<FeePayment>>;

  /** ADMIN only, requires reason and writes AuditLogEntry. */
  waiveItem(
    actor: Profile,
    voucherId: string,
    feeHeadId: string,
    waivedAmountRupees: number,
    reason: string
  ): Promise<AppResult<FeeVoucher>>;

  feeSummaryForStudent(
    studentId: string
  ): Promise<AppResult<StudentFeeSummary>>;
  getVouchersForStudent(studentId: string): Promise<AppResult<FeeVoucher[]>>;
  getPaymentsForStudent(studentId: string): Promise<AppResult<FeePayment[]>>;
  getAllVouchers(): Promise<AppResult<FeeVoucher[]>>;
  getAllPayments(): Promise<AppResult<FeePayment[]>>;
  getDefaulters(
    campusId: string | null
  ): Promise<AppResult<FeeDefaulterSummary[]>>;
  getCollectionReport(
    filter: FeeCollectionReportFilter
  ): Promise<AppResult<FeeCollectionReport>>;
}

// ============================================================================
// 5. EXAM REPOSITORY
// ============================================================================

export interface ExamRepository {
  getExams(campusId: string | null): Promise<AppResult<Exam[]>>;
  createExam(exam: Exam, actorId: string): Promise<AppResult<Exam>>;
  updateExamStatus(
    examId: string,
    status: ExamStatus,
    actorId: string
  ): Promise<AppResult<Exam>>;
  /** Replaces the subject list of ONE class for the exam (empty list clears it). Admin only, not after publishing. */
  configureExamSubjects(
    examId: string,
    classId: string,
    subjects: ExamSubject[],
    actorId: string
  ): Promise<AppResult<ExamSubject[]>>;
  getExamSubjectsForClass(
    examId: string,
    classId: string
  ): Promise<AppResult<ExamSubject[]>>;
  /**
   * Replaces the marks of one section+subject with the given list (students not in the list
   * have no mark yet). finalize=false is an autosave draft, finalize=true records a submission.
   * Teachers: assigned sections only, exam must be in MARKS_ENTRY. Admin may edit a PUBLISHED
   * exam but must give a reason (audited).
   */
  enterMarks(
    actor: Profile,
    examId: string,
    sectionId: string,
    subjectId: string,
    marks: Mark[],
    finalize: boolean,
    reason?: string
  ): Promise<AppResult<Mark[]>>;
  getMarksForSectionSubject(
    examId: string,
    sectionId: string,
    subjectId: string
  ): Promise<AppResult<Mark[]>>;
  getMarkSubmission(
    examId: string,
    sectionId: string,
    subjectId: string
  ): Promise<AppResult<MarkSubmission | null>>;
  getMarksProgress(examId: string): Promise<AppResult<MarksProgressRow[]>>;
  /** Parents only get PUBLISHED exams of their own children. */
  getStudentResultCard(
    examId: string,
    studentId: string,
    actor?: Profile
  ): Promise<AppResult<StudentResultCard>>;
  getSectionResultCards(
    examId: string,
    sectionId: string
  ): Promise<AppResult<StudentResultCard[]>>;
  getExamAnalytics(
    examId: string,
    campusId: string | null,
    classId: string | null
  ): Promise<AppResult<ExamAnalytics>>;
}

export interface MessageRepository {
  /** Parents/teachers see their own conversations; Principal/Admin see all (read-only). Newest first. */
  getConversationsForUser(
    userId: string,
    role: Role
  ): Promise<AppResult<Conversation[]>>;
  /**
   * One conversation per student + parent + teacher. The parent must be linked to the student and
   * the teacher must teach the student's section.
   */
  getOrCreateConversation(
    studentId: string,
    parentId: string,
    teacherId: string
  ): Promise<AppResult<Conversation>>;
  /** Participants, Principal and Admin only. */
  getMessages(
    conversationId: string,
    viewer: Profile
  ): Promise<AppResult<Message[]>>;
  /** Only the parent or teacher of the conversation can send. */
  sendMessage(
    conversationId: string,
    senderId: string,
    body: string
  ): Promise<AppResult<Message>>;
  /** Marks the other side's messages as read. Returns how many changed. */
  markConversationRead(
    conversationId: string,
    readerUserId: string
  ): Promise<AppResult<number>>;
  getUnreadMessageCount(userId: string): Promise<AppResult<number>>;
  /** Class teacher + teachers assigned to the student's section. */
  teachersOfStudent(studentId: string): Promise<AppResult<Profile[]>>;
  /** Students of every section the teacher is assigned to. */
  studentsForTeacher(teacherId: string): Promise<AppResult<Student[]>>;
}

export interface NoticeRepository {
  /** Active (not expired) notices this user is allowed to see, newest first. */
  getNoticesForUser(user: Profile): Promise<AppResult<Notice[]>>;
  /** Principal/Admin: every notice including expired ones. */
  getAllNotices(actor: Profile): Promise<AppResult<Notice[]>>;
  /** id and createdAt are assigned here. Also creates in-app notifications for the audience. */
  createNotice(notice: Notice, actor: Profile): Promise<AppResult<Notice>>;
  deleteNotice(noticeId: string, actor: Profile): Promise<AppResult<void>>;
  getNotificationsForUser(
    userId: string
  ): Promise<AppResult<AppNotification[]>>;
  markNotificationRead(
    notificationId: string,
    userId: string
  ): Promise<AppResult<void>>;
  markAllNotificationsRead(userId: string): Promise<AppResult<void>>;
}

// ============================================================================
// 8. DASHBOARD REPOSITORY (KPI & Chart Queries)
// ============================================================================

export interface DashboardRepository {
  getPrincipalDashboardKpis(
    campusId: string | null,
    referenceDate: string
  ): Promise<AppResult<PrincipalDashboardKpis>>;
  getAttendanceTrendChart(
    campusId: string | null,
    days: number
  ): Promise<AppResult<ChartSeriesPoint[]>>;
  getFeeCollectionChart(
    campusId: string | null,
    months: number
  ): Promise<AppResult<ChartSeriesPoint[]>>;
  getClassStrengthDistribution(
    campusId: string | null
  ): Promise<AppResult<ChartSeriesPoint[]>>;

  /** All principal/admin dashboard numbers, aggregated here (never in the UI). */
  getPrincipalDashboard(
    campusId: string | null,
    date: string
  ): Promise<AppResult<PrincipalDashboard>>;
  getAttendanceReport(
    filter: AttendanceReportFilter
  ): Promise<AppResult<AttendanceReport>>;
  getStaffCompliance(
    campusId: string | null,
    fromDate: string,
    toDate: string
  ): Promise<AppResult<StaffComplianceRow[]>>;

  // Skeleton summary helper
  getRoleDashboardSummary(
    role: UserRole,
    campus: Campus
  ): Promise<DashboardSummary>;
}

// ============================================================================
// 9. SETTINGS REPOSITORY
// ============================================================================

export interface SettingsRepository {
  getSchoolSettings(): Promise<AppResult<SchoolSettings>>;
  updateSchoolSettings(
    settings: SchoolSettings,
    actor: Profile
  ): Promise<AppResult<SchoolSettings>>;
  getCampuses(): Promise<AppResult<CampusModel[]>>;
  getCurrentAcademicYear(): Promise<AppResult<AcademicYear | null>>;
  getClasses(campusId: string | null): Promise<AppResult<SchoolClass[]>>;
  getSections(classId: string | null): Promise<AppResult<Section[]>>;
  getSubjects(): Promise<AppResult<Subject[]>>;
  getClassSubjects(classId: string): Promise<AppResult<Subject[]>>;
  /** Create or rename a class (sortOrder is assigned automatically on create). Admin only. */
  saveClass(
    cls: Pick<SchoolClass, 'campusId' | 'nameEn' | 'nameUr'> & { id?: string },
    actor: Profile
  ): Promise<AppResult<SchoolClass>>;
  /** Create or edit a section, including its class teacher. Admin only. */
  saveSection(
    section: Pick<Section, 'classId' | 'name' | 'classTeacherId'> & { id?: string },
    actor: Profile
  ): Promise<AppResult<Section>>;
  /** Only allowed when the section has no students. */
  deleteSection(sectionId: string, actor: Profile): Promise<AppResult<void>>;

  // Holidays
  getHolidays(
    year: number,
    campusId: string | null
  ): Promise<AppResult<SchoolHoliday[]>>;
  saveHoliday(
    holiday: SchoolHoliday,
    actor: Profile
  ): Promise<AppResult<SchoolHoliday>>;
  deleteHoliday(holidayId: string, actor: Profile): Promise<AppResult<void>>;

  // Grading Scale
  getGradingScale(): Promise<AppResult<GradingScaleEntry[]>>;
  saveGradingScale(
    entries: GradingScaleEntry[],
    actor: Profile
  ): Promise<AppResult<GradingScaleEntry[]>>;

  // Users CRUD & Teacher Assignments
  getProfiles(
    role: Role | null,
    campusId: string | null
  ): Promise<AppResult<Profile[]>>;
  saveProfile(
    profile: Profile,
    initialPassword: string | null,
    actor: Profile
  ): Promise<AppResult<Profile>>;
  /** Creates a user with an auto-generated Login ID (P00001 / T0001 / PR01 / AC01 / AD01) and an 8-character password. */
  createProfile(
    input: NewProfileInput,
    actor: Profile
  ): Promise<AppResult<{ profile: Profile; password: string }>>;
  /** Generates and stores a new 8-character password. The password is returned once. */
  resetPassword(
    profileId: string,
    actor: Profile
  ): Promise<AppResult<{ profile: Profile; password: string }>>;
  setProfileActive(
    profileId: string,
    isActive: boolean,
    actor: Profile
  ): Promise<AppResult<Profile>>;
  getTeacherAssignments(
    teacherId: string | null
  ): Promise<AppResult<TeacherAssignment[]>>;
  saveTeacherAssignment(
    assignment: TeacherAssignment,
    actor: Profile
  ): Promise<AppResult<TeacherAssignment>>;
  deleteTeacherAssignment(
    assignmentId: string,
    actor: Profile
  ): Promise<AppResult<void>>;

  // Audit Logs
  getAuditLogs(limit?: number): Promise<AppResult<AuditLogEntry[]>>;

  // Reset & Re-seed Demo Data (Developer Action)
  resetDemoData(): Promise<AppResult<void>>;

  // App UI Preferences & Parent Selected Child Persistence
  getSettings(): Promise<AppSettings>;
  setLanguage(language: LanguageCode): Promise<AppSettings>;
  setCampus(campus: Campus): Promise<AppSettings>;
  getSelectedChildId(parentId: string): Promise<string | null>;
  setSelectedChildId(parentId: string, studentId: string): Promise<void>;
  clearAllLocalData(): Promise<AppSettings>;
}
