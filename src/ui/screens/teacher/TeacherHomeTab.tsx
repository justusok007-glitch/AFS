import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  Building2,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Users,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  checkWeeklyOffOrHoliday,
  subscribeToClock,
  today,
} from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  AttendanceSubmission,
  DayOfWeek,
  Profile,
  SchoolClass,
  SchoolHoliday,
  Section,
} from '../../../domain/models/models';
import {
  EmptyState,
  SchoolCard,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { PullToRefreshContainer } from '../parent/ParentHelpers';
import {
  formatClassSectionTitle,
  formatDomainErrorMessage,
  formatSectionCampusLabel,
  SectionSubmissionBadge,
} from './TeacherHelpers';

export interface TeacherHomeTabProps {
  teacherProfile: Profile;
  classesMap: Record<string, SchoolClass>;
  onOpenSectionAttendance: (sectionId: string) => void;
}

interface SectionTodayCardItem {
  section: Section;
  studentCount: number;
  submission: AttendanceSubmission | null;
}

export const TeacherHomeTab: React.FC<TeacherHomeTabProps> = ({
  teacherProfile,
  classesMap,
  onOpenSectionAttendance,
}) => {
  const { stringResource, language, isRtl } = useStringResource();

  const [todayDate, setTodayDate] = useState<string>(() => today());
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sectionItems, setSectionItems] = useState<SectionTodayCardItem[]>([]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<DayOfWeek[]>([
    DayOfWeek.SUNDAY,
  ]);

  useEffect(() => {
    return subscribeToClock(() => {
      setTodayDate(today());
    });
  }, []);

  const loadTeacherHomeData = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const currentToday = today();
        setTodayDate(currentToday);
        const yearNum = Number(currentToday.slice(0, 4)) || 2026;

        const [sectionsRes, settingsRes, holidaysRes] = await Promise.all([
          AppModule.attendanceRepository.sectionsForTeacher(teacherProfile.id),
          AppModule.settingsRepository.getSchoolSettings(),
          AppModule.settingsRepository.getHolidays(
            yearNum,
            teacherProfile.campusId
          ),
        ]);
        if (!sectionsRes.ok) {
          setErrorMessage(
            formatDomainErrorMessage(sectionsRes.error, stringResource)
          );
          return;
        }

        if (settingsRes.ok && settingsRes.data.weeklyOffDays) {
          setWeeklyOffDays(settingsRes.data.weeklyOffDays);
        }
        if (holidaysRes.ok) {
          setHolidays(holidaysRes.data);
        }

        const assignedSections = sectionsRes.data;
        const items: SectionTodayCardItem[] = await Promise.all(
          assignedSections.map(async (sec) => {
            const [studentsRes, submissionRes] = await Promise.all([
              AppModule.attendanceRepository.studentsOfSection(sec.id),
              AppModule.attendanceRepository.getSubmission(
                sec.id,
                currentToday
              ),
            ]);

            return {
              section: sec,
              studentCount: studentsRes.ok ? studentsRes.data.length : 0,
              submission: submissionRes.ok ? submissionRes.data : null,
            };
          })
        );

        setSectionItems(items);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : stringResource('domain_err_generic')
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [teacherProfile.id, teacherProfile.campusId, stringResource]
  );

  useEffect(() => {
    loadTeacherHomeData(false);
  }, [loadTeacherHomeData, todayDate]);

  if (loading) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={errorMessage}
        actionLabel={stringResource('retry_button')}
        onAction={() => loadTeacherHomeData(false)}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const todayOffInfo = checkWeeklyOffOrHoliday(
    todayDate,
    holidays,
    weeklyOffDays,
    teacherProfile.campusId
  );

  const doneCount = sectionItems.filter(
    (item) => item.submission !== null
  ).length;
  const pendingCount = todayOffInfo.isOff ? 0 : sectionItems.length - doneCount;

  return (
    <PullToRefreshContainer
      refreshing={refreshing}
      onRefresh={() => loadTeacherHomeData(true)}
    >
      {/* 1. Greeting with Teacher's Name & Today's Date */}
      <SchoolCard className="space-y-2.5 border-s-4 border-s-[#F28C28]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#F28C28]">
              {stringResource('parent_greeting_prefix')}
            </div>
            <h2 className="font-heading text-lg font-bold text-[#14284B] mt-0.5">
              {language === 'ur'
                ? teacherProfile.fullNameUr
                : teacherProfile.fullName}
            </h2>
            <p className="text-xs text-[#6B7385]">
              {stringResource('teacher_welcome_subtitle')}
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] text-end shrink-0">
            <div className="text-[10px] font-semibold text-[#6B7385]">
              {stringResource('teacher_today_date_label')}
            </div>
            <div
              dir="ltr"
              className="font-mono text-xs font-bold text-[#14284B] mt-0.5"
            >
              {formatSchoolDate(todayDate)}
            </div>
          </div>
        </div>
      </SchoolCard>

      {/* Weekly Off / Holiday Notice on Home if Today is Off */}
      {todayOffInfo.isOff && (
        <div className="p-3.5 rounded-2xl bg-[#E4E8F0]/80 border border-[#6B7385]/25 flex items-center gap-2.5 text-xs font-semibold text-[#1B2233]">
          <Calendar className="w-4 h-4 text-[#6B7385] shrink-0" />
          <div>
            <div>{stringResource('teacher_att_holiday_off_notice')}</div>
            {todayOffInfo.holiday && (
              <div className="text-[11px] font-normal text-[#6B7385] mt-0.5">
                {language === 'ur'
                  ? todayOffInfo.holiday.titleUr
                  : todayOffInfo.holiday.titleEn}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Small Summary: Sections Done / Sections Pending */}
      {sectionItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <SchoolCard className="flex items-center justify-between gap-2.5 py-3 px-3.5 bg-[#2E9E5B]/8 border-[#2E9E5B]/25">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-semibold text-[#2E9E5B] truncate">
                {stringResource('teacher_summary_done_label')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-xl font-bold text-[#2E9E5B] tabular-nums text-start"
              >
                {doneCount} / {sectionItems.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#2E9E5B]/15 text-[#2E9E5B] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </SchoolCard>

          <SchoolCard className="flex items-center justify-between gap-2.5 py-3 px-3.5 bg-[#F2B705]/10 border-[#F2B705]/30">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-semibold text-[#9E7400] truncate">
                {stringResource('teacher_summary_pending_label')}
              </div>
              <div
                dir="ltr"
                className="font-heading text-xl font-bold text-[#9E7400] tabular-nums text-start"
              >
                {pendingCount} / {sectionItems.length}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F2B705]/20 text-[#9E7400] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </SchoolCard>
        </div>
      )}

      {/* 3. "Today's attendance" Card List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-heading text-xs font-bold text-[#14284B] flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-[#F28C28]" />
            <span>{stringResource('teacher_today_attendance_title')}</span>
          </h3>
          <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">
            {sectionItems.length}
          </span>
        </div>

        {sectionItems.length === 0 ? (
          <EmptyState
            title={stringResource('teacher_no_sections_title')}
            subtitle={stringResource('teacher_no_sections_subtitle')}
          />
        ) : (
          <div className="space-y-2.5">
            {sectionItems.map(({ section, studentCount, submission }) => {
              const title = formatClassSectionTitle(
                section,
                classesMap,
                language
              );
              const campusLabel = formatSectionCampusLabel(
                section,
                classesMap,
                stringResource
              );

              return (
                <SchoolCard
                  key={section.id}
                  onClick={() => onOpenSectionAttendance(section.id)}
                  className="space-y-2.5 py-3.5 px-4"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm font-bold text-[#14284B] truncate">
                        {title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#6B7385] mt-1 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>{campusLabel}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span dir="ltr" className="font-mono font-semibold">
                            {studentCount}
                          </span>
                          <span>
                            {stringResource('teacher_students_count_suffix')}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <SectionSubmissionBadge submission={submission} />
                      {isRtl ? (
                        <ChevronLeft className="w-4 h-4 text-[#6B7385]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#6B7385]" />
                      )}
                    </div>
                  </div>
                </SchoolCard>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Placeholder Cards: "Marks entry" and "Unread messages" with "Coming soon" */}
      <div className="grid grid-cols-1 gap-3.5 pt-1">
        <SchoolCard className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <BookOpenCheck className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('teacher_marks_entry_title')}</span>
            </div>
            <StatusChip
              label={stringResource('coming_soon_title')}
              tone="info"
            />
          </div>
          <p className="text-xs text-[#6B7385] leading-relaxed">
            {stringResource('teacher_marks_entry_subtitle')}
          </p>
        </SchoolCard>

        <SchoolCard className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <MessageSquare className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('teacher_unread_messages_title')}</span>
            </div>
            <StatusChip
              label={stringResource('coming_soon_title')}
              tone="info"
            />
          </div>
          <p className="text-xs text-[#6B7385] leading-relaxed">
            {stringResource('teacher_unread_messages_subtitle')}
          </p>
        </SchoolCard>
      </div>
    </PullToRefreshContainer>
  );
};
