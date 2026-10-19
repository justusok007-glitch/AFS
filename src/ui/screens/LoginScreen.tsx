import { CLOUD_ENABLED } from '../../data/supabase/mode';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Eraser,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  Terminal,
  UserCheck,
} from 'lucide-react';
import { AppModule } from '../../di/AppModule';
import {
  currentTimeHHMM,
  getDemoDateOverride,
  realToday,
  setDemoDateOverride,
  subscribeToClock,
  today,
} from '../../domain/clock';
import { formatSchoolDate } from '../../domain/formatters/SchoolFormatters';
import {
  Profile,
  Role,
  SchoolClass,
  Section,
  UserSession,
} from '../../domain/models/models';
import { StringKey } from '../../res/strings';
import {
  LanguageToggleSegment,
  PrimaryButton,
  SkinHeaderDecor,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
} from '../components/SchoolComposables';
import { SchoolLogo } from '../components/SchoolLogo';
import { useStringResource } from '../theme/LocaleContext';

export type HiddenDevDestination = 'dev_check';

export interface LoginScreenProps {
  onLoginSuccess: (session: UserSession) => void;
  onOpenDevDestination?: (destination: HiddenDevDestination) => void;
}

interface DemoAccountEntry {
  loginId: string;
  roleLabelEn: string;
  roleLabelUr: string;
  nameEn: string;
  nameUr: string;
  campusNoteEn: string;
  campusNoteUr: string;
}

const STAFF_DEMO_ACCOUNTS: DemoAccountEntry[] = [
  {
    loginId: 'AD01',
    roleLabelEn: 'Admin',
    roleLabelUr: 'ایڈمن',
    nameEn: 'Muhammad Usman',
    nameUr: 'محمد عثمان',
    campusNoteEn: 'All Campuses',
    campusNoteUr: 'تمام کیمپس',
  },
  {
    loginId: 'VP01',
    roleLabelEn: 'Vice Principal',
    roleLabelUr: 'وائس پرنسپل',
    nameEn: 'Sir Hafiz Imran Saeed',
    nameUr: 'جناب حافظ عمران سعید',
    campusNoteEn: 'All Campuses',
    campusNoteUr: 'تمام کیمپس',
  },
  {
    loginId: 'PR01',
    roleLabelEn: 'Principal',
    roleLabelUr: 'پرنسپل',
    nameEn: 'Prof. Abdul Qadeer Khan',
    nameUr: 'پروفیسر عبدالقدیر خان',
    campusNoteEn: 'All Campuses',
    campusNoteUr: 'تمام کیمپس',
  },
  {
    loginId: 'AC01',
    roleLabelEn: 'Accountant',
    roleLabelUr: 'اکاؤنٹنٹ',
    nameEn: 'Syed Mohsin Raza',
    nameUr: 'سید محسن رضا',
    campusNoteEn: 'All Campuses',
    campusNoteUr: 'تمام کیمپس',
  },
];

