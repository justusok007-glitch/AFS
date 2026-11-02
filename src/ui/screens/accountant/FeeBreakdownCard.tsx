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
/** charged === null: the bar shows only Received (this month) and Pending. */
interface Totals { charged: number | null; received: number; pending: number }

/** Monthly fees from this month onward are "new arrears" when left unpaid (the app started in Oct 2026). */
const NEW_ARREARS_FROM = '2026-10';

const Money: React.FC<{ v: number; className?: string }> = ({ v, className }) => (
  <span dir="ltr" className={`font-mono tabular-nums ${className ?? ''}`}>{formatRupees(v)}</span>
);

const GROUP_OF_CATEGORY: Record<string, GroupId> = { ARREARS: 'arrears', ADMISSION: 'admission', ANNUAL: 'annual' };
const GROUP_OF_HEAD: Record<string, GroupId> = { fh_arrears: 'arrears', fh_admission: 'admission', fh_annual: 'annual' };

const tagParts = (remarks: string | null | undefined, tag: string): [string, number][] => {
  const m = new RegExp(`\\[${tag}:([^\\]]+)\\]`).exec(remarks ?? '');
  return m ? m[1].split(',').map((part) => { const [k, v] = part.split('='); return [k, Number(v) || 0] as [string, number]; }) : [];
};

const net = (it: { amount: number; waivedAmount?: number }) => Math.max(0, it.amount - (it.waivedAmount ?? 0));

/**
 * Previous arrears: charged / received (all receipts) / pending, from the bills and receipts.
 * New arrears (Oct 2026 to last month): pending now, and money received this month for those months.
 * This month's fee: the students' monthly fees, received for this month (and advances), pending.
 * Admission fee and Annual charges: charged on this month's bills, received this month, pending on this month's bills.
 * Monthly fee money goes to the month written on the receipt ("Fee For"); a receipt without the month
 * fills the student's most recent month first, then the months before it.
 */
