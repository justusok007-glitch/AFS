import {
  AcademicYear,
  AppNotification,
  Conversation,
  Message,
  Notice,
  AttendanceRecord,
  AttendanceUnlock,
  AttendanceStatus,
  AttendanceSubmission,
  AuditLogEntry,
  CampusModel,
  ClassFeeStructure,
  ClassSubject,
  ConcessionType,
  DayOfWeek,
  Exam,
  ExamSubject,
  FeeCategory,
  FeeHead,
  FeePayment,
  FeeVoucher,
  FeeVoucherItem,
  Gender,
  GradingScaleEntry,
  Mark,
  MarkSubmission,
  ParentRelation,
  ParentStudent,
  PaymentAllocation,
  PaymentMethod,
  Profile,
  Role,
  SchoolClass,
  SchoolHoliday,
  SchoolSettings,
  Section,
  Student,
  StudentConcession,
  StudentStatus,
  Subject,
  TeacherAssignment,
  VoucherStatus,
} from '../../domain/models/models';
import {
  addDaysIso,
  checkWeeklyOffOrHoliday,
  shiftYearMonth,
  today,
} from '../../domain/clock';

export interface LocalDatabaseSnapshot {
  seededVersion: number;
  campuses: CampusModel[];
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  profiles: Profile[];
  passwordsByUserId: Record<string, string>;
  teacherAssignments: TeacherAssignment[];
  students: Student[];
  parentStudents: ParentStudent[];
  gradingScale: GradingScaleEntry[];
  schoolSettings: SchoolSettings;
  holidays: SchoolHoliday[];
  attendanceRecords: AttendanceRecord[];
  attendanceSubmissions: AttendanceSubmission[];
  attendanceUnlocks: AttendanceUnlock[];
  feeHeads: FeeHead[];
  classFeeStructures: ClassFeeStructure[];
  studentConcessions: StudentConcession[];
  feeVouchers: FeeVoucher[];
  feePayments: FeePayment[];
  paymentAllocations: PaymentAllocation[];
  auditLogs: AuditLogEntry[];
  exams: Exam[];
  examSubjects: ExamSubject[];
  marks: Mark[];
  markSubmissions: MarkSubmission[];
  conversations: Conversation[];
  messages: Message[];
  notices: Notice[];
  notifications: AppNotification[];
}

interface ClassTemplate {
  code: string;
  nameEn: string;
  nameUr: string;
  sortOrder: number;
  hasSectionB: boolean;
  tuitionRupees: number;
  annualRupees: number;
  admissionRupees: number;
}

const CLASS_TEMPLATES: ClassTemplate[] = [
  { code: 'nur', nameEn: 'Nursery', nameUr: 'نرسری', sortOrder: 1, hasSectionB: false, tuitionRupees: 1500, annualRupees: 3000, admissionRupees: 2000 },
  { code: 'prep', nameEn: 'Prep', nameUr: 'پریپ', sortOrder: 2, hasSectionB: false, tuitionRupees: 1700, annualRupees: 3000, admissionRupees: 2000 },
  { code: 'g1', nameEn: 'Grade 1', nameUr: 'جماعت اول', sortOrder: 3, hasSectionB: true, tuitionRupees: 2000, annualRupees: 3500, admissionRupees: 2500 },
  { code: 'g2', nameEn: 'Grade 2', nameUr: 'جماعت دوم', sortOrder: 4, hasSectionB: false, tuitionRupees: 2200, annualRupees: 3500, admissionRupees: 2500 },
  { code: 'g3', nameEn: 'Grade 3', nameUr: 'جماعت سوم', sortOrder: 5, hasSectionB: false, tuitionRupees: 2400, annualRupees: 4000, admissionRupees: 3000 },
  { code: 'g4', nameEn: 'Grade 4', nameUr: 'جماعت چہارم', sortOrder: 6, hasSectionB: false, tuitionRupees: 2600, annualRupees: 4000, admissionRupees: 3000 },
  { code: 'g5', nameEn: 'Grade 5', nameUr: 'جماعت پنجم', sortOrder: 7, hasSectionB: true, tuitionRupees: 2800, annualRupees: 4500, admissionRupees: 3500 },
  { code: 'g6', nameEn: 'Grade 6', nameUr: 'جماعت ششم', sortOrder: 8, hasSectionB: false, tuitionRupees: 3000, annualRupees: 4500, admissionRupees: 3500 },
  { code: 'g7', nameEn: 'Grade 7', nameUr: 'جماعت ہفتم', sortOrder: 9, hasSectionB: false, tuitionRupees: 3200, annualRupees: 5000, admissionRupees: 4000 },
  { code: 'g8', nameEn: 'Grade 8', nameUr: 'جماعت ہشتم', sortOrder: 10, hasSectionB: false, tuitionRupees: 3500, annualRupees: 5000, admissionRupees: 4000 },
  { code: 'g9', nameEn: 'Grade 9', nameUr: 'جماعت نہم', sortOrder: 11, hasSectionB: false, tuitionRupees: 3800, annualRupees: 6000, admissionRupees: 4500 },
  { code: 'g10', nameEn: 'Grade 10', nameUr: 'جماعت دہم', sortOrder: 12, hasSectionB: false, tuitionRupees: 4000, annualRupees: 6000, admissionRupees: 5000 },
];

