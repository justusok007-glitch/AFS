import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportStudentResult, ImportStudentRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { selectCls } from '../principal/PrincipalShared';
import { CredentialSlip } from './AdminShared';

/** Minimal CSV line splitter with quote support. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const HEADER = [
  'Student Name En',
  'Student Name Ur',
  'Father Name Eng',
  'Father Name Ur',
  'Phone 1',
  'Phone 2',
  'User Name',
  'Password',
  'Actual Fee',
  'Net Fee',
  'Annual Charges',
  'Annual Charges Status',
  'Admission Fee',
  'Admission Fee Status',
];

type Parsed = { row: ImportStudentRow | null; line: number; name: string; error: string | null };

/** Column order is fixed; see HEADER. */
export function parseStudentCsv(
  text: string,
  msg: { cols: string; number: string; status: string }
): Parsed[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const out: Parsed[] = [];
  lines.forEach((raw, idx) => {
    if (!raw.trim() || /^[,;\s]*$/.test(raw)) return;
    const c = splitCsvLine(raw);
    if (idx === 0 && /student|name/i.test(c[0] ?? '') && !/^\d/.test(c[8] ?? '')) return;
    const line = idx + 1;
    const name = c[0] ?? '';
    if (c.length < 5) return void out.push({ row: null, line, name, error: msg.cols });

    let error = null as string | null;
    const num = (v: string | undefined): number | null => {
      const s = (v ?? '').replace(/[,\s]/g, '');
      if (!s) return null;
      const n = Number(s);
      if (!Number.isFinite(n)) {
        error = msg.number;
        return null;
      }
      return n;
    };
    const paid = (v: string | undefined): boolean => {
      const s = (v ?? '').trim().toLowerCase();
      if (!s || s === 'unpaid' || s === 'no' || s === '0') return false;
      if (s === 'paid' || s === 'yes' || s === '1') return true;
      error = msg.status;
      return false;
    };
    const row: ImportStudentRow = {
      line,
      name: c[0] ?? '',
      nameUr: c[1] ?? '',
      fatherName: c[2] ?? '',
      fatherNameUr: c[3] ?? '',
      phone1: c[4] ?? '',
      phone2: c[5] ?? '',
      username: c[6] ?? '',
      password: c[7] ?? '',
      actualFee: num(c[8]),
      netFee: num(c[9]),
      annualCharges: num(c[10]),
      annualPaid: paid(c[11]),
      admissionFee: num(c[12]),
      admissionPaid: paid(c[13]),
    };
    out.push(error ? { row: null, line, name, error } : { row, line, name, error: null });
  });
  return out;
}

export const AdminBulkStudents: React.FC<{
  admin: Profile;
  sectionOptions: { id: string; label: string }[];
  onAddSlip: (s: CredentialSlip) => void;
  onPrintSlips: (s: CredentialSlip[]) => void;
  onClose: () => void;
}> = ({ admin, sectionOptions, onAddSlip, onPrintSlips, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [sectionId, setSectionId] = useState('');
  const [parsed, setParsed] = useState<Parsed[] | null>(null);
  const [checked, setChecked] = useState<ImportStudentResult[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slips, setSlips] = useState<CredentialSlip[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setParsed(null);
    setChecked(null);
    setSlips(null);
    setErr(null);
  };

  const check = async (p: Parsed[], sec: string) => {
    const rows = p.filter((x) => x.row).map((x) => x.row!);
    setChecking(true);
    setChecked(null);
    const r = await AppModule.studentRepository.importStudents(sec, rows, admin, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    if (!sectionId) return setErr(t('st_bulk_pick_section'));
    const p = parseStudentCsv(await file.text(), {
      cols: t('st_bulk_err_cols'),
      number: t('st_bulk_err_number'),
      status: t('st_bulk_err_status'),
    });
    setParsed(p);
    await check(p, sectionId);
  };

  const parseErrors = parsed?.filter((x) => x.error) ?? [];
  const failed = checked?.filter((x) => !x.ok) ?? [];
  const good = checked?.filter((x) => x.ok) ?? [];
  const newParents = good.filter((x) => x.parentCreated).length;

  const doImport = async () => {
    if (!parsed) return;
    const okLines = new Set(good.map((g) => g.line));
    const rows = parsed.filter((x) => x.row && okLines.has(x.line)).map((x) => x.row!);
    setBusy(true);
    setErr(null);
    const r = await AppModule.studentRepository.importStudents(sectionId, rows, admin, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    const created: CredentialSlip[] = [];
    r.data.forEach((x) => {
      if (x.ok && x.profile && x.password) created.push({ profile: x.profile, password: x.password });
    });
    created.forEach(onAddSlip);
    setSlips(created);
    setParsed(null);
    setChecked(null);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('st_bulk_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('st_bulk_hint')}</p>

      <select className={selectCls} value={sectionId} onChange={(e) => { setSectionId(e.target.value); reset(); }}>
        <option value="">{t('st_pick_section')}</option>
        {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('students-template.csv', [
              HEADER,
              ['Ali Raza', 'علی رضا', 'Raza Ahmed', 'رضا احمد', '03001234567', '', 'RAZA01', 'Raza@123', 2500, 2000, 1500, 'Paid', 1000, 'Unpaid'],
            ])
          }
        />
        <label className={`flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] ${sectionId ? 'cursor-pointer' : 'opacity-50'}`}>
          <Upload className="w-4 h-4 text-[#F28C28]" />
          {t('st_csv_pick')}
          <input type="file" accept=".csv,text/csv" className="hidden" disabled={!sectionId} onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>

      {checking && <p className="text-xs text-[#6B7385]">{t('st_bulk_checking')}</p>}

      {checked && (
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-[#2E9E5B]">
            <span dir="ltr">{good.length}</span> {t('st_csv_valid')} · <span dir="ltr">{newParents}</span> {t('st_bulk_new_parents')}
          </div>
          {failed.length + parseErrors.length > 0 && (
            <div className="font-semibold text-[#D64545]">
              <span dir="ltr">{failed.length + parseErrors.length}</span> {t('st_csv_invalid')}
            </div>
          )}
          {parseErrors.slice(0, 10).map((x) => (
            <div key={`p${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.name}): {x.error}</div>
          ))}
          {failed.slice(0, 10).map((x) => (
            <div key={`f${x.line}`} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.studentName}): {x.error}</div>
          ))}
          {good.flatMap((x) => x.warnings.map((w) => (
            <div key={`w${x.line}`} dir="ltr" className="text-[11px] text-[#B7791F] text-start">{t('st_csv_row')} {x.line}: {w}</div>
          ))).slice(0, 6)}
          {good.slice(0, 5).map((x) => (
            <div key={`g${x.line}`} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{x.studentName} · {x.parentLoginId}</div>
          ))}
          {good.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}

      {slips && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#2E9E5B]">{t('st_bulk_done')} (<span dir="ltr">{slips.length}</span>)</p>
          {slips.length > 0 && (
            <PrimaryButton text={t('st_bulk_print')} variant="orange" onClick={() => onPrintSlips(slips)} />
          )}
        </div>
      )}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}

      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0 || checking} onClick={() => void doImport()} />
      </div>
    </SchoolCard>
  );
};
