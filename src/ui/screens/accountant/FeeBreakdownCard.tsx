import React, { useCallback, useEffect, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { currentMonth, today } from '../../../domain/clock';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { FeeCategory, FeeCollectionReport, FeePayment, FeeVoucher } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { SchoolCard, ShimmerPlaceholder, TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from './AccountantShared';

type GroupId = 'arrears' | 'newArrears' | 'month' | 'admission' | 'annual' | 'other';
interface Totals { charged: number; received: number }

/** Monthly fees from this month onward are "new arrears" when left unpaid (the app started in Oct 2026). */
const NEW_ARREARS_FROM = '2026-10';

const emptyGroups = (): Record<GroupId, number> => ({ arrears: 0, newArrears: 0, month: 0, admission: 0, annual: 0, other: 0 });

/** Which bar a tuition month belongs to: this month and later (advances) = this month; Oct 2026 to last month = new arrears. */
const groupOfMonth = (billingMonth: string, month: string): GroupId =>
  billingMonth >= month ? 'month' : billingMonth >= NEW_ARREARS_FROM ? 'newArrears' : 'other';

const Money: React.FC<{ v: number; className?: string }> = ({ v, className }) => (
  <span dir="ltr" className={`font-mono tabular-nums ${className ?? ''}`}>{formatRupees(v)}</span>
);

/** Charged per group comes from the bills. */
function chargedByGroup(vouchers: FeeVoucher[], month: string): Record<GroupId, number> {
  const g = emptyGroups();
  for (const v of vouchers) {
    for (const it of v.items) {
      const id: GroupId =
        it.feeHeadId === 'fh_arrears' ? 'arrears'
        : it.feeHeadId === 'fh_tuition' ? groupOfMonth(v.billingMonth, month)
        : it.feeHeadId === 'fh_admission' ? 'admission'
        : it.feeHeadId === 'fh_annual' ? 'annual'
        : 'other';
      g[id] += Math.max(0, it.amount - (it.waivedAmount ?? 0));
    }
  }
  return g;
}

const GROUP_OF_CATEGORY: Record<string, GroupId> = { ARREARS: 'arrears', ADMISSION: 'admission', ANNUAL: 'annual' };
const GROUP_OF_HEAD: Record<string, GroupId> = { fh_arrears: 'arrears', fh_admission: 'admission', fh_annual: 'annual' };

const tagParts = (remarks: string | null | undefined, tag: string): [string, number][] => {
  const m = new RegExp(`\\[${tag}:([^\\]]+)\\]`).exec(remarks ?? '');
  return m ? m[1].split(',').map((part) => { const [k, v] = part.split('='); return [k, Number(v) || 0] as [string, number]; }) : [];
};

/**
 * Received per group, by the fee type the cashier wrote on the receipt (bills' allocation when there is none).
 * Monthly fee money goes to the month written on the receipt ("Fee For"). When a receipt does not say the month,
 * it fills the student's most recent month first, then the months before it.
 */
function receivedByGroup(payments: FeePayment[], vouchers: FeeVoucher[], month: string): Record<GroupId, number> {
  const g = emptyGroups();
  const byMonth: Record<string, Record<string, number>> = {}; // student -> month -> monthly fee received
  const unknown: Record<string, number> = {}; // student -> monthly fee received without a month
  const addMonth = (st: string, m: string, v: number) => { (byMonth[st] ??= {}); byMonth[st][m] = (byMonth[st][m] ?? 0) + v; };

  for (const p of payments) {
    if (p.isVoid) continue;
    const by = tagParts(p.remarks, 'by');
    let monthly = 0;
    if (by.length) {
      for (const [k, v] of by) {
        if (k === 'MONTHLY') monthly += v;
        else g[GROUP_OF_CATEGORY[k] ?? 'other'] += v;
      }
    } else {
      for (const a of p.allocations ?? []) {
        if (a.feeHeadId === 'fh_tuition') monthly += a.allocatedAmount;
        else g[GROUP_OF_HEAD[a.feeHeadId ?? ''] ?? 'other'] += a.allocatedAmount;
      }
    }
    let known = 0;
    for (const [m, v] of tagParts(p.remarks, 'mon')) {
      const take = Math.min(v, monthly - known);
      if (take <= 0) break;
      addMonth(p.studentId, m, take);
      known += take;
    }
    if (monthly > known) unknown[p.studentId] = (unknown[p.studentId] ?? 0) + monthly - known;
  }

  // money without a month: most recent billed month first, then older months
  for (const [st, amount] of Object.entries(unknown)) {
    const due: Record<string, number> = {};
    vouchers.filter((v) => v.studentId === st).forEach((v) =>
      v.items.filter((it) => it.feeHeadId === 'fh_tuition').forEach((it) => {
        due[v.billingMonth] = (due[v.billingMonth] ?? 0) + Math.max(0, it.amount - (it.waivedAmount ?? 0));
      })
    );
    let left = amount;
    for (const m of Object.keys(due).sort().reverse()) {
      const room = Math.max(0, due[m] - (byMonth[st]?.[m] ?? 0));
      const take = Math.min(left, room);
      if (take > 0) { addMonth(st, m, take); left -= take; }
      if (left <= 0) break;
    }
    if (left > 0) addMonth(st, month, left);
  }

  for (const months of Object.values(byMonth)) {
    for (const [m, v] of Object.entries(months)) g[groupOfMonth(m, month)] += v;
  }
  return g;
}

/** Fee breakdown: previous arrears, new arrears (since Oct 2026), this month's fee, admission and annual charges (charged / received / pending). */
export const FeeBreakdownCard: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [campus, setCampus] = useState('ALL');
  const [groups, setGroups] = useState<Record<GroupId, Totals> | null>(null);
  const [report, setReport] = useState<FeeCollectionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const month = currentMonth();

  const load = useCallback(async () => {
    setLoading(true);
    const [v, pay, r] = await Promise.all([
      AppModule.feeRepository.getAllVouchers(),
      AppModule.feeRepository.getAllPayments(),
      AppModule.feeRepository.getCollectionReport({
        fromDate: `${month}-01`, toDate: today(), campusId: campus === 'ALL' ? null : campus,
      }),
    ]);
    const list = v.ok ? v.data.filter((x) => campus === 'ALL' || x.campusId === campus) : [];
    const campusOf: Record<string, string> = {};
    (v.ok ? v.data : []).forEach((x) => (campusOf[x.studentId] = x.campusId));
    const pays = pay.ok ? pay.data.filter((p) => campus === 'ALL' || campusOf[p.studentId] === campus) : [];
    const charged = chargedByGroup(list, month);
    const received = receivedByGroup(pays, list, month);
    const merged = {} as Record<GroupId, Totals>;
    (Object.keys(charged) as GroupId[]).forEach((k) => (merged[k] = { charged: charged[k], received: received[k] }));
    setGroups(merged);
    setReport(r.ok ? r.data : null);
    setLoading(false);
  }, [campus, month]);
  useEffect(() => { void load(); }, [load]);

  const rows: { id: GroupId; label: string }[] = [
    { id: 'arrears', label: t('acc_cat_ARREARS') },
    { id: 'newArrears', label: t('fb_new_arrears') },
    { id: 'month', label: t('fb_this_month') },
    { id: 'admission', label: t('acc_cat_ADMISSION') },
    { id: 'annual', label: t('acc_cat_ANNUAL') },
    { id: 'other', label: t('fb_other') },
  ];
  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn })),
  ];
  const sum = (k: keyof Totals) => (groups ? Object.values(groups).reduce((s, x) => s + x[k], 0) : 0);
  const cats = (Object.entries(report?.byCategory ?? {}) as [FeeCategory, number][]).filter(([, v]) => v > 0);

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('fb_title')}</h3>
      <TabRow tabs={campusTabs} selected={campus} onSelect={setCampus} />
      {loading || !groups ? (
        <ShimmerPlaceholder lines={4} />
      ) : (
        <>
          <div className="space-y-2.5">
            {rows.filter((r) => (r.id !== 'other' && r.id !== 'newArrears') || groups[r.id].charged > 0 || groups[r.id].received > 0).map((r) => {
              const x = groups[r.id];
              const pending = Math.max(0, x.charged - x.received);
              const pct = x.charged > 0 ? Math.min(100, Math.round((x.received / x.charged) * 100)) : 0;
              return (
                <div key={r.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#14284B]">{r.label}</span>
                    <span dir="ltr" className="font-mono text-[11px] text-[#6B7385]">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E4E8F0] overflow-hidden" dir="ltr">
                    <div className="h-full rounded-full bg-[#2E9E5B]" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[11px]">
                    <div><div className="text-[#6B7385]">{t('fb_charged')}</div><Money v={x.charged} className="font-semibold text-[#14284B]" /></div>
                    <div><div className="text-[#6B7385]">{t('fb_received')}</div><Money v={x.received} className="font-semibold text-[#2E9E5B]" /></div>
                    <div><div className="text-[#6B7385]">{t('fb_pending')}</div><Money v={pending} className="font-semibold text-[#D64545]" /></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-1 text-[11px] border-t border-[#E4E8F0] pt-2">
            <div><div className="text-[#6B7385]">{t('fb_total_charged')}</div><Money v={sum('charged')} className="font-bold text-[#14284B]" /></div>
            <div><div className="text-[#6B7385]">{t('fb_received')}</div><Money v={sum('received')} className="font-bold text-[#2E9E5B]" /></div>
            <div><div className="text-[#6B7385]">{t('fb_pending')}</div><Money v={Math.max(0, sum('charged') - sum('received'))} className="font-bold text-[#D64545]" /></div>
          </div>
          <div className="space-y-1 border-t border-[#E4E8F0] pt-2">
            <div className="text-xs font-bold text-[#14284B]">{t('fb_collected_month')}</div>
            {cats.length === 0 ? (
              <p className="text-[11px] text-[#6B7385]">—</p>
            ) : (
              cats.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span>{t(`acc_cat_${k}` as StringKey)}</span>
                  <Money v={v} className="font-semibold" />
                </div>
              ))
            )}
            {Object.entries(report?.byCollectedAt ?? {}).filter(([, v]) => v > 0).length > 1 && (
              <div className="pt-1 space-y-1">
                <div className="text-xs font-bold text-[#14284B]">{t('fb_collected_at')}</div>
                {Object.entries(report?.byCollectedAt ?? {}).filter(([, v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-xs">
                    <span>{k === 'Girls' ? t('fb_at_girls') : t('fb_at_boys')}</span>
                    <Money v={v} className="font-semibold" />
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-bold border-t border-[#E4E8F0] pt-1">
              <span>{t('fb_total')}</span>
              <Money v={report?.totalCollectedRupees ?? 0} className="text-[#2E9E5B]" />
            </div>
          </div>
        </>
      )}
    </SchoolCard>
  );
};
