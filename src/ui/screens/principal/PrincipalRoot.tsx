import React, { useState } from 'react';
import { Profile } from '../../../domain/models/models';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { PrincipalAttendanceTab } from './PrincipalAttendanceTab';
import { PrincipalDashboardTab } from './PrincipalDashboardTab';
import { PrincipalFeesTab } from './PrincipalFeesTab';
import { MoreView, PrincipalMoreTab } from './PrincipalMoreTab';
import { PrincipalResultsTab } from './PrincipalResultsTab';

export interface PrincipalRootProps {
  principal: Profile;
  tabId: string;
  onSwitchTab: (index: number) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const PrincipalRoot: React.FC<PrincipalRootProps> = ({
  principal,
  tabId,
  onSwitchTab,
  onOpenSettings,
  onLogout,
}) => {
  const lookups = useAccountantLookups();
  const [moreView, setMoreView] = useState<MoreView>('menu');
  const openMore = (v: MoreView) => {
    setMoreView(v);
    onSwitchTab(4);
  };
  switch (tabId) {
    case 'dashboard':
      return <PrincipalDashboardTab principal={principal} onSwitchTab={onSwitchTab} onOpenMore={openMore} onOpenSettings={onOpenSettings} />;
    case 'attendance':
      return <PrincipalAttendanceTab lookups={lookups} />;
    case 'fees':
      return <PrincipalFeesTab lookups={lookups} />;
    case 'results':
      return <PrincipalResultsTab principal={principal} lookups={lookups} />;
    case 'more':
      return <PrincipalMoreTab principal={principal} lookups={lookups} view={moreView} onViewChange={setMoreView} onOpenSettings={onOpenSettings} onLogout={onLogout} />;
    default:
      return null;
  }
};