export function computeBreakdown(
  vouchers: FeeVoucher[], payments: FeePayment[], monthlyFees: { studentId: string; amount: number }[], month: string
): Record<GroupId, Totals> {
  const g: Record<GroupId, Totals> = {
    arrears: { charged: 0, received: 0, pending: 0 },
    newArrears: { charged: null, received: 0, pending: 0 },
    month: { charged: monthlyFees.reduce((sum, f) => sum + f.amount, 0), received: 0, pending: 0 },
    admission: { charged: 0, received: 0, pending: 0 },
    annual: { charged: 0, received: 0, pending: 0 },
    other: { charged: 0, received: 0, pending: 0 },
  };
  const tuitionDue: Record<string, Record<string, number>> = {}; // student -> month -> monthly fee billed
  for (const v of vouchers) {
    for (const it of v.items) {
      const open = Math.max(0, net(it) - (it.paidAmount ?? 0));
      if (it.feeHeadId === 'fh_arrears') g.arrears.charged! += net(it);
      else if (it.feeHeadId === 'fh_tuition') {
        (tuitionDue[v.studentId] ??= {});
        tuitionDue[v.studentId][v.billingMonth] = (tuitionDue[v.studentId][v.billingMonth] ?? 0) + net(it);
        if (v.billingMonth >= NEW_ARREARS_FROM && v.billingMonth < month) g.newArrears.pending += open;
        else if (v.billingMonth < NEW_ARREARS_FROM) g.other.charged! += net(it);
      } else if (it.feeHeadId === 'fh_admission' || it.feeHeadId === 'fh_annual') {
        if (v.billingMonth === month) {
          const x = g[it.feeHeadId === 'fh_admission' ? 'admission' : 'annual'];
          x.charged! += net(it);
          x.pending += open;
        }
      } else g.other.charged! += net(it);
    }
  }

  const assigned: Record<string, Record<string, number>> = {}; // student -> month -> monthly fee money so far
  const addMonth = (st: string, m: string, v: number, thisMonth: boolean) => {
    (assigned[st] ??= {});
    assigned[st][m] = (assigned[st][m] ?? 0) + v;
    if (m >= month) g.month.received += v;
    else if (m >= NEW_ARREARS_FROM) { if (thisMonth) g.newArrears.received += v; }
    else g.other.received += v;
  };
  const sorted = payments.filter((p) => !p.isVoid).sort((x, y) => x.paidOn.localeCompare(y.paidOn));
  for (const p of sorted) {
    const thisMonth = p.paidOn.slice(0, 7) === month;
    const by = tagParts(p.remarks, 'by');
    let monthly = 0;
    const other = (id: GroupId, v: number) => {
      if (id === 'arrears' || id === 'other') g[id].received += v;
      else if (thisMonth) g[id].received += v;
    };
    if (by.length) {
      for (const [k, v] of by) { if (k === 'MONTHLY') monthly += v; else other(GROUP_OF_CATEGORY[k] ?? 'other', v); }
    } else {
      for (const a of p.allocations ?? []) {
        if (a.feeHeadId === 'fh_tuition') monthly += a.allocatedAmount;
        else other(GROUP_OF_HEAD[a.feeHeadId ?? ''] ?? 'other', a.allocatedAmount);
      }
    }
    let left = monthly;
    for (const [m, v] of tagParts(p.remarks, 'mon')) {
      const take = Math.min(v, left);
      if (take <= 0) break;
      addMonth(p.studentId, m, take, thisMonth);
      left -= take;
    }
    if (left > 0) {
      // no month on the receipt: most recent billed month first, then older months
      const due = tuitionDue[p.studentId] ?? {};
      for (const m of Object.keys(due).sort().reverse()) {
        const take = Math.min(left, Math.max(0, due[m] - (assigned[p.studentId]?.[m] ?? 0)));
        if (take > 0) { addMonth(p.studentId, m, take, thisMonth); left -= take; }
        if (left <= 0) break;
      }
      if (left > 0) addMonth(p.studentId, month, left, thisMonth);
    }
  }
  g.arrears.pending = Math.max(0, g.arrears.charged! - g.arrears.received);
  g.month.pending = Math.max(0, g.month.charged! - g.month.received);
  g.other.pending = Math.max(0, g.other.charged! - g.other.received);
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
    const [v, pay, mf, r] = await Promise.all([
      AppModule.feeRepository.getAllVouchers(),
      AppModule.feeRepository.getAllPayments(),
      AppModule.feeRepository.getMonthlyFees(),
      AppModule.feeRepository.getCollectionReport({
        fromDate: `${month}-01`, toDate: today(), campusId: campus === 'ALL' ? null : campus,
      }),
    ]);
    const list = v.ok ? v.data.filter((x) => campus === 'ALL' || x.campusId === campus) : [];
    const campusOf: Record<string, string> = {};
    (v.ok ? v.data : []).forEach((x) => (campusOf[x.studentId] = x.campusId));
    (mf.ok ? mf.data : []).forEach((x) => (campusOf[x.studentId] ??= x.campusId));
    const pays = pay.ok ? pay.data.filter((p) => campus === 'ALL' || campusOf[p.studentId] === campus) : [];
    const fees = mf.ok ? mf.data.filter((x) => campus === 'ALL' || x.campusId === campus) : [];
    setGroups(computeBreakdown(list, pays, fees, month));
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
  const sum = (k: 'pending') => (groups ? Object.values(groups).reduce((s, x) => s + x[k], 0) : 0);
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
            {rows.filter((r) => (r.id !== 'other' && r.id !== 'newArrears') || (groups[r.id].charged ?? 0) > 0 || groups[r.id].received > 0 || groups[r.id].pending > 0).map((r) => {
              const x = groups[r.id];
              const base = r.id === 'admission' || r.id === 'annual' ? x.received + x.pending : x.charged ?? x.received + x.pending;
              const pct = base > 0 ? Math.min(100, Math.round((x.received / base) * 100)) : 0;
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
                    {x.charged !== null && (
                      <div><div className="text-[#6B7385]">{t('fb_charged')}</div><Money v={x.charged} className="font-semibold text-[#14284B]" /></div>
                    )}
                    <div><div className="text-[#6B7385]">{r.id === 'newArrears' || r.id === 'admission' || r.id === 'annual' ? t('fb_received_month') : t('fb_received')}</div><Money v={x.received} className="font-semibold text-[#2E9E5B]" /></div>
                    <div><div className="text-[#6B7385]">{t('fb_pending')}</div><Money v={x.pending} className="font-semibold text-[#D64545]" /></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs font-bold border-t border-[#E4E8F0] pt-2">
            <span className="text-[#14284B]">{t('fb_total_pending')}</span>
            <Money v={sum('pending')} className="text-[#D64545]" />
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
