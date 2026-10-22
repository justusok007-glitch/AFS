import { DiaryTab } from '../diary/DiaryTab';
import React, { useEffect, useState } from 'react';
import { AccountantDefaultersTab } from '../accountant/AccountantDefaultersTab';
import { AlertTriangle, ArrowLeft, ArrowRight, Bell, BookOpen, CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, MessageSquare, Settings as SettingsIcon, Activity, Sliders, Unlock, Users, Wallet } from 'lucide-react';
import { MessagesTab } from '../comms/MessagesTab';
import { NoticesManager } from '../comms/CommsShared';
import { AdminAttendanceCorrection } from './AdminAttendanceCorrection';
import { AdminAttendanceUnlock } from './AdminAttendanceUnlock';
import { AdminActivity } from './AdminActivity';
import { AdminAuditCard } from './AdminMoreTab';
import { useSectionOptions } from './AdminStudentsTab';
import { StudentSearchPanel } from '../principal/StudentSearchPanel';
import { Search } from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { AppModule } from '../../../di/AppModule';
import { Profile, Role, StudentStatus } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { FeeBreakdownCard } from '../accountant/FeeBreakdownCard';
import { PrincipalSummaryDashboard } from '../principal/PrincipalSummaryDashboard';

const ROLES: Role[] = [Role.PARENT, Role.TEACHER, Role.PRINCIPAL, Role.VICE_PRINCIPAL, Role.ACCOUNTANT, Role.ATTENDANCE_COORDINATOR, Role.ADMIN];

