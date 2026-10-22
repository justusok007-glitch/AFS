import { useBackHandler } from '../../navigation/backStack';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Award, ArrowLeft, ArrowRight } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppModule } from '../../../di/AppModule';
import { StringKey } from '../../../res/strings';
import { Exam, ExamAnalytics, ExamStatus, Profile, Student } from '../../../domain/models/models';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups, StudentNameBlock, studentClassLabel } from '../accountant/AccountantShared';
import { ParentResultsTab } from '../parent/ParentResultsTab';
import { examName, ExamStatusChip, subjectName, useSubjectsMap } from '../exams/ExamShared';
import { CHART, CountUp, percentColor, selectCls } from './PrincipalShared';

export const PrincipalResultsTab: React.FC<{ principal: Profile; lookups: AccountantLookups }> = ({ principal, lookups }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const [openStudent, setOpenStudent] = useState<Student | null>(null);
  const subjects = useSubjectsMap();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState('');
  const [cls, setCls] = useState('');
  const [data, setData] = useState<ExamAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useBackHandler(!!openStudent || !!examId || !!cls, () => {
    if (openStudent) setOpenStudent(null);
    else if (examId) setExamId('');
    else setCls('');
  });

  const loadExams = useCallback(async () => {
    const r = await AppModule.examRepository.getExams(null);
    if (!r.ok) return setFailed(true);
    setExams(r.data.filter((e) => e.status !== ExamStatus.DRAFT));
  }, []);
  useEffect(() => {
    void loadExams();
  }, [loadExams]);

  const exam = exams.find((e) => e.id === examId);
  const [classExams, setClassExams] = useState<Exam[] | null>(null);
  useEffect(() => {
    if (!cls) {
      setClassExams(null);
      return;
    }
    let off = false;
    setClassExams(null);
    const campusOfClass = lookups.classes.find((c) => c.id === cls)?.campusId ?? null;
    void Promise.all(
      exams
        .filter((e) => !e.campusId || !campusOfClass || e.campusId === campusOfClass)
        .map(async (e) => {
          const r = await AppModule.examRepository.getExamSubjectsForClass(e.id, cls);
          return r.ok && r.data.length > 0 ? e : null;
        })
    ).then((list) => {
      if (!off) setClassExams(list.filter((e): e is Exam => e !== null));
    });
    return () => {
      off = true;
    };
  }, [cls, exams, lookups.classes]);

  useEffect(() => {
    if (!exam || !cls) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const campusOfClass = lookups.classes.find((c) => c.id === cls)?.campusId ?? null;
    void AppModule.examRepository
      .getExamAnalytics(exam.id, campusOfClass, cls)
      .then((r) => {
        if (cancelled) return;
        if (r.ok) setData(r.data);
        else setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [exam, cls, lookups.classes]);

  if (failed) {
    return <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { setFailed(false); void loadExams(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />;
  }
  if (!loading && exams.length === 0) {
    return <EmptyState title={t('rs_no_exams')} description="" icon={<Award className="w-6 h-6 text-[#F28C28]" />} />;
  }

  const campusLabel = (id: string) => {
    const c = lookups.campuses.find((x) => x.id === id);
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : '';
  };
  const classOptions = lookups.classes;
  if (openStudent) {
    const Back = isRtl ? ArrowRight : ArrowLeft;
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setOpenStudent(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <Back className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <ParentResultsTab parent={principal} child={openStudent} initialExamId={exam?.id} />
      </div>
    );
  }
  const gradeColors = [CHART.green, CHART.blue, CHART.navy, CHART.amber, CHART.orange, CHART.red, CHART.grey];

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <select className={selectCls} value={cls} onChange={(e) => { setCls(e.target.value); setExamId(''); }}>
          <option value="">{t('rs_choose_class')}</option>
          {classOptions.map((c) => (<option key={c.id} value={c.id}>{campusLabel(c.campusId)} · {language === 'ur' ? c.nameUr : c.nameEn}</option>))}
        </select>
      </SchoolCard>

      {!cls ? (
        <EmptyState title={t('rs_pick_class_hint')} description="" icon={<Award className="w-6 h-6 text-[#F28C28]" />} />
      ) : !exam ? (
        classExams === null ? (
          <ShimmerPlaceholder lines={3} showHeader />
        ) : classExams.length === 0 ? (
          <EmptyState title={t('rs_no_exams')} description="" icon={<Award className="w-6 h-6 text-[#F28C28]" />} />
        ) : (
          <>
            <h3 className="text-xs font-bold text-[#14284B] px-1">{t('rs_exams_of_class')}</h3>
            {classExams.map((e) => (
              <SchoolCard key={e.id} className="p-3 flex items-center justify-between gap-2" onClick={() => setExamId(e.id)}>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#14284B] truncate">{examName(e, language)}</div>
                  <div className="text-[11px] text-[#6B7385]">{t(`ex_type_${e.type}` as StringKey)}</div>
                </div>
                <ExamStatusChip status={e.status} />
              </SchoolCard>
            ))}
          </>
        )
      ) : loading || !data ? (
        <>
          <ExamBackRow onBack={() => setExamId('')} title={examName(exam, language)} />
          <ShimmerPlaceholder lines={5} showHeader />
        </>
      ) : data.studentsCount === 0 && data.incompleteCount === 0 ? (
        <EmptyState title={t('rs_none')} description="" />
      ) : (
        <>
          <ExamBackRow onBack={() => setExamId('')} title={examName(exam, language)} status={exam.status} />
          <div className="grid grid-cols-2 gap-2.5">
            <Kpi label={t('rs_students')} value={<CountUp value={data.studentsCount} />} />
            <Kpi label={t('rs_avg')} value={<span dir="ltr" style={{ color: percentColor(data.averagePercent) }}>{data.averagePercent}%</span>} />
            <Kpi label={t('rs_pass_rate')} value={<span dir="ltr" style={{ color: percentColor(data.passPercent) }}>{data.passPercent}%</span>} />
            <Kpi label={t('rs_incomplete')} value={<CountUp value={data.incompleteCount} />} />
          </div>

          <SchoolCard className="space-y-2">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('rs_grade_dist')}</div>
            <div dir="ltr" className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gradeDistribution} margin={{ top: 20, right: 8, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="grade" tick={{ fill: '#1B2233', fontSize: 11, fontWeight: 600 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: CHART.grey, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {data.gradeDistribution.map((_, i) => (<Cell key={i} fill={gradeColors[i % gradeColors.length]} />))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#1B2233' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SchoolCard>

          <SchoolCard className="space-y-2">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('rs_subject_avgs')}</div>
            <div dir="ltr" className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectAverages.map((s) => ({ name: subjectName(subjects, s.subjectId, language), pct: s.averagePercent }))} margin={{ top: 20, right: 8, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                  <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={80} tick={{ fill: '#1B2233', fontSize: 10 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                  <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: CHART.grey, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: unknown) => [`${Number(v)}%`, t('rs_avg')]} contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }} />
                  <Bar dataKey="pct" radius={[8, 8, 0, 0]} maxBarSize={40}>
                    {data.subjectAverages.map((s, i) => (<Cell key={i} fill={percentColor(s.averagePercent)} />))}
                    <LabelList dataKey="pct" position="top" style={{ fontSize: 10, fill: '#1B2233' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SchoolCard>

          <SchoolCard className="space-y-2">
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('rs_top10')}</div>
            {data.topStudents.map((s, i) => (
              <div key={s.student.id} role="button" tabIndex={0} onClick={() => setOpenStudent(s.student)} className="flex items-center gap-2 border-t border-[#E4E8F0] pt-1.5 cursor-pointer active:bg-[#F7F8FB]">
                <span dir="ltr" className="w-5 text-xs font-bold text-[#F28C28]">{i + 1}</span>
                <div className="flex-1 min-w-0"><StudentNameBlock student={s.student} classLabel={studentClassLabel(s.student, lookups, language)} /></div>
                <span dir="ltr" className="text-xs font-bold text-[#14284B]">{s.percentage}% · {s.grade}</span>
              </div>
            ))}
          </SchoolCard>
        </>
      )}
    </div>
  );
};

const ExamBackRow: React.FC<{ onBack: () => void; title: string; status?: Exam['status'] }> = ({ onBack, title, status }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const Back = isRtl ? ArrowRight : ArrowLeft;
  return (
    <SchoolCard className="p-3 flex items-center justify-between gap-2">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[36px] cursor-pointer shrink-0">
        <Back className="w-4 h-4" />
        <span>{t('rs_all_exams')}</span>
      </button>
      <div className="min-w-0 flex items-center gap-2">
        <span className="text-xs font-bold text-[#14284B] truncate">{title}</span>
        {status && <ExamStatusChip status={status} />}
      </div>
    </SchoolCard>
  );
};

const Kpi: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <SchoolCard className="text-center py-3">
    <div className="font-heading text-xl font-bold text-[#14284B]">{value}</div>
    <div className="text-[11px] text-[#6B7385]">{label}</div>
  </SchoolCard>
);
