import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import {
  AttendanceRecord,
  AttendanceStatus,
  AttendanceSubmission,
  Profile,
  SchoolClass,
  Section,
} from '../../../domain/models/models';
import { SchoolCard, ShimmerPlaceholder, TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { CoordinatorRecords } from '../principal/CoordinatorRecords';
import { formatClassSectionTitle, SectionSubmissionBadge } from './TeacherHelpers';

interface SectionStat {
  section: Section;
  students: number;
  submission: AttendanceSubmission | null;
  present: number;
  absent: number;
  late: number;
  leave: number;
}

type DashTab = 'progress' | 'totals' | 'records';

export const CoordinatorDashboard: React.FC<{
  coordinator: Profile;
  sections: Section[];
  classesMap: Record<string, SchoolClass>;
  onOpenSection: (sectionId: string) => void;
}> = ({ coordinator, sections, classesMap, onOpenSection }) => {
  const { stringResource: t, language } = useStringResource();
  const [tab, setTab] = useState<DashTab>('progress');
  const [stats, setStats] = useState<SectionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const date = today();

  const load = useCallback(async () => {
    setLoading(true);
    const out: SectionStat[] = [];
    for (const section of sections) {
      const [st, sub, rec] = await Promise.all([
        AppModule.attendanceRepository.studentsOfSection(section.id),
        AppModule.attendanceRepository.getSubmission(section.id, date),
        AppModule.attendanceRepository.getForSectionAndDate(section.id, date),
      ]);
      const submission = sub.ok ? sub.data : null;
      const records: AttendanceRecord[] = rec.ok && submission ? rec.data : [];
      const n = (s: AttendanceStatus) => records.filter((r) => r.status === s).length;
      out.push({
        section,
        students: st.ok ? st.data.length : 0,
        submission,
        present: n(AttendanceStatus.PRESENT),
        absent: n(AttendanceStatus.ABSENT),
        late: n(AttendanceStatus.LATE),
        leave: n(AttendanceStatus.LEAVE),
      });
    }
    setStats(out);
    setLoading(false);
  }, [sections, date]);
  useEffect(() => {
    void load();
  }, [load]);

  const done = stats.filter((s) => s.submission);
  const remaining = stats.length - done.length;
  const tot = useMemo(
    () =>
      done.reduce(
        (a, s) => ({
          present: a.present + s.present,
          absent: a.absent + s.absent,
          late: a.late + s.late,
          leave: a.leave + s.leave,
          students: a.students + s.students,
        }),
        { present: 0, absent: 0, late: 0, leave: 0, students: 0 }
      ),
    [done]
  );
  const marked = tot.present + tot.absent + tot.late + tot.leave;
  const title = (s: Section) => formatClassSectionTitle(s, classesMap, language);

  const Box: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
    <div className="rounded-2xl border p-3 text-center" style={{ borderColor: color + '55', background: color + '14' }}>
      <div className="text-[11px] font-semibold" style={{ color }}>{label}</div>
      <div dir="ltr" className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );

  return (
    <div className="space-y-3">
      <TabRow
        tabs={[
          { id: 'progress' as DashTab, label: t('co_tab_progress') },
          { id: 'totals' as DashTab, label: t('co_tab_totals') },
          { id: 'records' as DashTab, label: t('tab_att_records') },
        ]}
        selected={tab}
        onSelect={setTab}
      />
      {tab === 'records' ? (
        <CoordinatorRecords coordinator={coordinator} />
      ) : loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : sections.length === 0 ? (
        <SchoolCard><p className="text-xs text-[#6B7385]">{t('co_no_sections')}</p></SchoolCard>
      ) : tab === 'progress' ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Box label={t('co_assigned')} value={stats.length} color="#14284B" />
            <Box label={t('co_marked')} value={done.length} color="#2E9E5B" />
            <Box label={t('co_remaining')} value={remaining} color={remaining ? '#D64545' : '#6B7385'} />
          </div>
          <SchoolCard className="space-y-2">
            {[...stats]
              .sort((a, b) => Number(!!a.submission) - Number(!!b.submission))
              .map((s) => (
                <button
                  key={s.section.id}
                  type="button"
                  onClick={() => onOpenSection(s.section.id)}
                  className="w-full flex items-center justify-between gap-2 border-t first:border-t-0 border-[#E4E8F0] pt-2 first:pt-0 text-start cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#14284B] truncate">{title(s.section)}</div>
                    <div dir="ltr" className="text-[11px] text-[#6B7385] text-start">{s.students} {t('co_students')}</div>
                  </div>
                  <SectionSubmissionBadge submission={s.submission} />
                </button>
              ))}
          </SchoolCard>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Box label={t('pr_present')} value={tot.present} color="#2E9E5B" />
            <Box label={t('pr_absent')} value={tot.absent} color="#D64545" />
            <Box label={t('pr_late')} value={tot.late} color="#C98A00" />
            <Box label={t('pr_leave')} value={tot.leave} color="#3B6FD4" />
          </div>
          {remaining > 0 && (
            <p className="text-[11px] text-[#9E7400]">{t('co_totals_note').replace('{n}', String(remaining))}</p>
          )}
          <SchoolCard className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#14284B]">{t('co_by_section')}</h3>
              <span dir="ltr" className="text-[11px] text-[#6B7385]">
                {marked ? Math.round(((tot.present + tot.late) / marked) * 100) : 0}%
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[280px]">
                <thead>
                  <tr className="text-[#6B7385] text-[11px]">
                    <th className="text-start font-semibold py-1">{t('acc_class_col')}</th>
                    <th className="font-semibold">{t('pr_present')}</th>
                    <th className="font-semibold">{t('pr_absent')}</th>
                    <th className="font-semibold">{t('pr_late')}</th>
                    <th className="font-semibold">{t('pr_leave')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.section.id} className="border-t border-[#E4E8F0] text-center">
                      <td className="py-1.5 text-start font-semibold text-[#14284B]">{title(s.section)}</td>
                      {s.submission ? (
                        <>
                          <td dir="ltr" className="text-[#2E9E5B] font-bold">{s.present}</td>
                          <td dir="ltr" className="text-[#D64545] font-bold">{s.absent}</td>
                          <td dir="ltr">{s.late}</td>
                          <td dir="ltr">{s.leave}</td>
                        </>
                      ) : (
                        <td colSpan={4} className="text-[11px] text-[#9E7400]">{t('co_not_marked')}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SchoolCard>
        </>
      )}
    </div>
  );
};
