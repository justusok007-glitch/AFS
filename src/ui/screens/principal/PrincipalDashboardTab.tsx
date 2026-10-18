import React from 'react';
import {
  Award,
  Bell,
  CalendarCheck,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  Settings as SettingsIcon,
  Wallet,
} from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { useStringResource } from '../../theme/LocaleContext';
import { NoticesCard } from '../comms/CommsShared';
import { Profile } from '../../../domain/models/models';
import { MoreView } from './PrincipalMoreTab';

/** Principal home: shortcut tiles for every option. Summaries now live inside their own tabs. */
export const PrincipalDashboardTab: React.FC<{
  principal: Profile;
  onSwitchTab: (index: number) => void;
  onOpenMore: (view: MoreView) => void;
  onOpenSettings: () => void;
}> = ({ principal, onSwitchTab, onOpenMore, onOpenSettings }) => {
  const { stringResource: t } = useStringResource();
  const ic = 'w-6 h-6';
  return (
    <div className="space-y-3">
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
