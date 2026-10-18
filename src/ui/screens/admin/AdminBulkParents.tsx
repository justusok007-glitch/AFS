import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { NewProfileInput, Profile, Role } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { CredentialSlip } from './AdminShared';

interface ParsedRow {
  line: number;
  input: NewProfileInput | null;
  error: string | null;
}

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

export function parseParentCsv(text: string, lookups: AccountantLookups): ParsedRow[] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const rows: ParsedRow[] = [];
  lines.forEach((raw, idx) => {
    const cols = splitCsvLine(raw);
    if (idx === 0 && /name/i.test(cols[0] ?? '') && !/\d{6,}/.test(cols[2] ?? '')) return; // header
    const [nameEn = '', nameUr = '', phone = '', campusRaw = ''] = cols;
    const code = campusRaw.trim().toUpperCase().charAt(0);
    const campus = lookups.campuses.find((c) => c.code === code);
    let error: string | null = null;
    if (nameEn.trim().length < 3) error = 'name_en';
    else if (nameUr.trim().length < 2) error = 'name_ur';
    else if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s-]/g, ''))) error = 'phone';
    else if (!campus) error = 'campus';
    rows.push({
      line: idx + 1,
      error,
      input: error
        ? null
        : {
            role: Role.PARENT,
            fullName: nameEn,
            fullNameUr: nameUr,
            phone,
            campusId: campus!.id,
          },
    });
  });
  return rows;
}

export const AdminBulkParents: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onAddSlip: (s: CredentialSlip) => void;
  onClose: () => void;
  onDone: () => void;
}> = ({ admin, lookups, onAddSlip, onClose, onDone }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = rows?.filter((r) => r.input) ?? [];
  const invalid = rows?.filter((r) => r.error) ?? [];

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setDone(false);
    setErr(null);
    setRows(parseParentCsv(await file.text(), lookups));
  };

  const create = async () => {
    setBusy(true);
    setErr(null);
    for (const r of valid) {
      const res = await AppModule.settingsRepository.createProfile(r.input!, admin);
      if (res.ok) onAddSlip({ profile: res.data.profile, password: res.data.password });
      else setErr(res.error.message);
    }
    setBusy(false);
    setDone(true);
    setRows(null);
    onDone();
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('st_csv_title')}</h3>
      <p className="text-[11px] text-[#6B7385]">{t('st_csv_hint')}</p>
      <label className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] cursor-pointer">
        <Upload className="w-4 h-4 text-[#F28C28]" />
        {t('st_csv_pick')}
        <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
      </label>
      {rows && (
        <div className="space-y-1.5 text-xs">
          <div className="font-semibold text-[#2E9E5B]"><span dir="ltr">{valid.length}</span> {t('st_csv_valid')}</div>
          {invalid.length > 0 && (
            <div className="font-semibold text-[#D64545]"><span dir="ltr">{invalid.length}</span> {t('st_csv_invalid')}</div>
          )}
          {invalid.slice(0, 8).map((r) => (
            <div key={r.line} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {r.line}: {r.error}</div>
          ))}
          {valid.slice(0, 6).map((r) => (
            <div key={r.line} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{r.input!.fullName} · {r.input!.phone}</div>
          ))}
          {valid.length === 0 && <p className="text-[#6B7385]">{t('st_csv_none')}</p>}
        </div>
      )}
      {done && <p className="text-xs font-semibold text-[#2E9E5B]">{t('st_csv_done')}</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={t('st_csv_create')} variant="orange" loading={busy} disabled={valid.length === 0} onClick={() => void create()} />
      </div>
    </SchoolCard>
  );
};
