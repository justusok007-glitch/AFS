import { useBackHandler } from '../../navigation/backStack';
import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ClipboardCheck } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Exam, ExamStatus, MarksProgressRow, Profile, TeacherAssignment } from '../../../domain/models/models';
import {
  EmptyState,
  SchoolCard,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { useAccountantLookups } from '../accountant/AccountantShared';
import { examName, MarksEntryGrid, subjectName, useSubjectsMap } from '../exams/ExamShared';
import { selectCls } from '../principal/PrincipalShared';

interface Pair {
  sectionId: string;
  subjectId: string;
}

export const TeacherMarksTab: React.FC<{ teacher: Profile }> = ({ teacher }) => {
  const { stringResource: t, language } = useStringResource();
  const lookups = useAccountantLookups();
  const subjects = useSubjectsMap();
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [examId, setExamId] = useState('');
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [progress, setProgress] = useState<MarksProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState<Pair | null>(null);
  useBackHandler(!!open, () => setOpen(null));

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [ex, as] = await Promise.all([
      AppModule.examRepository.getExams(teacher.campusId),
      AppModule.settingsRepository.getTeacherAssignments(teacher.id),
    ]);
    if (!ex.ok || !as.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setExams(ex.data.filter((e) => e.status === ExamStatus.MARKS_ENTRY));
    setAssignments(as.data.filter((a) => a.canEnterMarks));
    setLoading(false);
  }, [teacher.campusId, teacher.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeExamId = examId || exams[0]?.id || '';
  const exam = exams.find((e) => e.id === activeExamId);

  useEffect(() => {
    if (!exam || lookups.loading) return;
    let cancelled = false;
    void (async () => {
      const out: Pair[] = [];
      const seen = new Set<string>();
      for (const a of assignments) {
        const sec = lookups.sectionsMap[a.sectionId];
        if (!sec) continue;
        const es = await AppModule.examRepository.getExamSubjectsForClass(exam.id, sec.classId);
        if (!es.ok) continue;
        for (const line of es.data) {
          if (a.subjectId && a.subjectId !== line.subjectId) continue;
          const key = `${a.sectionId}/${line.subjectId}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({ sectionId: a.sectionId, subjectId: line.subjectId });
        }
      }
      const pr = await AppModule.examRepository.getMarksProgress(exam.id);
      if (cancelled) return;
      setPairs(out);
      setProgress(pr.ok ? pr.data : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [exam, assignments, lookups.loading, lookups.sectionsMap, open]);

  if (loading || lookups.loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed || lookups.failed) {
    return (
      <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { lookups.reload(); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
    );
  }
  if (exams.length === 0) {
    return <EmptyState title={t('ex_no_open')} description="" icon={<ClipboardCheck className="w-6 h-6 text-[#F28C28]" />} />;
  }
  if (assignments.length === 0) {
    return <EmptyState title={t('ex_no_assign')} description="" icon={<ClipboardCheck className="w-6 h-6 text-[#F28C28]" />} />;
  }

  const labelOf = (p: Pair) => {
    const sec = lookups.sectionsMap[p.sectionId];
    const cls = sec ? lookups.classesMap[sec.classId] : undefined;
    return `${cls ? (language === 'ur' ? cls.nameUr : cls.nameEn) : ''} - ${sec?.name ?? ''} · ${subjectName(subjects, p.subjectId, language)}`;
  };

  if (open && exam) {
    return (
      <MarksEntryGrid
        key={`${open.sectionId}/${open.subjectId}`}
        actor={teacher}
        exam={exam}
        sectionId={open.sectionId}
        subjectId={open.subjectId}
        title={`${examName(exam, language)} · ${labelOf(open)}`}
        onClose={() => setOpen(null)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <select className={selectCls} value={activeExamId} onChange={(e) => setExamId(e.target.value)}>
        {exams.map((e) => (<option key={e.id} value={e.id}>{examName(e, language)}</option>))}
      </select>
      {pairs.length === 0 ? (
        <EmptyState title={t('ex_no_assign')} description="" />
      ) : (
        pairs.map((p) => {
          const pr = progress.find((x) => x.sectionId === p.sectionId && x.subjectId === p.subjectId);
          return (
            <SchoolCard key={`${p.sectionId}/${p.subjectId}`} className="p-3 flex items-center justify-between gap-2" onClick={() => setOpen(p)}>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#14284B] truncate">{labelOf(p)}</div>
                <div dir="ltr" className="text-[11px] text-[#6B7385] text-start">{pr?.entered ?? 0} / {pr?.expected ?? 0}</div>
              </div>
              {pr?.submitted ? <StatusChip label={t('ex_submitted')} tone="success" /> : <StatusChip label={t('att_status_not_marked')} tone="warning" />}
            </SchoolCard>
          );
        })
      )}
    </div>
  );
};
