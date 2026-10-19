import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, LogOut, Settings } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { AuditLogEntry, Profile } from '../../../domain/models/models';
import { AccountantLookups } from '../accountant/AccountantShared';
import { AdminRemoveData } from './AdminRemoveData';
import { AdminAttendanceCorrection } from './AdminAttendanceCorrection';
import { MessagesTab } from '../comms/MessagesTab';
import { NoticesManager } from '../comms/CommsShared';
import { useSectionOptions } from './AdminStudentsTab';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';

/** Audit log card (used on the admin dashboard and the More tab). */
export const AdminAuditCard: React.FC = () => {
  const { stringResource: t } = useStringResource();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [staff, setStaff] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [a, p] = await Promise.all([
      AppModule.settingsRepository.getAuditLogs(60),
      AppModule.settingsRepository.getProfiles(null, null),
    ]);
    if (!a.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const m: Record<string, Profile> = {};
    if (p.ok) p.data.forEach((x) => (m[x.id] = x));
    setStaff(m);
    setLogs(a.data);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SchoolCard className="space-y-2">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ad_audit_title')}</h3>
      {loading ? (
        <ShimmerPlaceholder lines={4} />
      ) : failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : logs.length === 0 ? (
        <p className="text-xs text-[#6B7385]">{t('ad_audit_none')}</p>
      ) : (
        logs.map((l) => (
          <div key={l.id} className="border-t border-[#E4E8F0] pt-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <b className="text-[#14284B] font-mono text-[11px]" dir="ltr">{l.action}</b>
              <span dir="ltr" className="text-[10px] text-[#6B7385] shrink-0">{l.changedAt.slice(0, 16).replace('T', ' ')}</span>
            </div>
            <div className="text-[#1B2233]">{l.reason}</div>
            <div dir="ltr" className="text-[10px] text-[#6B7385] text-start">
              {l.tableName}:{l.recordId} · {t('ad_audit_by')} {staff[l.changedBy]?.loginId ?? l.changedBy}
            </div>
          </div>
        ))
      )}
    </SchoolCard>
  );
};

export const AdminMoreTab: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ admin, lookups, onOpenSettings, onLogout }) => {
  const { stringResource: t } = useStringResource();
  const sectionOptions = useSectionOptions(lookups);
  const [showAtt, setShowAtt] = useState(false);
  const [showRemove, setShowRemove] = useState(false);
  const [comms, setComms] = useState<'messages' | 'notices' | null>(null);

  if (comms === 'messages') return <MessagesTab user={admin} readOnly onBack={() => setComms(null)} />;
  if (comms === 'notices') return <NoticesManager actor={admin} lookups={lookups} onBack={() => setComms(null)} />;

  if (showRemove) return <AdminRemoveData admin={admin} onBack={() => setShowRemove(false)} />;

  if (showAtt) {
    return <AdminAttendanceCorrection admin={admin} sectionOptions={sectionOptions} onBack={() => setShowAtt(false)} />;
  }

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <PrimaryButton text={t('ad_att_btn')} variant="orange" onClick={() => setShowAtt(true)} />
        <PrimaryButton text={t('nt_manage_btn')} variant="navy" onClick={() => setComms('notices')} />
        <PrimaryButton text={t('ms_audit_btn')} variant="outline" onClick={() => setComms('messages')} />
        <PrimaryButton text={t('rm_btn')} variant="outline" onClick={() => setShowRemove(true)} />
        <PrimaryButton text={t('settings_open_from_more')} variant="navy" onClick={onOpenSettings} icon={<Settings className="w-4 h-4 text-[#F28C28]" />} />
        <PrimaryButton text={t('logout_button')} variant="outline" onClick={onLogout} icon={<LogOut className="w-4 h-4 text-[#14284B]" />} />
      </SchoolCard>

      <AdminAuditCard />
    </div>
  );
};
