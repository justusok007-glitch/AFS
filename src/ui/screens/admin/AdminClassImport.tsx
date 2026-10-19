import React, { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { ImportClassResult, ImportClassRow, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { downloadCsv } from '../accountant/AccountantShared';
import { splitCsvLine } from './AdminBulkStudents';

const HEADER = ['Campus', 'Class (en)', 'Class (ur)', 'Sections', 'Subjects'];
const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Sections are separated by ; and subjects by ; (optionally English|اردو). */
function parseClassFile(text: string): { rows: ImportClassRow[]; fatal: boolean } {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() && !/^[,;\s]*$/.test(l));
  if (lines.length < 2) return { rows: [], fatal: true };
  const head = splitCsvLine(lines[0]).map(norm);
  const find = (...n: string[]) => head.findIndex((h) => n.includes(h));
  const iCampus = find('campus');
  const iEn = find('classen', 'class', 'classname');
  const iUr = find('classur');
  const iSec = find('sections', 'section');
  const iSub = find('subjects', 'subject');
  if (iCampus < 0 || iEn < 0) return { rows: [], fatal: true };
  const list = (v: string) => v.split(/[;؛]/).map((x) => x.trim()).filter(Boolean);
  const rows = lines.slice(1).map((raw, k) => {
    const c = splitCsvLine(raw);
    const g = (i: number) => (i >= 0 ? (c[i] ?? '').trim() : '');
    return { line: k + 2, campus: g(iCampus), classEn: g(iEn), classUr: g(iUr), sections: list(g(iSec)), subjects: list(g(iSub)) };
  });
  return { rows, fatal: false };
}

export const AdminClassImport: React.FC<{ admin: Profile; onDone: () => void; onClose: () => void }> = ({ admin, onDone, onClose }) => {
  const { stringResource: t } = useStringResource();
  const [rows, setRows] = useState<ImportClassRow[] | null>(null);
  const [checked, setChecked] = useState<ImportClassResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr(null);
    setDone(false);
    setChecked(null);
    const p = parseClassFile(await file.text());
    if (p.fatal) return setErr(t('cl_import_err_cols'));
    setRows(p.rows);
    const r = await AppModule.settingsRepository.importClasses(p.rows, admin, true);
    if (!r.ok) return setErr(r.error.message);
    setChecked(r.data);
  };

  const run = async () => {
    if (!rows) return;
    setBusy(true);
    const r = await AppModule.settingsRepository.importClasses(rows, admin, false);
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(true);
    setRows(null);
    setChecked(null);
    onDone();
  };

  const good = checked?.filter((x) => x.ok) ?? [];
  const bad = checked?.filter((x) => !x.ok) ?? [];

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('cl_import_title')}</h3>
      <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('cl_import_hint')}</p>
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton
          text={t('st_bulk_template')}
          variant="outline"
          icon={<Download className="w-4 h-4 text-[#F28C28]" />}
          onClick={() =>
            downloadCsv('classes-template.csv', [
              HEADER,
              ['Boys', '6', 'جماعت 6', 'A;B', 'English|انگریزی;Maths|ریاضی;Islamiat|اسلامیات'],
              ['Girls', 'Nursery', 'نرسری', 'A', 'English;Urdu'],
            ])
          }
        />
        <label className="flex items-center justify-center gap-2 min-h-[48px] rounded-2xl border border-dashed border-[#14284B] text-sm font-semibold text-[#14284B] cursor-pointer">
          <Upload className="w-4 h-4 text-[#F28C28]" />
          {t('st_csv_pick')}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      {checked && (
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-[#2E9E5B]"><span dir="ltr">{good.length}</span> {t('st_csv_valid')}</div>
          {bad.length > 0 && <div className="font-semibold text-[#D64545]"><span dir="ltr">{bad.length}</span> {t('st_csv_invalid')}</div>}
          {bad.slice(0, 10).map((x) => (
            <div key={x.line} dir="ltr" className="text-[11px] text-[#D64545] text-start">{t('st_csv_row')} {x.line} ({x.className}): {x.error}</div>
          ))}
          {good.slice(0, 8).map((x) => (
            <div key={x.line} dir="ltr" className="text-[11px] text-[#6B7385] text-start">{x.className} · {x.created ? 'new' : 'existing'} · +{x.sectionsAdded} sections</div>
          ))}
        </div>
      )}
      {done && <p className="text-xs font-semibold text-[#2E9E5B]">{t('cl_import_done')}</p>}
      {err && <p className="text-xs text-[#D64545]">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onClose} />
        <PrimaryButton text={`${t('st_bulk_import')}${good.length ? ` (${good.length})` : ''}`} variant="orange" loading={busy} disabled={good.length === 0} onClick={() => void run()} />
      </div>
    </SchoolCard>
  );
};
