import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { formatRupees, formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import { PrincipalDashboard } from '../../../domain/models/models';
import { SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { AttendanceProgressRing } from '../parent/ParentHelpers';
import { HomeTile } from '../../components/HomeTile';
import { useStringResource } from '../../theme/LocaleContext';
import { Profile } from '../../../domain/models/models';
import { NoticesCard } from '../comms/CommsShared';
import { MoreView } from './PrincipalMoreTab';

/** Today's school-wide attendance and fee collection, shown above the shortcut tiles. */
const TodayCards: React.FC<{ showCollection: boolean }> = ({ showCollection }) => {
  const { stringResource: t } = useStringResource();
  const [d, setD] = useState<PrincipalDashboard | null>(null);
  useEffect(() => {
    let off = false;
    const load = async () => {
      const r = await AppModule.dashboardRepository.getPrincipalDashboard(null, today());
      if (!off && r.ok) setD(r.data);
    };
    void load();
    const id = setInterval(() => void load(), 30000);
    return () => {
      off = true;
      clearInterval(id);
    };
  }, []);
  if (!d) return <ShimmerPlaceholder lines={3} showHeader />;
  const chip = (cls: string, label: string, n: number) => (
    <div className={`px-2.5 py-1.5 rounded-xl font-semibold flex items-center justify-between ${cls}`}>
      <span>{label}</span>
      <span dir="ltr" className="font-mono font-bold">{n}</span>
    </div>
  );
  return (
    <>
      <SchoolCard className="space-y-3">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E8F0]">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-[#14284B]">
              <CalendarCheck className="w-4 h-4 text-[#F28C28] shrink-0" />
              <span>{t('home_today_attendance_title')}</span>
            </div>
            <div dir="ltr" className="text-[11px] font-mono text-[#6B7385] text-start">{formatSchoolDate(d.date)}</div>
          </div>
          <div className="text-[11px] text-[#6B7385]">
            {d.unmarkedSections.length > 0 ? `${d.unmarkedSections.length} ${t('pr_kpi_unmarked')}` : ''}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="grid grid-cols-2 gap-1.5 text-xs flex-1 min-w-0">
            {chip('bg-[#2E9E5B]/10 text-[#2E9E5B]', t('att_status_present'), d.present)}
            {chip('bg-[#D64545]/10 text-[#D64545]', t('att_status_absent'), d.absent)}
            {chip('bg-[#2F80ED]/10 text-[#2F80ED]', t('att_status_leave'), d.leave)}
            {chip('bg-[#F2B705]/15 text-[#9E7400]', t('att_status_late'), d.late)}
          </div>
          <AttendanceProgressRing percentage={d.attendancePercent} size={104} strokeWidth={9} subtitle={`${d.totalStudents}`} />
        </div>
      </SchoolCard>
      {showCollection && <SchoolCard className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-[#14284B]">
            <Wallet className="w-4 h-4 text-[#F28C28] shrink-0" />
            <span>{t('pr_kpi_collected_today')}</span>
          </div>
          <div dir="ltr" className="font-mono text-2xl font-bold text-[#14284B] text-start mt-1">{formatRupees(d.feeCollectedTodayRupees)}</div>
        </div>
        <div className="text-end shrink-0">
          <div className="text-[11px] text-[#6B7385]">{t('pr_kpi_collected_month')}</div>
          <div dir="ltr" className="font-mono text-sm font-bold text-[#2E9E5B]">{formatRupees(d.feeCollectedMonthRupees)}</div>
        </div>
      </SchoolCard>}
    </>
  );
};

/** Principal home: shortcut tiles for every option. Summaries now live inside their own tabs. */
export const PrincipalDashboardTab: React.FC<{
  principal: Profile;
  vice?: boolean;
  onSwitchTab: (index: number) => void;
  onOpenMore: (view: MoreView) => void;
  onOpenSettings: () => void;
}> = ({ principal, vice = false, onSwitchTab, onOpenMore, onOpenSettings }) => {
  const { stringResource: t } = useStringResource();
  const ic = 'w-6 h-6';
  return (
    <div className="space-y-3">
      <TodayCards showCollection={!vice} />
      <NoticesCard user={principal} />
      <div className="grid grid-cols-3 gap-3">
        <HomeTile tone="red" label={t('tab_attendance')} icon={<CalendarCheck className={ic} />} onClick={() => onSwitchTab(1)} />
        <HomeTile tone="orange" label={vice ? t('vp_student_fees') : t('tab_fees')} icon={<Wallet className={ic} />} onClick={() => onSwitchTab(2)} />
        <HomeTile tone="purple" label={t('tab_results')} icon={<Award className={ic} />} onClick={() => onSwitchTab(3)} />
        <HomeTile tone="red" label={t('tab_defaulters')} icon={<AlertTriangle className={ic} />} onClick={() => onOpenMore('defaulters')} />
        <HomeTile tone="teal" label={t('pr_more_students')} icon={<GraduationCap className={ic} />} onClick={() => onOpenMore('students')} />
        <HomeTile tone="indigo" label={t('pr_more_compliance')} icon={<ClipboardCheck className={ic} />} onClick={() => onOpenMore('compliance')} />
        <HomeTile tone="pink" label={t('nt_manage_btn')} icon={<Bell className={ic} />} onClick={() => onOpenMore('notices')} />
        <HomeTile tone="green" label={t('ms_audit_btn')} icon={<MessageSquare className={ic} />} onClick={() => onOpenMore('messages')} />
        <HomeTile tone="blue" label={t('settings_title')} icon={<SettingsIcon className={ic} />} onClick={onOpenSettings} />
      </div>
    </div>
  );
};