const PARENT_NAMES: { en: string; ur: string }[] = [
  { en: 'Muhammad Tariq Mahmood', ur: 'محمد طارق محمود' }, // P00001 (2 kids in different campuses: B & G)
  { en: 'Chaudhry Zahid Iqbal', ur: 'چوہدری زاہد اقبال' }, // P00002 (2 kids in same campus: Boys)
  { en: 'Hafiz Abdul Rehman', ur: 'حافظ عبدالرحمٰن' },
  { en: 'Syed Ali Raza Gillani', ur: 'سید علی رضا گیلانی' },
  { en: 'Rana Muhammad Asif', ur: 'رانا محمد آصف' },
  { en: 'Malik Farooq Ahmed', ur: 'ملک فاروق احمد' },
  { en: 'Mian Kashif Nadeem', ur: 'میاں کاشف ندیم' },
  { en: 'Sardar Imran Khan', ur: 'سردار عمران خان' },
  { en: 'Sheikh Waqas Ahmad', ur: 'شیخ وقاص احمد' },
  { en: 'Qari Muhammad Bilal', ur: 'قاری محمد بلال' },
  { en: 'Mirza Kamran Baig', ur: 'مرزا کامران بیگ' },
  { en: 'Chaudhry Naseer Ud Din', ur: 'چوہدری نصیر الدین' },
  { en: 'Rao Muhammad Shafiq', ur: 'راؤ محمد شفیق' },
  { en: 'Mahr Ghulam Mustafa', ur: 'مہر غلام مصطفیٰ' },
  { en: 'Khawaja Saad Rafique', ur: 'خواجہ سعد رفیق' },
  { en: 'Muhammad Junaid Akram', ur: 'محمد جنید اکرم' },
  { en: 'Babar Hussain Bhatti', ur: 'بابر حسین بھٹی' },
  { en: 'Zulfiqar Ali Joyia', ur: 'ذوالفقار علی جوئیہ' },
  { en: 'Noman Ejaz Wattoo', ur: 'نعمان اعجاز وٹو' },
  { en: 'Shahid Rasool Kharal', ur: 'شاہد رسول کھرل' },
  { en: 'Amjad Pervez Langrial', ur: 'امجد پرویز لنگڑیال' },
  { en: 'Tahir Mehmood Arain', ur: 'طاہر محمود آرائیں' },
  { en: 'Sajjad Haider Naqvi', ur: 'سجاد حیدر نقوی' },
  { en: 'Faisal Khan Lodhi', ur: 'فیصل خان لودھی' },
  { en: 'Rizwan Ullah Siddiqui', ur: 'رضوان اللہ صدیقی' },
  { en: 'Adnan Sami Qureshi', ur: 'عدنان سمیع قریشی' },
  { en: 'Naveed Anjum Cheema', ur: 'نوید انجم چیمہ' },
  { en: 'Humayun Saeed Bodla', ur: 'ہمایوں سعید بودلہ' },
  { en: 'Iftikhar Thakur', ur: 'افتخار ٹھاکر' },
  { en: 'Salman Ahmad Minhas', ur: 'سلمان احمد منہاس' },
];

const BOY_FIRST_NAMES: { en: string; ur: string }[] = [
  { en: 'Muhammad Rayyan', ur: 'محمد ریان' },
  { en: 'Ahmed Hassan', ur: 'احمد حسن' },
  { en: 'Abdullah Zahid', ur: 'عبداللہ زاہد' },
  { en: 'Hamza Rehman', ur: 'حمزہ رحمٰن' },
  { en: 'Huzaifa Ali', ur: 'حذیفہ علی' },
  { en: 'Zain Ul Abideen', ur: 'زین العابدین' },
  { en: 'Usman Ghani', ur: 'عثمان غنی' },
  { en: 'Ibrahim Khalil', ur: 'ابراہیم خلیل' },
  { en: 'Taha Mustafa', ur: 'طہٰ مصطفیٰ' },
  { en: 'Saad Bin Waqas', ur: 'سعد بن وقاص' },
  { en: 'Bilal Ahmed', ur: 'بلال احمد' },
  { en: 'Fahad Mahmood', ur: 'فہد محمود' },
  { en: 'Haris Rauf', ur: 'حارث رؤف' },
  { en: 'Shaheen Afridi', ur: 'شاہین آفریدی' },
  { en: 'Hassan Ali', ur: 'حسن علی' },
  { en: 'Ammar Yasir', ur: 'عمار یاسر' },
  { en: 'Yahya Khan', ur: 'یحییٰ خان' },
  { en: 'Musa Raza', ur: 'موسیٰ رضا' },
  { en: 'Daniyal Asif', ur: 'دانیال آصف' },
  { en: 'Subhan Farooq', ur: 'سبحان فاروق' },
  { en: 'Arham Kashif', ur: 'ارحم کاشف' },
  { en: 'Ayan Imran', ur: 'ایان عمران' },
  { en: 'Zayan Kamran', ur: 'زیان کامران' },
  { en: 'Rehan Naseer', ur: 'ریحان نصیر' },
  { en: 'Salman Shafiq', ur: 'سلمان شفیق' },
  { en: 'Sufyan Mustafa', ur: 'سفیان مصطفیٰ' },
  { en: 'Talha Junaid', ur: 'طلحہ جنید' },
  { en: 'Awais Babar', ur: 'اویس بابر' },
  { en: 'Ayan Zulfiqar', ur: 'عیان ذوالفقار' },
  { en: 'Hadi Noman', ur: 'ہادی نعمان' },
];

const GIRL_FIRST_NAMES: { en: string; ur: string }[] = [
  { en: 'Fatima Tuz Zahra', ur: 'فاطمہ الزہرا' },
  { en: 'Ayesha Siddiqa', ur: 'عائشہ صدیقہ' },
  { en: 'Zainab Tariq', ur: 'زینب طارق' },
  { en: 'Maryam Nawaz', ur: 'مریم نواز' },
  { en: 'Hafsa Rehman', ur: 'حفصہ رحمٰن' },
  { en: 'Khadija Tul Kubra', ur: 'خدیجۃ الکبریٰ' },
  { en: 'Amina Bibi', ur: 'آمنہ بی بی' },
  { en: 'Noor Ul Huda', ur: 'نور الہدیٰ' },
  { en: 'Hoorain Fatima', ur: 'حورین فاطمہ' },
  { en: 'Inaya Ali', ur: 'عنایہ علی' },
  { en: 'Anaya Asif', ur: 'انایہ آصف' },
  { en: 'Minahil Farooq', ur: 'مناہل فاروق' },
  { en: 'Eman Kashif', ur: 'ایمان کاشف' },
  { en: 'Hareem Imran', ur: 'حریم عمران' },
  { en: 'Laiba Waqas', ur: 'لائبہ وقاص' },
  { en: 'Mahnoor Bilal', ur: 'ماہ نور بلال' },
  { en: 'Sana Kamran', ur: 'ثناء کامران' },
  { en: 'Iqra Naseer', ur: 'اقراء نصیر' },
  { en: 'Hira Shafiq', ur: 'حرا شفیق' },
  { en: 'Momina Mustafa', ur: 'مومنہ مصطفیٰ' },
  { en: 'Aleena Saad', ur: 'علینہ سعد' },
  { en: 'Areeba Junaid', ur: 'اریبہ جنید' },
  { en: 'Nimra Babar', ur: 'نمرہ بابر' },
  { en: 'Kinza Zulfiqar', ur: 'کنزہ ذوالفقار' },
  { en: 'Bushra Noman', ur: 'بشریٰ نعمان' },
  { en: 'Sadia Shahid', ur: 'سعدیہ شاہد' },
  { en: 'Rabia Amjad', ur: 'رابعہ امجد' },
  { en: 'Javeria Tahir', ur: 'جویریہ طاہر' },
  { en: 'Urwa Sajjad', ur: 'عروہ سجاد' },
  { en: 'Sumayya Salman', ur: 'سمیہ سلمان' },
];

