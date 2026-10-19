import React, { useEffect, useState } from 'react';
import { CLOUD_ENABLED } from '../../data/supabase/mode';
import {
  discardAndReload,
  getSyncStatus,
  pushNow,
  refreshIfIdle,
  subscribeSyncStatus,
  type SyncStatus,
} from '../../data/supabase/sync';
import { useStringResource } from '../theme/LocaleContext';

/** Small strip at the bottom: shows "Saving…" and any server error with Retry / Discard. */
export const SyncBanner: React.FC = () => {
  const { stringResource } = useStringResource();
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    const unsub = subscribeSyncStatus(setStatus);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refreshIfIdle();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  if (!CLOUD_ENABLED || status.state === 'idle') return null;

  if (status.state === 'error') {
    return (
      <div className="fixed bottom-0 inset-x-0 z-[80] bg-[#B3261E] text-white px-4 py-2.5 text-xs flex flex-col gap-2">
        <div className="font-semibold">
          {stringResource('sync_failed')}
          {status.message ? `: ${status.message}` : ''}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void pushNow()} className="min-h-[36px] px-3 rounded-lg bg-white text-[#B3261E] font-bold cursor-pointer">
            {stringResource('sync_retry')}
          </button>
          <button type="button" onClick={() => void discardAndReload().then(() => window.location.reload())} className="min-h-[36px] px-3 rounded-lg border border-white/70 font-semibold cursor-pointer">
            {stringResource('sync_reload')}
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed bottom-2 inset-x-0 z-[80] flex justify-center pointer-events-none">
      <span className="px-3 py-1 rounded-full bg-[#14284B] text-white text-[11px] font-semibold shadow">
        {stringResource('sync_saving')}
      </span>
    </div>
  );
};
