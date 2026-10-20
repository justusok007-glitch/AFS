import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Unlock } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { AttendanceUnlock, Profile } from '../../../domain/models/models';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { selectCls } from '../principal/PrincipalShared';

const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Admin opens attendance editing for a few minutes; assigned teachers / coordinators can then change it. */
export const AdminAttendanceUnlock: React.FC<{
  admin: Profile;
  sectionOptions: { id: string; label: string }[];
  onBack: () => void;
}> = ({ admin, sectionOptions, onBack }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [sectionId, setSectionId] = useState('ALL');
  const [date, setDate] = useState(today());
  const [minutes, setMinutes] = useState('5');
  const [items, setItems] = useState<AttendanceUnlock[]>([]);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await AppModule.attendanceRepository.listActiveUnlocks();
    setItems(r.ok ? r.data : []);
    setNow(Date.now());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      setItems((cur) => cur.filter((u) => new Date(u.expiresAt).getTime() > Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const open = async () => {
    const m = Math.round(Number(minutes));
    if (!Number.isFinite(m) || m < 1 || m > 240) return setErr(t('ad_unlock_err_minutes'));
    setBusy(true);
    setErr(null);
    const r = await AppModule.attendanceRepository.openUnlock(admin, { sectionId: sectionId === 'ALL' ? null : sectionId, date, minutes: m });
    setBusy(false);
    if (!r.ok) return setErr(r.error.message);
    void load();
  };
  const close = async (id: string) => {
    await AppModule.attendanceRepository.closeUnlock(admin, id);
    void load();
  };
  const label = (id: string | null) => (id ? sectionOptions.find((o) => o.id === id)?.label ?? id : t('ad_unlock_all'));

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <SchoolCard className="space-y-3">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ad_unlock_title')}</h3>
        <p className="text-[11px] leading-relaxed text-[#6B7385]">{t('ad_unlock_hint')}</p>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('ad_unlock_section')}</label>
          <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="ALL">{t('ad_unlock_all')}</option>
            {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('ad_att_date')}</label>
            <input type="date" dir="ltr" className={selectCls} value={date} max={today()} onChange={(e) => setDate(e.target.value || today())} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('ad_unlock_minutes')}</label>
            <input type="number" inputMode="numeric" min={1} max={240} dir="ltr" className={selectCls} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </div>
        </div>
        {err && <p className="text-xs font-medium text-[#D64545]">{err}</p>}
        <PrimaryButton text={t('ad_unlock_open_btn')} variant="orange" loading={busy} icon={<Unlock className="w-4 h-4" />} onClick={() => void open()} />
      </SchoolCard>
      <SchoolCard className="space-y-2">
        <h3 className="text-xs font-bold text-[#14284B]">{t('ad_unlock_active')}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-[#6B7385]">{t('ad_unlock_none')}</p>
        ) : (
          items.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-2 text-xs">
              <div className="min-w-0">
                <div className="font-semibold text-[#14284B] truncate">{label(u.sectionId)}</div>
                <div dir="ltr" className="text-[11px] text-[#6B7385] text-start">{u.date} · <span className="font-mono font-bold text-[#2E9E5B]">{fmt(Math.max(0, Math.floor((new Date(u.expiresAt).getTime() - now) / 1000)))}</span></div>
              </div>
              <button type="button" onClick={() => void close(u.id)} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#D64545] cursor-pointer min-h-[36px]">
                <Lock className="w-3.5 h-3.5" />{t('ad_unlock_lock_now')}
              </button>
            </div>
          ))
        )}
      </SchoolCard>
    </div>
  );
};
