import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Profile, Role, Student } from '../../../domain/models/models';
import { EmptyState, SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { selectCls } from '../principal/PrincipalShared';

const digits = (s: string) => s.replace(/\D/g, '').replace(/^0092|^92/, '0');
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Admin: finds parent accounts that look like duplicates (same phone or same name) and merges two of them into one. */
export const AdminMergeParents: React.FC<{ admin: Profile; onBack: () => void; onMerged: () => void }> = ({ admin, onBack, onMerged }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [parents, setParents] = useState<Profile[]>([]);
  const [kids, setKids] = useState<Record<string, Student[]>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [keepId, setKeepId] = useState('');
  const [removeId, setRemoveId] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.settingsRepository.getProfiles(null, null);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const ps = r.data.filter((p) => p.role === Role.PARENT).sort((a, b) => a.fullName.localeCompare(b.fullName));
    const entries = await Promise.all(
      ps.map(async (p) => {
        const c = await AppModule.studentRepository.childrenOfParent(p.id);
        return [p.id, c.ok ? c.data : []] as const;
      })
    );
    setParents(ps);
    setKids(Object.fromEntries(entries));
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

  const label = (p: Profile) => {
    const k = (kids[p.id] ?? []).map((s) => (language === 'ur' && s.nameUr ? s.nameUr : s.name)).join(', ');
    return `${p.loginId} · ${language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName}${p.phone ? ` · ${p.phone}` : ''}${k ? ` · ${k}` : ''}`;
  };

  // groups that look like duplicates
  const groups = useMemo(() => {
    const byKey = new Map<string, Profile[]>();
    const add = (key: string, p: Profile) => {
      if (!key) return;
      const list = byKey.get(key) ?? [];
      if (!list.includes(p)) list.push(p);
      byKey.set(key, list);
    };
    parents.forEach((p) => {
      const ph = digits(p.phone || '');
      if (ph.length >= 7) add(`p:${ph}`, p);
      const nm = norm(p.fullName || '');
      if (nm.length >= 4) add(`n:${nm}`, p);
    });
    const seen = new Set<string>();
    const out: Profile[][] = [];
    byKey.forEach((list) => {
      if (list.length < 2) return;
      const sig = list.map((p) => p.id).sort().join('|');
      if (seen.has(sig)) return;
      seen.add(sig);
      out.push(list);
    });
    return out;
  }, [parents]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? parents.filter((p) => label(p).toLowerCase().includes(q)) : parents;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parents, query, kids, language]);

  const keep = parents.find((p) => p.id === keepId);
  const dup = parents.find((p) => p.id === removeId);

  const pickPair = (list: Profile[]) => {
    const sorted = [...list].sort((a, b) => (kids[b.id]?.length ?? 0) - (kids[a.id]?.length ?? 0) || a.loginId.localeCompare(b.loginId));
    setKeepId(sorted[0].id);
    setRemoveId(sorted[1].id);
    setMsg('');
  };

  const merge = async () => {
    if (!keep || !dup) return;
    if (!window.confirm(t('mg_confirm').replace('{dup}', dup.loginId).replace('{keep}', keep.loginId))) return;
    setBusy(true);
    const r = await AppModule.settingsRepository.mergeParentAccounts(keep.id, dup.id, admin);
    setBusy(false);
    if (!r.ok) {
      setMsg(r.error.message);
      return;
    }
    setMsg(t('mg_done').replace('{c}', String(r.data.childrenMoved)).replace('{m}', String(r.data.chatsMoved)));
    setKeepId('');
    setRemoveId('');
    onMerged();
    void load();
  };

  const kidsLine = (p: Profile) => {
    const k = kids[p.id] ?? [];
    return k.length ? k.map((s) => (language === 'ur' && s.nameUr ? s.nameUr : s.name)).join(', ') : t('mg_no_children');
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <h2 className="font-heading text-base font-bold text-[#14284B]">{t('mg_title')}</h2>
      <p className="text-xs text-[#6B7385]">{t('mg_hint')}</p>

      {loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : (
        <>
          <SchoolCard className="space-y-2">
            <h3 className="text-sm font-bold text-[#14284B]">{t('mg_suggested')}</h3>
            {groups.length === 0 ? (
              <p className="text-xs text-[#6B7385]">{t('mg_none')}</p>
            ) : (
              groups.map((g) => (
                <div key={g.map((p) => p.id).join('|')} className="border-t border-[#E4E8F0] pt-2 space-y-1">
                  {g.map((p) => (
                    <div key={p.id} className="text-xs text-[#14284B]">{label(p)}</div>
                  ))}
                  <button type="button" onClick={() => pickPair(g)} className="min-h-[36px] px-3 rounded-xl border border-[#F28C28] text-[#F28C28] text-xs font-bold cursor-pointer">
                    {t('mg_choose_these')}
                  </button>
                </div>
              ))
            )}
          </SchoolCard>

          <SchoolCard className="space-y-2.5">
            <h3 className="text-sm font-bold text-[#14284B]">{t('mg_manual')}</h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ad_users_search')}
              className="w-full min-h-[44px] rounded-xl border border-[#E4E8F0] px-3 text-sm"
            />
            <label className="block text-xs font-semibold text-[#6B7385]">
              {t('mg_keep')}
              <select className={selectCls} value={keepId} onChange={(e) => setKeepId(e.target.value)}>
                <option value="">—</option>
                {shown.map((p) => (<option key={p.id} value={p.id}>{label(p)}</option>))}
              </select>
            </label>
            <label className="block text-xs font-semibold text-[#6B7385]">
              {t('mg_remove')}
              <select className={selectCls} value={removeId} onChange={(e) => setRemoveId(e.target.value)}>
                <option value="">—</option>
                {shown.filter((p) => p.id !== keepId).map((p) => (<option key={p.id} value={p.id}>{label(p)}</option>))}
              </select>
            </label>

            {keep && dup && keep.id !== dup.id && (
              <div className="rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] p-3 space-y-1.5 text-xs text-[#14284B]">
                <div><b>{t('mg_keep')}:</b> {label(keep)}</div>
                <div><b>{t('mg_remove')}:</b> {label(dup)}</div>
                <div className="text-[#6B7385]">{t('mg_result').replace('{keep}', keep.loginId).replace('{kids}', [...new Set([...(kids[keep.id] ?? []), ...(kids[dup.id] ?? [])].map((s) => (language === 'ur' && s.nameUr ? s.nameUr : s.name)))].join(', ') || kidsLine(keep)).replace('{dup}', dup.loginId)}</div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void merge()}
                  className="w-full min-h-[44px] rounded-xl bg-[#D64545] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {busy ? '…' : t('mg_merge')}
                </button>
              </div>
            )}
            {msg && <p className="text-xs text-[#14284B]">{msg}</p>}
          </SchoolCard>
        </>
      )}
    </div>
  );
};
