import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CalendarCheck,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import { PrincipalDashboard } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  SchoolCard,
  ShimmerPlaceholder,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import {
  CATEGORY_COLORS,
  CHART,
  CountUp,
  percentColor,
  selectCls,
  shortMonth,
} from './PrincipalShared';


const ChartCard: React.FC<{ title: string; empty?: boolean; children: React.ReactNode }> = ({
  title,
  empty,
  children,
}) => {
  const { stringResource: t } = useStringResource();
  return (
    <SchoolCard className="space-y-2">
      <h3 className="text-xs font-bold text-[#14284B]">{title}</h3>
      {empty ? (
        <p className="text-xs text-[#6B7385] py-6 text-center">{t('pr_chart_no_data')}</p>
      ) : (
        <div dir="ltr" style={{ width: '100%', height: 190 }}>
          <ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer>
        </div>
      )}
    </SchoolCard>
  );
};

/** Class / section table for one day (Students, Present, Absent, %), shown above the 30-day trend. */
export const TodayClassTable: React.FC<{ lookups: AccountantLookups; campus: string; date: string }> = ({ lookups, campus, date }) => {
  const { stringResource: t, language } = useStringResource();
  const [rows, setRows] = useState<{ sectionId: string; students: number; present: number; late: number; absent: number; percent: number }[] | null>(null);
  useEffect(() => {
    let off = false;
    setRows(null);
    void AppModule.dashboardRepository
      .getAttendanceReport({ campusId: campus === 'ALL' ? null : campus, classId: null, sectionId: null, fromDate: date, toDate: date })
      .then((r) => {
        if (!off) setRows(r.ok ? r.data.sectionRows : []);
      });
    return () => {
      off = true;
    };
  }, [campus, date]);
  const label = (secId: string) => {
    const s = lookups.sectionsMap[secId];
    const c = s ? lookups.classesMap[s.classId] : undefined;
    return s ? `${c ? (language === 'ur' ? c.nameUr : c.nameEn) : s.classId} - ${s.name}` : secId;
  };
  return (
    <SchoolCard className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#14284B]">{t('pr_class_table')}</h3>
        <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">{formatSchoolDate(date)}</span>
      </div>
      {rows === null ? (
        <ShimmerPlaceholder lines={3} />
      ) : rows.length === 0 ? (
        <p className="text-xs text-[#6B7385] py-4 text-center">{t('pr_chart_no_data')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[300px]">
            <thead>
              <tr className="text-[#6B7385] text-[11px]">
                <th className="text-start font-semibold py-1">{t('acc_class_col')}</th>
                <th className="font-semibold">{t('pr_students_col')}</th>
                <th className="font-semibold">{t('pr_present')}</th>
                <th className="font-semibold">{t('pr_absent')}</th>
                <th className="font-semibold">{t('pr_percent_col')}</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => label(a.sectionId).localeCompare(label(b.sectionId), undefined, { numeric: true })).map((r) => (
                <tr key={r.sectionId} className="border-t border-[#E4E8F0] text-center">
                  <td className="py-1.5 text-start font-semibold text-[#14284B]">{label(r.sectionId)}</td>
                  <td dir="ltr">{r.students}</td>
                  <td dir="ltr">{r.present + r.late}</td>
                  <td dir="ltr">{r.absent}</td>
                  <td dir="ltr" className="font-bold" style={{ color: percentColor(r.percent) }}>{r.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SchoolCard>
  );
};

export const PrincipalAttendanceSummary: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [campus, setCampus] = useState('ALL');
  const [date, setDate] = useState(today());
  const [data, setData] = useState<PrincipalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [showUnmarked, setShowUnmarked] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.dashboardRepository.getPrincipalDashboard(campus === 'ALL' ? null : campus, date);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setData(r.data);
    setLoading(false);
  }, [campus, date]);
  useEffect(() => {
    void load();
  }, [load]);

  const campusName = (id: string) => {
    const c = lookups.campuses.find((x) => x.id === id);
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const rupeesShort = (v: number) =>
    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn })),
  ];

  const header = (
    <SchoolCard className="space-y-2.5">
      <TabRow tabs={campusTabs} selected={campus} onSelect={setCampus} />
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold shrink-0">{t('pr_date_label')}</label>
        <input
          type="date"
          dir="ltr"
          className={selectCls}
          value={date}
          max={today()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
      </div>
    </SchoolCard>
  );

  if (loading || lookups.loading) {
    return (
      <div className="space-y-3">
        {header}
        <ShimmerPlaceholder lines={3} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }
  if (failed || lookups.failed || !data) {
    return (
      <div className="space-y-3">
        {header}
        <EmptyState
          title={t('error_loading_title')}
          description={t('error_loading_subtitle')}
          actionLabel={t('retry_button')}
          onAction={() => {
            lookups.reload();
            void load();
          }}
          icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
        />
      </div>
    );
  }


  const kpi = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
    sub: React.ReactNode,
    onClick?: () => void,
    accent = 'text-[#14284B]'
  ) => (
    <SchoolCard className="p-3 space-y-1" onClick={onClick}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7385]">
        <span className="text-[#F28C28]">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`font-mono text-lg font-bold tabular-nums text-start ${accent}`}>{value}</div>
      <div className="text-[10px] text-[#6B7385] min-h-[14px]">{sub}</div>
    </SchoolCard>
  );

  const catData = Object.entries(data.collectionByCategory)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => ({ key: k, name: t(`acc_cat_${k}` as StringKey), value: v ?? 0 }));

  const trendData = data.attendanceTrend30.map((p) => ({ day: p.label.slice(5), value: p.value }));
  const monthlyData = data.monthlyCollection12.map((p) => ({ m: shortMonth(p.label), value: p.value }));
  const evcData = data.expectedVsCollected6.map((p) => ({
    m: shortMonth(p.month),
    expected: p.expected,
    collected: p.collected,
  }));
  const campusAtt = data.campusComparison.map((c) => ({ name: campusName(c.campusId), value: c.attendancePercent }));
  const campusFee = data.campusComparison.map((c) => ({ name: campusName(c.campusId), value: c.collectedThisMonthRupees }));
  const classData = data.classAttendance.map((c) => ({ name: className(c.classId), value: c.percent }));

  return (
    <div className="space-y-3">
      {header}
      <div className="grid grid-cols-2 gap-2.5">
        {kpi(<Users className="w-3.5 h-3.5" />, t('pr_kpi_students'), <CountUp value={data.totalStudents} />,
          <span dir="ltr">{data.boysCount} / {data.girlsCount} · {t('pr_kpi_boys_girls')}</span>,
          undefined)}
        {kpi(<CalendarCheck className="w-3.5 h-3.5" />, t('pr_kpi_attendance'),
          <span style={{ color: percentColor(data.attendancePercent) }}><CountUp value={data.attendancePercent} format={(n) => `${n}%`} /></span>,
          <span dir="ltr">{data.present + data.late} {t('pr_present')} · {data.absent} {t('pr_absent')} · {data.leave} {t('pr_leave')}</span>,
          undefined)}
        {kpi(<AlertTriangle className="w-3.5 h-3.5" />, t('pr_kpi_unmarked'),
          <CountUp value={data.unmarkedSections.length} />, null,
          () => setShowUnmarked((v) => !v),
          data.unmarkedSections.length > 0 ? 'text-[#D64545]' : 'text-[#2E9E5B]')}
      </div>
      {showUnmarked && (
        <SchoolCard className="space-y-2">
          <h3 className="text-xs font-bold text-[#14284B]">{t('pr_kpi_unmarked')}</h3>
          {data.unmarkedSections.length === 0 ? (
            <p className="text-xs text-[#2E9E5B] font-semibold">{t('pr_all_marked')}</p>
          ) : (
            data.unmarkedSections.map((s) => {
              const names = language === 'ur' ? s.teacherNamesUr : s.teacherNamesEn;
              return (
                <div key={s.sectionId} className="border-t border-[#E4E8F0] pt-1.5 text-xs">
                  <div className="font-semibold text-[#14284B]">
                    {className(s.classId)} - {s.sectionName}
                    <span className="text-[#6B7385] font-normal"> · {campusName(s.campusId)}</span>
                  </div>
                  <div className="text-[#6B7385]">
                    {t('pr_unmarked_teachers')}: {names.length ? names.join('، ') : t('pr_no_teacher')}
                  </div>
                </div>
              );
            })
          )}
        </SchoolCard>
      )}

      <TodayClassTable lookups={lookups} campus={campus} date={date} />

      <ChartCard title={t('pr_chart_trend30')} empty={trendData.length === 0}>
        <BarChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 8 }} interval={0} angle={-60} textAnchor="end" height={44} tickMargin={2} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={32} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {trendData.map((d, i) => (
              <Cell key={i} fill={d.value < 60 ? CHART.red : d.value < 70 ? CHART.orange : CHART.green} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard title={t('pr_chart_campus_att')} empty={campusAtt.every((d) => d.value === 0)}>
        <BarChart data={campusAtt}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={32} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="value" fill={CHART.navy} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <SchoolCard className="space-y-2">
        <h3 className="text-xs font-bold text-[#14284B]">{t('pr_chart_class_att')}</h3>
        {classData.length === 0 ? (
          <p className="text-xs text-[#6B7385] py-6 text-center">{t('pr_chart_no_data')}</p>
        ) : (
          <div dir="ltr" style={{ width: '100%', height: Math.max(160, classData.length * 28 + 30) }}>
            <ResponsiveContainer>
              <BarChart data={classData} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={74} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {classData.map((d, i) => (
                    <Cell key={i} fill={percentColor(d.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SchoolCard>

    </div>
  );
};

/** Vertical bars: money collected on each day of the month of `date` (every day of the month on the x axis). */
const DailyCollectionChart: React.FC<{ date: string; campus: string }> = ({ date, campus }) => {
  const { stringResource: t } = useStringResource();
  const [byDay, setByDay] = useState<Record<string, number> | null>(null);
  const month = date.slice(0, 7);
  useEffect(() => {
    let off = false;
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    void AppModule.feeRepository
      .getCollectionReport({ fromDate: `${month}-01`, toDate: `${month}-${String(last).padStart(2, '0')}`, campusId: campus === 'ALL' ? null : campus })
      .then((r) => {
        if (!off) setByDay(r.ok ? r.data.byDay : {});
      });
    return () => {
      off = true;
    };
  }, [month, campus]);
  const [y, m] = month.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const rows = Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    return { d: String(d), value: byDay?.[`${month}-${String(d).padStart(2, '0')}`] ?? 0 };
  });
  const total = rows.reduce((a, r) => a + r.value, 0);
  const short = (v: number) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v));
  return (
    <ChartCard title={`${t('pr_chart_daily')} · ${month}`} empty={byDay !== null && total === 0}>
      <BarChart data={rows} margin={{ left: 0, right: 4 }} barCategoryGap={1}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="d" tick={{ fontSize: 8 }} interval={0} tickMargin={2} />
        <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={short} />
        <Tooltip formatter={(v) => formatRupees(Number(v))} labelFormatter={(l) => `${month}-${String(l).padStart(2, '0')}`} />
        <Bar dataKey="value" fill={CHART.green} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
};

export const PrincipalFeesSummary: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [campus, setCampus] = useState('ALL');
  const [date, setDate] = useState(today());
  const [data, setData] = useState<PrincipalDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.dashboardRepository.getPrincipalDashboard(campus === 'ALL' ? null : campus, date);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setData(r.data);
    setLoading(false);
  }, [campus, date]);
  useEffect(() => {
    void load();
  }, [load]);

  const campusName = (id: string) => {
    const c = lookups.campuses.find((x) => x.id === id);
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const rupeesShort = (v: number) =>
    v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn })),
  ];

  const header = (
    <SchoolCard className="space-y-2.5">
      <TabRow tabs={campusTabs} selected={campus} onSelect={setCampus} />
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold shrink-0">{t('pr_date_label')}</label>
        <input
          type="date"
          dir="ltr"
          className={selectCls}
          value={date}
          max={today()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
        />
      </div>
    </SchoolCard>
  );

  if (loading || lookups.loading) {
    return (
      <div className="space-y-3">
        {header}
        <ShimmerPlaceholder lines={3} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }
  if (failed || lookups.failed || !data) {
    return (
      <div className="space-y-3">
        {header}
        <EmptyState
          title={t('error_loading_title')}
          description={t('error_loading_subtitle')}
          actionLabel={t('retry_button')}
          onAction={() => {
            lookups.reload();
            void load();
          }}
          icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
        />
      </div>
    );
  }


  const kpi = (
    icon: React.ReactNode,
    label: string,
    value: React.ReactNode,
    sub: React.ReactNode,
    onClick?: () => void,
    accent = 'text-[#14284B]'
  ) => (
    <SchoolCard className="p-3 space-y-1" onClick={onClick}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7385]">
        <span className="text-[#F28C28]">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <div className={`font-mono text-lg font-bold tabular-nums text-start ${accent}`}>{value}</div>
      <div className="text-[10px] text-[#6B7385] min-h-[14px]">{sub}</div>
    </SchoolCard>
  );

  const catData = Object.entries(data.collectionByCategory)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => ({ key: k, name: t(`acc_cat_${k}` as StringKey), value: v ?? 0 }));

  const trendData = data.attendanceTrend30.map((p) => ({ day: p.label.slice(5), value: p.value }));
  const monthlyData = data.monthlyCollection12.map((p) => ({ m: shortMonth(p.label), value: p.value }));
  const campusAtt = data.campusComparison.map((c) => ({ name: campusName(c.campusId), value: c.attendancePercent }));
  const campusFee = data.campusComparison.map((c) => ({ name: campusName(c.campusId), value: c.collectedThisMonthRupees }));
  const classData = data.classAttendance.map((c) => ({ name: className(c.classId), value: c.percent }));

  return (
    <div className="space-y-3">
      {header}
      <div className="grid grid-cols-2 gap-2.5">
        {kpi(<Wallet className="w-3.5 h-3.5" />, t('pr_kpi_collected_today'),
          <CountUp value={data.feeCollectedTodayRupees} format={formatRupees} />, null,
          undefined, 'text-[#2E9E5B]')}
        {kpi(<Receipt className="w-3.5 h-3.5" />, t('pr_kpi_collected_month'),
          <CountUp value={data.feeCollectedMonthRupees} format={formatRupees} />, null,
          undefined)}
        {kpi(<Wallet className="w-3.5 h-3.5" />, t('pr_kpi_outstanding'),
          <CountUp value={data.totalOutstandingRupees} format={formatRupees} />, null,
          undefined, 'text-[#D64545]')}
        {kpi(<AlertTriangle className="w-3.5 h-3.5" />, t('pr_kpi_defaulters'),
          <CountUp value={data.defaultersCount} />, null,
          undefined, 'text-[#D64545]')}
      </div>
      <ChartCard title={t('pr_chart_monthly12')} empty={monthlyData.every((d) => d.value === 0)}>
        <BarChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="m" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={rupeesShort} />
          <Tooltip formatter={(v) => formatRupees(Number(v))} />
          <Bar dataKey="value" fill={CHART.orange} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <DailyCollectionChart date={date} campus={campus} />

      <ChartCard title={t('pr_chart_category')} empty={catData.length === 0}>
        <PieChart>
          <Pie data={catData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={2}>
            {catData.map((d) => (
              <Cell key={d.key} fill={CATEGORY_COLORS[d.key] ?? CHART.grey} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatRupees(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ChartCard>

      <ChartCard title={t('pr_chart_campus_fee')} empty={campusFee.every((d) => d.value === 0)}>
        <BarChart data={campusFee}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={40} tickFormatter={rupeesShort} />
          <Tooltip formatter={(v) => formatRupees(Number(v))} />
          <Bar dataKey="value" fill={CHART.orange} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <SchoolCard className="space-y-2">
        <h3 className="text-xs font-bold text-[#14284B]">{t('pr_recent_activity')}</h3>
        {data.recentActivity.length === 0 ? (
          <p className="text-xs text-[#6B7385]">—</p>
        ) : (
          data.recentActivity.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-xs border-t border-[#E4E8F0] pt-1.5">
              <div className="min-w-0">
                <div className={`font-semibold ${a.kind === 'VOID' ? 'text-[#D64545]' : 'text-[#14284B]'}`}>
                  {t(a.kind === 'PAYMENT' ? 'pr_activity_payment' : a.kind === 'VOID' ? 'pr_activity_void' : 'pr_activity_correction')}
                </div>
                <div dir="ltr" className="text-[11px] text-[#6B7385] text-start truncate">
                  {formatSchoolDate(a.date)} · {a.text}
                </div>
              </div>
              {a.amountRupees !== null && (
                <span dir="ltr" className="font-mono font-bold text-[#14284B] shrink-0">
                  {formatRupees(a.amountRupees)}
                </span>
              )}
            </div>
          ))
        )}
      </SchoolCard>
    </div>
  );
};

