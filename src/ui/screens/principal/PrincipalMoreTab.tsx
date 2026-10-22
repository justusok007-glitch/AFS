import { useBackHandler } from '../../navigation/backStack';
import { DiaryTab } from '../diary/DiaryTab';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Bell, BookOpen, ClipboardCheck, GraduationCap, LogOut, MessageSquare, Settings } from 'lucide-react';
import { HomeTile } from '../../components/HomeTile';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  ParentAttendanceSummary,
  Profile,
  StaffComplianceRow,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
import {
  EmptyState,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  FeeSummaryCards,
  StudentNameBlock,
  studentClassLabel,
} from '../accountant/AccountantShared';
import { percentColor } from './PrincipalShared';
import { StudentSearchPanel } from './StudentSearchPanel';
import { AccountantDefaultersTab } from '../accountant/AccountantDefaultersTab';
import { MessagesTab } from '../comms/MessagesTab';
import { NoticesCard, NoticesManager } from '../comms/CommsShared';

type Range = 'week' | 'month';
export type MoreView = 'menu' | 'students' | 'compliance' | 'notices' | 'messages' | 'defaulters' | 'diary';

export const PrincipalMoreTab: React.FC<{
  principal: Profile;
  lookups: AccountantLookups;
  view: MoreView;
  onViewChange: (v: MoreView) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}> = ({ principal, lookups, view, onViewChange, onOpenSettings, onLogout }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  useBackHandler(view !== 'menu', () => onViewChange('menu'));

  // compliance
  const [range, setRange] = useState<Range>('month');
  const [rows, setRows] = useState<StaffComplianceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const td = today();
    const from = range === 'week' ? addDaysIso(td, -6) : td.slice(0, 7) + '-01';
    const r = await AppModule.dashboardRepository.getStaffCompliance(null, from, td);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setRows(r.data);
    setLoading(false);
  }, [range]);
  useEffect(() => {
    void load();
  }, [load]);


  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };


  if (view === 'diary') return <DiaryTab user={principal} onBack={() => onViewChange('menu')} />;
  if (view === 'messages') return <MessagesTab user={principal} readOnly onBack={() => onViewChange('menu')} />;
  if (view === 'notices')
    return (
      <div className="space-y-3">
        <NoticesCard user={principal} />
        <NoticesManager actor={principal} lookups={lookups} onBack={() => onViewChange('menu')} />
      </div>
    );

  if (view === 'defaulters') {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => onViewChange('menu')} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <AccountantDefaultersTab lookups={lookups} allowExport={false} />
      </div>
    );
  }

  const backBtn = (
    <button type="button" onClick={() => onViewChange('menu')} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
      <BackIcon className="w-4 h-4" />
      <span>{t('back_button_label')}</span>
    </button>
  );
  const ic = 'w-6 h-6';

  if (view === 'menu') {
    return (
      <div className="grid grid-cols-3 gap-3">
        <HomeTile tone="teal" label={t('pr_more_students')} icon={<GraduationCap className={ic} />} onClick={() => onViewChange('students')} />
        <HomeTile tone="red" label={t('tab_defaulters')} icon={<AlertTriangle className={ic} />} onClick={() => onViewChange('defaulters')} />
        <HomeTile tone="indigo" label={t('pr_more_compliance')} icon={<ClipboardCheck className={ic} />} onClick={() => onViewChange('compliance')} />
        <HomeTile tone="pink" label={t('nt_manage_btn')} icon={<Bell className={ic} />} onClick={() => onViewChange('notices')} />
        <HomeTile tone="orange" label={t('tab_diary')} icon={<BookOpen className={ic} />} onClick={() => onViewChange('diary')} />
        <HomeTile tone="green" label={t('ms_audit_btn')} icon={<MessageSquare className={ic} />} onClick={() => onViewChange('messages')} />
        <HomeTile tone="blue" label={t('settings_open_from_more')} icon={<Settings className={ic} />} onClick={onOpenSettings} />
        <HomeTile tone="red" label={t('logout_button')} icon={<LogOut className={ic} />} onClick={onLogout} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {backBtn}
      {view === 'students' && <StudentSearchPanel user={principal} lookups={lookups} />}

      {view === 'compliance' && (
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('pr_more_compliance')}</h3>
        <p className="text-[11px] text-[#6B7385]">{t('pr_more_compliance_hint')}</p>
        <TabRow
          tabs={[
            { id: 'week' as Range, label: t('pr_range_week') },
            { id: 'month' as Range, label: t('pr_range_month') },
          ]}
          selected={range}
          onSelect={setRange}
        />
        {loading || lookups.loading ? (
          <ShimmerPlaceholder lines={3} />
        ) : failed ? (
          <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
        ) : (
          [...rows]
            .sort((a, b) => a.percent - b.percent)
            .map((r) => {
              const names = language === 'ur' ? r.teacherNamesUr : r.teacherNamesEn;
              return (
                <div key={r.sectionId} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#14284B]">{className(r.classId)} - {r.sectionName}</div>
                    <div className="text-[11px] text-[#6B7385] truncate">{names.length ? names.join('، ') : t('pr_no_teacher')}</div>
                    <div dir="ltr" className="text-[10px] text-[#6B7385] text-start">{r.daysMarked}/{r.daysExpected} {t('pr_days_marked')}</div>
                  </div>
                  <StatusChip label={`${r.percent}%`} tone={r.percent >= 90 ? 'success' : r.percent >= 75 ? 'warning' : 'error'} />
                </div>
              );
            })
        )}
      </SchoolCard>
      )}
    </div>
  );
};
