import { PushCard } from '../../components/PushCard';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  CalendarCheck,
  MessageSquare,
  BookOpen,
  Wallet,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { currentMonth, subscribeToClock, today } from '../../../domain/clock';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { AttendanceStatus, Profile, Student } from '../../../domain/models/models';
import { SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { NoticesCard } from '../comms/CommsShared';
import { AttendanceStatusBadge, PullToRefreshContainer } from './ParentHelpers';

export interface ParentHomeTabProps {
  parentProfile: Profile;
  childrenList: Student[];
  selectedChild: Student;
  onSelectChild: (childId: string) => void;
  /** Tab indexes: 1 attendance, 2 fees, 3 results, 4 diary, 5 messages. */
  onOpenTab: (index: number) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  unreadNotifications: number;
  unreadMessages: number;
}

export const ParentHomeTab: React.FC<ParentHomeTabProps> = ({
  parentProfile,
  childrenList,
  selectedChild,
  onSelectChild,
  onOpenTab,
  onOpenNotifications,
  unreadNotifications,
  unreadMessages,
}) => {
  const { stringResource: t, language } = useStringResource();
  const [todayDate, setTodayDate] = useState(() => today());
  const [statusByChild, setStatusByChild] = useState<Record<string, AttendanceStatus | null> | null>(null);
  const [pendingFee, setPendingFee] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => subscribeToClock(() => setTodayDate(today())), []);

  const load = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      const date = today();
      const month = currentMonth();
      const entries = await Promise.all(
        childrenList.map(async (c) => {
          const r = await AppModule.attendanceRepository.getParentSummary(c.id, month);
          const rec = r.ok ? r.data.dailyRecords.find((d) => d.date === date) : undefined;
          return [c.id, rec?.status ?? null] as const;
        })
      );
      setStatusByChild(Object.fromEntries(entries));
      const f = await AppModule.feeRepository.feeSummaryForStudent(selectedChild.id);
      setPendingFee(f.ok ? f.data.pending : 0);
      setRefreshing(false);
    },
    [childrenList, selectedChild.id]
  );
  useEffect(() => {
    void load(false);
  }, [load, todayDate]);

  const badge = (text: string | number) => (
    <span dir="ltr" className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#F28C28] text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs whitespace-nowrap">
      {text}
    </span>
  );

  const tiles: { key: string; label: string; icon: React.ReactNode; grad: [string, string]; tint: string; onClick: () => void; badge?: React.ReactNode }[] = [
    { key: 'att', tint: '#FFEFF1', grad: ['#FF7A7A', '#E8456B'], label: t('tab_attendance'), icon: <CalendarCheck className="w-6 h-6" />, onClick: () => onOpenTab(1) },
    { key: 'fees', tint: '#FFF4DF', grad: ['#FFC15A', '#F28C28'], label: t('tab_fees'), icon: <Wallet className="w-6 h-6" />, onClick: () => onOpenTab(2), badge: pendingFee > 0 ? badge(formatRupees(pendingFee)) : undefined },
    { key: 'res', tint: '#F1EBFF', grad: ['#B993FF', '#7B5BE6'], label: t('tab_results'), icon: <Award className="w-6 h-6" />, onClick: () => onOpenTab(3) },
    { key: 'diary', tint: '#FFF1E0', grad: ['#FFB866', '#F28C28'], label: t('tab_diary'), icon: <BookOpen className="w-6 h-6" />, onClick: () => onOpenTab(4) },
    { key: 'msg', tint: '#E6F8EF', grad: ['#55E0A5', '#1FB77C'], label: t('tab_messages'), icon: <MessageSquare className="w-6 h-6" />, onClick: () => onOpenTab(5), badge: unreadMessages > 0 ? badge(unreadMessages) : undefined },
    { key: 'notif', tint: '#FFEAF1', grad: ['#FF9DB3', '#F2587E'], label: t('notifications_label'), icon: <Bell className="w-6 h-6" />, onClick: onOpenNotifications, badge: unreadNotifications > 0 ? badge(unreadNotifications) : undefined },
  ];

  return (
    <PullToRefreshContainer refreshing={refreshing} onRefresh={() => void load(true)}>
      <SchoolCard className="space-y-2.5">
        <div className="flex items-center gap-2 font-heading text-sm font-bold text-[#14284B]">
          <span className="w-8 h-8 rounded-xl bg-[#F28C28]/12 flex items-center justify-center"><CalendarCheck className="w-4 h-4 text-[#F28C28]" /></span>
          <span>{t('home_today_attendance_title')}</span>
        </div>
        {statusByChild === null ? (
          <ShimmerPlaceholder lines={childrenList.length} />
        ) : (
          childrenList.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectChild(c.id)}
              style={{ background: idx % 2 === 0 ? '#E8F3FD' : '#EFEDFC', borderColor: c.id === selectedChild.id ? 'rgba(30,136,229,0.55)' : 'transparent' }}
              className="w-full flex items-center justify-between gap-2 rounded-2xl border-[1.5px] px-3.5 py-3 text-start cursor-pointer transition-colors"
            >
              <span className="text-sm font-semibold text-[#14284B] truncate">{language === 'ur' && c.nameUr ? c.nameUr : c.name}</span>
              <AttendanceStatusBadge status={statusByChild[c.id] ?? null} />
            </button>
          ))
        )}
      </SchoolCard>

      <PushCard compact />

      <NoticesCard user={parentProfile} />

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={x.onClick}
            style={{ background: `linear-gradient(135deg, ${x.tint}, #FFFFFF 85%)` }}
            className="school-card relative min-h-[96px] rounded-3xl border border-[#E4E8F0] flex flex-col items-center justify-center gap-2 px-3 py-3 text-center text-[#14284B] active:scale-95 transition-transform cursor-pointer"
          >
            <span
              className="ps-keep w-12 h-12 rounded-full flex items-center justify-center text-white"
              style={{
                background: `radial-gradient(circle at 30% 22%, rgba(255,255,255,0.55), rgba(255,255,255,0) 46%), linear-gradient(145deg, ${x.grad[0]}, ${x.grad[1]})`,
                boxShadow: `0 6px 14px ${x.grad[1]}55`,
              }}
            >
              {x.icon}
            </span>
            <span className="text-[13px] font-bold truncate max-w-full">{x.label}</span>
            {x.badge}
          </button>
        ))}
      </div>
    </PullToRefreshContainer>
  );
};
