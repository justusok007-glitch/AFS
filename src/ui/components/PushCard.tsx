import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { disablePush, enablePush, PUSH_SUPPORTED, pushPermission, sendTestPush } from '../../data/supabase/push';
import { CLOUD_ENABLED } from '../../data/supabase/mode';
import { SchoolCard } from './SchoolComposables';
import { useStringResource } from '../theme/LocaleContext';

/** "Turn on notifications" card. compact = home screen (disappears once notifications are on). */
export const PushCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { stringResource: t } = useStringResource();
  const [perm, setPerm] = useState(pushPermission());
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  if (!CLOUD_ENABLED) return null;
  if (compact && (perm === 'granted' || perm === 'denied')) return null;
  if (compact && !PUSH_SUPPORTED) return null;

  const turnOn = async () => {
    setBusy(true);
    const r = await enablePush();
    setPerm(pushPermission());
    setMsg(r === 'ok' ? t('pn_on') : r === 'denied' ? t('pn_blocked') : r === 'unsupported' ? t('pn_unsupported') : t('pn_failed'));
    setBusy(false);
  };

  return (
    <SchoolCard className="space-y-2.5">
      <div className="flex items-center gap-2 font-heading text-sm font-bold text-[#14284B]">
        <span className="w-8 h-8 rounded-xl bg-[#F28C28]/12 flex items-center justify-center">
          <Bell className="w-4 h-4 text-[#F28C28]" />
        </span>
        <span>{t('pn_title')}</span>
      </div>
      {perm === 'unsupported' ? (
        <p className="text-xs text-[#6B7385]">{t('pn_unsupported')}</p>
      ) : perm === 'denied' ? (
        <p className="text-xs text-[#C0392B]">{t('pn_blocked')}</p>
      ) : perm === 'granted' ? (
        <>
          <p className="text-xs text-[#2E9E5B] font-semibold">{t('pn_on')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => setMsg((await sendTestPush()) ? t('pn_test_sent') : t('pn_failed'))}
              className="flex-1 min-h-[40px] rounded-xl border border-[#E4E8F0] text-sm font-semibold text-[#14284B] cursor-pointer"
            >
              {t('pn_test')}
            </button>
            <button
              type="button"
              onClick={async () => {
                await disablePush();
                setMsg(t('pn_off_done'));
              }}
              className="flex-1 min-h-[40px] rounded-xl border border-[#E4E8F0] text-sm font-semibold text-[#6B7385] cursor-pointer"
            >
              {t('pn_disable')}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-[#6B7385]">{t('pn_hint')}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void turnOn()}
            className="w-full min-h-[44px] rounded-xl bg-[#F28C28] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
          >
            {busy ? '…' : t('pn_enable')}
          </button>
        </>
      )}
      {msg && <p className="text-xs text-[#14284B]">{msg}</p>}
    </SchoolCard>
  );
};
