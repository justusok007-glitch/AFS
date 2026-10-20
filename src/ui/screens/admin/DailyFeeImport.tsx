import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportPaymentResult, ImportPaymentRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { splitCsvLine } from './AdminBulkStudents';
import { money, monthOf } from './AdminFeeImport';

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "02-Oct-2026", "2-Oct-26", "2026-10-02" or "02/10/2026" -> "2026-10-02"; '' when unreadable. */
export function dateOf(v: string): string {
  const t = v.trim();
  const pad = (n: string | number) => String(n).padStart(2, '0');
  let m = /^(\d{1,2})[-\s/]([A-Za-z]{3})[A-Za-z]*[-\s/,]*(\d{2,4})$/.exec(t);
  if (m && MONTHS.includes(m[2].toLowerCase())) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${pad(MONTHS.indexOf(m[2].toLowerCase()) + 1)}-${pad(m[1])}`;
  }
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  return '';
}

export const DAILY_HEADER = ['Receipt No', 'Payment Date', 'Adm No', 'Student Name', 'Father Name', 'Class', 'Campus', 'Fee For', 'Amount', 'Collected At'];

export function parseDailyFile(text: string): { rows: ImportPaymentRow[]; fatal: boolean } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: true };
  const head = splitCsvLine(lines[0]).map(norm);
  const find = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const iRec = find('receiptno', 'receipt', 'receiptnumber');
  const iDate = find('paymentdate', 'date');
  const iNo = find('admno', 'admissionno', 'admissionnumber');
  const iName = find('studentname', 'name');
  const iCampus = find('campus');
  const iFor = find('feefor', 'paymentfor');
  const iAmt = find('amount', 'amountpaid');
  const iAt = find('collectedat', 'collectionpoint', 'remarks');
  if (iRec < 0 || iDate < 0 || iNo < 0 || iFor < 0 || iAmt < 0) return { rows: [], fatal: true };
  const rows = lines.slice(1).map((ln, k) => {
    const c = splitCsvLine(ln);
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    const f = g(iFor);
    return {
      line: k + 2,
      receiptNo: g(iRec),
      date: dateOf(g(iDate)),
      admissionNo: g(iNo),
      name: g(iName),
      campus: g(iCampus),
      feeFor: /arrear/i.test(f) ? 'ARREARS' : /admission/i.test(f) ? 'ADMISSION' : /annual/i.test(f) ? 'ANNUAL' : monthOf(f) ?? '',
      amount: money(g(iAmt)),
      collectedAt: /girl/i.test(g(iAt)) ? 'Girls' : /boy/i.test(g(iAt)) ? 'Boys' : '',
    } as ImportPaymentRow;
  });
  return { rows, fatal: false };
}

export const DailyFeeImport: React.FC<{ actor: Profile; onClose: () => void }> = ({ actor, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ImportPaymentRow[] | null>(null);
  const [checked, setChecked] = useState<ImportPaymentResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(null);
    setChecked(null);
    const p = parseDailyFile(await file.text());
    if (p.fatal) return setErr(t('daily_imp_err_cols'));
    setRows(p.rows);
    setChecking(true);
    const r = await AppModule.feeRepository.importDailyPayments(p.rows, actor, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const receiptCount = new Set(good.map((x) => x.receiptNo.toLowerCase())).size;
  const failed = checked?.filter((x) => !x.ok) ?? [];
  const total = good.reduce((s, x) => s + x.amount, 0);

  const doImport = async () => {
    if (!rows) return;
    const okLines = new Set(good.map((g) => g.line));
    setBusy(true);
    setErr(null);
    const r = await AppModule.feeRepository.importDailyPayments(rows.filter((x) => okLines.has(x.line)), actor, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(new Set(r.data.filter((x) => x.ok).map((x) => x.receiptNo.toLowerCase())).size);
    setRows(null);
    setChecked(null);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('daily_imp_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('daily_imp_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('daily-fee-template.csv', [
              DAILY_HEADER,
              ['R-0001', '02-Oct-2026', '1006', 'Muhammad Zaighum', 'Liaqat Ali', '6', 'Boys', 'Oct-2026', '2000', 'Boys'],
              ['R-0002', '02-Oct-2026', '1072', 'Talha Azam', 'Azam', '9', 'Boys', 'Previous Arrears', '5000', 'Girls'],
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
            <span dir="ltr">{receiptCount}</span> {t('st_csv_valid')} · <span dir="ltr">Rs {total.toLocaleString('en-US')}</span>
          </div>
          {failed.length > 0 && (
            <div className="font-semibold text-[#D64545]"><span dir="ltr">{new Set(failed.map((x) => x.receiptNo.toLowerCase())).size}</span> {t('st_csv_invalid')}</div>
          )}
          {failed.filter((x, i, a) => a.findIndex((y) => y.receiptNo.toLowerCase() === x.receiptNo.toLowerCase()) === i).slice(0, 15).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.receiptNo} · {x.studentName}): {x.error}</div>
          ))}
          {good.filter((x) => x.warnings.length > 0).slice(0, 25).map((x) => (
            <div key={`g${x.line}`} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{x.receiptNo} · {x.studentName}: {x.warnings.join(' ')}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done !== null && <p className="text-xs font-semibold text-[#2E9E5B]">{t('daily_imp_done')} (<span dir="ltr">{done}</span>)</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${receiptCount})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
      </div>
    </SchoolCard>
  );
};
