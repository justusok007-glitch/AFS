import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Settings as SettingsIcon,
  UserCheck,
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
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { PrincipalDashboard, Profile } from '../../../domain/models/models';
import { NoticesCard } from '../comms/CommsShared';
import { SchoolCard } from '../../components/SchoolComposables';
import { percentColor } from './PrincipalShared';
import { MoreView } from './PrincipalMoreTab';

/** Today's school-wide attendance and fee collection, shown above the shortcut tiles. */
const TodayCards: React.FC = () => {
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
      <SchoolCard className="flex items-center justify-between gap-3">
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
      </SchoolCard>
    </>
  );
};

/** Principal home: shortcut tiles for every option. Summaries now live inside their own tabs. */
export const PrincipalDashboardTab: React.FC<{
  principal: Profile;
  onSwitchTab: (index: number) => void;
  onOpenMore: (view: MoreView) => void;
  onOpenSettings: () => void;
}> = ({ principal, onSwitchTab, onOpenMore, onOpenSettings }) => {
  const { stringResource: t } = useStringResource();
  const ic = 'w-6 h-6';
  const [data, setData] = useState<PrincipalDashboard | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const r = await AppModule.dashboardRepository.getPrincipalDashboard(null, today());
      if (!cancelled && r.ok) setData(r.data);
    };
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const kpi = (icon: React.ReactNode, label: string, value: React.ReactNode, color = '#14284B') => (
    <SchoolCard className="p-3 space-y-1">
      <div className="flex items-center gap-1 text-[10px] font-semibold text-[#6B7385]">
        <span className="text-[#F28C28] shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div dir="ltr" className="font-mono text-base font-bold tabular-nums text-start" style={{ color }}>{value}</div>
    </SchoolCard>
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        {kpi(<CalendarCheck className="w-3.5 h-3.5" />, t('pr_kpi_attendance'), data ? `${data.attendancePercent}%` : '…', data ? percentColor(data.attendancePercent) : undefined)}
        {kpi(<Wallet className="w-3.5 h-3.5" />, t('pr_kpi_collected_today'), data ? formatRupees(data.feeCollectedTodayRupees) : '…')}
        {kpi(<UserCheck className="w-3.5 h-3.5" />, t('pr_kpi_present_absent'), data ? `${data.present + data.late}/${data.absent}` : '…')}
      </div>
      <NoticesCard user={principal} />
      <div className="grid grid-cols-3 gap-3">
        <HomeTile tone="red" label={t('tab_attendance')} icon={<CalendarCheck className={ic} />} onClick={() => onSwitchTab(1)} />
        <HomeTile tone="orange" label={t('tab_fees')} icon={<Wallet className={ic} />} onClick={() => onSwitchTab(2)} />
        <HomeTile tone="purple" label={t('tab_results')} icon={<Award className={ic} />} onClick={() => onSwitchTab(3)} />
        <HomeTile tone="teal" label={t('pr_more_students')} icon={<GraduationCap className={ic} />} onClick={() => onOpenMore('students')} />
        <HomeTile tone="indigo" label={t('pr_more_compliance')} icon={<ClipboardCheck className={ic} />} onClick={() => onOpenMore('compliance')} />
        <HomeTile tone="pink" label={t('nt_manage_btn')} icon={<Bell className={ic} />} onClick={() => onOpenMore('notices')} />
        <HomeTile tone="green" label={t('ms_audit_btn')} icon={<MessageSquare className={ic} />} onClick={() => onOpenMore('messages')} />
        <HomeTile tone="blue" label={t('settings_title')} icon={<SettingsIcon className={ic} />} onClick={onOpenSettings} />
      </div>
    </div>
  );
};
