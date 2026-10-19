import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Plus, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Exam, ExamStatus, ExamType, MarksProgressRow, Profile, Subject } from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { examName, ExamStatusChip, MarksEntryGrid, subjectName, useSubjectsMap } from '../exams/ExamShared';
import { AdminResultImport } from './AdminResultImport';
import { selectCls } from '../principal/PrincipalShared';

export const AdminExamsSection: React.FC<{ admin: Profile; lookups: AccountantLookups }> = ({ admin, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.examRepository.getExams(null);
    if (!r.ok) setFailed(true);
    else setExams(r.data);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (loading || lookups.loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed) {
    return <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />;
  }

  const open = exams.find((e) => e.id === openId);
  if (open) {
    return <ExamDetail admin={admin} lookups={lookups} examId={open.id} onBack={() => { setOpenId(null); void load(); }} />;
  }

  if (importing) {
    return <AdminResultImport admin={admin} onDone={() => void load()} onClose={() => setImporting(false)} />;
  }

  if (creating) {
    return (
      <CreateExam
        admin={admin}
        lookups={lookups}
        onCancel={() => setCreating(false)}
        onCreated={(e) => {
          setCreating(false);
          void load();
          setOpenId(e.id);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <PrimaryButton text={t('ex_new')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setCreating(true)} />
      <PrimaryButton text={t('res_imp_btn')} variant="outline" icon={<Upload className="w-4 h-4 text-[#F28C28]" />} onClick={() => setImporting(true)} />
      {exams.length === 0 ? (
        <EmptyState title={t('ex_none')} description="" />
      ) : (
        exams.map((e) => {
          const campus = lookups.campuses.find((c) => c.id === e.campusId);
          return (
            <SchoolCard key={e.id} className="p-3 flex items-center justify-between gap-2" onClick={() => setOpenId(e.id)}>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#14284B] truncate">{examName(e, language)}</div>
                <div className="text-[11px] text-[#6B7385]">
                  {t(`ex_type_${e.type}` as StringKey)} · {campus ? (language === 'ur' ? campus.nameUr : campus.nameEn) : t('ex_all_campus')}
                </div>
              </div>
              <ExamStatusChip status={e.status} />
            </SchoolCard>
          );
        })
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ create */

const CreateExam: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onCancel: () => void;
  onCreated: (e: Exam) => void;
}> = ({ admin, lookups, onCancel, onCreated }) => {
  const { stringResource: t, language } = useStringResource();
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [type, setType] = useState<ExamType>(ExamType.MONTHLY_TEST);
  const [campus, setCampus] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError(null);
    const r = await AppModule.examRepository.createExam(
      { id: '', nameEn, nameUr, type, status: ExamStatus.DRAFT, campusId: campus || null, startDate: start || null, endDate: end || null },
      admin.id
    );
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    onCreated(r.data);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ex_new')}</h3>
      <SchoolTextField label={t('ex_name_en')} value={nameEn} onValueChange={setNameEn} />
      <div><SchoolTextField urdu label={t('ex_name_ur')} value={nameUr} onValueChange={setNameUr} /></div>
      <TabRow
        tabs={[ExamType.MONTHLY_TEST, ExamType.MID_TERM, ExamType.FINAL_TERM].map((x) => ({ id: x, label: t(`ex_type_${x}` as StringKey) }))}
        selected={type}
        onSelect={setType}
      />
      <select className={selectCls} value={campus} onChange={(e) => setCampus(e.target.value)}>
        <option value="">{t('ex_all_campus')}</option>
        {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
      </select>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('ex_start')}</label>
          <input type="date" dir="ltr" className={selectCls} value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('ex_end')}</label>
          <input type="date" dir="ltr" className={selectCls} value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onCancel} />
        <PrimaryButton text={t('su_save')} variant="orange" loading={busy} onClick={() => void save()} />
      </div>
    </SchoolCard>
  );
};

/* ------------------------------------------------------------------ detail */

interface SubRow {
  subjectId: string;
  on: boolean;
  total: string;
  pass: string;
}

const ExamDetail: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  examId: string;
  onBack: () => void;
}> = ({ admin, lookups, examId, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const subjects = useSubjectsMap();
  const [exam, setExam] = useState<Exam | null>(null);
  const [progress, setProgress] = useState<MarksProgressRow[]>([]);
  const [classId, setClassId] = useState('');
  const [rows, setRows] = useState<SubRow[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ sectionId: string; subjectId: string } | null>(null);

  const reloadExam = useCallback(async () => {
    const [ex, pr] = await Promise.all([
      AppModule.examRepository.getExams(null),
      AppModule.examRepository.getMarksProgress(examId),
    ]);
    if (ex.ok) setExam(ex.data.find((e) => e.id === examId) ?? null);
    if (pr.ok) setProgress(pr.data);
  }, [examId]);
  useEffect(() => {
    void reloadExam();
  }, [reloadExam]);

  const classes = lookups.classes.filter((c) => !exam?.campusId || c.campusId === exam.campusId);
  const activeClass = classId || classes[0]?.id || '';

  // load the class subjects + the exam's saved config for the chosen class
  useEffect(() => {
    if (!activeClass) return;
    let cancelled = false;
    void (async () => {
      const [cs, es] = await Promise.all([
        AppModule.settingsRepository.getClassSubjects(activeClass),
        AppModule.examRepository.getExamSubjectsForClass(examId, activeClass),
      ]);
      if (cancelled || !cs.ok || !es.ok) return;
      setClassSubjects(cs.data);
      setRows(
        cs.data.map((s) => {
          const saved = es.data.find((x) => x.subjectId === s.id);
          return { subjectId: s.id, on: !!saved, total: String(saved?.totalMarks ?? 100), pass: String(saved?.passMarks ?? 33) };
        })
      );
      setNotice(false);
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeClass, examId, progress.length]);

  if (!exam) return <ShimmerPlaceholder lines={4} showHeader />;

  const locked = exam.status === ExamStatus.PUBLISHED;

  const toList = (r: SubRow[], cid: string) =>
    r.filter((x) => x.on).map((x) => ({ examId, classId: cid, subjectId: x.subjectId, totalMarks: Number(x.total), passMarks: Number(x.pass) }));

  const saveClass = async () => {
    setBusy(true);
    setError(null);
    setNotice(false);
    const r = await AppModule.examRepository.configureExamSubjects(examId, activeClass, toList(rows, activeClass), admin.id);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setNotice(true);
    void reloadExam();
  };

  const copyAll = async () => {
    setBusy(true);
    setError(null);
    setNotice(false);
    for (const c of classes) {
      const cs = await AppModule.settingsRepository.getClassSubjects(c.id);
      if (!cs.ok) continue;
      const have = new Set(cs.data.map((x) => x.id));
      const list = toList(rows, c.id).filter((x) => have.has(x.subjectId));
      const r = await AppModule.examRepository.configureExamSubjects(examId, c.id, list, admin.id);
      if (!r.ok) {
        setBusy(false);
        return setError(`${language === 'ur' ? c.nameUr : c.nameEn}: ${r.error.message}`);
      }
    }
    setBusy(false);
    setNotice(true);
    void reloadExam();
  };

  const setStatus = async (status: ExamStatus) => {
    setError(null);
    const r = await AppModule.examRepository.updateExamStatus(examId, status, admin.id);
    if (!r.ok) return setError(r.error.message);
    void reloadExam();
  };

  if (editing) {
    const sec = lookups.sectionsMap[editing.sectionId];
    const cls = sec ? lookups.classesMap[sec.classId] : undefined;
    return (
      <MarksEntryGrid
        actor={admin}
        exam={exam}
        sectionId={editing.sectionId}
        subjectId={editing.subjectId}
        title={`${cls ? (language === 'ur' ? cls.nameUr : cls.nameEn) : ''} - ${sec?.name ?? ''} · ${subjectName(subjects, editing.subjectId, language)}`}
        onClose={() => { setEditing(null); void reloadExam(); }}
      />
    );
  }

  const progressByClass = classes.map((c) => ({ cls: c, rows: progress.filter((p) => p.classId === c.id) })).filter((x) => x.rows.length > 0);

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('ad_att_close')}</span>
      </button>
      <SchoolCard className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-heading text-sm font-bold text-[#14284B]">{examName(exam, language)}</div>
            <div className="text-[11px] text-[#6B7385]">{t(`ex_type_${exam.type}` as StringKey)}{exam.startDate ? ` · ${exam.startDate}${exam.endDate ? ` → ${exam.endDate}` : ''}` : ''}</div>
          </div>
          <ExamStatusChip status={exam.status} />
        </div>
        {exam.status === ExamStatus.DRAFT && <PrimaryButton text={t('ex_btn_open_entry')} variant="navy" onClick={() => void setStatus(ExamStatus.MARKS_ENTRY)} />}
        {exam.status === ExamStatus.MARKS_ENTRY && <PrimaryButton text={t('ex_btn_publish')} variant="orange" onClick={() => void setStatus(ExamStatus.PUBLISHED)} />}
        {exam.status === ExamStatus.PUBLISHED && <PrimaryButton text={t('ex_btn_unpublish')} variant="outline" onClick={() => void setStatus(ExamStatus.MARKS_ENTRY)} />}
        {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      </SchoolCard>

      <SchoolCard className="space-y-2.5">
        <h3 className="text-xs font-bold text-[#14284B]">{t('ex_subjects_heading')}</h3>
        <select className={selectCls} value={activeClass} onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
        </select>
        {classSubjects.length === 0 ? (
          <p className="text-xs text-[#6B7385]">{t('ex_no_class_subjects')}</p>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[10px] font-semibold text-[#6B7385]">
              <span className="flex-1">{t('ex_subject')}</span>
              <span className="w-16 text-center">{t('ex_total')}</span>
              <span className="w-16 text-center">{t('ex_pass')}</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.subjectId} className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-2 text-xs cursor-pointer min-w-0">
                  <input type="checkbox" disabled={locked} checked={r.on} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, on: e.target.checked } : x)))} />
                  <span className="truncate">{subjectName(subjects, r.subjectId, language)}</span>
                </label>
                <input dir="ltr" inputMode="numeric" disabled={locked || !r.on} value={r.total} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, total: e.target.value } : x)))} className="w-16 min-h-[40px] rounded-xl border border-[#E4E8F0] text-center text-sm" />
                <input dir="ltr" inputMode="numeric" disabled={locked || !r.on} value={r.pass} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, pass: e.target.value } : x)))} className="w-16 min-h-[40px] rounded-xl border border-[#E4E8F0] text-center text-sm" />
              </div>
            ))}
          </div>
        )}
        {notice && <p className="text-xs font-semibold text-[#2E9E5B]">{t('ex_saved')}</p>}
        {!locked && (
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('su_save')} variant="orange" loading={busy} onClick={() => void saveClass()} />
            <PrimaryButton text={t('ex_copy_all')} variant="outline" loading={busy} onClick={() => void copyAll()} />
          </div>
        )}
      </SchoolCard>

      {progressByClass.length > 0 && (
        <SchoolCard className="space-y-2">
          <h3 className="text-xs font-bold text-[#14284B]">{t('ex_progress')}</h3>
          {progressByClass.map(({ cls, rows: pr }) => (
            <div key={cls.id} className="space-y-1">
              <div className="text-[11px] font-bold text-[#14284B]">{language === 'ur' ? cls.nameUr : cls.nameEn}</div>
              {pr.map((p) => {
                const sec = lookups.sectionsMap[p.sectionId];
                const done = p.expected > 0 && p.entered >= p.expected;
                return (
                  <button
                    key={`${p.sectionId}/${p.subjectId}`}
                    type="button"
                    disabled={exam.status === ExamStatus.DRAFT}
                    onClick={() => setEditing({ sectionId: p.sectionId, subjectId: p.subjectId })}
                    className="w-full flex items-center justify-between gap-2 text-xs border-t border-[#E4E8F0] pt-1.5 text-start cursor-pointer disabled:cursor-default"
                  >
                    <span className="truncate">{sec?.name} · {subjectName(subjects, p.subjectId, language)}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span dir="ltr" className="font-mono">{p.entered}/{p.expected}</span>
                      <StatusChip label={p.submitted ? t('ex_submitted') : done ? t('ex_entered') : t('att_status_not_marked')} tone={p.submitted || done ? 'success' : 'warning'} />
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </SchoolCard>
      )}
    </div>
  );
};