// 4 sections intentionally left unmarked for TODAY when today is a working day
export const TODAY_UNMARKED_SECTION_IDS = new Set<string>([
  'sec_b_g9_a',
  'sec_b_g10_a',
  'sec_g_g9_a',
  'sec_g_g10_a',
]);

/**
 * Generates the working days for the last 30 calendar days ending yesterday
 * (skipping Sundays/weeklyOffDays and holidays), plus today if today is a working day.
 */
export function buildWorkingDaysWindow(
  referenceToday: string,
  holidays: SchoolHoliday[],
  weeklyOffDays: DayOfWeek[] = [DayOfWeek.SUNDAY]
): string[] {
  const workingDays: string[] = [];
  for (let delta = -30; delta <= -1; delta++) {
    const dateStr = addDaysIso(referenceToday, delta);
    if (!checkWeeklyOffOrHoliday(dateStr, holidays, weeklyOffDays).isOff) {
      workingDays.push(dateStr);
    }
  }
  if (!checkWeeklyOffOrHoliday(referenceToday, holidays, weeklyOffDays).isOff) {
    workingDays.push(referenceToday);
  }
  return workingDays;
}

export function computeNetTuition(
  baseTuition: number,
  concession: StudentConcession | undefined
): number {
  if (!concession) return baseTuition;
  switch (concession.type) {
    case ConcessionType.FIXED_OFF:
      return Math.max(0, baseTuition - concession.value);
    case ConcessionType.PERCENT_OFF:
      return Math.max(
        0,
        Math.round(baseTuition * (1 - concession.value / 100))
      );
    case ConcessionType.OVERRIDE:
      return Math.max(0, concession.value);
  }
}

