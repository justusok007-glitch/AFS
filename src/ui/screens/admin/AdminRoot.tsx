import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { Profile } from '../../../domain/models/models';
import { EmptyState } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { AdminDashboardTab } from './AdminDashboardTab';
import { AdminMoreTab } from './AdminMoreTab';
import { CredentialSlip } from './AdminShared';
import { AdminStudentsTab } from './AdminStudentsTab';
import { AdminUsersTab } from './AdminUsersTab';

export const AdminRoot: React.FC<{
  admin: Profile;
  tabId: string;
  onSwitchTab: (index: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ admin, tabId, onSwitchTab, onOpenSettings, onLogout }) => {
  const { stringResource: t } = useStringResource();
  const lookups = useAccountantLookups();
  // Credentials are only known right after create/reset, so the slip queue lives in memory.
  const [slips, setSlips] = useState<CredentialSlip[]>([]);

  switch (tabId) {
    case 'dashboard':
      return <AdminDashboardTab lookups={lookups} onSwitchTab={onSwitchTab} />;
    case 'users':
      return (
        <AdminUsersTab
          admin={admin}
          lookups={lookups}
          slips={slips}
          onAddSlip={(s) => setSlips((prev) => [...prev.filter((x) => x.profile.id !== s.profile.id), s])}
          onClearSlips={() => setSlips([])}
        />
      );
    case 'setup':
      return <EmptyState title={t('coming_soon_title')} description={t('ad_soon_setup')} icon={<Sliders className="w-6 h-6 text-[#F28C28]" />} />;
    case 'students':
      return (
        <AdminStudentsTab
          admin={admin}
          lookups={lookups}
          onAddSlip={(s) => setSlips((prev) => [...prev.filter((x) => x.profile.id !== s.profile.id), s])}
        />
      );
    case 'more':
      return <AdminMoreTab onOpenSettings={onOpenSettings} onLogout={onLogout} />;
    default:
      return null;
  }
};
