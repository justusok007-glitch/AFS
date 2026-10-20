import React from 'react';
import { AlertTriangle, BarChart3, Layers, Receipt, Settings as SettingsIcon, Wallet } from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from './AccountantShared';
import { FeeBreakdownCard } from './FeeBreakdownCard';

/** Accountant home: shortcut tiles for every option. */
export const AccountantDashboardTab: React.FC<{
  lookups: AccountantLookups;
  onSwitchTab: (index: number) => void;
  onOpenDefaulters: () => void;
  onOpenSettings: () => void;
}> = ({ lookups, onSwitchTab, onOpenDefaulters, onOpenSettings }) => {
  const { stringResource: t } = useStringResource();
  const ic = 'w-6 h-6';
  return (
    <div className="space-y-3">
    <FeeBreakdownCard lookups={lookups} />
    <div className="grid grid-cols-3 gap-3">
      <HomeTile tone="green" label={t('tab_collect')} icon={<Wallet className={ic} />} onClick={() => onSwitchTab(1)} />
      <HomeTile tone="purple" label={t('tab_vouchers')} icon={<Receipt className={ic} />} onClick={() => onSwitchTab(2)} />
      <HomeTile tone="orange" label={t('tab_reports')} icon={<BarChart3 className={ic} />} onClick={() => onSwitchTab(3)} />
      <HomeTile tone="red" label={t('tab_defaulters')} icon={<AlertTriangle className={ic} />} onClick={onOpenDefaulters} />
      <HomeTile tone="teal" label={t('acc_more_structure_title')} icon={<Layers className={ic} />} onClick={() => onSwitchTab(4)} />
      <HomeTile tone="blue" label={t('settings_title')} icon={<SettingsIcon className={ic} />} onClick={onOpenSettings} />
    </div>
    </div>
  );
};
