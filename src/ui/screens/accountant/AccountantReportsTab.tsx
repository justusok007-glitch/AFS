import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import {
  FeeCategory,
  FeeCollectionReport,
  FeePayment,
  PaymentMethod,
  Student,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  downloadCsv,
  PrintFrame,
  staffName,
} from './AccountantShared';

type Sub = 'daily' | 'period';
type Range = 'today' | 'week' | 'month' | 'custom';

const selectCls =
  'w-full min-h-[44px] px-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm text-[#14284B]';
const METHODS = [PaymentMethod.CASH, PaymentMethod.BANK, PaymentMethod.JAZZCASH, PaymentMethod.EASYPAISA];
const CATEGORIES = [
  FeeCategory.ARREARS, FeeCategory.MONTHLY, FeeCategory.ANNUAL, FeeCategory.ADMISSION,
  FeeCategory.EXAM, FeeCategory.LATE, FeeCategory.OTHER,
];

function weekStart(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0 Sun
  return addDaysIso(iso, -((dow + 6) % 7)); // Monday
}

const Money: React.FC<{ v: number; className?: string }> = ({ v, className }) => (
  <span dir="ltr" className={`font-mono tabular-nums ${className ?? ''}`}>{formatRupees(v)}</span>
);

export const AccountantReportsTab: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [sub, setSub] = useState<Sub>('daily');
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [baseLoading, setBaseLoading] = useState(true);
  const [baseFailed, setBaseFailed] = useState(false);

  const loadBase = useCallback(async () => {
    setBaseLoading(true);
    setBaseFailed(false);
    const [st, pa] = await Promise.all([
      AppModule.studentRepository.search({ query: '', status: null }),
      AppModule.feeRepository.getAllPayments(),
    ]);
    if (!st.ok || !pa.ok) {
      setBaseFailed(true);
      setBaseLoading(false);
      return;
    }
    const m: Record<string, Student> = {};
    st.data.forEach((s) => (m[s.id] = s));
    setStudents(m);
    setPayments(pa.data);
    setBaseLoading(false);
  }, []);
  useEffect(() => { void loadBase(); }, [loadBase]);

  /* ---------- daily ---------- */
  const [day, setDay] = useState(today());
  const [daily, setDaily] = useState<FeeCollectionReport | null>(null);
  const [dailyFailed, setDailyFailed] = useState(false);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [printDaily, setPrintDaily] = useState(false);

  const loadDaily = useCallback(async () => {
    setDailyLoading(true);
    setDailyFailed(false);
    const r = await AppModule.feeRepository.getCollectionReport({ fromDate: day, toDate: day });
    if (!r.ok) { setDailyFailed(true); setDailyLoading(false); return; }
    setDaily(r.data);
    setDailyLoading(false);
  }, [day]);
  useEffect(() => { void loadDaily(); }, [loadDaily]);

  const dayReceipts = useMemo(
    () => payments.filter((p) => p.paidOn === day && !p.isVoid).sort((a, b) => a.receiptNo.localeCompare(b.receiptNo)),
    [payments, day]
  );

  /* ---------- period ---------- */
  const [range, setRange] = useState<Range>('month');
  const [from, setFrom] = useState(today().slice(0, 7) + '-01');
  const [to, setTo] = useState(today());
  const [fCampus, setFCampus] = useState('ALL');
  const [fClass, setFClass] = useState('ALL');
  const [fCat, setFCat] = useState('ALL');
  const [fMethod, setFMethod] = useState('ALL');
  const [period, setPeriod] = useState<FeeCollectionReport | null>(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [periodFailed, setPeriodFailed] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const effective = useMemo(() => {
    const td = today();
    if (range === 'today') return { from: td, to: td };
    if (range === 'week') return { from: weekStart(td), to: td };
    if (range === 'month') return { from: td.slice(0, 7) + '-01', to: td };
    return { from, to };
  }, [range, from, to]);

  const loadPeriod = useCallback(async () => {
    if (effective.from > effective.to) {
      setRangeError(t('acc_err_range_invalid'));
      return;
    }
    setRangeError(null);
    setPeriodLoading(true);
    setPeriodFailed(false);
    const r = await AppModule.feeRepository.getCollectionReport({
      fromDate: effective.from,
      toDate: effective.to,
      campusId: fCampus === 'ALL' ? null : fCampus,
      classId: fClass === 'ALL' ? null : fClass,
      category: fCat === 'ALL' ? null : (fCat as FeeCategory),
      method: fMethod === 'ALL' ? null : (fMethod as PaymentMethod),
    });
    if (!r.ok) { setPeriodFailed(true); setPeriodLoading(false); return; }
    setPeriod(r.data);
    setPeriodLoading(false);
  }, [effective, fCampus, fClass, fCat, fMethod, t]);
  useEffect(() => { if (sub === 'period') void loadPeriod(); }, [sub, loadPeriod]);

  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : '';
  };

  const exportCsv = () => {
    if (!period) return;
    const rows: (string | number)[][] = [
      [t('acc_period_title'), effective.from, effective.to],
      [],
      [t('acc_day_col'), t('acc_total_collected')],
      ...Object.keys(period.byDay).sort().map((d) => [d, period.byDay[d]]),
      [],
      [t('acc_by_category'), t('acc_total_collected')],
      ...CATEGORIES.filter((c) => period.byCategory[c]).map((c) => [t(`acc_cat_${c}` as StringKey), period.byCategory[c] ?? 0]),
      [],
      [t('acc_by_method'), t('acc_total_collected')],
      ...METHODS.filter((m) => period.byMethod[m]).map((m) => [t(`method_${m}` as StringKey), period.byMethod[m] ?? 0]),
      [],
      [t('acc_total_collected'), period.totalCollectedRupees],
    ];
    downloadCsv(`collection_${effective.from}_${effective.to}.csv`, rows);
  };

  if (baseLoading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (baseFailed || lookups.failed) {
    return (
      <EmptyState
        title={t('error_loading_title')}
        description={t('error_loading_subtitle')}
        actionLabel={t('retry_button')}
        onAction={() => { lookups.reload(); void loadBase(); }}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const breakdown = (rep: FeeCollectionReport) => (
    <>
      <SchoolCard className="space-y-1.5">
        <h3 className="text-xs font-bold text-[#14284B]">{t('acc_by_method')}</h3>
        {METHODS.map((m) => (
          <div key={m} className="flex justify-between text-xs">
            <span>{t(`method_${m}` as StringKey)}</span>
            <Money v={rep.byMethod[m] ?? 0} className="font-bold text-[#14284B]" />
          </div>
        ))}
      </SchoolCard>
      <SchoolCard className="space-y-1.5">
        <h3 className="text-xs font-bold text-[#14284B]">{t('acc_by_category')}</h3>
        {CATEGORIES.filter((c) => (rep.byCategory[c] ?? 0) > 0).map((c) => (
          <div key={c} className="flex justify-between text-xs">
            <span>{t(`acc_cat_${c}` as StringKey)}</span>
            <Money v={rep.byCategory[c] ?? 0} className="font-bold text-[#14284B]" />
          </div>
        ))}
        {Object.keys(rep.byCategory).length === 0 && <p className="text-xs text-[#6B7385]">—</p>}
      </SchoolCard>
    </>
  );

  const receiptRow = (p: FeePayment) => {
    const s = students[p.studentId];
    return (
      <div key={p.id} className="flex items-center justify-between gap-2 text-xs border-t border-[#E4E8F0] pt-1.5">
        <div className="min-w-0">
          <div className="font-semibold text-[#14284B] line-clamp-2">
            {s ? (language === 'ur' && s.nameUr ? s.nameUr : s.name) : p.studentId}
          </div>
          <div dir="ltr" className="text-[11px] text-[#6B7385] text-start">
            {p.receiptNo} · {t(`method_${p.method}` as StringKey)}
          </div>
        </div>
        <Money v={p.amount} className="font-bold text-[#14284B] shrink-0" />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <TabRow
        tabs={[
          { id: 'daily' as Sub, label: t('acc_daily_title') },
          { id: 'period' as Sub, label: t('acc_period_title') },
        ]}
        selected={sub}
        onSelect={setSub}
      />

      {sub === 'daily' && (
        <>
          <SchoolCard className="space-y-2">
            <label className="block text-xs font-semibold">{t('acc_pick_date')}</label>
            <input type="date" dir="ltr" className={selectCls} value={day} max={today()} onChange={(e) => e.target.value && setDay(e.target.value)} />
          </SchoolCard>
          {dailyLoading ? (
            <ShimmerPlaceholder lines={4} showHeader />
          ) : dailyFailed || !daily ? (
            <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void loadDaily()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <SchoolCard className="p-3 space-y-1">
                  <div className="text-[11px] text-[#6B7385] font-semibold">{t('acc_total_collected')}</div>
                  <Money v={daily.totalCollectedRupees} className="text-base font-bold text-[#14284B]" />
                </SchoolCard>
                <SchoolCard className="p-3 space-y-1">
                  <div className="text-[11px] text-[#6B7385] font-semibold">{t('acc_receipts_count')}</div>
                  <div dir="ltr" className="font-mono text-base font-bold text-[#14284B] text-start">{daily.receiptsCount}</div>
                </SchoolCard>
              </div>
              <SchoolCard className="p-3 flex items-center justify-between bg-[#F28C28]/10">
                <span className="text-xs font-bold text-[#14284B]">{t('acc_cash_in_hand')}</span>
                <Money v={daily.byMethod[PaymentMethod.CASH] ?? 0} className="text-base font-bold text-[#14284B]" />
              </SchoolCard>
              {breakdown(daily)}
              <SchoolCard className="space-y-2">
                <h3 className="text-xs font-bold text-[#14284B]">{t('acc_receipts_of_day')}</h3>
                {dayReceipts.length === 0 ? <p className="text-xs text-[#6B7385]">{t('acc_no_receipts_title')}</p> : dayReceipts.map(receiptRow)}
              </SchoolCard>
              <PrimaryButton text={t('acc_print_report_btn')} variant="navy" icon={<Printer className="w-4 h-4 text-[#F28C28]" />} onClick={() => setPrintDaily(true)} />
              {printDaily && (
                <PrintFrame onClose={() => setPrintDaily(false)}>
                  <div className="print-sheet-doc">
                    <h2 className="font-heading text-base font-bold text-[#14284B]">{lookups.schoolNameEn} — {t('acc_daily_title')}</h2>
                    <p className="text-xs mb-2">{formatSchoolDate(day)}</p>
                    <table className="w-full text-xs border-collapse">
                      <tbody>
                        <tr><td className="py-0.5">{t('acc_total_collected')}</td><td dir="ltr" className="text-end font-mono font-bold">{formatRupees(daily.totalCollectedRupees)}</td></tr>
                        <tr><td className="py-0.5">{t('acc_receipts_count')}</td><td dir="ltr" className="text-end font-mono">{daily.receiptsCount}</td></tr>
                        <tr><td className="py-0.5">{t('acc_cash_in_hand')}</td><td dir="ltr" className="text-end font-mono font-bold">{formatRupees(daily.byMethod[PaymentMethod.CASH] ?? 0)}</td></tr>
                        {METHODS.map((m) => (<tr key={m}><td className="py-0.5 ps-3">{t(`method_${m}` as StringKey)}</td><td dir="ltr" className="text-end font-mono">{formatRupees(daily.byMethod[m] ?? 0)}</td></tr>))}
                        {CATEGORIES.filter((c) => (daily.byCategory[c] ?? 0) > 0).map((c) => (<tr key={c}><td className="py-0.5 ps-3">{t(`acc_cat_${c}` as StringKey)}</td><td dir="ltr" className="text-end font-mono">{formatRupees(daily.byCategory[c] ?? 0)}</td></tr>))}
                      </tbody>
                    </table>
                    <h3 className="text-xs font-bold mt-3 mb-1">{t('acc_receipts_of_day')}</h3>
                    <table className="w-full text-[11px] border-collapse">
                      <tbody>
                        {dayReceipts.map((p) => {
                          const s = students[p.studentId];
                          return (
                            <tr key={p.id} className="border-t border-[#E4E8F0]">
                              <td dir="ltr" className="py-0.5 font-mono">{p.receiptNo}</td>
                              <td className="py-0.5">{s ? (language === 'ur' && s.nameUr ? s.nameUr : s.name) : ''}</td>
                              <td className="py-0.5">{t(`method_${p.method}` as StringKey)}</td>
                              <td className="py-0.5">{staffName(p.receivedBy, lookups, language)}</td>
                              <td dir="ltr" className="py-0.5 text-end font-mono">{formatRupees(p.amount)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </PrintFrame>
              )}
            </>
          )}
        </>
      )}

      {sub === 'period' && (
        <>
          <SchoolCard className="space-y-2.5">
            <TabRow
              tabs={[
                { id: 'today' as Range, label: t('acc_range_today') },
                { id: 'week' as Range, label: t('acc_range_week') },
                { id: 'month' as Range, label: t('acc_range_month') },
                { id: 'custom' as Range, label: t('acc_range_custom') },
              ]}
              selected={range}
              onSelect={setRange}
            />
            {range === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><label className="block text-xs font-semibold">{t('acc_from_date')}</label><input type="date" dir="ltr" className={selectCls} value={from} max={today()} onChange={(e) => e.target.value && setFrom(e.target.value)} /></div>
                <div className="space-y-1"><label className="block text-xs font-semibold">{t('acc_to_date')}</label><input type="date" dir="ltr" className={selectCls} value={to} max={today()} onChange={(e) => e.target.value && setTo(e.target.value)} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <select className={selectCls} value={fCampus} onChange={(e) => { setFCampus(e.target.value); setFClass('ALL'); }}>
                <option value="ALL">{t('campus_both')}</option>
                {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
              </select>
              <select className={selectCls} value={fClass} onChange={(e) => setFClass(e.target.value)}>
                <option value="ALL">{t('acc_all_classes')}</option>
                {lookups.classes.filter((c) => fCampus === 'ALL' || c.campusId === fCampus).map((c) => (<option key={c.id} value={c.id}>{className(c.id)}</option>))}
              </select>
              <select className={selectCls} value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label={t('acc_filter_category')}>
                <option value="ALL">{t('acc_filter_all_categories')}</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{t(`acc_cat_${c}` as StringKey)}</option>))}
              </select>
              <select className={selectCls} value={fMethod} onChange={(e) => setFMethod(e.target.value)} aria-label={t('acc_filter_method')}>
                <option value="ALL">{t('acc_filter_all_methods')}</option>
                {METHODS.map((m) => (<option key={m} value={m}>{t(`method_${m}` as StringKey)}</option>))}
              </select>
            </div>
            {rangeError && <p className="text-xs font-medium text-[#D64545]">{rangeError}</p>}
          </SchoolCard>

          {periodLoading ? (
            <ShimmerPlaceholder lines={4} showHeader />
          ) : periodFailed || !period ? (
            <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void loadPeriod()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <SchoolCard className="p-3 space-y-1"><div className="text-[11px] text-[#6B7385] font-semibold">{t('acc_total_collected')}</div><Money v={period.totalCollectedRupees} className="text-base font-bold text-[#14284B]" /></SchoolCard>
                <SchoolCard className="p-3 space-y-1"><div className="text-[11px] text-[#6B7385] font-semibold">{t('acc_receipts_count')}</div><div dir="ltr" className="font-mono text-base font-bold text-[#14284B] text-start">{period.receiptsCount}</div></SchoolCard>
              </div>
              {period.receiptsCount === 0 ? (
                <EmptyState title={t('acc_no_receipts_title')} description="" />
              ) : (
                <>
                  <SchoolCard className="space-y-2">
                    <h3 className="text-xs font-bold text-[#14284B]">{t('acc_chart_title')}</h3>
                    <div dir="ltr" style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <BarChart data={Object.keys(period.byDay).sort().map((d) => ({ day: d.slice(5), amount: period.byDay[d] }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E4E8F0" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} width={44} />
                          <Tooltip formatter={(v) => formatRupees(Number(v))} />
                          <Bar dataKey="amount" fill="#F28C28" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SchoolCard>
                  <SchoolCard className="space-y-1.5">
                    <h3 className="text-xs font-bold text-[#14284B]">{t('acc_group_by_day')}</h3>
                    {Object.keys(period.byDay).sort().map((d) => (
                      <div key={d} className="flex justify-between text-xs"><span dir="ltr">{formatSchoolDate(d)}</span><Money v={period.byDay[d]} className="font-bold text-[#14284B]" /></div>
                    ))}
                  </SchoolCard>
                  {breakdown(period)}
                </>
              )}
              <PrimaryButton text={t('acc_export_csv_btn')} variant="navy" icon={<Download className="w-4 h-4 text-[#F28C28]" />} onClick={exportCsv} disabled={period.receiptsCount === 0} />
            </>
          )}
        </>
      )}
    </div>
  );
};
