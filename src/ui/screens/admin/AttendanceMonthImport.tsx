import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportAttendanceResult, ImportAttendanceRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { splitCsvLine } from './AdminBulkStudents';

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function monthNo(v: string): number {
  const t = v.trim().toLowerCase();
  if (/^\d{1,2}$/.test(t)) return Number(t);
  const i = MONTHS.indexOf(t.slice(0, 3));
  return i >= 0 ? i + 1 : 0;
}

export function parseAttendanceFile(text: string): { rows: ImportAttendanceRow[]; fatal: boolean } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: true };
  const head = splitCsvLine(lines[0]).map(norm);
  const find = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const iNo = find('admissionno', 'admno', 'admissionnumber');
  const iName = find('studentname', 'name');
  const iFather = find('fathername', 'father');
  const iClass = find('class', 'classname', 'classsection');
  const iCampus = find('campus');
  const iMonth = find('month');
  const iYear = find('year');
  const dayCols: { day: number; idx: number }[] = [];
  head.forEach((h, idx) => {
    if (/^\d{1,2}$/.test(h) && Number(h) >= 1 && Number(h) <= 31) dayCols.push({ day: Number(h), idx });
  });
  if (iNo < 0 || iMonth < 0 || iYear < 0 || dayCols.length < 28) return { rows: [], fatal: true };
  const rows = lines.slice(1).map((ln, k) => {
    const c = splitCsvLine(ln);
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    const cells: Record<number, string> = {};
    dayCols.forEach(({ day, idx }) => {
      cells[day] = (c[idx] ?? '').trim();
    });
    return { line: k + 2, admissionNo: g(iNo), name: g(iName), fatherName: g(iFather), className: g(iClass), campus: g(iCampus), year: Number(g(iYear)), month: monthNo(g(iMonth)), cells };
  });
  return { rows, fatal: false };
}

export const AttendanceMonthImport: React.FC<{ actor: Profile; onClose: () => void }> = ({ actor, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ImportAttendanceRow[] | null>(null);
  const [checked, setChecked] = useState<ImportAttendanceResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(null);
    setChecked(null);
    const p = parseAttendanceFile(await file.text());
    if (p.fatal) return setErr(t('attimp_err_cols'));
    setRows(p.rows);
    setChecking(true);
    const r = await AppModule.attendanceRepository.importMonthlyAttendance(p.rows, actor, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const failed = checked?.filter((x) => !x.ok) ?? [];
  const days = good.reduce((s, x) => s + x.daysMarked, 0);

  const doImport = async () => {
    if (!rows) return;
    const okLines = new Set(good.map((g) => g.line));
    setBusy(true);
    setErr(null);
    const r = await AppModule.attendanceRepository.importMonthlyAttendance(rows.filter((x) => okLines.has(x.line)), actor, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(r.data.filter((x) => x.ok).length);
    setRows(null);
    setChecked(null);
  };

  const header = ['Admission No', 'Student Name', 'Father Name', 'Class', 'Campus', 'Month', 'Year', ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
  const sample = (no: string, name: string, father: string, cls: string, campus: string, pattern: string[]) => [no, name, father, cls, campus, 'October', '2026', ...Array.from({ length: 31 }, (_, i) => pattern[i % pattern.length])];

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('attimp_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('attimp_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('monthly-attendance-template.csv', [
              header,
              sample('1001', 'Hasham Ashraf', 'Ashraf Ali', '6-B', 'Boys', ['P', 'P', 'P', 'A', 'P', 'P', 'H']),
              sample('1002', 'Muhammad Abdullah', 'Abdul Rehman', '6-B', 'Boys', ['P', 'L', 'P', 'Le', 'P', 'A']),
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
            <span dir="ltr">{good.length}</span> {t('st_csv_valid')} · <span dir="ltr">{days}</span> {t('attimp_days')}
          </div>
          {failed.length > 0 && <div className="font-semibold text-[#D64545]"><span dir="ltr">{failed.length}</span> {t('st_csv_invalid')}</div>}
          {failed.slice(0, 20).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.studentName}): {x.error}</div>
          ))}
          {good.filter((x) => x.warnings.length > 0).slice(0, 20).map((x) => (
            <div key={`g${x.line}`} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{t('st_csv_row')} {x.line} · {x.studentName}: {x.warnings.join(' ')}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done !== null && <p className="text-xs font-semibold text-[#2E9E5B]">{t('attimp_done')} (<span dir="ltr">{done}</span>)</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
      </div>
    </SchoolCard>
  );
};