const TEACHER_DEMO_ACCOUNTS: DemoAccountEntry[] = [
  {
    loginId: 'T0001',
    roleLabelEn: 'Teacher (Boys)',
    roleLabelUr: 'استاد (بوائز)',
    nameEn: 'Ustad Muhammad Salman',
    nameUr: 'استاد محمد سلمان',
    campusNoteEn: 'Boys Campus · Class & Subject Teacher',
    campusNoteUr: 'بوائز کیمپس · کلاس اور مضمون استاد',
  },
  {
    loginId: 'T0002',
    roleLabelEn: 'Teacher (Boys)',
    roleLabelUr: 'استاد (بوائز)',
    nameEn: 'Hafiz Zubair Ahmed',
    nameUr: 'حافظ زبیر احمد',
    campusNoteEn: 'Boys Campus · Islamiyat & Quran',
    campusNoteUr: 'بوائز کیمپس · اسلامیات اور قرآن',
  },
  {
    loginId: 'T0003',
    roleLabelEn: 'Teacher (Boys)',
    roleLabelUr: 'استاد (بوائز)',
    nameEn: 'Rana Tanveer Hussain',
    nameUr: 'رانا تنویر حسین',
    campusNoteEn: 'Boys Campus · Maths & Science',
    campusNoteUr: 'بوائز کیمپس · ریاضی اور سائنس',
  },
  {
    loginId: 'T0004',
    roleLabelEn: 'Teacher (Boys)',
    roleLabelUr: 'استاد (بوائز)',
    nameEn: 'Malik Waqar Younis',
    nameUr: 'ملک وقار یونس',
    campusNoteEn: 'Boys Campus · Computer & Pak Studies',
    campusNoteUr: 'بوائز کیمپس · کمپیوٹر اور مطالعہ پاکستان',
  },
  {
    loginId: 'T0005',
    roleLabelEn: 'Teacher (Girls)',
    roleLabelUr: 'استانی (گرلز)',
    nameEn: 'Ms. Sadia Bashir',
    nameUr: 'محترمہ سعدیہ بشیر',
    campusNoteEn: 'Girls Campus · English & Urdu',
    campusNoteUr: 'گرلز کیمپس · انگریزی اور اردو',
  },
  {
    loginId: 'T0006',
    roleLabelEn: 'Teacher (Girls)',
    roleLabelUr: 'استانی (گرلز)',
    nameEn: 'Ms. Farah Naz',
    nameUr: 'محترمہ فرح ناز',
    campusNoteEn: 'Girls Campus · Islamiyat & Quran',
    campusNoteUr: 'گرلز کیمپس · اسلامیات اور قرآن',
  },
  {
    loginId: 'T0007',
    roleLabelEn: 'Teacher (Girls)',
    roleLabelUr: 'استانی (گرلز)',
    nameEn: 'Ms. Rabia Kouser',
    nameUr: 'محترمہ رابعہ کوثر',
    campusNoteEn: 'Girls Campus · Maths & Science',
    campusNoteUr: 'گرلز کیمپس · ریاضی اور سائنس',
  },
  {
    loginId: 'T0008',
    roleLabelEn: 'Teacher (Girls)',
    roleLabelUr: 'استانی (گرلز)',
    nameEn: 'Ms. Asma Jahangir',
    nameUr: 'محترمہ عاصمہ جہانگیر',
    campusNoteEn: 'Girls Campus · Computer & Pak Studies',
    campusNoteUr: 'گرلز کیمپس · کمپیوٹر اور مطالعہ پاکستان',
  },
];

