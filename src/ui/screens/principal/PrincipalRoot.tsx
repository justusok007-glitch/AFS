import React from 'react';
import { Award } from 'lucide-react';
import { EmptyState } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { PrincipalAttendanceTab } from './PrincipalAttendanceTab';
import { PrincipalDashboardTab } from './PrincipalDashboardTab';
import { PrincipalFeesTab } from './PrincipalFeesTab';
import { PrincipalMoreTab } from './PrincipalMoreTab';

export interface PrincipalRootProps {
  tabId: string;
  onSwitchTab: (index: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const PrincipalRoot: React.FC<PrincipalRootProps> = ({
  tabId,
  onSwitchTab,
  onOpenSettings,
  onLogout,
}) => {
  const { stringResource: t } = useStringResource();
  const lookups = useAccountantLookups();
  switch (tabId) {
    case 'dashboard':
      return <PrincipalDashboardTab lookups={lookups} onSwitchTab={onSwitchTab} />;
    case 'attendance':
      return <PrincipalAttendanceTab lookups={lookups} />;
    case 'fees':
      return <PrincipalFeesTab lookups={lookups} />;
    case 'results':
      return (
        <EmptyState
          title={t('pr_results_soon_title')}
          description={t('pr_results_soon_body')}
          icon={<Award className="w-6 h-6 text-[#F28C28]" />}
        />
      );
    case 'more':
      return <PrincipalMoreTab lookups={lookups} onOpenSettings={onOpenSettings} onLogout={onLogout} />;
    default:
      return null;
  }
};
