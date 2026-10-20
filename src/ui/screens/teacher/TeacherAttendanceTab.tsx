import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileEdit,
  Lock,
  Plane,
  Send,
  X,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  checkWeeklyOffOrHoliday,
  subscribeToClock,
  today,
} from '../../../domain/clock';
import {
  formatSchoolDate,
  formatSchoolTime,
} from '../../../domain/formatters/SchoolFormatters';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSubmission,
  DayOfWeek,
  Profile,
  SchoolClass,
  SchoolHoliday,
  Section,
  Student,
} from '../../../domain/models/models';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolDialog,
  SchoolTextField,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AttendanceStatusBadge } from '../parent/ParentHelpers';
import {
  addDaysToIsoDate,
  formatClassSectionTitle,
  formatDomainErrorMessage,
  formatSectionCampusLabel,
  getCurrentKarachiWallTimeHHMM,
  getNextCycledStatus,
  getStudentInitials,
  getWeekdayName,
  SectionSubmissionBadge,
} from './TeacherHelpers';

export interface TeacherAttendanceTabProps {
  teacherProfile: Profile;
  classesMap: Record<string, SchoolClass>;
  selectedSectionId: string | null;
  onSelectSectionId: (sectionId: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
  /** Section chosen by the screen (coordinator tabs): hides the section picker. */
  lockedSection?: boolean;
}

interface StudentDraftRow {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = ({
  teacherProfile,
  classesMap,
  selectedSectionId,
  onSelectSectionId,
  onDirtyChange,
  lockedSection = false,
}) => {
  const { stringResource, language, isRtl } = useStringResource();

  const [currentToday, setCurrentToday] = useState<string>(() => today());
  const [assignedSections, setAssignedSections] = useState<Section[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => today());
  const [lockTime, setLockTime] = useState<string>('23:59');
  const [weeklyOffDays, setWeeklyOffDays] = useState<DayOfWeek[]>([
    DayOfWeek.SUNDAY,
  ]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);

  const [loadingSections, setLoadingSections] = useState<boolean>(true);
  const [loadingRoster, setLoadingRoster] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [submission, setSubmission] = useState<AttendanceSubmission | null>(
    null
  );
  const [hasRecordsOnPastDay, setHasRecordsOnPastDay] = useState<boolean>(true);

  const [draftRows, setDraftRows] = useState<StudentDraftRow[]>([]);
  const [savedSnapshotJson, setSavedSnapshotJson] = useState<string>('[]');

  // Track scale animation on status chip tap
  const [animatingStudentId, setAnimatingStudentId] = useState<string | null>(
    null
  );

  // Bottom sheet for explicit status & optional remark
  const [remarkSheetStudentId, setRemarkSheetStudentId] = useState<
    string | null
  >(null);
  const [sheetStatus, setSheetStatus] = useState<AttendanceStatus>(
    AttendanceStatus.PRESENT
  );
  const [sheetRemark, setSheetRemark] = useState<string>('');

  // Long press timer ref
  const longPressTimerRef = useRef<number | null>(null);

  // Pending section/date navigation when unsaved changes exist
  const [pendingInternalNav, setPendingInternalNav] = useState<
    | { type: 'section'; sectionId: string }
    | { type: 'date'; date: string }
    | null
  >(null);

  useEffect(() => {
    return subscribeToClock(() => {
      const nextToday = today();
      setCurrentToday(nextToday);
      setSelectedDate(nextToday);
    });
  }, []);

  const activeSection =
    assignedSections.find((s) => s.id === selectedSectionId) ??
    assignedSections[0] ??
    null;

  const activeCampusId = activeSection
    ? classesMap[activeSection.classId]?.campusId ?? teacherProfile.campusId
    : teacherProfile.campusId;

  const offDayInfo = checkWeeklyOffOrHoliday(
    selectedDate,
    holidays,
    weeklyOffDays,
    activeCampusId
  );
  const isOffDay = offDayInfo.isOff;

  const serializeRows = (rows: StudentDraftRow[]): string =>
    JSON.stringify(
      rows.map((r) => ({
        studentId: r.student.id,
        status: r.status,
        remarks: r.remarks.trim(),
      }))
    );

  const currentSnapshotJson = serializeRows(draftRows);
  const isPastDay = selectedDate < currentToday;
  const isPastLockTime =
    selectedDate === currentToday && getCurrentKarachiWallTimeHHMM() > lockTime;
  const isViewOnly = isPastDay || isPastLockTime || isOffDay;

  const isDirty =
    !isViewOnly &&
    !loadingRoster &&
    draftRows.length > 0 &&
    currentSnapshotJson !== savedSnapshotJson;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // 1. Load teacher's assigned sections & school settings
  const loadInitialSetup = useCallback(async () => {
    setLoadingSections(true);
    setLoadError(null);
    try {
      const [sectionsRes, settingsRes] = await Promise.all([
        AppModule.attendanceRepository.sectionsForTeacher(teacherProfile.id),
        AppModule.settingsRepository.getSchoolSettings(),
      ]);

      if (!sectionsRes.ok) {
        setLoadError(
          formatDomainErrorMessage(sectionsRes.error, stringResource)
        );
        return;
      }

      if (settingsRes.ok) {
        if (settingsRes.data.attendanceLockTime) {
          setLockTime(settingsRes.data.attendanceLockTime);
        }
        if (settingsRes.data.weeklyOffDays) {
          setWeeklyOffDays(settingsRes.data.weeklyOffDays);
        }
      }

      const secs = sectionsRes.data;
      setAssignedSections(secs);

      if (secs.length > 0) {
        const validSelected = secs.find((s) => s.id === selectedSectionId);
        if (!validSelected) {
          onSelectSectionId(secs[0].id);
        }
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : stringResource('domain_err_generic')
      );
    } finally {
      setLoadingSections(false);
    }
  }, [teacherProfile.id, selectedSectionId, onSelectSectionId, stringResource]);

  useEffect(() => {
    loadInitialSetup();
  }, [loadInitialSetup]);

  // 2. Load students, submission & records for activeSection + selectedDate
  const loadSectionAttendance = useCallback(async () => {
    if (!activeSection) {
      setLoadingRoster(false);
      return;
    }

    setLoadingRoster(true);
    setLoadError(null);
    setActionError(null);

    try {
      const yearNum = Number(selectedDate.slice(0, 4)) || 2026;
      const [studentsRes, subRes, recordsRes, settingsRes, holidaysRes] =
        await Promise.all([
          AppModule.attendanceRepository.studentsOfSection(activeSection.id),
          AppModule.attendanceRepository.getSubmission(
            activeSection.id,
            selectedDate
          ),
          AppModule.attendanceRepository.getForSectionAndDate(
            activeSection.id,
            selectedDate
          ),
          AppModule.settingsRepository.getSchoolSettings(),
          AppModule.settingsRepository.getHolidays(yearNum, activeCampusId),
        ]);

      if (settingsRes.ok) {
        if (settingsRes.data.attendanceLockTime) {
          setLockTime(settingsRes.data.attendanceLockTime);
        }
        if (settingsRes.data.weeklyOffDays) {
          setWeeklyOffDays(settingsRes.data.weeklyOffDays);
        }
      }
      if (holidaysRes.ok) {
        setHolidays(holidaysRes.data);
      }

      if (!studentsRes.ok) {
        setLoadError(
          formatDomainErrorMessage(studentsRes.error, stringResource)
        );
        return;
      }
      if (!subRes.ok) {
        setLoadError(formatDomainErrorMessage(subRes.error, stringResource));
        return;
      }
      if (!recordsRes.ok) {
        setLoadError(
          formatDomainErrorMessage(recordsRes.error, stringResource)
        );
        return;
      }

      const students = studentsRes.data;
      const existingSub = subRes.data;
      const existingRecords = recordsRes.data;

      const recordByStudentId: Record<string, AttendanceRecord> = {};
      existingRecords.forEach((r) => {
        recordByStudentId[r.studentId] = r;
      });

      const pastWithoutRecords =
        selectedDate < today() &&
        !existingSub &&
        existingRecords.length === 0;
      setHasRecordsOnPastDay(!pastWithoutRecords);

      // For today with no submission yet, every student starts as PRESENT
      const rows: StudentDraftRow[] = students.map((stu) => {
        const rec = recordByStudentId[stu.id];
        return {
          student: stu,
          status: rec ? rec.status : AttendanceStatus.PRESENT,
          remarks: rec?.remarks ?? '',
        };
      });

      setSubmission(existingSub);
      setDraftRows(rows);
      setSavedSnapshotJson(serializeRows(rows));
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : stringResource('domain_err_generic')
      );
    } finally {
      setLoadingRoster(false);
    }
  }, [activeSection, activeCampusId, selectedDate, stringResource]);

