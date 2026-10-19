import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Profile, Student } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard, SchoolTextField } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';

/** Admin: remove several students (with their parents when left without a child), or everything at once. */
export const AdminRemoveData: React.FC<{ admin: Profile; onBack: () => void }> = ({ admin, onBack }) => {
  const { stringResource: t } = useStringResource();
  const [query, setQuery] = useState('');
  const [list, setList] = useState<Student[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirmWord, setConfirmWord] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let off = false;
    void (async () => {
      const r = await AppModule.studentRepository.search({ query: query.trim(), campusId: null, classId: null, sectionId: null, status: null });
      if (!off && r.ok) setList(r.data);
    })();
    return () => { off = true; };
  }, [query, tick]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const shown = list.slice(0, 200);

  const run = async (fn: () => Promise<{ ok: boolean; text: string }>) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    setMsg(r.text);
    setPicked(new Set());
    setConfirmWord('');
    setTick((n) => n + 1);
  };

  const removeSelected = () => {
    if (!window.confirm(t('rm_confirm_selected').replace('{n}', String(picked.size)))) return;
    void run(async () => {
      const r = await AppModule.studentRepository.removeStudents([...picked], admin);
      return r.ok ? { ok: true, text: `${t('rm_done')}: ${r.data.students} / ${r.data.parents}` } : { ok: false, text: r.error.message };
    });
  };
  const removeAll = () =>
    void run(async () => {
      const r = await AppModule.studentRepository.removeStudents('ALL', admin);
      return r.ok ? { ok: true, text: `${t('rm_done')}: ${r.data.students} / ${r.data.parents}` } : { ok: false, text: r.error.message };
    });
  const removeOrphans = () =>
    void run(async () => {
      const r = await AppModule.studentRepository.removeParentsWithoutStudents(admin);
      return r.ok ? { ok: true, text: `${t('rm_done')}: ${r.data.parents}` } : { ok: false, text: r.error.message };
    });

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('rm_title')}</h3>
        <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('rm_hint')}</p>
        <SchoolTextField label={t('st_search')} value={query} onValueChange={setQuery} />
        <div className="flex gap-2">
          <button type="button" className="text-xs font-semibold text-[#14284B] underline cursor-pointer" onClick={() => setPicked(new Set(shown.map((x) => x.id)))}>{t('rm_select_shown')}</button>
          <button type="button" className="text-xs font-semibold text-[#6B7385] underline cursor-pointer" onClick={() => setPicked(new Set())}>{t('rm_clear')}</button>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-[#E4E8F0] border border-[#E4E8F0] rounded-xl">
          {shown.map((s) => (
            <label key={s.id} className="flex items-center gap-2.5 px-3 py-2 text-xs cursor-pointer">
              <input type="checkbox" checked={picked.has(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 shrink-0" />
              <span dir="ltr" className="font-mono text-[#6B7385] shrink-0">{s.admissionNo}</span>
              <span className="truncate text-[#14284B] font-semibold">{s.name}</span>
            </label>
          ))}
          {shown.length === 0 && <div className="p-3 text-xs text-[#6B7385]">{t('st_csv_none')}</div>}
        </div>
        <PrimaryButton text={`${t('rm_selected_btn')} (${picked.size})`} variant="outline" icon={<Trash2 className="w-4 h-4 text-[#D64545]" />} disabled={picked.size === 0 || busy} loading={busy} onClick={removeSelected} />
      </SchoolCard>

      <SchoolCard className="space-y-2.5">
        <PrimaryButton text={t('rm_orphans_btn')} variant="outline" disabled={busy} onClick={removeOrphans} />
      </SchoolCard>

      <SchoolCard className="space-y-2.5 border border-[#D64545]/40">
        <p className="text-xs font-semibold text-[#D64545]">{t('rm_all_hint')}</p>
        <SchoolTextField label={t('rm_type_delete')} value={confirmWord} onValueChange={setConfirmWord} forceLtrValue />
        <PrimaryButton text={t('rm_all_btn')} variant="orange" disabled={confirmWord.trim().toUpperCase() !== 'DELETE' || busy} loading={busy} onClick={removeAll} />
      </SchoolCard>

      {msg && <p className="text-xs font-semibold text-[#2E9E5B]">{msg}</p>}
      <PrimaryButton text={t('ad_cred_done')} variant="outline" onClick={onBack} />
    </div>
  );
};