export function buildInitialDemoDatabase(
  referenceToday: string = today()
): LocalDatabaseSnapshot {
  const currentMonthStr = referenceToday.slice(0, 7);
  const monthMinus2Str = shiftYearMonth(currentMonthStr, -2);
  const monthMinus1Str = shiftYearMonth(currentMonthStr, -1);
  const annualChargeMonthNum = Number(monthMinus2Str.split('-')[1] ?? '8');

  // 1. Campuses
  const campuses: CampusModel[] = [
    {
      id: 'campus_b',
      code: 'B',
      nameEn: 'Boys Campus',
      nameUr: 'بوائز کیمپس',
    },
    {
      id: 'campus_g',
      code: 'G',
      nameEn: 'Girls Campus',
      nameUr: 'گرلز کیمپس',
    },
  ];

  // 2. Academic Year 2026-27 (current)
  const academicYears: AcademicYear[] = [
    {
      id: 'ay_2026_27',
      name: '2026-27',
      startDate: '2026-04-01',
      endDate: '2027-03-31',
      isCurrent: true,
    },
  ];

  // 3. Subjects
  const subjects: Subject[] = [
    { id: 'sub_eng', nameEn: 'English', nameUr: 'انگریزی' },
    { id: 'sub_urd', nameEn: 'Urdu', nameUr: 'اردو' },
    { id: 'sub_mth', nameEn: 'Mathematics', nameUr: 'ریاضی' },
    { id: 'sub_isl', nameEn: 'Islamiyat', nameUr: 'اسلامیات' },
    { id: 'sub_sci', nameEn: 'Science', nameUr: 'سائنس' },
    { id: 'sub_sst', nameEn: 'Social Studies', nameUr: 'معاشرتی علوم' },
    { id: 'sub_cmp', nameEn: 'Computer', nameUr: 'کمپیوٹر' },
    { id: 'sub_pst', nameEn: 'Pakistan Studies', nameUr: 'مطالعہ پاکستان' },
    { id: 'sub_qur', nameEn: 'Quran / Nazra', nameUr: 'قرآن / ناظرہ' },
  ];

  // 4. Fee Heads (with priorities: Arrears = 1 first!)
  const feeHeads: FeeHead[] = [
    {
      id: 'fh_arrears',
      code: 'ARR',
      nameEn: 'Previous Arrears',
      nameUr: 'سابقہ بقایاجات',
      category: FeeCategory.ARREARS,
      priority: 1,
    },
    {
      id: 'fh_admission',
      code: 'ADM',
      nameEn: 'Admission Fee',
      nameUr: 'داخلہ فیس',
      category: FeeCategory.ADMISSION,
      priority: 2,
    },
    {
      id: 'fh_annual',
      code: 'ANN',
      nameEn: 'Annual Charges',
      nameUr: 'سالانہ واجبات',
      category: FeeCategory.ANNUAL,
      priority: 3,
    },
    {
      id: 'fh_tuition',
      code: 'TUI',
      nameEn: 'Monthly Tuition Fee',
      nameUr: 'ماہانہ ٹیوشن فیس',
      category: FeeCategory.MONTHLY,
      priority: 4,
    },
    {
      id: 'fh_exam',
      code: 'EXM',
      nameEn: 'Exam Fee',
      nameUr: 'امتحانی فیس',
      category: FeeCategory.EXAM,
      priority: 5,
    },
    {
      id: 'fh_late',
      code: 'LAT',
      nameEn: 'Late Fee',
      nameUr: 'لیٹ فیس',
      category: FeeCategory.LATE,
      priority: 6,
    },
    {
      id: 'fh_other',
      code: 'OTH',
      nameEn: 'Other',
      nameUr: 'دیگر',
      category: FeeCategory.OTHER,
      priority: 7,
    },
  ];

  // 5. Classes, Sections, ClassSubjects & ClassFeeStructures
  const classes: SchoolClass[] = [];
  const sections: Section[] = [];
  const classSubjects: ClassSubject[] = [];
  const classFeeStructures: ClassFeeStructure[] = [];

  const boysTeachers = ['usr_t0001', 'usr_t0002', 'usr_t0003', 'usr_t0004'];
  const girlsTeachers = ['usr_t0005', 'usr_t0006', 'usr_t0007', 'usr_t0008'];

  let bSecCounter = 0;
  let gSecCounter = 0;

  for (const campus of campuses) {
    const prefix = campus.code.toLowerCase();
    for (const tmpl of CLASS_TEMPLATES) {
      const classId = `cls_${prefix}_${tmpl.code}`;
      classes.push({
        id: classId,
        campusId: campus.id,
        nameEn: tmpl.nameEn,
        nameUr: tmpl.nameUr,
        sortOrder: tmpl.sortOrder,
      });

      // Class Fee Structure: Tuition (every month), Annual Charges (August = 8), Admission Fee (once)
      classFeeStructures.push(
        {
          classId,
          feeHeadId: 'fh_tuition',
          amount: tmpl.tuitionRupees,
          chargeMonth: null,
        },
        {
          classId,
          feeHeadId: 'fh_annual',
          amount: tmpl.annualRupees,
          chargeMonth: annualChargeMonthNum,
        },
        {
          classId,
          feeHeadId: 'fh_admission',
          amount: tmpl.admissionRupees,
          chargeMonth: null,
        }
      );

      const subjectIdsForClass: string[] = [
        'sub_eng',
        'sub_urd',
        'sub_mth',
        'sub_isl',
      ];
      if (tmpl.sortOrder <= 7) subjectIdsForClass.push('sub_qur');
      if (tmpl.sortOrder >= 3) subjectIdsForClass.push('sub_sci');
      if (tmpl.sortOrder >= 3 && tmpl.sortOrder <= 10)
        subjectIdsForClass.push('sub_sst');
      if (tmpl.sortOrder >= 6) subjectIdsForClass.push('sub_cmp');
      if (tmpl.sortOrder >= 11) subjectIdsForClass.push('sub_pst');

      for (const subId of subjectIdsForClass) {
        classSubjects.push({ classId, subjectId: subId });
      }

      const teacherPool = campus.code === 'B' ? boysTeachers : girlsTeachers;
      const teacherA =
        campus.code === 'B'
          ? teacherPool[bSecCounter++ % teacherPool.length]
          : teacherPool[gSecCounter++ % teacherPool.length];

      sections.push({
        id: `sec_${prefix}_${tmpl.code}_a`,
        classId,
        name: 'A',
        classTeacherId: teacherA,
      });

      if (tmpl.hasSectionB) {
        const teacherB =
          campus.code === 'B'
            ? teacherPool[bSecCounter++ % teacherPool.length]
            : teacherPool[gSecCounter++ % teacherPool.length];
        sections.push({
          id: `sec_${prefix}_${tmpl.code}_b`,
          classId,
          name: 'B',
          classTeacherId: teacherB,
        });
      }
    }
  }

  // 6. Profiles
  const profiles: Profile[] = [
    {
      id: 'usr_ad01',
      loginId: 'AD01',
      role: Role.ADMIN,
      fullName: 'Muhammad Usman (System Admin)',
      fullNameUr: 'محمد عثمان (سسٹم ایڈمن)',
      phone: '0300-4411001',
      campusId: null,
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_pr01',
      loginId: 'PR01',
      role: Role.PRINCIPAL,
      fullName: 'Prof. Abdul Qadeer Khan',
      fullNameUr: 'پروفیسر عبدالقدیر خان',
      phone: '0300-4411002',
      campusId: null,
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_vp01',
      loginId: 'VP01',
      role: Role.VICE_PRINCIPAL,
      fullName: 'Sir Hafiz Imran Saeed',
      fullNameUr: 'جناب حافظ عمران سعید',
      phone: '0300-4411004',
      campusId: null,
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_ac01',
      loginId: 'AC01',
      role: Role.ACCOUNTANT,
      fullName: 'Syed Mohsin Raza',
      fullNameUr: 'سید محسن رضا',
      phone: '0300-4411003',
      campusId: null,
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0001',
      loginId: 'T0001',
      role: Role.TEACHER,
      fullName: 'Ustad Muhammad Salman',
      fullNameUr: 'استاد محمد سلمان',
      phone: '0301-7701001',
      campusId: 'campus_b',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0002',
      loginId: 'T0002',
      role: Role.TEACHER,
      fullName: 'Hafiz Zubair Ahmed',
      fullNameUr: 'حافظ زبیر احمد',
      phone: '0301-7701002',
      campusId: 'campus_b',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0003',
      loginId: 'T0003',
      role: Role.TEACHER,
      fullName: 'Rana Tanveer Hussain',
      fullNameUr: 'رانا تنویر حسین',
      phone: '0301-7701003',
      campusId: 'campus_b',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0004',
      loginId: 'T0004',
      role: Role.TEACHER,
      fullName: 'Malik Waqar Younis',
      fullNameUr: 'ملک وقار یونس',
      phone: '0301-7701004',
      campusId: 'campus_b',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0005',
      loginId: 'T0005',
      role: Role.TEACHER,
      fullName: 'Ms. Sadia Bashir',
      fullNameUr: 'محترمہ سعدیہ بشیر',
      phone: '0301-7701005',
      campusId: 'campus_g',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0006',
      loginId: 'T0006',
      role: Role.TEACHER,
      fullName: 'Ms. Farah Naz',
      fullNameUr: 'محترمہ فرح ناز',
      phone: '0301-7701006',
      campusId: 'campus_g',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0007',
      loginId: 'T0007',
      role: Role.TEACHER,
      fullName: 'Ms. Rabia Kouser',
      fullNameUr: 'محترمہ رابعہ کوثر',
      phone: '0301-7701007',
      campusId: 'campus_g',
      language: 'en',
      isActive: true,
    },
    {
      id: 'usr_t0008',
      loginId: 'T0008',
      role: Role.TEACHER,
      fullName: 'Ms. Asma Jahangir',
      fullNameUr: 'محترمہ عاصمہ جہانگیر',
      phone: '0301-7701008',
      campusId: 'campus_g',
      language: 'en',
      isActive: true,
    },
  ];

  for (let i = 0; i < 30; i++) {
    const numStr = String(i + 1).padStart(5, '0');
    const loginId = `P${numStr}`;
    const parentName = PARENT_NAMES[i];
    const campusId = i === 0 ? null : i < 15 ? 'campus_b' : 'campus_g';

    profiles.push({
      id: `usr_${loginId.toLowerCase()}`,
      loginId,
      role: Role.PARENT,
      fullName: parentName.en,
      fullNameUr: parentName.ur,
      phone: `0300-865${String(1000 + i + 1)}`,
      campusId,
      language: 'en',
      isActive: true,
    });
  }

  const passwordsByUserId: Record<string, string> = {};
  for (const p of profiles) {
    passwordsByUserId[p.id] = 'demo1234';
  }

  // 7. TeacherAssignments
  const teacherAssignments: TeacherAssignment[] = [];
  let taCounter = 1;
  for (const sec of sections) {
    if (sec.classTeacherId) {
      teacherAssignments.push({
        id: `ta_${taCounter++}`,
        teacherId: sec.classTeacherId,
        sectionId: sec.id,
        subjectId: null,
        canMarkAttendance: true,
        canEnterMarks: true,
      });
    }
  }

  const subjectAssignmentsSpec = [
    {
      teacherId: 'usr_t0001',
      sectionIds: ['sec_b_g1_a', 'sec_b_g1_b', 'sec_b_g5_a', 'sec_b_g5_b'],
      subjectIds: ['sub_eng', 'sub_urd'],
    },
    {
      teacherId: 'usr_t0002',
      sectionIds: ['sec_b_g1_a', 'sec_b_g1_b', 'sec_b_g5_a', 'sec_b_g5_b'],
      subjectIds: ['sub_isl', 'sub_qur'],
    },
    {
      teacherId: 'usr_t0003',
      sectionIds: ['sec_b_g5_a', 'sec_b_g8_a', 'sec_b_g9_a', 'sec_b_g10_a'],
      subjectIds: ['sub_mth', 'sub_sci'],
    },
    {
      teacherId: 'usr_t0004',
      sectionIds: ['sec_b_g8_a', 'sec_b_g9_a', 'sec_b_g10_a'],
      subjectIds: ['sub_cmp', 'sub_pst'],
    },
    {
      teacherId: 'usr_t0005',
      sectionIds: ['sec_g_g1_a', 'sec_g_g1_b', 'sec_g_g5_a', 'sec_g_g5_b'],
      subjectIds: ['sub_eng', 'sub_urd'],
    },
    {
      teacherId: 'usr_t0006',
      sectionIds: ['sec_g_g1_a', 'sec_g_g1_b', 'sec_g_g5_a', 'sec_g_g5_b'],
      subjectIds: ['sub_isl', 'sub_qur'],
    },
    {
      teacherId: 'usr_t0007',
      sectionIds: ['sec_g_g5_a', 'sec_g_g8_a', 'sec_g_g9_a', 'sec_g_g10_a'],
      subjectIds: ['sub_mth', 'sub_sci'],
    },
    {
      teacherId: 'usr_t0008',
      sectionIds: ['sec_g_g8_a', 'sec_g_g9_a', 'sec_g_g10_a'],
      subjectIds: ['sub_cmp', 'sub_pst'],
    },
  ];

  for (const spec of subjectAssignmentsSpec) {
    for (const sectionId of spec.sectionIds) {
      for (const subjectId of spec.subjectIds) {
        teacherAssignments.push({
          id: `ta_${taCounter++}`,
          teacherId: spec.teacherId,
          sectionId,
          subjectId,
          canMarkAttendance: false,
          canEnterMarks: true,
        });
      }
    }
  }

  // 8. 60 Students (30 Boys in Boys Campus, 30 Girls in Girls Campus)
  // Spread across all 28 sections so every section has active students!
  const students: Student[] = [];
  const parentStudents: ParentStudent[] = [];
  const boysSectionIds = sections
    .filter((s) => s.id.startsWith('sec_b_'))
    .map((s) => s.id);
  const girlsSectionIds = sections
    .filter((s) => s.id.startsWith('sec_g_'))
    .map((s) => s.id);

  const rollCounterBySection: Record<string, number> = {};

  for (let i = 0; i < 30; i++) {
    const stuIndex = i + 1;
    const id = `stu_${String(stuIndex).padStart(3, '0')}`;
    const admissionNo = `AFS-B-${2021 + (i % 5)}-${String(stuIndex).padStart(3, '0')}`;
    // stu_001 -> sec_b_g5_a, stu_002 & stu_003 -> sec_b_g1_a, others spread across all 14 Boys sections
    const sectionId =
      i === 0
        ? 'sec_b_g5_a'
        : i === 1 || i === 2
        ? 'sec_b_g1_a'
        : boysSectionIds[i % boysSectionIds.length];
    const rollNo = (rollCounterBySection[sectionId] ?? 0) + 1;
    rollCounterBySection[sectionId] = rollNo;

    const parentIdx = i === 0 ? 0 : i === 1 || i === 2 ? 1 : (i % 28) + 2;
    const parentProfile = profiles.find(
      (p) => p.loginId === `P${String(parentIdx + 1).padStart(5, '0')}`
    )!;

    const boyName = BOY_FIRST_NAMES[i % BOY_FIRST_NAMES.length];
    const status = stuIndex === 30 ? StudentStatus.LEFT : StudentStatus.ACTIVE;

    students.push({
      id,
      admissionNo,
      name: boyName.en.trim(),
      nameUr: boyName.ur.trim(),
      fatherName: parentProfile.fullName,
      gender: Gender.MALE,
      dateOfBirth: `${2012 + (i % 8)}-0${(i % 9) + 1}-15`,
      campusId: 'campus_b',
      sectionId,
      rollNo,
      admissionDate: `2024-04-${String((i % 20) + 1).padStart(2, '0')}`,
      status,
      guardianPhone: parentProfile.phone,
    });

    parentStudents.push({
      parentId: parentProfile.id,
      studentId: id,
      relation: ParentRelation.FATHER,
    });
  }

  for (let i = 0; i < 30; i++) {
    const stuIndex = 31 + i;
    const id = `stu_${String(stuIndex).padStart(3, '0')}`;
    const admissionNo = `AFS-G-${2021 + (i % 5)}-${String(stuIndex).padStart(3, '0')}`;
    // stu_031 -> sec_g_nur_a (P00001's 2nd child in Girls Campus), others spread across all 14 Girls sections
    const sectionId =
      i === 0 ? 'sec_g_nur_a' : girlsSectionIds[i % girlsSectionIds.length];
    const rollNo = (rollCounterBySection[sectionId] ?? 0) + 1;
    rollCounterBySection[sectionId] = rollNo;

    const parentIdx = i === 0 ? 0 : ((i + 14) % 29) + 1;
    const parentProfile = profiles.find(
      (p) => p.loginId === `P${String(parentIdx + 1).padStart(5, '0')}`
    )!;

    const girlName = GIRL_FIRST_NAMES[i % GIRL_FIRST_NAMES.length];
    const status = stuIndex === 60 ? StudentStatus.LEFT : StudentStatus.ACTIVE;

    students.push({
      id,
      admissionNo,
      name: girlName.en.trim(),
      nameUr: girlName.ur.trim(),
      fatherName: parentProfile.fullName,
      gender: Gender.FEMALE,
      dateOfBirth: `${2012 + (i % 8)}-0${(i % 9) + 1}-20`,
      campusId: 'campus_g',
      sectionId,
      rollNo,
      admissionDate: `2024-04-${String((i % 20) + 1).padStart(2, '0')}`,
      status,
      guardianPhone: parentProfile.phone,
    });

    parentStudents.push({
      parentId: parentProfile.id,
      studentId: id,
      relation: ParentRelation.FATHER,
    });
  }

  // 9. School Settings & Holidays (needed to filter working days)
  const schoolSettings: SchoolSettings = {
    nameEn: 'Al Furqan School Okara',
    nameUr: 'الفرقان اسکول اوکاڑہ',
    officePhones: ['044-2701122', '0300-8441122'],
    address: 'M.A. Jinnah Road, Okara, Punjab',
    attendanceLockTime: '23:59',
    weeklyOffDays: [DayOfWeek.SUNDAY],
  };

  const refYear = Number(referenceToday.slice(0, 4));
  const holidays: SchoolHoliday[] = [
    {
      id: 'hol_pak_day',
      titleEn: 'Pakistan Day',
      titleUr: 'یومِ پاکستان',
      date: `${refYear}-03-23`,
      campusId: null,
    },
    {
      id: 'hol_ind_day',
      titleEn: 'Independence Day',
      titleUr: 'یومِ آزادی',
      date: `${refYear}-08-14`,
      campusId: null,
    },
    {
      id: 'hol_iqbal_day',
      titleEn: 'Iqbal Day',
      titleUr: 'یومِ اقبال',
      date: `${refYear}-11-09`,
      campusId: null,
    },
  ];

  // 10. Attendance Data: last 30 days ending yesterday (skipping Sundays & holidays),
  // plus today if today is a working day, with 4 sections left without a submission today.
  const workingDaysWindow = buildWorkingDaysWindow(
    referenceToday,
    holidays,
    schoolSettings.weeklyOffDays
  );

  const attendanceRecords: AttendanceRecord[] = [];
  const attendanceSubmissions: AttendanceSubmission[] = [];

  const activeStudents = students.filter(
    (s) => s.status === StudentStatus.ACTIVE
  );
  const studentsBySection: Record<string, Student[]> = {};
  for (const stu of activeStudents) {
    if (!studentsBySection[stu.sectionId]) {
      studentsBySection[stu.sectionId] = [];
    }
    studentsBySection[stu.sectionId].push(stu);
  }

  const frequentAbsenteeIds = new Set([
    'stu_008',
    'stu_018',
    'stu_038',
    'stu_048',
  ]);

  const totalWorkingDays = workingDaysWindow.length;
  // Pick deterministic working-day indices for stu_001 and stu_031 across the window
  const stu1AbsentIdx = Math.max(0, Math.min(4, totalWorkingDays - 6));
  const stu1LateIdx = Math.max(1, totalWorkingDays - 5);
  const stu1LeaveIdx = Math.max(2, totalWorkingDays - 3);

  const stu31LeaveIdx = Math.max(0, Math.min(5, totalWorkingDays - 6));
  const stu31AbsentIdx = Math.max(1, totalWorkingDays - 4);
  const stu31LateIdx = Math.max(2, totalWorkingDays - 2);

  for (let dIdx = 0; dIdx < totalWorkingDays; dIdx++) {
    const dateStr = workingDaysWindow[dIdx];
    const isToday = dateStr === referenceToday;

    for (const sec of sections) {
      if (isToday && TODAY_UNMARKED_SECTION_IDS.has(sec.id)) {
        // Leave these 4 sections without a submission today!
        continue;
      }

      const markedBy = sec.classTeacherId ?? 'usr_ad01';
      attendanceSubmissions.push({
        sectionId: sec.id,
        date: dateStr,
        submittedBy: markedBy,
        submittedAt: `${dateStr}T08:35:00+05:00`,
      });

      const secStudents = studentsBySection[sec.id] ?? [];
      for (let sIdx = 0; sIdx < secStudents.length; sIdx++) {
        const stu = secStudents[sIdx];
        let status: AttendanceStatus = AttendanceStatus.PRESENT;
        let remarks: string | null = null;

        if (stu.id === 'stu_001') {
          if (dIdx === stu1AbsentIdx) {
            status = AttendanceStatus.ABSENT;
            remarks = 'Fever / medical rest';
          } else if (dIdx === stu1LateIdx) {
            status = AttendanceStatus.LATE;
            remarks = 'School van delayed';
          } else if (dIdx === stu1LeaveIdx) {
            status = AttendanceStatus.LEAVE;
            remarks = 'Approved family leave';
          }
        } else if (stu.id === 'stu_031') {
          if (dIdx === stu31LeaveIdx) {
            status = AttendanceStatus.LEAVE;
            remarks = 'Urgent family work';
          } else if (dIdx === stu31AbsentIdx) {
            status = AttendanceStatus.ABSENT;
            remarks = 'Dental checkup';
          } else if (dIdx === stu31LateIdx) {
            status = AttendanceStatus.LATE;
            remarks = 'Traffic on MA Jinnah Road';
          }
        } else if (frequentAbsenteeIds.has(stu.id)) {
          const dayNum = Number(dateStr.slice(-2));
          if (dayNum % 3 === 0) {
            status = AttendanceStatus.ABSENT;
            remarks = 'Repeated absence - guardian notified';
          } else if (dayNum % 7 === 0) {
            status = AttendanceStatus.LATE;
          }
        } else {
          // General deterministic pattern for other students
          const stuNum = Number(stu.id.replace('stu_', ''));
          const dayNum = Number(dateStr.slice(-2));
          const hash = (stuNum * 7 + dayNum * 13) % 29;
          if (hash === 0) {
            status = AttendanceStatus.ABSENT;
            remarks = 'Sick leave / informed by parent';
          } else if (hash === 1) {
            status = AttendanceStatus.LEAVE;
            remarks = 'Leave application approved';
          } else if (hash === 2) {
            status = AttendanceStatus.LATE;
          }
        }

        attendanceRecords.push({
          studentId: stu.id,
          sectionId: sec.id,
          date: dateStr,
          status,
          remarks,
          markedBy,
        });
      }
    }
  }

  // 11. Student Concessions
  // Two sibling discounts (PERCENT_OFF), one FIXED_OFF, one OVERRIDE
  const studentConcessions: StudentConcession[] = [
    {
      studentId: 'stu_031', // P00001's 2nd child (Fatima Tuz Zahra, Girls Nursery-A, base tuition 1500 -> 1350)
      feeHeadId: 'fh_tuition',
      type: ConcessionType.PERCENT_OFF,
      value: 10,
      reason: 'Sibling discount (10% off - P00001 family)',
    },
    {
      studentId: 'stu_003', // P00002's 2nd child (Abdullah Zahid, Boys Grade 1-A, base tuition 2000 -> 1700)
      feeHeadId: 'fh_tuition',
      type: ConcessionType.PERCENT_OFF,
      value: 15,
      reason: 'Sibling discount (15% off - P00002 family)',
    },
    {
      studentId: 'stu_004', // Fixed discount Rs 500 off
      feeHeadId: 'fh_tuition',
      type: ConcessionType.FIXED_OFF,
      value: 500,
      reason: 'Merit & deserving fixed concession',
    },
    {
      studentId: 'stu_005', // Override tuition to Rs 1,200
      feeHeadId: 'fh_tuition',
      type: ConcessionType.OVERRIDE,
      value: 1200,
      reason: 'Orphan support override amount',
    },
  ];

  // 12. Vouchers for current month (currentMonthStr) and the two months before it (monthMinus2Str, monthMinus1Str)
  // for all 58 ACTIVE students
  const feeVouchers: FeeVoucher[] = [];
  const feePayments: FeePayment[] = [];
  const paymentAllocations: PaymentAllocation[] = [];

  const sectionById: Record<string, Section> = {};
  sections.forEach((s) => {
    sectionById[s.id] = s;
  });

  const tuitionByClassId: Record<string, number> = {};
  const annualByClassId: Record<string, number> = {};
  const admissionByClassId: Record<string, number> = {};
  classFeeStructures.forEach((cfs) => {
    if (cfs.feeHeadId === 'fh_tuition') tuitionByClassId[cfs.classId] = cfs.amount;
    if (cfs.feeHeadId === 'fh_annual') annualByClassId[cfs.classId] = cfs.amount;
    if (cfs.feeHeadId === 'fh_admission') admissionByClassId[cfs.classId] = cfs.amount;
  });

  let bVoucherSeq = 1;
  let gVoucherSeq = 1;
  let bReceiptSeq = 1;
  let gReceiptSeq = 1;
  let allocSeq = 1;

  // Students who have a "Previous Arrears" item on their oldest (monthMinus2) voucher
  const studentsWithPreAugArrears = new Set([
    'stu_008',
    'stu_009',
    'stu_038',
    'stu_039',
  ]);

  // 8 Defaulter students who have unpaid/partial past months
  // stu_008, stu_009, stu_010, stu_011 (Boys) and stu_031, stu_038, stu_039, stu_040 (Girls)
  const fullDefaulterIds = new Set([
    'stu_008',
    'stu_009',
    'stu_010',
    'stu_011',
    'stu_038',
    'stu_039',
    'stu_040',
  ]);

  // Students who already paid the current month voucher in full (10 students)
  const currentMonthPaidStudentIds = new Set([
    'stu_002',
    'stu_003',
    'stu_004',
    'stu_005',
    'stu_006',
    'stu_032',
    'stu_033',
    'stu_034',
    'stu_035',
    'stu_036',
  ]);

  const billingMonths: {
    month: string;
    issueDate: string;
    dueDate: string;
  }[] = [
    {
      month: monthMinus2Str,
      issueDate: `${monthMinus2Str}-01`,
      dueDate: `${monthMinus2Str}-10`,
    },
    {
      month: monthMinus1Str,
      issueDate: `${monthMinus1Str}-01`,
      dueDate: `${monthMinus1Str}-10`,
    },
    {
      month: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-10`,
    },
  ];

  const paymentMethods = [
    PaymentMethod.CASH,
    PaymentMethod.BANK,
    PaymentMethod.JAZZCASH,
    PaymentMethod.EASYPAISA,
  ];

  const refDayOfMonth = Math.max(1, Number(referenceToday.slice(8, 10)) || 10);

  for (const bm of billingMonths) {
    for (let sIdx = 0; sIdx < activeStudents.length; sIdx++) {
      const stu = activeStudents[sIdx];
      const sec = sectionById[stu.sectionId];
      const classId = sec.classId;
      const baseTuition = tuitionByClassId[classId] ?? 2000;
      const concession = studentConcessions.find(
        (c) => c.studentId === stu.id && c.feeHeadId === 'fh_tuition'
      );
      const netTuition = computeNetTuition(baseTuition, concession);

      const isBoys = stu.campusId === 'campus_b';
      const voucherNo = isBoys
        ? `B-${String(bVoucherSeq++).padStart(4, '0')}`
        : `G-${String(gVoucherSeq++).padStart(4, '0')}`;
      const voucherId = `vch_${voucherNo.toLowerCase()}`;

      const items: FeeVoucherItem[] = [];

      if (bm.month === monthMinus2Str) {
        if (studentsWithPreAugArrears.has(stu.id)) {
          items.push({
            feeHeadId: 'fh_arrears',
            description: `Previous Arrears (Pre-${monthMinus2Str})`,
            amount: 2000,
            waivedAmount: 0,
            paidAmount: 0,
          });
        }
        // Include Admission Fee on monthMinus2 voucher for admissions (including stu_001 & stu_031)
        const admAmount = admissionByClassId[classId] ?? 2000;
        items.push({
          feeHeadId: 'fh_admission',
          description: 'Admission Fee',
          amount: admAmount,
          waivedAmount: 0,
          paidAmount: 0,
        });
        // Include Annual Charges on monthMinus2 voucher
        const annAmount = annualByClassId[classId] ?? 3500;
        items.push({
          feeHeadId: 'fh_annual',
          description: 'Annual Charges (2026-27)',
          amount: annAmount,
          waivedAmount: 0,
          paidAmount: 0,
        });
      }

      items.push({
        feeHeadId: 'fh_tuition',
        description: `Monthly Tuition Fee (${bm.month})`,
        amount: netTuition,
        waivedAmount: 0,
        paidAmount: 0,
      });

      const totalVoucherNet = items.reduce(
        (sum, it) => sum + (it.amount - it.waivedAmount),
        0
      );

      // Determine payment behavior for this student & month
      let amountToPay = 0;
      if (bm.month === monthMinus2Str) {
        if (fullDefaulterIds.has(stu.id)) {
          amountToPay = 0;
        } else {
          amountToPay = totalVoucherNet;
        }
      } else if (bm.month === monthMinus1Str) {
        if (fullDefaulterIds.has(stu.id)) {
          amountToPay = 0;
        } else if (stu.id === 'stu_031') {
          // P00001's 2nd child (Fatima Tuz Zahra) paid Rs 850 out of Rs 1,350 in previous month -> Rs 500 Previous Arrears!
          amountToPay = 850;
        } else {
          amountToPay = totalVoucherNet;
        }
      } else if (bm.month === currentMonthStr) {
        if (currentMonthPaidStudentIds.has(stu.id)) {
          amountToPay = totalVoucherNet;
        } else {
          amountToPay = 0;
        }
      }

      let status: VoucherStatus = VoucherStatus.UNPAID;
      if (amountToPay >= totalVoucherNet) {
        status = VoucherStatus.PAID;
      } else if (amountToPay > 0) {
        status = VoucherStatus.PARTIAL;
      }

      // Allocate payment across items by priority
      if (amountToPay > 0) {
        const receiptNo = isBoys
          ? `B-R-${String(bReceiptSeq++).padStart(4, '0')}`
          : `G-R-${String(gReceiptSeq++).padStart(4, '0')}`;
        const paymentId = `pay_${receiptNo.toLowerCase()}`;
        const rawPaidDay = (sIdx % 8) + 2;
        const paidDayNum =
          bm.month === currentMonthStr
            ? Math.min(rawPaidDay, refDayOfMonth)
            : rawPaidDay;
        const paidOn = `${bm.month}-${String(paidDayNum).padStart(2, '0')}`;
        const method = paymentMethods[sIdx % paymentMethods.length];

        feePayments.push({
          id: paymentId,
          receiptNo,
          studentId: stu.id,
          amount: amountToPay,
          paidOn,
          method,
          receivedBy: 'usr_ac01',
          isVoid: false,
        });

        let rem = amountToPay;
        for (const item of items) {
          if (rem <= 0) break;
          const itemDue = item.amount - item.waivedAmount;
          const alloc = Math.min(rem, itemDue);
          item.paidAmount = alloc;
          rem -= alloc;

          paymentAllocations.push({
            id: `alloc_${allocSeq++}`,
            paymentId,
            voucherId,
            feeHeadId: item.feeHeadId,
            allocatedAmount: alloc,
          });
        }
      }

      feeVouchers.push({
        id: voucherId,
        voucherNo,
        studentId: stu.id,
        campusId: stu.campusId,
        billingMonth: bm.month,
        issueDate: bm.issueDate,
        dueDate: bm.dueDate,
        items,
        status,
      });
    }
  }

  // Add 1 voided payment as required ("Include one voided payment")
  const voidReceiptNo = `B-R-${String(bReceiptSeq++).padStart(4, '0')}`;
  feePayments.push({
    id: 'pay_void_001',
    receiptNo: voidReceiptNo,
    studentId: 'stu_008',
    amount: 2400,
    paidOn: `${monthMinus1Str}-12`,
    method: PaymentMethod.CASH,
    receivedBy: 'usr_ac01',
    isVoid: true,
    voidReason: 'Duplicate cash receipt entry voided by Admin',
  });

  // 13. Grading Scale & Audit Logs
  const gradingScale: GradingScaleEntry[] = [
    { minPercent: 80, grade: 'A+', remarksEn: 'Outstanding', remarksUr: 'شاندار' },
    { minPercent: 70, grade: 'A', remarksEn: 'Excellent', remarksUr: 'بہترین' },
    { minPercent: 60, grade: 'B', remarksEn: 'Very Good', remarksUr: 'بہت اچھا' },
    { minPercent: 50, grade: 'C', remarksEn: 'Good', remarksUr: 'اچھا' },
    { minPercent: 40, grade: 'D', remarksEn: 'Satisfactory', remarksUr: 'تسلی بخش' },
    { minPercent: 33, grade: 'E', remarksEn: 'Pass', remarksUr: 'پاس' },
    { minPercent: 0, grade: 'F', remarksEn: 'Needs Improvement', remarksUr: 'مزید محنت درکار' },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'aud_seed_void_1',
      action: 'VOID_PAYMENT',
      tableName: 'fee_payments',
      recordId: 'pay_void_001',
      oldValue: 'isVoid=false (Rs 2,400)',
      newValue: 'isVoid=true',
      reason: 'Duplicate cash receipt entry voided by Admin',
      changedBy: 'usr_ad01',
      changedAt: `${monthMinus1Str}-12T11:20:00+05:00`,
    },
  ];

  return {
    seededVersion: 4,
    campuses,
    academicYears,
    classes,
    sections,
    subjects,
    classSubjects,
    profiles,
    passwordsByUserId,
    teacherAssignments,
    students,
    parentStudents,
    gradingScale,
    schoolSettings,
    holidays,
    attendanceRecords,
    attendanceSubmissions,
    attendanceUnlocks: [],
    feeHeads,
    classFeeStructures,
    studentConcessions,
    feeVouchers,
    feePayments,
    paymentAllocations,
    auditLogs,
    exams: [],
    examSubjects: [],
    marks: [],
    markSubmissions: [],
    conversations: [],
    messages: [],
    notices: [],
    notifications: [],
  };
}