  useEffect(() => {
    setSuccessBanner(null);
    loadSectionAttendance();
  }, [loadSectionAttendance]);

  // Guarded section change
  const requestSectionChange = (newSectionId: string) => {
    if (newSectionId === activeSection?.id) return;
    if (isDirty) {
      setPendingInternalNav({ type: 'section', sectionId: newSectionId });
      return;
    }
    onSelectSectionId(newSectionId);
  };

  // Guarded date change (future dates > currentToday not allowed)
  const requestDateChange = (newDate: string) => {
    if (newDate > currentToday || newDate === selectedDate) {
      return;
    }
    if (isDirty) {
      setPendingInternalNav({ type: 'date', date: newDate });
      return;
    }
    setSelectedDate(newDate);
  };

  const confirmDiscardInternalNav = () => {
    if (!pendingInternalNav) return;
    const nav = pendingInternalNav;
    setPendingInternalNav(null);
    // Reset dirty state before navigating
    setSavedSnapshotJson(currentSnapshotJson);
    onDirtyChange(false);
    if (nav.type === 'section') {
      onSelectSectionId(nav.sectionId);
    } else {
      setSelectedDate(nav.date);
    }
  };

  // Cycle status on tap: Present -> Absent -> Leave -> Late
  const handleCycleStudentStatus = (studentId: string) => {
    if (isViewOnly) return;
    setSuccessBanner(null);
    setActionError(null);

    setAnimatingStudentId(studentId);
    window.setTimeout(() => {
      setAnimatingStudentId((prev) => (prev === studentId ? null : prev));
    }, 180);

    setDraftRows((prev) =>
      prev.map((row) =>
        row.student.id === studentId
          ? { ...row, status: getNextCycledStatus(row.status) }
          : row
      )
    );
  };

