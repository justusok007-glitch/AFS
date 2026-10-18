import React, { useState } from 'react';
import { Profile } from '../../../domain/models/models';
import { useAccountantLookups } from './AccountantShared';
import { AccountantCollectTab } from './AccountantCollectTab';
import { AccountantDefaultersTab } from './AccountantDefaultersTab';
import { AccountantMoreTab } from './AccountantMoreTab';
import { AccountantReportsTab } from './AccountantReportsTab';
import { AccountantVouchersTab } from './AccountantVouchersTab';

export interface AccountantRootProps {
  accountant: Profile;
  tabId: string;
  /** Switches the bottom tab by index (0 = Collect). */
  onSwitchTab: (index: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

/** Owns the shared lookups so every accountant tab loads them once. */
export const AccountantRoot: React.FC<AccountantRootProps> = ({
  accountant,
  tabId,
  onSwitchTab,
  onOpenSettings,
  onLogout,
}) => {
  const lookups = useAccountantLookups();
  const [collectStudentId, setCollectStudentId] = useState<string | null>(null);

  switch (tabId) {
    case 'collect':
      return (
        <AccountantCollectTab
          accountant={accountant}
          lookups={lookups}
          initialStudentId={collectStudentId}
          onInitialConsumed={() => setCollectStudentId(null)}
        />
      );
    case 'vouchers':
      return <AccountantVouchersTab accountant={accountant} lookups={lookups} />;
    case 'reports':
      return <AccountantReportsTab lookups={lookups} />;
    case 'defaulters':
      return (
        <AccountantDefaultersTab
          lookups={lookups}
          onReceivePayment={(id) => {
            setCollectStudentId(id);
            onSwitchTab(0);
          }}
        />
      );
    case 'more':
      return (
        <AccountantMoreTab
          lookups={lookups}
          onOpenSettings={onOpenSettings}
          onLogout={onLogout}
        />
      );
    default:
      return null;
  }
};
