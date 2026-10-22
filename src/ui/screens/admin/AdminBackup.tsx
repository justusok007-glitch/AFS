import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { BackupRow, downloadFreshBackup, downloadStoredBackup, ensureDailyBackup, fetchStoredBackup, listBackups, restoreBackup, saveJson } from '../../../data/supabase/backup';
import { discardAndReload, pushNow } from '../../../data/supabase/sync';
import { rpc } from '../../../data/supabase/client';
import { SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';

export const AdminBackup: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [rows, setRows] = useState<BackupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    await ensureDailyBackup();
    try {
      setRows(await listBackups());
    } catch {
      setFailed(true);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const fileRef = useRef<HTMLInputElement>(null);

  /** Restore: safety copy first (downloaded), then replace, then reload everything from the server. */
  const restore = async (key: string, getData: () => Promise<unknown>) => {
    if (!window.confirm(t('bk_restore_warn'))) return;
    if ((window.prompt(t('bk_restore_type')) ?? '').trim().toUpperCase() !== 'RESTORE') return;
    setBusy(key);
    setMsg('');
    try {
      const data = await getData(); // read the chosen backup before the safety copy refreshes today's snapshot
      await pushNow().catch(() => undefined);
      saveJson(await rpc('backup_now', {}), `afs-before-restore-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`);
      await restoreBackup(data);
      await discardAndReload();
      setMsg(t('bk_restore_done'));
      window.setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      setMsg(`${t('bk_restore_failed')} ${e instanceof Error ? e.message : ''}`);
    }
    setBusy(null);
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setMsg('');
    try {
      await fn();
      setMsg(t('bk_done'));
      if (key === 'now') void load();
    } catch {
      setMsg(t('bk_failed'));
    }
    setBusy(null);
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <SchoolCard className="space-y-2.5">
        <h2 className="font-heading text-base font-bold text-[#14284B]">{t('bk_title')}</h2>
        <p className="text-xs text-[#6B7385]">{t('bk_hint')}</p>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void run('now', downloadFreshBackup)}
          className="w-full min-h-[46px] rounded-xl bg-[#F28C28] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {busy === 'now' ? t('bk_preparing') : t('bk_download_now')}
        </button>
        {msg && <p className="text-xs text-[#14284B]">{msg}</p>}
      </SchoolCard>
      <SchoolCard className="space-y-2">
        <h3 className="text-sm font-bold text-[#14284B]">{t('bk_restore_file')}</h3>
        <p className="text-xs text-[#6B7385]">{t('bk_restore_hint')}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void restore('file', async () => JSON.parse(await f.text()));
          }}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => fileRef.current?.click()}
          className="w-full min-h-[44px] rounded-xl border border-[#C0392B] text-sm font-bold text-[#C0392B] disabled:opacity-60 cursor-pointer"
        >
          {busy === 'file' ? '…' : t('bk_restore_file')}
        </button>
      </SchoolCard>
      <SchoolCard className="space-y-2">
        <h3 className="text-sm font-bold text-[#14284B]">{t('bk_stored')}</h3>
        {loading ? (
          <ShimmerPlaceholder lines={3} />
        ) : failed ? (
          <p className="text-xs text-[#C0392B]">{t('bk_not_installed')}</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-[#6B7385]">{t('bk_none')}</p>
        ) : (
          rows.map((r) => (
            <div key={r.day} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-2">
              <div>
                <p className="text-sm font-semibold text-[#14284B]">{r.day}</p>
                <p className="text-[11px] text-[#6B7385]">{r.sizeKb} KB</p>
              </div>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void run(r.day, () => downloadStoredBackup(r.day))}
                className="min-h-[40px] px-3 rounded-xl border border-[#E4E8F0] text-sm font-semibold text-[#14284B] disabled:opacity-60 cursor-pointer"
              >
                {busy === r.day ? '…' : t('bk_download')}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void restore('r' + r.day, () => fetchStoredBackup(r.day))}
                className="min-h-[40px] px-3 rounded-xl border border-[#C0392B] text-sm font-semibold text-[#C0392B] disabled:opacity-60 cursor-pointer"
              >
                {busy === 'r' + r.day ? '…' : t('bk_restore')}
              </button>
            </div>
          ))
        )}
      </SchoolCard>
    </div>
  );
};