const PARENT_DEMO_ACCOUNTS: DemoAccountEntry[] = [
  {
    loginId: 'P00001',
    roleLabelEn: 'Parent (2 Campuses)',
    roleLabelUr: 'والدین (دونوں کیمپس)',
    nameEn: 'Muhammad Tariq Mahmood',
    nameUr: 'محمد طارق محمود',
    campusNoteEn: '2 Children: 1 Boy (Boys) + 1 Girl (Girls)',
    campusNoteUr: '2 بچے: 1 بیٹا (بوائز) + 1 بیٹی (گرلز)',
  },
  {
    loginId: 'P00002',
    roleLabelEn: 'Parent (Same Campus)',
    roleLabelUr: 'والدین (ایک ہی کیمپس)',
    nameEn: 'Chaudhry Zahid Iqbal',
    nameUr: 'چوہدری زاہد اقبال',
    campusNoteEn: '2 Children in Boys Campus',
    campusNoteUr: 'بوائز کیمپس میں 2 بچے',
  },
  {
    loginId: 'P00003',
    roleLabelEn: 'Parent',
    roleLabelUr: 'والدین',
    nameEn: 'Hafiz Abdul Rehman',
    nameUr: 'حافظ عبدالرحمٰن',
    campusNoteEn: 'Boys Campus (P00003 – P00015)',
    campusNoteUr: 'بوائز کیمپس (P00003 تا P00015)',
  },
  {
    loginId: 'P00016',
    roleLabelEn: 'Parent',
    roleLabelUr: 'والدین',
    nameEn: 'Muhammad Junaid Akram',
    nameUr: 'محمد جنید اکرم',
    campusNoteEn: 'Girls Campus (P00016 – P00030)',
    campusNoteUr: 'گرلز کیمپس (P00016 تا P00030)',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenDevDestination,
}) => {
  const { stringResource, language } = useStringResource();
  const [loginId, setLoginId] = useState<string>(CLOUD_ENABLED ? '' : 'PR01');
  const [password, setPassword] = useState<string>(CLOUD_ENABLED ? '' : 'demo1234');
  const [errorKey, setErrorKey] = useState<StringKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [demoExpanded, setDemoExpanded] = useState<boolean>(false);

  // Hidden developer action: tap school logo 5 times to open Developer Menu
  const [, setLogoTapCount] = useState<number>(0);
  const [devMenuOpen, setDevMenuOpen] = useState<boolean>(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<boolean>(false);

  // Developer Menu: Pending sections by teacher + Clear today's attendance
  const [devPendingEntries, setDevPendingEntries] = useState<
    {
      teacher: Profile;
      section: Section;
      classSectionLabel: string;
      campusLabel: string;
    }[]
  >([]);
  const [devAllSections, setDevAllSections] = useState<
    { section: Section; label: string; isPending: boolean }[]
  >([]);
  const [devSelectedSectionToClear, setDevSelectedSectionToClear] =
    useState<string>('');
  const [devClearSuccessToast, setDevClearSuccessToast] =
    useState<boolean>(false);
  const [devClearing, setDevClearing] = useState<boolean>(false);

  const [devDemoOverride, setDevDemoOverrideState] = useState<string | null>(
    () => getDemoDateOverride()
  );

  useEffect(() => {
    return subscribeToClock(() => {
      setDevDemoOverrideState(getDemoDateOverride());
    });
  }, []);

  const loadDevMenuAttendanceData = useCallback(async () => {
    const todayDate = today();
    const [
      teachersRes,
      classesRes,
      sectionsRes,
      assignmentsRes,
      unmarkedRes,
    ] = await Promise.all([
      AppModule.settingsRepository.getProfiles(Role.TEACHER, null),
      AppModule.settingsRepository.getClasses(null),
      AppModule.settingsRepository.getSections(null),
      AppModule.settingsRepository.getTeacherAssignments(null),
      AppModule.attendanceRepository.sectionsNotMarked(todayDate, null),
    ]);

    const teachers = teachersRes.ok ? teachersRes.data : [];
    const classes = classesRes.ok ? classesRes.data : [];
    const sections = sectionsRes.ok ? sectionsRes.data : [];
    const assignments = assignmentsRes.ok ? assignmentsRes.data : [];
    const unmarked = unmarkedRes.ok ? unmarkedRes.data : [];
    const unmarkedIds = new Set(unmarked.map((s) => s.id));

    const classById: Record<string, SchoolClass> = {};
    classes.forEach((c) => {
      classById[c.id] = c;
    });

    const teacherById: Record<string, Profile> = {};
    teachers.forEach((t) => {
      teacherById[t.id] = t;
    });

    const formatSecLabel = (sec: Section) => {
      const cls = classById[sec.classId];
      const className = cls
        ? language === 'ur'
          ? cls.nameUr
          : cls.nameEn
        : sec.classId;
      const isGirls =
        cls?.campusId === 'campus_g' || sec.id.startsWith('sec_g_');
      const campusStr = isGirls
        ? stringResource('campus_girls')
        : stringResource('campus_boys');
      return {
        classSectionLabel: `${className}-${sec.name}`,
        campusLabel: campusStr,
        fullLabel: `${className}-${sec.name} · ${campusStr} (${sec.id})`,
      };
    };

    const pendingList: {
      teacher: Profile;
      section: Section;
      classSectionLabel: string;
      campusLabel: string;
    }[] = [];

    for (const sec of unmarked) {
      const attAssignment = assignments.find(
        (ta) => ta.sectionId === sec.id && ta.canMarkAttendance
      );
      const tId = attAssignment?.teacherId ?? sec.classTeacherId;
      const teacher = tId ? teacherById[tId] : undefined;
      if (teacher) {
        const lbl = formatSecLabel(sec);
        pendingList.push({
          teacher,
          section: sec,
          classSectionLabel: lbl.classSectionLabel,
          campusLabel: lbl.campusLabel,
        });
      }
    }

    pendingList.sort((a, b) =>
      a.teacher.loginId.localeCompare(b.teacher.loginId)
    );
    setDevPendingEntries(pendingList);

    const allSecOptions = sections.map((sec) => {
      const lbl = formatSecLabel(sec);
      return {
        section: sec,
        label: lbl.fullLabel,
        isPending: unmarkedIds.has(sec.id),
      };
    });
    setDevAllSections(allSecOptions);

    if (allSecOptions.length > 0 && !devSelectedSectionToClear) {
      const firstMarked =
        allSecOptions.find((o) => !o.isPending) ?? allSecOptions[0];
      setDevSelectedSectionToClear(firstMarked.section.id);
    }
  }, [language, stringResource, devSelectedSectionToClear]);

  useEffect(() => {
    if (devMenuOpen) {
      loadDevMenuAttendanceData();
    }
  }, [devMenuOpen, devDemoOverride, loadDevMenuAttendanceData]);

  const handleClearTodayAttendanceForSection = async () => {
    if (!devSelectedSectionToClear || devClearing) return;
    setDevClearing(true);
    try {
      await AppModule.attendanceRepository.clearAttendanceForSectionAndDate(
        devSelectedSectionToClear,
        today()
      );
      setDevClearSuccessToast(true);
      setTimeout(() => setDevClearSuccessToast(false), 3200);
      await loadDevMenuAttendanceData();
    } finally {
      setDevClearing(false);
    }
  };

  const handleDemoDateChange = (newDateValue: string) => {
    const trimmed = newDateValue.trim();
    if (!trimmed || trimmed === realToday()) {
      setDemoDateOverride(null);
    } else {
      setDemoDateOverride(trimmed);
    }
  };

  const handleLogoTap = () => {
    setLogoTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setDevMenuOpen(true);
        return 0;
      }
      return next;
    });
  };

  const handleConfirmResetDemoData = async () => {
    setDevMenuOpen(false);
    setIsLoading(true);
    try {
      await AppModule.settingsRepository.resetDemoData();
      setLoginId('PR01');
      setPassword('demo1234');
      setErrorKey(null);
      setResetSuccessToast(true);
      setTimeout(() => setResetSuccessToast(false), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemoAccount = (id: string) => {
    setLoginId(id);
    setPassword('demo1234');
    setErrorKey(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setErrorKey('login_error_empty');
      return;
    }

    setErrorKey(null);
    setIsLoading(true);
    try {
      const session = await AppModule.authRepository.loginWithId(
        loginId,
        password
      );
      onLoginSuccess(session);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'EMPTY_CREDENTIALS') {
        setErrorKey('login_error_empty');
      } else if (msg === 'ACCOUNT_INACTIVE') {
        setErrorKey('login_error_inactive');
      } else if (msg === 'NETWORK') {
        setErrorKey('login_error_network');
      } else {
        setErrorKey('login_error_invalid');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderDemoGroup = (
    heading: string,
    entries: DemoAccountEntry[]
  ) => (
    <div className="space-y-1.5">
      <div className="text-[11px] font-semibold text-[#6B7385] px-1">
        {heading}
      </div>
      <div className="space-y-1.5">
        {entries.map((entry) => {
          const isSelected =
            loginId.trim().toUpperCase() === entry.loginId.toUpperCase();
          return (
            <button
              key={entry.loginId}
              type="button"
              onClick={() => handleSelectDemoAccount(entry.loginId)}
              className={`w-full min-h-[48px] px-3 py-2 rounded-2xl border text-start transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-[#14284B]/8 border-[#14284B] text-[#14284B]'
                  : 'bg-[#F6F8FC] border-[#E4E8F0] text-[#1B2233] hover:border-[#14284B]/40'
              }`}
            >
              <div className="min-w-0">
                <div className="font-heading text-xs font-bold text-[#14284B] truncate">
                  {language === 'ur' ? entry.nameUr : entry.nameEn}{' '}
                  <span className="font-normal text-[#6B7385]">
                    · {language === 'ur' ? entry.roleLabelUr : entry.roleLabelEn}
                  </span>
                </div>
                <div className="text-[11px] text-[#6B7385] truncate">
                  {language === 'ur' ? entry.campusNoteUr : entry.campusNoteEn}
                </div>
              </div>
              <span
                dir="ltr"
                className="text-xs font-mono font-bold text-[#F28C28] shrink-0"
              >
                {entry.loginId}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-[#F6F8FC] pb-8 parent-skin ps-doodle">
      {/* Curved Navy Top Bar with School Logo (5-tap hidden developer trigger) */}
      <header className="bg-[#14284B] text-white rounded-b-[28px] px-5 pt-4 pb-5 shadow-md space-y-3 ps-header ps-principal ps-compact">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleLogoTap}
              aria-label={stringResource('app_name')}
              className="w-12 h-12 rounded-2xl bg-white border border-white/25 shadow-sm flex items-center justify-center p-1 active:scale-95 transition-transform shrink-0 cursor-pointer select-none overflow-hidden"
            >
              <SchoolLogo size={40} />
            </button>
            <div className="min-w-0 py-0.5">
              <h1
                className={`font-heading text-base font-bold text-white ${
                  language === 'ur'
                    ? 'font-urdu leading-[2.45] py-0.5'
                    : 'leading-snug'
                }`}
              >
                {stringResource('app_name')}
              </h1>
              <p
                className={`text-xs text-white/75 mt-0.5 ${
                  language === 'ur'
                    ? 'font-urdu leading-[2.35] py-0.5'
                    : 'leading-normal'
                }`}
              >
                {stringResource('school_subtitle')}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <LanguageToggleSegment variant="onNavy" />
          </div>
        </div>

        <div className="pt-1 flex items-center justify-between gap-2 text-xs text-white/85">
          <span>{stringResource('campuses_badge')}</span>
          <span dir="ltr" className="font-mono text-[11px] text-[#F28C28]">
            2026-27
          </span>
        </div>
        <SkinHeaderDecor />
      </header>

      <div className="px-4 pt-5 space-y-4">
        {resetSuccessToast && (
          <SchoolCard className="py-2.5 px-3.5">
            <StatusChip
              label={stringResource('dev_reset_toast')}
              tone="success"
            />
          </SchoolCard>
        )}

        <SchoolCard className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-bold text-[#14284B]">
                {stringResource('login_title')}
              </h2>
              <StatusChip
                label={stringResource('status_info')}
                tone="info"
              />
            </div>
            <p className="text-xs text-[#6B7385]">
              {stringResource('login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <SchoolTextField
              label={stringResource('login_id_label')}
              value={loginId}
              onValueChange={(val) => {
                setLoginId(val);
                if (errorKey) setErrorKey(null);
              }}
              placeholder={stringResource('login_id_placeholder')}
              forceLtrValue
              leadingIcon={<UserCheck className="w-4 h-4" />}
              errorText={errorKey ? stringResource(errorKey) : null}
            />

            <SchoolTextField
              label={stringResource('login_password_label')}
              value={password}
              onValueChange={(val) => {
                setPassword(val);
                if (errorKey) setErrorKey(null);
              }}
              type={showPassword ? 'text' : 'password'}
              placeholder={stringResource('login_password_placeholder')}
              trailingIcon={
                <button type="button" aria-label="Show password" className="p-1 cursor-pointer" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              forceLtrValue
              leadingIcon={<KeyRound className="w-4 h-4" />}
            />

            <div className="pt-1">
              <PrimaryButton
                type="submit"
                text={stringResource('login_button')}
                onClick={() => handleSubmit()}
                loading={isLoading}
                variant="orange"
              />
            </div>
          </form>
        </SchoolCard>

        {isLoading && <ShimmerPlaceholder lines={2} showHeader />}

        {/* Collapsible "Demo accounts" box (local demo mode only) */}
        <SchoolCard className={CLOUD_ENABLED ? 'hidden' : 'space-y-3'}>
          <button
            type="button"
            onClick={() => setDemoExpanded((prev) => !prev)}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 text-start cursor-pointer"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="font-heading text-xs font-bold text-[#14284B] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#F28C28] shrink-0" />
                <span className="truncate">
                  {stringResource('demo_accounts_title')}
                </span>
              </div>
              <div
                dir="ltr"
                className="text-[11px] font-mono text-[#6B7385]"
              >
                {stringResource('demo_accounts_badge')}
              </div>
            </div>
            <span className="w-8 h-8 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#14284B] shrink-0">
              {demoExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </span>
          </button>

          {demoExpanded && (
            <div className="pt-2 border-t border-[#E4E8F0] space-y-3.5">
              <p className="text-[11px] text-[#6B7385]">
                {stringResource('demo_password_note')}
              </p>

              {renderDemoGroup(
                stringResource('demo_group_staff'),
                STAFF_DEMO_ACCOUNTS
              )}

              {renderDemoGroup(
                stringResource('demo_group_teachers'),
                TEACHER_DEMO_ACCOUNTS
              )}

              {renderDemoGroup(
                stringResource('demo_group_parents'),
                PARENT_DEMO_ACCOUNTS
              )}
            </div>
          )}
        </SchoolCard>
      </div>

      {/* Hidden Developer Menu Dialog (triggered ONLY by tapping the school logo 5 times on Login) */}
      {devMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14284B]/50 backdrop-blur-[2px] overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm max-h-[88vh] overflow-y-auto bg-white rounded-2xl border border-[#E4E8F0] p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#14284B]/8 flex items-center justify-center text-[#F28C28] shrink-0">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-[#14284B]">
                  {stringResource('dev_menu_title')}
                </h3>
                <p className="text-[11px] text-[#6B7385]">
                  {stringResource('dev_menu_subtitle')}
                </p>
              </div>
            </div>

            {/* 0. Demo Date Override Picker (Default = real date in Asia/Karachi) */}
            <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#14284B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
                  <span>{stringResource('demo_date_picker_title')}</span>
                </div>
                <span
                  dir="ltr"
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                    devDemoOverride
                      ? 'bg-[#F28C28]/20 text-[#C86A10]'
                      : 'bg-[#2E9E5B]/15 text-[#2E9E5B]'
                  }`}
                >
                  {devDemoOverride
                    ? `${stringResource('demo_date_active_strip')}`
                    : stringResource('demo_date_using_real_badge')}
                </span>
              </div>

              <p className="text-[11px] text-[#6B7385] leading-relaxed">
                {stringResource('demo_date_picker_subtitle')}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  dir="ltr"
                  aria-label={stringResource('demo_date_picker_title')}
                  value={devDemoOverride ?? realToday()}
                  onChange={(e) => handleDemoDateChange(e.target.value)}
                  className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#E4E8F0] font-mono text-xs font-bold text-[#14284B] focus:outline-none focus:border-[#F28C28]"
                />
                {devDemoOverride && (
                  <button
                    type="button"
                    onClick={() => setDemoDateOverride(null)}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#E4E8F0] text-xs font-semibold text-[#14284B] hover:border-[#14284B]/40 transition-colors cursor-pointer shrink-0"
                  >
                    {stringResource('demo_date_use_real_btn')}
                  </button>
                )}
              </div>

              <div
                dir="ltr"
                className="text-[11px] font-mono text-[#6B7385] flex items-center justify-between pt-0.5"
              >
                <span>
                  Today: <strong className="text-[#14284B]">{formatSchoolDate(today())}</strong> ({today()})
                </span>
                <span>PKT {currentTimeHHMM()}</span>
              </div>
            </div>

            {/* 1. Live list of which teachers have which sections still pending today */}
            <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-2">
              <div className="text-xs font-bold text-[#14284B] flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
                  <span>
                    {stringResource('dev_pending_today_title')} (
                    <span dir="ltr" className="font-mono">
                      {formatSchoolDate(today())}
                    </span>
                    )
                  </span>
                </span>
                <span
                  dir="ltr"
                  className="px-2 py-0.5 rounded-md bg-[#F2B705]/20 text-[#9E7400] font-mono text-[11px] font-bold"
                >
                  {devPendingEntries.length}
                </span>
              </div>

              {devPendingEntries.length === 0 ? (
                <p className="text-xs text-[#2E9E5B] font-semibold">
                  {stringResource('dev_pending_today_all_done')}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {devPendingEntries.map((item) => (
                    <div
                      key={item.section.id}
                      className="p-2 rounded-lg bg-white border border-[#E4E8F0] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#14284B] truncate">
                          <span
                            dir="ltr"
                            className="font-mono font-bold text-[#F28C28]"
                          >
                            {item.teacher.loginId}
                          </span>{' '}
                          ·{' '}
                          {language === 'ur'
                            ? item.teacher.fullNameUr
                            : item.teacher.fullName}
                        </div>
                        <div className="text-[11px] text-[#6B7385] truncate">
                          {item.classSectionLabel} · {item.campusLabel}
                        </div>
                      </div>
                      <span
                        dir="ltr"
                        className="font-mono text-[10px] text-[#6B7385] shrink-0"
                      >
                        {item.section.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Clear today's attendance for a section */}
            <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-2.5">
              <div className="text-xs font-bold text-[#14284B] flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
                <span>{stringResource('dev_clear_section_title')}</span>
              </div>

              <select
                aria-label={stringResource('dev_clear_section_select_label')}
                value={devSelectedSectionToClear}
                onChange={(e) => setDevSelectedSectionToClear(e.target.value)}
                className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#E4E8F0] text-xs font-medium text-[#14284B]"
              >
                {devAllSections.map((opt) => (
                  <option key={opt.section.id} value={opt.section.id}>
                    {opt.label}{' '}
                    {opt.isPending
                      ? `[${stringResource('teacher_badge_pending')}]`
                      : ''}
                  </option>
                ))}
              </select>

              {devClearSuccessToast && (
                <div className="text-[11px] font-semibold text-[#2E9E5B]">
                  {stringResource('dev_clear_section_toast')}
                </div>
              )}

              <PrimaryButton
                text={stringResource('dev_clear_section_btn')}
                variant="navy"
                loading={devClearing}
                icon={<Eraser className="w-4 h-4 text-[#F28C28]" />}
                onClick={handleClearTodayAttendanceForSection}
              />
            </div>

            <div className="space-y-2 pt-1">
              {onOpenDevDestination && (
                <PrimaryButton
                  text={stringResource('dev_menu_check_screen')}
                  variant="navy"
                  icon={<Terminal className="w-4 h-4 text-[#F28C28]" />}
                  onClick={() => {
                    setDevMenuOpen(false);
                    onOpenDevDestination('dev_check');
                  }}
                />
              )}
              <PrimaryButton
                text={stringResource('dev_reset_confirm')}
                variant="orange"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleConfirmResetDemoData}
              />
              <PrimaryButton
                text={stringResource('dialog_cancel')}
                variant="outline"
                onClick={() => setDevMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
