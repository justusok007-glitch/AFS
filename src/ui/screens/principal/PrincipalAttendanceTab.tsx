import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PrincipalAttendanceSummary } from './PrincipalSummaries';
import { AlertCircle, CalendarX, Download, Printer } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import { AttendanceReport } from '../../../domain/models/models';
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
  StudentNameBlock,
  studentClassLabel,
} from '../accountant/AccountantShared';
import { percentColor, selectCls } from './PrincipalShared';

type Range = 'today' | 'week' | 'month' | 'custom';
const THRESHOLDS = [95, 90, 85, 80, 75, 60];

export const PrincipalAttendanceTab: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [campus, setCampus] = useState('ALL');
  const [cls, setCls] = useState('ALL');
  const [sec, setSec] = useState('ALL');
  const [range, setRange] = useState<Range>('month');
  const [from, setFrom] = useState(today().slice(0, 7) + '-01');
  const [to, setTo] = useState(today());
  const [threshold, setThreshold] = useState(75);
  const [chronicOnly, setChronicOnly] = useState(true);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const eff = useMemo(() => {
    const td = today();
    if (range === 'today') return { from: td, to: td };
    if (range === 'week') return { from: addDaysIso(td, -6), to: td };
    if (range === 'month') return { from: td.slice(0, 7) + '-01', to: td };
    return { from, to };
  }, [range, from, to]);

  const load = useCallback(async () => {
    if (eff.from > eff.to) {
      setRangeError(t('acc_err_range_invalid'));
      return;
    }
    setRangeError(null);
    setLoading(true);
    setFailed(false);
    const r = await AppModule.dashboardRepository.getAttendanceReport({
      campusId: campus === 'ALL' ? null : campus,
      classId: cls === 'ALL' ? null : cls,
      sectionId: sec === 'ALL' ? null : sec,
      fromDate: eff.from,
      toDate: eff.to,
    });
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setReport(r.data);
    setLoading(false);
  }, [campus, cls, sec, eff, t]);
  useEffect(() => {
    void load();
  }, [load]);

  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const sectionLabel = (secId: string) => {
    const s = lookups.sectionsMap[secId];
    return s ? `${className(s.classId)} - ${s.name}` : secId;
  };

  const students = useMemo(() => {
    if (!report) return [];
    const rows = [...report.studentRows].filter((r) => r.present + r.late + r.absent > 0);
    const filtered = chronicOnly ? rows.filter((r) => r.percent < threshold) : rows;
    return filtered.sort((a, b) => a.percent - b.percent);
  }, [report, chronicOnly, threshold]);

  const exportCsv = () => {
    if (!report) return;
    downloadCsv(`attendance_${eff.from}_${eff.to}.csv`, [
      ['Admission No', 'Student', 'Class', 'Present', 'Late', 'Absent', 'Leave', 'Percent'],
      ...students.map((r) => [
        r.student.admissionNo,
        r.student.name,
        studentClassLabel(r.student, lookups, 'en'),
        r.present,
        r.late,
        r.absent,
        r.leave,
        r.percent,
      ]),
    ]);
  };

  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn })),
  ];
  const classOptions = lookups.classes.filter((c) => campus === 'ALL' || c.campusId === campus);
  const sectionOptions = Object.values(lookups.sectionsMap).filter((s) => cls !== 'ALL' && s.classId === cls);

  return (
    <div className="space-y-3">
      <PrincipalAttendanceSummary lookups={lookups} />
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('pr_att_filters')}</h3>
        <TabRow tabs={campusTabs} selected={campus} onSelect={(v) => { setCampus(v); setCls('ALL'); setSec('ALL'); }} />
        <div className="grid grid-cols-2 gap-2">
          <select className={selectCls} value={cls} onChange={(e) => { setCls(e.target.value); setSec('ALL'); }}>
            <option value="ALL">{t('acc_all_classes')}</option>
            {classOptions.map((c) => (<option key={c.id} value={c.id}>{className(c.id)}</option>))}
          </select>
          <select className={selectCls} value={sec} onChange={(e) => setSec(e.target.value)} disabled={cls === 'ALL'}>
            <option value="ALL">{t('pr_all_sections')}</option>
            {sectionOptions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        <TabRow
          tabs={[
            { id: 'today' as Range, label: t('acc_range_today') },
            { id: 'week' as Range, label: t('pr_range_week') },
            { id: 'month' as Range, label: t('acc_range_month') },
            { id: 'custom' as Range, label: t('acc_range_custom') },
          ]}
          selected={range}
          onSelect={setRange}
        />
        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <input type="date" dir="ltr" className={selectCls} value={from} max={today()} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label={t('acc_from_date')} />
            <input type="date" dir="ltr" className={selectCls} value={to} max={today()} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label={t('acc_to_date')} />
          </div>
        )}
        {rangeError && <p className="text-xs font-medium text-[#D64545]">{rangeError}</p>}
        <p className="text-[11px] text-[#6B7385]">{t('pr_tab_attendance_hint')}</p>
      </SchoolCard>

      {loading || lookups.loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed || lookups.failed || !report ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { lookups.reload(); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : report.daysCovered === 0 ? (
        <EmptyState title={t('pr_att_none_title')} description="" icon={<CalendarX className="w-6 h-6 text-[#F28C28]" />} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <SchoolCard className="p-3 space-y-1">
              <div className="text-[11px] font-semibold text-[#6B7385]">{t('pr_overall_percent')}</div>
              <div dir="ltr" className="font-mono text-lg font-bold text-start" style={{ color: percentColor(report.overallPercent) }}>{report.overallPercent}%</div>
            </SchoolCard>
            <SchoolCard className="p-3 space-y-1">
              <div className="text-[11px] font-semibold text-[#6B7385]">{t('pr_days_covered')}</div>
              <div dir="ltr" className="font-mono text-lg font-bold text-[#14284B] text-start">{report.daysCovered}</div>
            </SchoolCard>
          </div>

          <SchoolCard className="space-y-1.5">
            <h3 className="text-xs font-bold text-[#14284B]">{t('pr_class_table')}</h3>
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
                  {[...report.sectionRows]
                    .sort((a, b) => sectionLabel(a.sectionId).localeCompare(sectionLabel(b.sectionId)))
                    .map((r) => (
                      <tr key={r.sectionId} className="border-t border-[#E4E8F0] text-center">
                        <td className="py-1.5 text-start font-semibold text-[#14284B]">{sectionLabel(r.sectionId)}</td>
                        <td dir="ltr">{r.students}</td>
                        <td dir="ltr">{r.present + r.late}</td>
                        <td dir="ltr">{r.absent}</td>
                        <td dir="ltr" className="font-bold" style={{ color: percentColor(r.percent) }}>{r.percent}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </SchoolCard>

          <SchoolCard className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#14284B]">{chronicOnly ? t('pr_chronic_title') : t('pr_student_list')}</h3>
              <span dir="ltr" className="text-[11px] text-[#6B7385]">{students.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TabRow
                tabs={[
                  { id: 'chronic', label: t('pr_chronic_title') },
                  { id: 'all', label: t('pr_show_all_students') },
                ]}
                selected={chronicOnly ? 'chronic' : 'all'}
                onSelect={(v) => setChronicOnly(v === 'chronic')}
              />
              {chronicOnly && (
                <select className={selectCls} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} aria-label={t('pr_chronic_below')}>
                  {THRESHOLDS.map((n) => (<option key={n} value={n}>{t('pr_chronic_below')} {n}%</option>))}
                </select>
              )}
            </div>
            {students.length === 0 ? (
              <p className="text-xs text-[#2E9E5B] font-semibold">{t('pr_chronic_none')}</p>
            ) : (
              students.slice(0, 60).map((r) => (
                <div key={r.student.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5">
                  <StudentNameBlock student={r.student} classLabel={studentClassLabel(r.student, lookups, language)} />
                  <div className="text-end shrink-0">
                    <div dir="ltr" className="font-mono text-sm font-bold" style={{ color: percentColor(r.percent) }}>{r.percent}%</div>
                    <div dir="ltr" className="text-[10px] text-[#6B7385]">{r.present + r.late}P · {r.absent}A · {r.leave}L</div>
                  </div>
                </div>
              ))
            )}
            {students.length > 60 && <p className="text-[11px] text-center text-[#6B7385]">{t('acc_showing_first').replace('50', '60')}</p>}
          </SchoolCard>

        </>
      )}
    </div>
  );
};
