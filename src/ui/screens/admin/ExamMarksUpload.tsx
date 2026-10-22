import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Exam, ImportMarksResult, ImportMarksRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups, downloadCsv } from '../accountant/AccountantShared';
import { examName, useSubjectsMap } from '../exams/ExamShared';
import { splitCsvLine } from './AdminBulkStudents';

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9؀-ۿ]/g, '');

/** Marks CSV of one exam and one class: the template already lists the class's students and the exam's subjects. */
export const ExamMarksUpload: React.FC<{
  admin: Profile;
  exam: Exam;
  classId: string;
  lookups: AccountantLookups;
  onDone: () => void;
}> = ({ admin, exam, classId, lookups, onDone }) => {
  const { stringResource: t, language } = useStringResource();
  const subjects = useSubjectsMap();
  const [rows, setRows] = useState<ImportMarksRow[] | null>(null);
  const [checked, setChecked] = useState<ImportMarksResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const cls = lookups.classesMap[classId];

  const sectionIds = Object.values(lookups.sectionsMap)
    .filter((s) => s.classId === classId)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((s) => s.id);

  const downloadTemplate = async () => {
    setErr(null);
    const es = await AppModule.examRepository.getExamSubjectsForClass(exam.id, classId);
    if (!es.ok) return setErr(es.error.message);
    const list = es.data;
    const head = ['Adm No', 'Student Name', 'Father Name', 'Section', ...list.map((x) => `${subjects[x.subjectId]?.nameEn ?? x.subjectId}/${x.totalMarks}`)];
    const out: (string | number)[][] = [head];
    for (const secId of sectionIds) {
      const st = await AppModule.attendanceRepository.studentsOfSection(secId);
      if (!st.ok) continue;
      const existing: Record<string, Record<string, string>> = {};
      for (const x of list) {
        const mk = await AppModule.examRepository.getMarksForSectionSubject(exam.id, secId, x.subjectId);
        if (!mk.ok) continue;
        mk.data.forEach((m) => {
          (existing[m.studentId] ??= {})[x.subjectId] = m.isAbsent ? 'A' : String(m.obtained);
        });
      }
      st.data.forEach((s) => {
        out.push([s.admissionNo, s.name, s.fatherName, lookups.sectionsMap[secId]?.name ?? '', ...list.map((x) => existing[s.id]?.[x.subjectId] ?? '')]);
      });
    }
    const nm = `${examName(exam, 'en')}_${cls?.nameEn ?? 'class'}`.replace(/[^A-Za-z0-9]+/g, '_');
    downloadCsv(`${nm}_marks.csv`, out);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(null);
    setChecked(null);
    const es = await AppModule.examRepository.getExamSubjectsForClass(exam.id, classId);
    if (!es.ok) return setErr(es.error.message);
    const byName = new Map<string, string>();
    es.data.forEach((x) => {
      const s = subjects[x.subjectId];
      if (s) {
        byName.set(norm(s.nameEn), x.subjectId);
        if (s.nameUr) byName.set(norm(s.nameUr), x.subjectId);
      }
    });
    const lines = (await file.text()).replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
    if (lines.length < 2) return setErr(t('mk_err_cols'));
    const rawHead = splitCsvLine(lines[0]);
    const head = rawHead.map(norm);
    const iNo = head.findIndex((h) => ['admno', 'admissionno', 'admissionnumber'].includes(h));
    const iName = head.findIndex((h) => ['studentname', 'name'].includes(h));
    const cols: { i: number; subjectId: string }[] = [];
    rawHead.forEach((h, i) => {
      const id = byName.get(norm(h.replace(/\/\s*\d+(\.\d+)?\s*$/, '')));
      if (id) cols.push({ i, subjectId: id });
    });
    if (iNo < 0 || cols.length === 0) return setErr(t('mk_err_cols'));
    const parsed: ImportMarksRow[] = lines.slice(1).map((ln, k) => {
      const c = splitCsvLine(ln);
      const cells: Record<string, string> = {};
      cols.forEach(({ i, subjectId }) => {
        cells[subjectId] = (c[i] ?? '').trim();
      });
      return { line: k + 2, admissionNo: (c[iNo] ?? '').trim(), name: iName >= 0 ? (c[iName] ?? '').trim() : '', cells };
    });
    setRows(parsed);
    setChecking(true);
    const r = await AppModule.examRepository.importExamMarks(admin, exam.id, classId, parsed, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const failed = checked?.filter((x) => !x.ok) ?? [];

  const doImport = async () => {
    if (!rows) return;
    const okLines = new Set(good.map((g) => g.line));
    setBusy(true);
    setErr(null);
    const r = await AppModule.examRepository.importExamMarks(admin, exam.id, classId, rows.filter((x) => okLines.has(x.line)), false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(r.data.filter((x) => x.ok).length);
    setRows(null);
    setChecked(null);
    onDone();
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="text-xs font-bold text-[#14284B]">{t('mk_title')}{cls ? ` · ${language === 'ur' ? cls.nameUr : cls.nameEn}` : ''}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('mk_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('st_bulk_template')} variant="outline" icon={<Download className="w-4 h-4 text-[#F28C28]" />} onClick={() => void downloadTemplate()} />
        <label className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] cursor-pointer">
          <Upload className="w-4 h-4 text-[#F28C28]" />
          {t('st_csv_pick')}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      {checking && <p className="text-xs text-[#6B7385]">{t('st_bulk_checking')}</p>}
      {checked && (
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-[#2E9E5B]"><span dir="ltr">{good.length}</span> {t('st_csv_valid')}</div>
          {failed.length > 0 && <div className="font-semibold text-[#D64545]"><span dir="ltr">{failed.length}</span> {t('st_csv_invalid')}</div>}
          {failed.slice(0, 20).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.admissionNo} · {x.studentName}): {x.error}</div>
          ))}
          {good.filter((x) => x.warnings.length > 0).slice(0, 15).map((x) => (
            <div key={`g${x.line}`} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{t('st_csv_row')} {x.line} · {x.studentName}: {x.warnings.join(' ')}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done !== null && <p className="text-xs font-semibold text-[#2E9E5B]">{t('mk_done')} (<span dir="ltr">{done}</span>)</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
    </SchoolCard>
  );
};
