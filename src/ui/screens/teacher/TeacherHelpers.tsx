import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import {
  addDaysIso,
  currentTimeHHMM,
} from '../../../domain/clock';
import { formatSchoolTime } from '../../../domain/formatters/SchoolFormatters';
import {
  AttendanceStatus,
  AttendanceSubmission,
  DomainError,
  SchoolClass,
  Section,
  Student,
} from '../../../domain/models/models';
import { LanguageCode, StringKey } from '../../../res/strings';
import { useStringResource } from '../../theme/LocaleContext';

export function getNextCycledStatus(
  current: AttendanceStatus
): AttendanceStatus {
  switch (current) {
    case AttendanceStatus.PRESENT:
      return AttendanceStatus.ABSENT;
    case AttendanceStatus.ABSENT:
      return AttendanceStatus.LEAVE;
    case AttendanceStatus.LEAVE:
      return AttendanceStatus.LATE;
    case AttendanceStatus.LATE:
      return AttendanceStatus.PRESENT;
  }
}

export function getStudentInitials(stu: Student): string {
  const parts = stu.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return stu.name.slice(0, 2).toUpperCase();
}

export function formatClassSectionTitle(
  section: Section,
  classesMap: Record<string, SchoolClass>,
  language: LanguageCode
): string {
  const cls = classesMap[section.classId];
  const className = cls
    ? language === 'ur'
      ? cls.nameUr
      : cls.nameEn
    : section.classId;
  return `${className}-${section.name}`;
}

export function formatSectionCampusLabel(
  section: Section,
  classesMap: Record<string, SchoolClass>,
  stringResource: (key: StringKey) => string
): string {
  const cls = classesMap[section.classId];
  const isGirls =
    cls?.campusId === 'campus_g' || section.id.startsWith('sec_g_');
  return isGirls
    ? stringResource('campus_girls')
    : stringResource('campus_boys');
}

export function addDaysToIsoDate(isoDate: string, deltaDays: number): string {
  return addDaysIso(isoDate, deltaDays);
}

export function getWeekdayName(
  isoDate: string,
  stringResource: (key: StringKey) => string
): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayIndex = dt.getUTCDay();
  const keys: StringKey[] = [
    'weekday_sun',
    'weekday_mon',
    'weekday_tue',
    'weekday_wed',
    'weekday_thu',
    'weekday_fri',
    'weekday_sat',
  ];
  return stringResource(keys[dayIndex] ?? 'weekday_sat');
}

export function getCurrentKarachiWallTimeHHMM(): string {
  return currentTimeHHMM();
}

export function formatDomainErrorMessage(
  error: DomainError,
  stringResource: (key: StringKey) => string
): string {
  switch (error.kind) {
    case 'SectionNotAssignedToTeacher':
      return stringResource('domain_err_section_not_assigned');
    case 'AttendanceDateLocked':
      return stringResource('domain_err_date_locked');
    case 'AttendancePastCutoffTime':
      return `${stringResource('domain_err_past_cutoff')} (${error.lockTime})`;
    case 'UnauthorizedRole':
      return stringResource('domain_err_unauthorized');
    case 'ValidationFailed':
      if (error.message === 'Holiday / weekly off - no attendance today') {
        return stringResource('teacher_att_holiday_off_notice');
      }
      return error.message || stringResource('domain_err_validation');
    default:
      return error.message || stringResource('domain_err_generic');
  }
}

export const SectionSubmissionBadge: React.FC<{
  submission: AttendanceSubmission | null;
}> = ({ submission }) => {
  const { stringResource } = useStringResource();

  if (!submission) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#F2B705]/18 text-[#9E7400] text-xs font-bold whitespace-nowrap shrink-0">
        <Clock className="w-3.5 h-3.5 shrink-0 text-[#F2B705]" />
        <span>{stringResource('teacher_badge_pending')}</span>
      </span>
    );
  }

  const timeFormatted = formatSchoolTime(submission.submittedAt);

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2E9E5B]/12 text-[#2E9E5B] text-xs font-bold whitespace-nowrap shrink-0">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2E9E5B]" />
      <span>
        {stringResource('teacher_badge_submitted_at')}{' '}
        <span dir="ltr" className="font-mono">
          {timeFormatted}
        </span>
      </span>
    </span>
  );
};
