import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppModule } from '../../../di/AppModule';
import { formatSchoolTime } from '../../../domain/formatters/SchoolFormatters';
import {
  Exam,
  ExamStatus,
  ExamSubject,
  Mark,
  MarkSubmission,
  Profile,
  Student,
  Subject,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';

export function examName(e: Exam, language: string): string {
  return language === 'ur' && e.nameUr ? e.nameUr : e.nameEn;
}

export function useSubjectsMap(): Record<string, Subject> {
  const [map, setMap] = useState<Record<string, Subject>>({});
  useEffect(() => {
    void (async () => {
      const r = await AppModule.settingsRepository.getSubjects();
      if (!r.ok) return;
      const m: Record<string, Subject> = {};
      r.data.forEach((s) => (m[s.id] = s));
      setMap(m);
    })();
  }, []);
  return map;
}

export function subjectName(map: Record<string, Subject>, id: string, language: string): string {
  const s = map[id];
  if (!s) return id;
  return language === 'ur' && s.nameUr ? s.nameUr : s.nameEn;
}

export const ExamStatusChip: React.FC<{ status: ExamStatus }> = ({ status }) => {
  const { stringResource: t } = useStringResource();
  const tone = status === ExamStatus.PUBLISHED ? 'success' : status === ExamStatus.MARKS_ENTRY ? 'warning' : 'info';
  return <StatusChip label={t(`ex_status_${status}` as StringKey)} tone={tone} />;
};

interface Cell {
  text: string;
  absent: boolean;
}

/** Marks grid for one exam + section + subject. Teachers autosave a draft; admin edits of a published exam need a reason. */
export const MarksEntryGrid: React.FC<{
  actor: Profile;
  exam: Exam;
  sectionId: string;
  subjectId: string;
  title: string;
  onClose: () => void;
}> = ({ actor, exam, sectionId, subjectId, title, onClose }) => {
  const { stringResource: t } = useStringResource();
  const published = exam.status === ExamStatus.PUBLISHED;
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [submission, setSubmission] = useState<MarkSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [st, mk, sm, subm] = await Promise.all([
      AppModule.attendanceRepository.studentsOfSection(sectionId),
      AppModule.examRepository.getMarksForSectionSubject(exam.id, sectionId, subjectId),
      AppModule.settingsRepository.getSections(null),
      AppModule.examRepository.getMarkSubmission(exam.id, sectionId, subjectId),
    ]);
    if (!st.ok || !mk.ok || !sm.ok || !subm.ok) {
      setError('Could not load marks.');
      setLoading(false);
      return;
    }
    const sec = sm.data.find((x) => x.id === sectionId);
    const es = sec ? await AppModule.examRepository.getExamSubjectsForClass(exam.id, sec.classId) : null;
    const line: ExamSubject | undefined = es && es.ok ? es.data.find((x) => x.subjectId === subjectId) : undefined;
    setTotal(line?.totalMarks ?? 0);
    setStudents(st.data);
    const c: Record<string, Cell> = {};
    mk.data.forEach((m: Mark) => (c[m.studentId] = { text: m.isAbsent ? '' : String(m.obtained), absent: m.isAbsent }));
    setCells(c);
    setSubmission(subm.data);
    setLoading(false);
    loaded.current = true;
  }, [exam.id, sectionId, subjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parse = (c: Cell | undefined): { ok: boolean; entered: boolean; value: number } => {
    if (!c) return { ok: true, entered: false, value: 0 };
    if (c.absent) return { ok: true, entered: true, value: 0 };
    if (c.text.trim() === '') return { ok: true, entered: false, value: 0 };
    const n = Number(c.text);
    const ok = Number.isFinite(n) && n >= 0 && n <= total && Math.round(n * 2) === n * 2;
    return { ok, entered: ok, value: n };
  };

  const toMarks = (): Mark[] =>
    students.flatMap((s) => {
      const p = parse(cells[s.id]);
      if (!p.entered) return [];
      return [{ examId: exam.id, studentId: s.id, subjectId, obtained: p.value, isAbsent: !!cells[s.id]?.absent }];
    });

  const enteredCount = students.filter((s) => parse(cells[s.id]).entered).length;
  const hasInvalid = students.some((s) => !parse(cells[s.id]).ok);

  const scheduleAutosave = (next: Record<string, Cell>) => {
    if (published || !loaded.current) return;
    setDraftSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const marks = students.flatMap((s) => {
        const c = next[s.id];
        if (!c) return [];
        if (c.absent) return [{ examId: exam.id, studentId: s.id, subjectId, obtained: 0, isAbsent: true }];
        const n = Number(c.text);
        if (c.text.trim() === '' || !Number.isFinite(n) || n < 0 || n > total || Math.round(n * 2) !== n * 2) return [];
        return [{ examId: exam.id, studentId: s.id, subjectId, obtained: n, isAbsent: false }];
      });
      const r = await AppModule.examRepository.enterMarks(actor, exam.id, sectionId, subjectId, marks, false);
      if (r.ok) setDraftSaved(true);
      else setError(r.error.message);
    }, 900);
  };

  const update = (id: string, patch: Partial<Cell>) => {
    const next = { ...cells, [id]: { ...(cells[id] ?? { text: '', absent: false }), ...patch } };
    setCells(next);
    setError(null);
    scheduleAutosave(next);
  };

  const submit = async () => {
    setError(null);
    if (hasInvalid) return setError(t('ex_invalid'));
    if (enteredCount !== students.length) return setError(t('ex_all_needed'));
    if (published && !reason.trim()) return setError(t('st_err_reason'));
    if (timer.current) clearTimeout(timer.current);
    setBusy(true);
    const r = await AppModule.examRepository.enterMarks(actor, exam.id, sectionId, subjectId, toMarks(), true, published ? reason : undefined);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    if (published) onClose();
    else void load();
  };

  if (loading) return <ShimmerPlaceholder lines={6} showHeader />;

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-sm font-bold text-[#14284B]">{title}</h3>
          {submission && !published && <StatusChip label={`${t('ex_submitted')} ${formatSchoolTime(submission.submittedAt)}`} tone="success" />}
        </div>
        <div className="text-xs text-[#6B7385]">
          <span dir="ltr" className="font-bold text-[#14284B]">{enteredCount} / {students.length}</span> {t('ex_entered')} · {t('ex_total')} <span dir="ltr" className="font-bold">{total}</span>
          {draftSaved && !published && <span className="ms-2 text-[#2E9E5B] font-semibold">{t('ex_saved_draft')}</span>}
        </div>
      </SchoolCard>

      <SchoolCard className="p-0 divide-y divide-[#E4E8F0]">
        {students.map((s) => {
          const c = cells[s.id];
          const bad = !parse(c).ok;
          return (
            <div key={s.id} className="flex items-center gap-2 px-3 py-2">
              <span dir="ltr" className="w-7 text-[11px] font-mono text-[#6B7385]">{s.rollNo}</span>
              <span className="flex-1 min-w-0 text-sm truncate">{s.name}</span>
              <input
                inputMode="decimal"
                dir="ltr"
                disabled={c?.absent}
                value={c?.absent ? '' : (c?.text ?? '')}
                onChange={(e) => update(s.id, { text: e.target.value })}
                className={`w-16 min-h-[40px] rounded-xl border px-2 text-center text-sm font-bold ${bad ? 'border-[#D64545] text-[#D64545]' : 'border-[#E4E8F0]'} ${c?.absent ? 'bg-[#F6F8FC]' : 'bg-white'}`}
              />
              <label className="flex items-center gap-1 text-[11px] text-[#6B7385] cursor-pointer">
                <input type="checkbox" checked={!!c?.absent} onChange={(e) => update(s.id, { absent: e.target.checked, text: '' })} />
                {t('ex_absent')}
              </label>
            </div>
          );
        })}
      </SchoolCard>

      {published && <SchoolTextField label={t('ex_reason_edit')} value={reason} onValueChange={setReason} />}
      {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_att_close')} variant="outline" onClick={onClose} />
        <PrimaryButton text={published ? t('ex_save_changes') : t('ex_submit')} variant="orange" loading={busy} onClick={() => void submit()} />
      </div>
    </div>
  );
};
