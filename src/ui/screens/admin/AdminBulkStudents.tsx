import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportFileRow, ImportStudentResult, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { CredentialSlip } from './AdminShared';

/** Minimal CSV line splitter with quote support. */
export function splitCsvLine(line: string): string[] {
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

export const STUDENT_FILE_HEADER = [
  'Admission No.', 'Student Name (en)', 'Student Name (ur)', 'Father Name', 'Father Name (ur)',
  'Contact 1', 'Contact 2', 'Campus', 'Class', 'Section', 'Status', 'User Id', 'Password',
];

type Parsed = { row: ImportFileRow | null; line: number; name: string; error: string | null };

const norm = (h: string) => h.toLowerCase().replace(/\(.*?\)/g, (m) => m.replace(/[()]/g, '')).replace(/[^a-z0-9]/g, '');

/** Columns are found by their header names, so their order in the file does not matter. */
export function parseStudentFile(text: string, colsMsg: string): { rows: Parsed[]; fatal: string | null } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: colsMsg };
  const head = splitCsvLine(lines[0]).map(norm);
  const find = (...names: string[]) => head.findIndex((h) => names.includes(h));
  const iNo = find('admissionno', 'admissionnumber', 'admno', 'admnumber');
  const iActual = find('actualfee');
  const iNet = find('netfee');
  const iPrev = find('previousarrears', 'prevarrears');
  const iAdmFee = find('admissionfee');
  const iAnnual = find('annualcharges', 'annualfee');
  const iName = find('studentnameen', 'studentname', 'nameen', 'name');
  const iNameUr = find('studentnameur', 'nameur');
  const iFather = find('fathername', 'fathernameen', 'fathernameeng');
  const iFatherUr = find('fathernameur');
  const iP1 = find('contact1', 'phone1', 'phone');
  const iP2 = find('contact2', 'phone2');
  const iClass = find('class');
  const iStatus = find('status');
  const iUser = find('userid', 'username', 'loginid');
  const iPass = find('password');
  let iCampus = find('campus');
  const secIdx = head.map((h, i) => (h === 'section' ? i : -1)).filter((i) => i >= 0);
  let iSection = -1;
  if (secIdx.length) {
    iSection = secIdx[secIdx.length - 1];
    if (iCampus < 0 && secIdx.length > 1) iCampus = secIdx[0];
  }
  if (iName < 0 || iClass < 0 || iSection < 0 || iCampus < 0) {
    return { rows: [], fatal: colsMsg };
  }
  const known = new Set([iNo, iName, iNameUr, iFather, iFatherUr, iP1, iP2, iClass, iStatus, iUser, iPass, iCampus, iSection, iActual, iNet, iPrev, iAdmFee, iAnnual]);
  const rawHead = splitCsvLine(lines[0]);
  const subjectCols = rawHead.map((h, i) => (known.has(i) || !h.trim() ? -1 : i)).filter((i) => i >= 0);
  const out: Parsed[] = [];
  lines.slice(1).forEach((raw, k) => {
    const c = splitCsvLine(raw);
    const line = k + 2;
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    const money = (i: number): number | undefined => {
      const v = g(i).replace(/,/g, '').replace(/[^\d.]/g, '');
      return v === '' ? undefined : Math.round(Number(v));
    };
    const row: ImportFileRow = {
      line,
      admissionNo: g(iNo),
      name: g(iName),
      nameUr: g(iNameUr),
      fatherName: g(iFather),
      fatherNameUr: g(iFatherUr),
      phone1: g(iP1),
      phone2: g(iP2),
      campus: g(iCampus),
      className: g(iClass),
      sectionName: g(iSection),
      status: g(iStatus),
      username: g(iUser),
      password: g(iPass),
      subjects: subjectCols.map((i) => rawHead[i].trim()),
      actualFee: money(iActual),
      netFee: money(iNet),
      prevArrears: money(iPrev),
      admissionFee: money(iAdmFee),
      annualCharges: money(iAnnual),
    };
    out.push({ row, line, name: row.name, error: null });
  });
  return { rows: out, fatal: null };
}

export const AdminBulkStudents: React.FC<{
  admin: Profile;
  onAddSlip: (s: CredentialSlip) => void;
  onPrintSlips: (s: CredentialSlip[]) => void;
  onClose: () => void;
}> = ({ admin, onAddSlip, onPrintSlips, onClose }) => {
  const { stringResource: t } = useStringResource();
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

  const check = async (p: Parsed[]) => {
    const rows = p.filter((x) => x.row).map((x) => x.row!);
    setChecking(true);
    setChecked(null);
    const r = await AppModule.studentRepository.importStudentFile(rows, admin, true);
    setChecking(false);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    reset();
    const p = parseStudentFile(await file.text(), t('st_bulk_err_cols'));
    if (p.fatal) return setErr(p.fatal);
    setParsed(p.rows);
    await check(p.rows);
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
    const r = await AppModule.studentRepository.importStudentFile(rows, admin, false);
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

      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('students-template.csv', [
              STUDENT_FILE_HEADER,
              ['1001', 'Ali Raza', 'علی رضا', 'Raza Ahmed', 'رضا احمد', '0300-1234567', '', 'Boys', '6', 'B', 'Active', 'afs@1001', 'Raza@1001'],
            ])
          }
        />
        <label className={`flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] cursor-pointer`}>
          <Upload className="w-4 h-4 text-[#F28C28]" />
          {t('st_csv_pick')}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
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
          {slips.slice(0, 8).map((x) => (
            <div key={x.profile.id} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{x.profile.fullName} · {x.profile.loginId} / {x.password}</div>
          ))}
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
