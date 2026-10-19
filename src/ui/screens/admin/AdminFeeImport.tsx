import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportFeeResult, ImportFeeRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { splitCsvLine } from './AdminBulkStudents';

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "26-Apr", "Apr-26" or "2026-04" -> "2026-04"; anything else -> null. */
function monthOf(h: string): string | null {
  const t = h.trim();
  let m = /^(\d{2})[-\s/]([A-Za-z]{3})[A-Za-z]*$/.exec(t);
  if (m) return MONTHS.includes(m[2].toLowerCase()) ? `20${m[1]}-${String(MONTHS.indexOf(m[2].toLowerCase()) + 1).padStart(2, '0')}` : null;
  m = /^([A-Za-z]{3})[A-Za-z]*[-\s/](\d{2})$/.exec(t);
  if (m) return MONTHS.includes(m[1].toLowerCase()) ? `20${m[2]}-${String(MONTHS.indexOf(m[1].toLowerCase()) + 1).padStart(2, '0')}` : null;
  m = /^(\d{4})-(\d{2})$/.exec(t);
  return m ? `${m[1]}-${m[2]}` : null;
}

/** "2,300" -> 2300, "—" or blank -> undefined. */
function money(v: string | undefined): number | undefined {
  const s = (v ?? '').replace(/,/g, '').replace(/[^\d.]/g, '');
  return s === '' ? undefined : Math.round(Number(s));
}

export const FEE_FILE_HEADER = [
  'Adm No', 'Student Name', 'Class', 'Status', 'Campus', 'Monthly Fee', 'Prev. Arrears', 'Admission Fee', 'Annual Charges',
  '26-Apr', '26-May', '26-Jun', '26-Jul', '26-Aug', '26-Sep', '26-Oct', '26-Nov', '26-Dec', '27-Jan', '27-Feb', '27-Mar',
  'Total Due', 'Total Paid', 'Arrears',
];

export function parseFeeFile(text: string): { rows: ImportFeeRow[]; fatal: boolean } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: true };
  const raw = splitCsvLine(lines[0]);
  const head = raw.map(norm);
  const find = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const iNo = find('admno', 'admissionno', 'admissionnumber');
  const iName = find('studentname', 'name');
  const iCampus = find('campus');
  const iMonthly = find('monthlyfee', 'monthly');
  const iPrev = find('prevarrears', 'previousarrears');
  const iAdm = find('admissionfee');
  const iAnn = find('annualcharges', 'annualfee');
  const iDue = find('totaldue');
  const iPaid = find('totalpaid');
  const iArr = find('arrears');
  const monthCols = raw.map((h, i) => ({ i, month: monthOf(h) })).filter((x): x is { i: number; month: string } => x.month !== null);
  if (iNo < 0 || iPaid < 0 || monthCols.length === 0) return { rows: [], fatal: true };
  const first = [...monthCols].sort((a, b) => a.month.localeCompare(b.month))[0].month;
  const y = Number(first.slice(0, 4));
  const mo = Number(first.slice(5));
  const arrearsMonth = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`;
  const rows: ImportFeeRow[] = lines.slice(1).map((ln, k) => {
    const c = splitCsvLine(ln);
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    return {
      line: k + 2,
      admissionNo: g(iNo),
      name: g(iName),
      campus: g(iCampus),
      monthlyFee: money(g(iMonthly)),
      prevArrears: money(g(iPrev)) ?? 0,
      admissionFee: money(g(iAdm)) ?? 0,
      annualCharges: money(g(iAnn)) ?? 0,
      arrearsMonth,
      months: monthCols
        .map((m) => ({ month: m.month, amount: money(g(m.i)) ?? 0 }))
        .filter((m) => m.amount > 0),
      totalDue: money(g(iDue)),
      totalPaid: money(g(iPaid)) ?? 0,
      arrears: money(g(iArr)),
    };
  });
  return { rows, fatal: false };
}

export const AdminFeeImport: React.FC<{ admin: Profile; onClose: () => void }> = ({ admin, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ImportFeeRow[] | null>(null);
  const [checked, setChecked] = useState<ImportFeeResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(null);
    setChecked(null);
    const p = parseFeeFile(await file.text());
    if (p.fatal) return setErr(t('fee_imp_err_cols'));
    setRows(p.rows);
    setChecking(true);
    const r = await AppModule.feeRepository.importFeeFile(p.rows, admin, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const failed = checked?.filter((x) => !x.ok) ?? [];
  const warned = good.filter((x) => x.warnings.length > 0);
  const totalDue = good.reduce((s, x) => s + x.due, 0);
  const totalPaid = good.reduce((s, x) => s + x.paid, 0);

  const doImport = async () => {
    if (!rows) return;
    const okLines = new Set(good.map((g) => g.line));
    setBusy(true);
    setErr(null);
    const r = await AppModule.feeRepository.importFeeFile(rows.filter((x) => okLines.has(x.line)), admin, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(r.data.filter((x) => x.ok).length);
    setRows(null);
    setChecked(null);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('fee_imp_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('fee_imp_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('fees-template.csv', [
              FEE_FILE_HEADER,
              ['1001', 'Ali Raza', '6', 'Active', 'Boys', '2,000', '0', '—', '—', '2,000', '2,000', '2,000', '', '', '', '', '', '', '', '', '', '6,000', '4,000', '2,000'],
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
            <span dir="ltr">{good.length}</span> {t('st_csv_valid')} · <span dir="ltr">Rs {totalDue.toLocaleString('en-US')}</span> / <span dir="ltr">Rs {totalPaid.toLocaleString('en-US')}</span>
          </div>
          {failed.length > 0 && (
            <div className="font-semibold text-[#D64545]"><span dir="ltr">{failed.length}</span> {t('st_csv_invalid')}</div>
          )}
          {failed.slice(0, 12).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.studentName}): {x.error}</div>
          ))}
          {warned.slice(0, 8).map((x) => (
            <div key={`w${x.line}`} dir="ltr" className="text-[11px] text-[#B7791F] text-start">{t('st_csv_row')} {x.line} ({x.studentName}): {x.warnings.join(' ')}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done !== null && <p className="text-xs font-semibold text-[#2E9E5B]">{t('fee_imp_done')} (<span dir="ltr">{done}</span>)</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
      </div>
    </SchoolCard>
  );
};
