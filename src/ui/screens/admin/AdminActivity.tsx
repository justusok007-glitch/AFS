import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppModule } from '../../../di/AppModule';
import { ActivityRow, fetchActivity } from '../../../data/supabase/activity';
import { Profile, Role } from '../../../domain/models/models';
import { RoleActionRow } from '../../../domain/repository/repositories';
import { StringKey } from '../../../res/strings';
import { EmptyState, SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { CHART, selectCls } from '../principal/PrincipalShared';

const ROLES: Role[] = [Role.ADMIN, Role.PRINCIPAL, Role.VICE_PRINCIPAL, Role.ACCOUNTANT, Role.TEACHER, Role.ATTENDANCE_COORDINATOR, Role.PARENT];
const ACTIVE_NOW_MS = 6 * 60 * 1000;
const karachiDay = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
const karachiTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });

export const AdminActivity: React.FC<{ admin: Profile; onBack: () => void }> = ({ admin, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [serverNow, setServerNow] = useState(Date.now());
  const [actions, setActions] = useState<RoleActionRow[]>([]);
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const since = karachiDay(Date.now() - 29 * 86400000);
      const [pr, act, ra] = await Promise.all([
        AppModule.settingsRepository.getProfiles(null, null),
        fetchActivity(),
        AppModule.dashboardRepository.getRoleActions(since),
      ]);
      if (pr.ok) setProfiles(pr.data.filter((p) => p.isActive));
      setRows(act.rows);
      setServerNow(act.serverNow);
      if (ra.ok) setActions(ra.data);
    } catch {
      setFailed(true);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(id);
  }, [load]);

  const roleLabel = (r: Role) => t(`role_${r.toLowerCase()}` as StringKey);
  const people = useMemo(() => profiles.filter((p) => roleFilter === 'ALL' || p.role === roleFilter), [profiles, roleFilter]);
  const ids = useMemo(() => new Set(people.map((p) => p.id)), [people]);

  const stats = useMemo(() => {
    const today = karachiDay(serverNow);
    const start30 = karachiDay(serverNow - 29 * 86400000);
    const lastSeen = new Map<string, string>();
    const daysActive = new Map<string, number>();
    const perDay = new Map<string, Set<string>>();
    const todayUsers = new Set<string>();
    const month = new Set<string>();
    rows.filter((r) => ids.has(r.userId)).forEach((r) => {
      const cur = lastSeen.get(r.userId);
      if (!cur || r.lastSeen > cur) lastSeen.set(r.userId, r.lastSeen);
      if (r.day >= start30) {
        month.add(r.userId);
        daysActive.set(r.userId, (daysActive.get(r.userId) ?? 0) + 1);
        (perDay.get(r.day) ?? perDay.set(r.day, new Set()).get(r.day)!).add(r.userId);
      }
      if (r.day === today) todayUsers.add(r.userId);
    });
    const now = [...lastSeen.entries()].filter(([, v]) => serverNow - new Date(v).getTime() <= ACTIVE_NOW_MS).length;
    const chart = Array.from({ length: 30 }, (_, i) => {
      const d = karachiDay(serverNow - (29 - i) * 86400000);
      return { day: d.slice(5), value: perDay.get(d)?.size ?? 0 };
    });
    const never = people.filter((p) => !month.has(p.id)).length;
    return { now, today: todayUsers.size, month: month.size, never, chart, lastSeen, daysActive };
  }, [rows, ids, people, serverNow]);

  const sortedPeople = useMemo(
    () =>
      [...people].sort((a, b) => {
        const la = stats.lastSeen.get(a.id) ?? '';
        const lb = stats.lastSeen.get(b.id) ?? '';
        return lb.localeCompare(la) || a.fullName.localeCompare(b.fullName);
      }),
    [people, stats.lastSeen]
  );

  const byUser = useMemo(() => {
    const m = new Map<string, Partial<Record<RoleActionRow['kind'], number>>>();
    actions.forEach((a) => {
      const cur = m.get(a.userId) ?? {};
      cur[a.kind] = (cur[a.kind] ?? 0) + a.count;
      m.set(a.userId, cur);
    });
    return m;
  }, [actions]);

  const ranking = useMemo(() => {
    const total = (id: string) => Object.values(byUser.get(id) ?? {}).reduce((s, n) => s + (n ?? 0), 0);
    return ROLES.map((role) => {
      const members = profiles
        .filter((p) => p.role === role && total(p.id) > 0)
        .sort((a, b) => total(b.id) - total(a.id));
      return { role, total: members.reduce((s, p) => s + total(p.id), 0), members, total_: total };
    })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [profiles, byUser]);

  const block = (label: string, value: number, color: string) => (
    <SchoolCard className="p-3.5 space-y-1">
      <div className="text-[11px] font-semibold text-[#6B7385]">{label}</div>
      <div dir="ltr" className="font-mono text-3xl font-bold leading-none text-start" style={{ color }}>{value}</div>
    </SchoolCard>
  );
  const name = (p: Profile) => (language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName);

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <select className={selectCls} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'ALL' | Role)} aria-label={t('act_role_filter')}>
        <option value="ALL">{t('act_all_roles')}</option>
        {ROLES.map((r) => (<option key={r} value={r}>{roleLabel(r)}</option>))}
      </select>

      {loading && rows.length === 0 ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('act_failed_title')} description={t('act_failed_hint')} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} actionLabel={t('retry_button')} onAction={() => void load()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {block(t('act_now'), stats.now, '#2E9E5B')}
            {block(t('act_today'), stats.today, '#14284B')}
            {block(t('act_month'), stats.month, '#2F80ED')}
            {block(t('act_never'), stats.never, stats.never > 0 ? '#D64545' : '#6B7385')}
          </div>

          <SchoolCard className="space-y-2">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('act_daily_chart')}</div>
            <div dir="ltr" className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chart} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barCategoryGap={1}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="day" tick={{ fontSize: 8 }} interval={0} angle={-60} textAnchor="end" height={44} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART.blue} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SchoolCard>

          <SchoolCard className="space-y-2">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('act_ranking')}</div>
            {ranking.length === 0 ? (
              <p className="text-xs text-[#6B7385]">{t('act_none')}</p>
            ) : (
              ranking.map((g) => (
                <div key={g.role} className="border-t border-[#E4E8F0] pt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#14284B]">
                    <span>{roleLabel(g.role)}</span>
                    <span dir="ltr" className="font-mono">{g.total}</span>
                  </div>
                  {g.members.map((p) => {
                    const k = byUser.get(p.id) ?? {};
                    return (
                      <div key={p.id} className="text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#1B2233] truncate">{name(p)}</span>
                          <span dir="ltr" className="font-mono text-[#6B7385]">{g.total_(p.id)}</span>
                        </div>
                        <div className="text-[#6B7385]">
                          {(['attendance', 'payments', 'marks', 'admin'] as const)
                            .filter((x) => (k[x] ?? 0) > 0)
                            .map((x) => `${t(`act_kind_${x}` as StringKey)} ${k[x]}`)
                            .join(' · ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <p className="text-[10px] text-[#6B7385]">{t('act_ranking_note')}</p>
          </SchoolCard>

          <SchoolCard className="space-y-1.5">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('act_people')}</div>
            {sortedPeople.map((p) => {
              const ls = stats.lastSeen.get(p.id);
              const days = stats.daysActive.get(p.id) ?? 0;
              const live = ls && serverNow - new Date(ls).getTime() <= ACTIVE_NOW_MS;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#14284B] truncate">{name(p)}</div>
                    <div className="text-[11px] text-[#6B7385]">{roleLabel(p.role)}{days > 0 ? ` · ${days} ${t('act_days_30')}` : ''}</div>
                  </div>
                  <div className="text-end shrink-0">
                    {live ? (
                      <span className="text-[11px] font-bold text-[#2E9E5B]">{t('act_online')}</span>
                    ) : ls ? (
                      <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">{karachiTime(ls)}</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#D64545]">{t('act_never_seen')}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </SchoolCard>
        </>
      )}
    </div>
  );
};
