import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  MessageSquare,
  MoreHorizontal,
  Settings as SettingsIcon,
} from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { useStringResource } from '../../theme/LocaleContext';
import { TeacherHomeTab, TeacherHomeTabProps } from './TeacherHomeTab';

/** Teacher home: shortcut tiles. Today's sections and notices open from their own tile. */
export const TeacherDashboardTab: React.FC<
  TeacherHomeTabProps & { onSwitchTab: (index: number) => void; onOpenSettings: () => void }
> = ({ onSwitchTab, onOpenSettings, ...homeProps }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const [showToday, setShowToday] = useState(false);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ic = 'w-6 h-6';

  if (showToday) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setShowToday(false)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <TeacherHomeTab {...homeProps} />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-3">
      <HomeTile tone="teal" label={t('teacher_today_attendance_title')} icon={<CalendarDays className={ic} />} onClick={() => setShowToday(true)} />
      <HomeTile tone="red" label={t('tab_attendance')} icon={<CalendarCheck className={ic} />} onClick={() => onSwitchTab(1)} />
      <HomeTile tone="orange" label={t('tab_marks')} icon={<ClipboardCheck className={ic} />} onClick={() => onSwitchTab(2)} />
      <HomeTile tone="green" label={t('tab_messages')} icon={<MessageSquare className={ic} />} onClick={() => onSwitchTab(3)} />
      <HomeTile tone="indigo" label={t('tab_more')} icon={<MoreHorizontal className={ic} />} onClick={() => onSwitchTab(4)} />
      <HomeTile tone="blue" label={t('settings_title')} icon={<SettingsIcon className={ic} />} onClick={onOpenSettings} />
    </div>
  );
};
