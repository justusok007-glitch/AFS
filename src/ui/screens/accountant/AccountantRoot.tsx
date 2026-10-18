import React, { useState } from 'react';
import { Profile } from '../../../domain/models/models';
import { useAccountantLookups } from './AccountantShared';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantDashboardTab } from './AccountantDashboardTab';
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
  const [showDefaulters, setShowDefaulters] = useState(false);
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  switch (tabId) {
    case 'dashboard':
      if (showDefaulters) {
        return (
          <div className="space-y-3">
            <button type="button" onClick={() => setShowDefaulters(false)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
              <BackIcon className="w-4 h-4" />
              <span>{t('back_button_label')}</span>
            </button>
            <AccountantDefaultersTab
              lookups={lookups}
              onReceivePayment={(id) => {
                setCollectStudentId(id);
                setShowDefaulters(false);
                onSwitchTab(1);
              }}
            />
          </div>
        );
      }
      return <AccountantDashboardTab onSwitchTab={onSwitchTab} onOpenDefaulters={() => setShowDefaulters(true)} onOpenSettings={onOpenSettings} />;
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