  // Open remark & explicit status bottom sheet
  const openRemarkSheet = (row: StudentDraftRow) => {
    if (isViewOnly) return;
    setRemarkSheetStudentId(row.student.id);
    setSheetStatus(row.status);
    setSheetRemark(row.remarks);
  };

  const handleApplyRemarkSheet = () => {
    if (!remarkSheetStudentId) return;
    setSuccessBanner(null);
    setActionError(null);
    setDraftRows((prev) =>
      prev.map((row) =>
        row.student.id === remarkSheetStudentId
          ? {
              ...row,
              status: sheetStatus,
              remarks: sheetRemark.trim(),
            }
          : row
      )
    );
    setRemarkSheetStudentId(null);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    if (isViewOnly) return;
    setSuccessBanner(null);
    setActionError(null);
    setDraftRows((prev) =>
      prev.map((row) => ({
        ...row,
        status: AttendanceStatus.PRESENT,
      }))
    );
  };

  // Long press handlers
  const startLongPress = (row: StudentDraftRow) => {
    if (isViewOnly) return;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = window.setTimeout(() => {
      openRemarkSheet(row);
      longPressTimerRef.current = null;
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Submit or Update attendance
  const handleSubmitAttendance = async () => {
    if (!activeSection || isViewOnly || submitting) return;
    setSubmitting(true);
    setActionError(null);
    setSuccessBanner(null);

    const wasAlreadySubmitted = submission !== null;

    const recordsPayload: AttendanceRecord[] = draftRows.map((row) => ({
      studentId: row.student.id,
      sectionId: activeSection.id,
      date: selectedDate,
      status: row.status,
      remarks: row.remarks.trim() ? row.remarks.trim() : null,
      markedBy: teacherProfile.id,
    }));

    try {
      const res = await AppModule.attendanceRepository.submit(
        teacherProfile,
        activeSection.id,
        selectedDate,
        recordsPayload
      );

      if (!res.ok) {
        setActionError(formatDomainErrorMessage(res.error, stringResource));
        return;
      }

      setSubmission(res.data);
      setSavedSnapshotJson(serializeRows(draftRows));
      onDirtyChange(false);

      const timeStr = formatSchoolTime(res.data.submittedAt);
      const baseMsg = wasAlreadySubmitted
        ? stringResource('teacher_att_update_success')
        : stringResource('teacher_att_submit_success');
      setSuccessBanner(
        `${baseMsg} (${stringResource('teacher_badge_submitted_at')} ${timeStr})`
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : stringResource('domain_err_generic')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSections) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={5} showHeader />
      </div>
    );
  }

  if (loadError) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={loadError}
        actionLabel={stringResource('retry_button')}
        onAction={loadSectionAttendance}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  if (assignedSections.length === 0 || !activeSection) {
    return (
      <EmptyState
        title={stringResource('teacher_no_sections_title')}
        subtitle={stringResource('teacher_no_sections_subtitle')}
      />
    );
  }

  // Live counts for sticky counter bar
  const presentCount = draftRows.filter(
    (r) => r.status === AttendanceStatus.PRESENT
  ).length;
  const absentCount = draftRows.filter(
    (r) => r.status === AttendanceStatus.ABSENT
  ).length;
  const leaveCount = draftRows.filter(
    (r) => r.status === AttendanceStatus.LEAVE
  ).length;
  const lateCount = draftRows.filter(
    (r) => r.status === AttendanceStatus.LATE
  ).length;

  const remarkSheetRow =
    draftRows.find((r) => r.student.id === remarkSheetStudentId) ?? null;

  const isTodaySelected = selectedDate === currentToday;

  return (
    <div className="space-y-3.5 pb-4">
      {/* 1. Section Picker + Date Bar Card */}
      <SchoolCard className="space-y-3.5">
        {/* Assigned Section Picker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#6B7385]">
              {stringResource('teacher_att_section_picker_label')}
            </span>
            {isTodaySelected && !isOffDay && (
              <SectionSubmissionBadge submission={submission} />
            )}
          </div>

          {lockedSection && (
            <div className="font-heading text-sm font-bold text-[#14284B]">
              {formatClassSectionTitle(activeSection, classesMap, language)}
            </div>
          )}
          <div className={lockedSection ? 'hidden' : 'grid grid-cols-2 gap-2'}>
            {assignedSections.map((sec) => {
              const isSelected = sec.id === activeSection.id;
              const title = formatClassSectionTitle(sec, classesMap, language);
              const campus = formatSectionCampusLabel(
                sec,
                classesMap,
                stringResource
              );
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => requestSectionChange(sec.id)}
                  className={`min-h-[46px] px-3 py-2 rounded-xl border text-start transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#14284B] text-white border-[#14284B] shadow-xs'
                      : 'bg-[#F6F8FC] text-[#14284B] border-[#E4E8F0] hover:border-[#14284B]/35'
                  }`}
                >
                  <div className="font-heading text-xs font-bold truncate">
                    {title}
                  </div>
                  <div
                    className={`text-[10px] truncate mt-0.5 ${
                      isSelected ? 'text-white/80' : 'text-[#6B7385]'
                    }`}
                  >
                    {campus}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Bar with Previous / Next Day Buttons (Future Days Disabled) */}
        <div className="pt-2.5 border-t border-[#E4E8F0] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() =>
              requestDateChange(addDaysToIsoDate(selectedDate, -1))
            }
            aria-label={stringResource('teacher_att_prev_day')}
            className="w-10 h-10 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#14284B] hover:bg-[#14284B]/8 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {isRtl ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div className="text-center min-w-0 flex-1">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
              <span
                dir="ltr"
                className="font-mono text-sm font-bold text-[#14284B]"
              >
                {formatSchoolDate(selectedDate)}
              </span>
              {isTodaySelected ? (
                <span className="px-2 py-0.5 rounded-md bg-[#F28C28]/15 text-[#F28C28] text-[10px] font-bold">
                  {stringResource('teacher_att_today_badge')}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-[#E4E8F0] text-[#6B7385] text-[10px] font-bold">
                  {stringResource('teacher_att_view_only_badge')}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#6B7385] mt-0.5">
              {getWeekdayName(selectedDate, stringResource)} ·{' '}
              {stringResource('teacher_att_lock_time_note')}{' '}
              <span dir="ltr" className="font-mono font-semibold">
                {lockTime}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={selectedDate >= currentToday}
            onClick={() => requestDateChange(addDaysToIsoDate(selectedDate, 1))}
            aria-label={stringResource('teacher_att_next_day')}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
              selectedDate >= currentToday
                ? 'bg-[#F6F8FC] border-[#E4E8F0] text-[#6B7385]/35 cursor-not-allowed'
                : 'bg-[#F6F8FC] border-[#E4E8F0] text-[#14284B] hover:bg-[#14284B]/8 active:scale-95 cursor-pointer'
            }`}
          >
            {isRtl ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </SchoolCard>

      {/* 2A. Holiday / Weekly Off Notice (disables marking) */}
      {isOffDay && (
        <div className="p-4 rounded-2xl bg-[#E4E8F0]/80 border border-[#6B7385]/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#6B7385]/15 text-[#6B7385] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="font-heading text-xs font-bold text-[#1B2233]">
              {stringResource('teacher_att_holiday_off_notice')}
            </div>
            <p className="text-xs text-[#6B7385] mt-0.5">
              {offDayInfo.holiday
                ? `${getWeekdayName(selectedDate, stringResource)} · ${
                    language === 'ur'
                      ? offDayInfo.holiday.titleUr
                      : offDayInfo.holiday.titleEn
                  }`
                : getWeekdayName(selectedDate, stringResource)}
            </p>
          </div>
        </div>
      )}

      {/* 2B. View-Only Grey Notice (when past working day OR past lock time) */}
      {!isOffDay && isViewOnly && (
        <div className="p-3.5 rounded-2xl bg-[#E4E8F0]/75 border border-[#6B7385]/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#6B7385]/15 text-[#6B7385] flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-xs font-bold text-[#1B2233]">
                {stringResource('teacher_att_view_only_badge')}
              </div>
              <p className="text-xs text-[#6B7385]">
                {stringResource('teacher_att_only_admin_can_change')}
              </p>
            </div>
          </div>
          {submission && <SectionSubmissionBadge submission={submission} />}
        </div>
      )}

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-[#2E9E5B]/12 border border-[#2E9E5B]/30 flex items-center gap-2.5 text-xs font-semibold text-[#2E9E5B]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Repository DomainError Banner */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-[#D64545]/12 border border-[#D64545]/30 flex items-center gap-2.5 text-xs font-semibold text-[#D64545]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 3. Sticky Live Counter Bar + "Mark all present" button (only on working days) */}
      {!isOffDay && (
        <div className="sticky top-0 z-20 bg-[#F6F8FC]/95 backdrop-blur-xs py-1">
          <SchoolCard className="p-3 space-y-2.5 shadow-sm">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-2 rounded-xl bg-[#2E9E5B]/10 border border-[#2E9E5B]/20">
                <div className="text-[10px] font-semibold text-[#2E9E5B] truncate">
                  {stringResource('att_status_present')}
                </div>
                <div
                  dir="ltr"
                  className="font-mono text-sm font-bold text-[#2E9E5B] mt-0.5 tabular-nums"
                >
                  {presentCount}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#D64545]/10 border border-[#D64545]/20">
                <div className="text-[10px] font-semibold text-[#D64545] truncate">
                  {stringResource('att_status_absent')}
                </div>
                <div
                  dir="ltr"
                  className="font-mono text-sm font-bold text-[#D64545] mt-0.5 tabular-nums"
                >
                  {absentCount}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#2F80ED]/10 border border-[#2F80ED]/20">
                <div className="text-[10px] font-semibold text-[#2F80ED] truncate">
                  {stringResource('att_status_leave')}
                </div>
                <div
                  dir="ltr"
                  className="font-mono text-sm font-bold text-[#2F80ED] mt-0.5 tabular-nums"
                >
                  {leaveCount}
                </div>
              </div>

              <div className="p-2 rounded-xl bg-[#F2B705]/15 border border-[#F2B705]/30">
                <div className="text-[10px] font-semibold text-[#9E7400] truncate">
                  {stringResource('att_status_late')}
                </div>
                <div
                  dir="ltr"
                  className="font-mono text-sm font-bold text-[#9E7400] mt-0.5 tabular-nums"
                >
                  {lateCount}
                </div>
              </div>
            </div>

            {!isViewOnly && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#E4E8F0]">
                <span className="text-[11px] text-[#6B7385] leading-snug">
                  {stringResource('teacher_att_cycle_hint')}
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#14284B]/8 hover:bg-[#14284B]/15 text-[#14284B] text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#2E9E5B]" />
                  <span>{stringResource('teacher_att_mark_all_present')}</span>
                </button>
              </div>
            )}
          </SchoolCard>
        </div>
      )}

      {/* 4. Student Roster List */}
      {loadingRoster ? (
        <div className="space-y-2.5">
          <ShimmerPlaceholder lines={3} />
          <ShimmerPlaceholder lines={3} />
        </div>
      ) : isOffDay ? null : isPastDay && !hasRecordsOnPastDay ? (
        <SchoolCard className="py-6 text-center text-xs text-[#6B7385]">
          {stringResource('teacher_att_no_records_past_day')}
        </SchoolCard>
      ) : (
        <div className="space-y-2.5">
          {draftRows.map((row) => {
            const { student, status, remarks } = row;
            const isBouncing = animatingStudentId === student.id;

            return (
              <SchoolCard
                key={student.id}
                className="py-3 px-3.5 flex items-center justify-between gap-2.5 select-none"
              >
                <div
                  onPointerDown={() => startLongPress(row)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  {/* Roll No Badge + Small Initial Avatar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      dir="ltr"
                      className="min-w-[28px] h-7 px-1.5 rounded-lg bg-[#F6F8FC] border border-[#E4E8F0] font-mono text-xs font-bold text-[#14284B] flex items-center justify-center tabular-nums"
                    >
                      #{student.rollNo}
                    </span>
                    <div
                      dir="ltr"
                      className="w-8 h-8 rounded-xl bg-[#14284B] text-white font-heading text-xs font-bold flex items-center justify-center shrink-0"
                    >
                      {getStudentInitials(student)}
                    </div>
                  </div>

                  {/* Student Name (wraps up to 2 lines) & Admission No (1 small line under name) */}
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-heading text-sm font-bold text-[#1B2233] line-clamp-2 break-words ${
                        language === 'ur'
                          ? 'font-urdu leading-[2.1] py-0.5'
                          : 'leading-snug'
                      }`}
                    >
                      {language === 'ur' ? student.nameUr : student.name}
                    </div>
                    <div
                      dir="ltr"
                      className="text-[11px] font-mono text-[#6B7385] text-start whitespace-nowrap leading-tight mt-0.5"
                    >
                      {student.admissionNo}
                    </div>
                    {remarks && (
                      <div className="mt-1 px-2 py-0.5 rounded-lg bg-[#F6F8FC] border border-[#E4E8F0] text-[11px] text-[#14284B] line-clamp-1">
                        {remarks}
                      </div>
                    )}
                  </div>
                </div>

                {/* Note Icon Button + Interactive Status Chip */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {!isViewOnly && (
                    <button
                      type="button"
                      onClick={() => openRemarkSheet(row)}
                      aria-label={stringResource(
                        'teacher_att_edit_note_tooltip'
                      )}
                      title={stringResource('teacher_att_edit_note_tooltip')}
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                        remarks
                          ? 'bg-[#F28C28]/12 border-[#F28C28]/40 text-[#F28C28]'
                          : 'bg-[#F6F8FC] border-[#E4E8F0] text-[#6B7385] hover:text-[#14284B]'
                      }`}
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => handleCycleStudentStatus(student.id)}
                    onPointerDown={() => startLongPress(row)}
                    onPointerUp={cancelLongPress}
                    onPointerLeave={cancelLongPress}
                    className={`transition-transform duration-150 ${
                      isBouncing ? 'scale-110' : 'scale-100'
                    } ${
                      isViewOnly
                        ? 'cursor-default opacity-90'
                        : 'cursor-pointer active:scale-95'
                    }`}
                  >
                    <AttendanceStatusBadge status={status} />
                  </button>
                </div>
              </SchoolCard>
            );
          })}
        </div>
      )}

      {/* 5. Submit / Update Attendance Button (Orange) */}
      {!isViewOnly && draftRows.length > 0 && (
        <div className="pt-2">
          <PrimaryButton
            text={
              submitting
                ? stringResource('teacher_att_submitting_btn')
                : submission
                ? stringResource('teacher_att_update_btn')
                : stringResource('teacher_att_submit_btn')
            }
            loading={submitting}
            onClick={handleSubmitAttendance}
            variant="orange"
            icon={<Send className="w-4 h-4" />}
          />
        </div>
      )}

      {/* 6. Bottom Sheet for Explicit Status Selection & Optional Remark */}
      {remarkSheetRow && !isViewOnly && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#14284B]/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setRemarkSheetStudentId(null)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[28px] border-t border-[#E4E8F0] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-[#E4E8F0] mx-auto" />

            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold text-[#14284B]">
                  {language === 'ur'
                    ? remarkSheetRow.student.nameUr
                    : remarkSheetRow.student.name}
                </h3>
                <p dir="ltr" className="text-xs font-mono text-[#6B7385]">
                  #{remarkSheetRow.student.rollNo} ·{' '}
                  {remarkSheetRow.student.admissionNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRemarkSheetStudentId(null)}
                className="w-8 h-8 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#6B7385] hover:text-[#14284B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explicit Status Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#14284B]">
                {stringResource('teacher_att_select_status_label')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    {
                      st: AttendanceStatus.PRESENT,
                      labelKey: 'att_status_present',
                      activeCls:
                        'bg-[#2E9E5B] text-white border-[#2E9E5B] shadow-xs',
                      icon: <CheckCircle2 className="w-4 h-4" />,
                    },
                    {
                      st: AttendanceStatus.ABSENT,
                      labelKey: 'att_status_absent',
                      activeCls:
                        'bg-[#D64545] text-white border-[#D64545] shadow-xs',
                      icon: <AlertCircle className="w-4 h-4" />,
                    },
                    {
                      st: AttendanceStatus.LEAVE,
                      labelKey: 'att_status_leave',
                      activeCls:
                        'bg-[#2F80ED] text-white border-[#2F80ED] shadow-xs',
                      icon: <Plane className="w-4 h-4" />,
                    },
                    {
                      st: AttendanceStatus.LATE,
                      labelKey: 'att_status_late',
                      activeCls:
                        'bg-[#F2B705] text-[#14284B] border-[#F2B705] shadow-xs',
                      icon: <Clock className="w-4 h-4" />,
                    },
                  ] as const
                ).map((opt) => {
                  const selected = sheetStatus === opt.st;
                  return (
                    <button
                      key={opt.st}
                      type="button"
                      onClick={() => setSheetStatus(opt.st)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        selected
                          ? opt.activeCls
                          : 'bg-[#F6F8FC] text-[#1B2233] border-[#E4E8F0] hover:border-[#14284B]/30'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {opt.icon}
                        <span>{stringResource(opt.labelKey)}</span>
                      </span>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Remark Input */}
            <div className="space-y-2">
              <SchoolTextField
                label={stringResource('teacher_att_remark_input_label')}
                value={sheetRemark}
                onValueChange={setSheetRemark}
                placeholder={stringResource(
                  'teacher_att_remark_input_placeholder'
                )}
              />
              {sheetRemark && (
                <button
                  type="button"
                  onClick={() => setSheetRemark('')}
                  className="text-xs font-semibold text-[#6B7385] hover:text-[#D64545] cursor-pointer"
                >
                  {stringResource('teacher_att_remark_clear_btn')}
                </button>
              )}
            </div>

            <PrimaryButton
              text={stringResource('teacher_att_remark_save_btn')}
              onClick={handleApplyRemarkSheet}
              variant="orange"
            />
          </div>
        </div>
      )}

      {/* 7. Unsaved Changes Confirmation Dialog for Internal Section/Date Switches */}
      <SchoolDialog
        open={pendingInternalNav !== null}
        title={stringResource('unsaved_changes_title')}
        message={stringResource('unsaved_changes_body')}
        confirmText={stringResource('unsaved_discard_btn')}
        cancelText={stringResource('unsaved_stay_btn')}
        onConfirm={confirmDiscardInternalNav}
        onDismiss={() => setPendingInternalNav(null)}
      />
    </div>
  );
};