/** Admin dashboard = the principal dashboard plus a small system overview. */
export const AdminOverviewTab: React.FC<{
  lookups: AccountantLookups;
  onSwitchTab: (index: number) => void;
}> = ({ lookups, onSwitchTab }) => {
  const { stringResource: t, language } = useStringResource();
  const [users, setUsers] = useState<Profile[] | null>(null);
  const [studentsByCampus, setStudentsByCampus] = useState<Record<string, number>>({});
  const [auditCount, setAuditCount] = useState(0);

  useEffect(() => {
    (async () => {
      const [u, s, a] = await Promise.all([
        AppModule.settingsRepository.getProfiles(null, null),
        AppModule.studentRepository.search({ query: '', status: StudentStatus.ACTIVE }),
        AppModule.settingsRepository.getAuditLogs(500),
      ]);
      setUsers(u.ok ? u.data : []);
      const by: Record<string, number> = {};
      if (s.ok) s.data.forEach((st) => (by[st.campusId] = (by[st.campusId] ?? 0) + 1));
      setStudentsByCampus(by);
      setAuditCount(a.ok ? a.data.length : 0);
    })();
  }, []);

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ad_sys_title')}</h3>
        {users === null ? (
          <ShimmerPlaceholder lines={2} />
        ) : (
          <>
            <div>
              <div className="text-[11px] font-semibold text-[#6B7385] mb-1">{t('ad_sys_users_by_role')}</div>
              <div className="grid grid-cols-6 gap-1.5 text-center">
                {ROLES.map((r) => (
                  <div key={r} className="rounded-xl bg-[#F6F8FC] py-1.5">
                    <div dir="ltr" className="font-mono text-sm font-bold text-[#14284B]">{users.filter((u) => u.role === r).length}</div>
                    <div className="text-[9px] text-[#6B7385] truncate px-0.5">{t(`role_${r.toLowerCase()}` as StringKey)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#6B7385] mb-1">{t('ad_sys_students_by_campus')}</div>
              <div className="grid grid-cols-2 gap-1.5 text-center">
                {lookups.campuses.map((c) => (
                  <div key={c.id} className="rounded-xl bg-[#F6F8FC] py-1.5">
                    <div dir="ltr" className="font-mono text-sm font-bold text-[#14284B]">{studentsByCampus[c.id] ?? 0}</div>
                    <div className="text-[10px] text-[#6B7385]">{language === 'ur' ? c.nameUr : c.nameEn}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#6B7385]">{t('ad_sys_audit_count')}</span>
              <b dir="ltr" className="font-mono text-[#14284B]">{auditCount}</b>
            </div>
          </>
        )}
      </SchoolCard>
      <PrincipalSummaryDashboard lookups={lookups} onSwitchTab={onSwitchTab} />
    </div>
  );
};

/** Admin home: shortcut tiles. Overview, corrections, notices, conversations and audit log open from their own tile. */
type DashView = 'menu' | 'overview' | 'attendance' | 'notices' | 'messages' | 'audit' | 'defaulters' | 'search' | 'feebreak' | 'unlock' | 'activity' | 'diary';

export const AdminDashboardTab: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onSwitchTab: (index: number) => void;
  onOpenSettings: () => void;
}> = ({ admin, lookups, onSwitchTab, onOpenSettings }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const [view, setView] = useState<DashView>('menu');
  const sectionOptions = useSectionOptions(lookups);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ic = 'w-6 h-6';
  const back = () => setView('menu');

  if (view === 'attendance') {
    return <AdminAttendanceCorrection admin={admin} sectionOptions={sectionOptions} onBack={back} />;
  }
  if (view === 'diary') return <DiaryTab user={admin} onBack={back} />;
  if (view === 'activity') return <AdminActivity admin={admin} onBack={back} />;
  if (view === 'unlock') return <AdminAttendanceUnlock admin={admin} sectionOptions={sectionOptions} onBack={back} />;
  if (view === 'notices') return <NoticesManager actor={admin} lookups={lookups} onBack={back} />;
  if (view === 'messages') return <MessagesTab user={admin} readOnly onBack={back} />;
  if (view === 'overview' || view === 'audit' || view === 'defaulters' || view === 'search' || view === 'feebreak') {
    return (
      <div className="space-y-3">
        <button type="button" onClick={back} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        {view === 'overview' ? <AdminOverviewTab lookups={lookups} onSwitchTab={onSwitchTab} /> : view === 'feebreak' ? <FeeBreakdownCard lookups={lookups} /> : view === 'defaulters' ? <AccountantDefaultersTab lookups={lookups} /> : view === 'search' ? <StudentSearchPanel user={admin} lookups={lookups} /> : <AdminAuditCard />}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      <HomeTile tone="teal" label={t('ad_sys_title')} icon={<LayoutDashboard className={ic} />} onClick={() => setView('overview')} />
      <HomeTile tone="orange" label={t('tab_setup')} icon={<Sliders className={ic} />} onClick={() => onSwitchTab(1)} />
      <HomeTile tone="purple" label={t('tab_users')} icon={<Users className={ic} />} onClick={() => onSwitchTab(2)} />
      <HomeTile tone="green" label={t('tab_students')} icon={<GraduationCap className={ic} />} onClick={() => onSwitchTab(3)} />
      <HomeTile tone="blue" label={t('pr_more_students')} icon={<Search className={ic} />} onClick={() => setView('search')} />
      <HomeTile tone="green" label={t('fb_title')} icon={<Wallet className={ic} />} onClick={() => setView('feebreak')} />
      <HomeTile tone="orange" label={t('tab_defaulters')} icon={<AlertTriangle className={ic} />} onClick={() => setView('defaulters')} />
      <HomeTile tone="red" label={t('ad_att_btn')} icon={<CalendarCheck className={ic} />} onClick={() => setView('attendance')} />
      <HomeTile tone="orange" label={t('tab_diary')} icon={<BookOpen className={ic} />} onClick={() => setView('diary')} />
      <HomeTile tone="teal" label={t('act_title')} icon={<Activity className={ic} />} onClick={() => setView('activity')} />
      <HomeTile tone="purple" label={t('ad_unlock_title')} icon={<Unlock className={ic} />} onClick={() => setView('unlock')} />
      <HomeTile tone="pink" label={t('nt_manage_btn')} icon={<Bell className={ic} />} onClick={() => setView('notices')} />
      <HomeTile tone="indigo" label={t('ms_audit_btn')} icon={<MessageSquare className={ic} />} onClick={() => setView('messages')} />
      <HomeTile tone="teal" label={t('ad_audit_title')} icon={<ClipboardList className={ic} />} onClick={() => setView('audit')} />
      <HomeTile tone="blue" label={t('settings_title')} icon={<SettingsIcon className={ic} />} onClick={onOpenSettings} />
    </div>
  );
};
