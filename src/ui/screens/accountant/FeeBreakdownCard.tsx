import React, { useCallback, useEffect, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { currentMonth, today } from '../../../domain/clock';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { FeeCategory, FeeCollectionReport, FeePayment, FeeVoucher } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { SchoolCard, ShimmerPlaceholder, TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from './AccountantShared';

type GroupId = 'arrears' | 'month' | 'admission' | 'annual' | 'other';
interface Totals { charged: number; received: number }

const Money: React.FC<{ v: number; className?: string }> = ({ v, className }) => (
  <span dir="ltr" className={`font-mono tabular-nums ${className ?? ''}`}>{formatRupees(v)}</span>
);

/** Charged per group comes from the bills; this month's group also holds fees billed for later months (advances). */
function chargedByGroup(vouchers: FeeVoucher[], month: string): Record<GroupId, number> {
  const g: Record<GroupId, number> = { arrears: 0, month: 0, admission: 0, annual: 0, other: 0 };
  for (const v of vouchers) {
    for (const it of v.items) {
      const id: GroupId =
        it.feeHeadId === 'fh_arrears' ? 'arrears'
        : it.feeHeadId === 'fh_tuition' && v.billingMonth >= month ? 'month'
        : it.feeHeadId === 'fh_admission' ? 'admission'
        : it.feeHeadId === 'fh_annual' ? 'annual'
        : 'other';
      g[id] += Math.max(0, it.amount - (it.waivedAmount ?? 0));
    }
  }
  return g;
}

const GROUP_OF_CATEGORY: Record<string, GroupId> = { ARREARS: 'arrears', MONTHLY: 'month', ADMISSION: 'admission', ANNUAL: 'annual' };
const GROUP_OF_HEAD: Record<string, GroupId> = { fh_arrears: 'arrears', fh_tuition: 'month', fh_admission: 'admission', fh_annual: 'annual' };

/** Received per group, by the fee type the cashier wrote on the receipt (bills' allocation when there is none). */
function receivedByGroup(payments: FeePayment[]): Record<GroupId, number> {
  const g: Record<GroupId, number> = { arrears: 0, month: 0, admission: 0, annual: 0, other: 0 };
  for (const p of payments) {
    if (p.isVoid) continue;
    const declared = /\[by:([^\]]+)\]/.exec(p.remarks ?? '');
    if (declared) {
      for (const part of declared[1].split(',')) {
        const [k, v] = part.split('=');
        g[GROUP_OF_CATEGORY[k] ?? 'other'] += Number(v) || 0;
      }
    } else {
      for (const a of p.allocations ?? []) g[GROUP_OF_HEAD[a.feeHeadId ?? ''] ?? 'other'] += a.allocatedAmount;
    }
  }
  return g;
}

/** Fee breakdown: previous arrears, this month's fee, admission and annual charges (charged / received / pending). */
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
    const received = receivedByGroup(pays);
    const merged = {} as Record<GroupId, Totals>;
    (Object.keys(charged) as GroupId[]).forEach((k) => (merged[k] = { charged: charged[k], received: received[k] }));
    setGroups(merged);
    setReport(r.ok ? r.data : null);
    setLoading(false);
  }, [campus, month]);
  useEffect(() => { void load(); }, [load]);

  const rows: { id: GroupId; label: string }[] = [
    { id: 'arrears', label: t('acc_cat_ARREARS') },
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
            {rows.filter((r) => r.id !== 'other' || groups.other.charged > 0).map((r) => {
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
