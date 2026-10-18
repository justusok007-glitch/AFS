import React, { useEffect, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { Profile, Role, StudentStatus } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { PrincipalSummaryDashboard } from '../principal/PrincipalSummaryDashboard';

const ROLES: Role[] = [Role.PARENT, Role.TEACHER, Role.PRINCIPAL, Role.ACCOUNTANT, Role.ADMIN];

/** Admin dashboard = the principal dashboard plus a small system overview. */
export const AdminDashboardTab: React.FC<{
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
              <div className="grid grid-cols-5 gap-1.5 text-center">
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
