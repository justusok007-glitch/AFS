import React, { useEffect, useState } from 'react';
import { AlertCircle, Award, Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppModule } from '../../../di/AppModule';
import { ExamStatus, ExamType, Profile, Student, StudentResultCard } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  PrintFrame,
  Row,
  SchoolHeader,
  studentClassLabel,
  useAccountantLookups,
} from '../accountant/AccountantShared';
import { examName, subjectName, useSubjectsMap } from '../exams/ExamShared';
import { CHART, percentColor } from '../principal/PrincipalShared';

export const ParentResultsTab: React.FC<{ parent: Profile; child: Student }> = ({ parent, child }) => {
  const { stringResource: t, language } = useStringResource();
  const lookups = useAccountantLookups();
  const subjects = useSubjectsMap();
  const [cards, setCards] = useState<StudentResultCard[]>([]);
  const [showPosition, setShowPosition] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setFailed(false);
      const [ex, ss] = await Promise.all([
        AppModule.examRepository.getExams(child.campusId),
        AppModule.settingsRepository.getSchoolSettings(),
      ]);
      if (cancelled) return;
      if (!ex.ok) {
        setFailed(true);
        setLoading(false);
        return;
      }
      if (ss.ok) setShowPosition(ss.data.showClassPosition !== false);
      const out: StudentResultCard[] = [];
      for (const e of ex.data.filter((x) => x.status === ExamStatus.PUBLISHED)) {
        const r = await AppModule.examRepository.getStudentResultCard(e.id, child.id, parent);
        if (r.ok) out.push(r.data);
      }
      if (cancelled) return;
      setCards(out);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [child.id, child.campusId, parent]);

  if (loading || lookups.loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed) {
    return <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />;
  }
  if (cards.length === 0) {
    return <EmptyState title={t('rs_none')} description="" icon={<Award className="w-6 h-6 text-[#F28C28]" />} />;
  }

  const open = cards.find((c) => c.exam.id === openId);
  if (open) {
    const mid =
      open.exam.type === ExamType.FINAL_TERM
        ? cards.find((c) => c.exam.type === ExamType.MID_TERM && c.exam.id !== open.exam.id)
        : undefined;
    return (
      <>
        {printing && (
          <PrintFrame onClose={() => setPrinting(false)}>
            <ReportCardDoc card={open} mid={mid} lookups={lookups} subjects={subjects} showPosition={showPosition} />
          </PrintFrame>
        )}
        <ReportCard
          card={open}
          mid={mid}
          lookups={lookups}
          subjects={subjects}
          showPosition={showPosition}
          onBack={() => setOpenId(null)}
          onPrint={() => setPrinting(true)}
        />
      </>
    );
  }

  const trend = [...cards].reverse().map((c) => ({ name: examName(c.exam, language), pct: c.percentage }));

  return (
    <div className="space-y-3">
      {trend.length >= 2 && (
        <SchoolCard className="space-y-2">
          <div className="font-heading text-xs font-bold text-[#14284B]">{t('rs_trend')}</div>
          <div dir="ltr" className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 12, right: 16, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
                <XAxis dataKey="name" tick={{ fill: '#1B2233', fontSize: 10 }} axisLine={{ stroke: CHART.grid }} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: CHART.grey, fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: unknown) => [`${Number(v)}%`, t('rs_percentage')]} contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }} />
                <Line type="monotone" dataKey="pct" stroke={CHART.orange} strokeWidth={3} dot={{ r: 4, fill: CHART.navy }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SchoolCard>
      )}
      {cards.map((c) => (
        <SchoolCard key={c.exam.id} className="p-3 flex items-center justify-between gap-2" onClick={() => setOpenId(c.exam.id)}>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#14284B] truncate">{examName(c.exam, language)}</div>
            <div className="text-[11px] text-[#6B7385]">
              {t(`ex_type_${c.exam.type}` as StringKey)} · <span dir="ltr">{c.percentage}%</span> · {t('rs_grade')} <span dir="ltr">{c.grade}</span>
            </div>
          </div>
          <StatusChip label={c.passed ? t('rs_pass') : t('rs_fail')} tone={c.passed ? 'success' : 'error'} />
        </SchoolCard>
      ))}
    </div>
  );
};

/* -------------------------------------------------------------- report card */

interface CardProps {
  card: StudentResultCard;
  mid?: StudentResultCard;
  lookups: AccountantLookups;
  subjects: ReturnType<typeof useSubjectsMap>;
  showPosition: boolean;
}

