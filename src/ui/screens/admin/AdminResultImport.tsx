import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportResultResult, ImportResultRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { splitCsvLine } from './AdminBulkStudents';

const norm = (h: string) => h.toLowerCase().replace(/\(.*?\)/g, (m) => m.replace(/[()]/g, '')).replace(/[^a-z0-9]/g, '');

export const RESULT_FILE_HEADER = [
  'Adm No', 'Student Name (en)', 'Father Name', 'Campus', 'Class', 'Section', 'Status', 'Exam',
  'English/80', 'Maths/80', 'Science/40',
];

/** Subject columns are the ones written like "English/80" (subject name / total marks). */
export function parseResultFile(text: string): { rows: ImportResultRow[]; fatal: boolean } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: true };
  const raw = splitCsvLine(lines[0]);
  const head = raw.map(norm);
  const find = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const iNo = find('admno', 'admissionno', 'admissionnumber');
  const iCampus = find('campus');
  const iExam = find('exam', 'examname');
  const subs = raw
    .map((h, i) => {
      const m = /^(.+?)\s*\/\s*(\d+(?:\.\d+)?)\s*$/.exec(h.trim());
      return m ? { i, subject: m[1].trim(), total: Number(m[2]) } : null;
    })
    .filter((x): x is { i: number; subject: string; total: number } => x !== null && x.total > 0);
  if (iNo < 0 || iExam < 0 || subs.length === 0) return { rows: [], fatal: true };
  const rows: ImportResultRow[] = lines.slice(1).map((ln, k) => {
    const c = splitCsvLine(ln);
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    return {
      line: k + 2,
      admissionNo: g(iNo),
      campus: g(iCampus),
      examName: g(iExam),
      marks: subs.map((s) => {
        const v = g(s.i);
        const absent = /^(a|ab|abs|absent)$/i.test(v);
        const blank = v === '' || /^[—–-]+$/.test(v);
        const n = Number(v.replace(/,/g, ''));
        return {
          subject: s.subject,
          total: s.total,
          obtained: absent || blank ? null : Number.isFinite(n) ? n : null,
          absent,
          bad: !absent && !blank && !Number.isFinite(n),
        };
      }),
    };
  });
  return { rows, fatal: false };
}

export const AdminResultImport: React.FC<{ admin: Profile; onDone: () => void; onClose: () => void }> = ({ admin, onDone, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ImportResultRow[] | null>(null);
  const [checked, setChecked] = useState<ImportResultResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(null);
    setChecked(null);
    const p = parseResultFile(await file.text());
    if (p.fatal) return setErr(t('res_imp_err_cols'));
    setRows(p.rows);
    setChecking(true);
    const r = await AppModule.examRepository.importResultFile(p.rows, admin, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const failed = checked?.filter((x) => !x.ok) ?? [];
  const warnings = Array.from(new Set(good.flatMap((x) => x.warnings)));
  const exams = Array.from(new Set(good.map((x) => x.examName)));

  const doImport = async () => {
    if (!rows) return;
    const okLines = new Set(good.map((g) => g.line));
    setBusy(true);
    setErr(null);
    const r = await AppModule.examRepository.importResultFile(rows.filter((x) => okLines.has(x.line)), admin, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(r.data.filter((x) => x.ok).length);
    setRows(null);
    setChecked(null);
    onDone();
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('res_imp_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('res_imp_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('results-template.csv', [
              RESULT_FILE_HEADER,
              ['1001', 'Ali Raza', 'Raza Ahmed', 'Boys', '6', 'B', 'Active', 'Final Semester 1', '75', '68', '33'],
            ])
          }
        />
        <label className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] cursor-pointer">
          <Upload className="w-4 h-4 text-[#F28C28]" />
          {t('st_csv_pick')}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      {checking && <p className="text-xs text-[#6B7385]">{t('st_bulk_checking')}</p>}
      {checked && (
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-[#2E9E5B]">
            <span dir="ltr">{good.length}</span> {t('st_csv_valid')}{exams.length ? <> · <span dir="ltr">{exams.join(', ')}</span></> : null}
          </div>
          {failed.length > 0 && <div className="font-semibold text-[#D64545]"><span dir="ltr">{failed.length}</span> {t('st_csv_invalid')}</div>}
          {failed.slice(0, 12).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.admissionNo}): {x.error}</div>
          ))}
          {warnings.slice(0, 8).map((w) => (
            <div key={w} dir="ltr" className="text-[11px] text-[#B7791F] text-start">{w}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done !== null && <p className="text-xs font-semibold text-[#2E9E5B]">{t('res_imp_done')} (<span dir="ltr">{done}</span>)</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
      </div>
    </SchoolCard>
  );
};