const ReportCard: React.FC<CardProps & { onBack: () => void; onPrint: () => void }> = ({ card, mid, lookups, subjects, showPosition, onBack, onPrint }) => {
  const { stringResource: t, language } = useStringResource();
  const chart = card.subjectLines.map((l) => ({ name: subjectName(subjects, l.subjectId, language), pct: l.percent }));
  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">← {t('rs_back')}</button>
      <SchoolCard className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-heading text-sm font-bold text-[#14284B]">{examName(card.exam, language)}</div>
            <div className="text-[11px] text-[#6B7385]">{studentClassLabel(card.student, lookups, language)}</div>
          </div>
          <StatusChip label={card.passed ? t('rs_pass') : t('rs_fail')} tone={card.passed ? 'success' : 'error'} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold" style={{ color: percentColor(card.percentage) }}>{card.percentage}%</div><div className="text-[10px] text-[#6B7385]">{t('rs_percentage')}</div></div>
          <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#14284B]">{card.grade}</div><div className="text-[10px] text-[#6B7385]">{t('rs_grade')}</div></div>
          {showPosition && card.rankInSection !== null ? (
            <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#14284B]">{card.rankInSection}/{card.sectionSize}</div><div className="text-[10px] text-[#6B7385]">{t('rs_position')}</div></div>
          ) : (
            <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#14284B]">{card.totalObtainedMarks}/{card.totalMaxMarks}</div><div className="text-[10px] text-[#6B7385]">{t('rs_grand_total')}</div></div>
          )}
        </div>
        {(language === 'ur' ? card.gradeRemarksUr : card.gradeRemarksEn) && (
          <p className="text-xs text-[#6B7385] text-center">{language === 'ur' ? card.gradeRemarksUr : card.gradeRemarksEn}</p>
        )}
      </SchoolCard>

      <SchoolCard className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#6B7385]">
          <span className="flex-1">{t('ex_subject')}</span>
          {mid && <span className="w-14 text-center">{t('rs_midterm')}</span>}
          <span className="w-16 text-center">{t('rs_obtained')}</span>
          <span className="w-10 text-center">{t('ex_total')}</span>
        </div>
        {card.subjectLines.map((l) => {
          const midLine = mid?.subjectLines.find((x) => x.subjectId === l.subjectId);
          return (
            <div key={l.subjectId} className="flex items-center gap-2 text-xs border-t border-[#E4E8F0] pt-1.5">
              <span className="flex-1 min-w-0 truncate">{subjectName(subjects, l.subjectId, language)}</span>
              {mid && <span dir="ltr" className="w-14 text-center text-[#6B7385]">{midLine ? (midLine.isAbsent ? 'A' : `${midLine.obtained}/${midLine.totalMarks}`) : '-'}</span>}
              <span dir="ltr" className={`w-16 text-center font-bold ${l.passed ? 'text-[#14284B]' : 'text-[#D64545]'}`}>{!l.entered ? t('rs_not_entered') : l.isAbsent ? t('ex_absent') : l.obtained}</span>
              <span dir="ltr" className="w-10 text-center text-[#6B7385]">{l.totalMarks}</span>
            </div>
          );
        })}
      </SchoolCard>

      <SchoolCard className="space-y-2">
        <div className="font-heading text-xs font-bold text-[#14284B]">{t('rs_subject_chart')}</div>
        <div dir="ltr" className="w-full h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart} margin={{ top: 20, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
              <XAxis dataKey="name" tick={{ fill: '#1B2233', fontSize: 9 }} axisLine={{ stroke: CHART.grid }} tickLine={false} interval={0} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: CHART.grey, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown) => [`${Number(v)}%`, t('rs_percentage')]} contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }} />
              <Bar dataKey="pct" radius={[8, 8, 0, 0]} maxBarSize={40}>
                {chart.map((e, i) => (<Cell key={i} fill={percentColor(e.pct)} />))}
                <LabelList dataKey="pct" position="top" style={{ fontSize: 10, fill: '#1B2233' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SchoolCard>

      <PrimaryButton text={t('rs_print')} variant="navy" icon={<Printer className="w-4 h-4 text-[#F28C28]" />} onClick={onPrint} />
    </div>
  );
};

const ReportCardDoc: React.FC<CardProps> = ({ card, mid, lookups, subjects, showPosition }) => {
  const { stringResource: t, language } = useStringResource();
  return (
    <div className="print-sheet-doc">
      <SchoolHeader lookups={lookups} subtitle={t('rs_report_title')} />
      <Row label={t('ex_pick_exam')} value={examName(card.exam, language)} />
      <Row label={t('acc_student_col')} value={`${language === 'ur' && card.student.nameUr ? card.student.nameUr : card.student.name} (${card.student.admissionNo})`} />
      <Row label={t('acc_class_col')} value={studentClassLabel(card.student, lookups, language)} />
      <Row label={t('acc_father_label')} value={card.student.fatherName} />
      <table className="w-full text-xs my-3 border-collapse">
        <thead>
          <tr className="border-b border-[#14284B] text-start">
            <th className="py-1 text-start">{t('ex_subject')}</th>
            {mid && <th>{t('rs_midterm')}</th>}
            <th>{t('rs_obtained')}</th>
            <th>{t('ex_total')}</th>
            <th>{t('ex_pass')}</th>
          </tr>
        </thead>
        <tbody>
          {card.subjectLines.map((l) => {
            const m = mid?.subjectLines.find((x) => x.subjectId === l.subjectId);
            return (
              <tr key={l.subjectId} className="border-b border-[#E4E8F0] text-center">
                <td className="py-1 text-start">{subjectName(subjects, l.subjectId, language)}</td>
                {mid && <td dir="ltr">{m ? (m.isAbsent ? 'A' : `${m.obtained}/${m.totalMarks}`) : '-'}</td>}
                <td dir="ltr" className="font-bold">{l.isAbsent ? t('ex_absent') : l.obtained}</td>
                <td dir="ltr">{l.totalMarks}</td>
                <td dir="ltr">{l.passMarks}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Row label={t('rs_grand_total')} value={<span dir="ltr">{card.totalObtainedMarks} / {card.totalMaxMarks}</span>} />
      <Row label={t('rs_percentage')} value={<span dir="ltr">{card.percentage}%</span>} />
      <Row label={t('rs_grade')} value={card.grade} />
      <Row label={t('rs_result')} value={card.passed ? t('rs_pass') : t('rs_fail')} />
      {showPosition && card.rankInSection !== null && <Row label={t('rs_position')} value={<span dir="ltr">{card.rankInSection} / {card.sectionSize}</span>} />}
      <div className="mt-8 flex justify-between text-[10px] text-[#6B7385]">
        <span>{t('print_computer_generated_note')}</span>
        <span className="border-t border-[#1B2233] pt-0.5 min-w-[110px] text-center">{t('acc_signature_label')}</span>
      </div>
    </div>
  );
};
