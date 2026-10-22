import { useBackHandler } from '../../navigation/backStack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Trash2 } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  compressPhoto,
  deleteDiary,
  DIARY_MAX_PHOTOS,
  DIARY_PHOTO_DAYS,
  diaryPhotoUrl,
  DiaryEntry,
  listDiary,
  postDiary,
  purgeOldDiaryPhotos,
} from '../../../data/supabase/diary';
import { subscribeRefreshTouched } from '../../../data/supabase/sync';
import { today } from '../../../domain/clock';
import { Profile, Role, SchoolClass, Section } from '../../../domain/models/models';
import { EmptyState, SchoolCard, ShimmerPlaceholder } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { formatClassSectionTitle } from '../teacher/TeacherHelpers';

const Photo: React.FC<{ path: string; onOpen: (url: string) => void }> = ({ path, onOpen }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  useEffect(() => {
    let live = true;
    diaryPhotoUrl(path)
      .then((u) => live && setUrl(u))
      .catch(() => live && setBad(true));
    return () => {
      live = false;
    };
  }, [path]);
  if (bad) return <div className="h-24 rounded-xl bg-[#F4F6FA] text-[11px] text-[#6B7385] flex items-center justify-center">!</div>;
  if (!url) return <div className="h-24 rounded-xl bg-[#F4F6FA] animate-pulse" />;
  return (
    <button type="button" onClick={() => onOpen(url)} className="block w-full cursor-pointer">
      <img src={url} alt="" className="w-full h-28 object-cover rounded-xl border border-[#E4E8F0]" />
    </button>
  );
};

/**
 * Diary: parents read it, class teachers / vice principal post it, principal and admin can read it.
 * `parentSectionIds` (parents only) limits the list to the selected child's section.
 */
export const DiaryTab: React.FC<{
  user: Profile;
  parentSectionIds?: string[];
  onBack?: () => void;
}> = ({ user, parentSectionIds, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [classesMap, setClassesMap] = useState<Record<string, SchoolClass>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [limit, setLimit] = useState(15);
  const [composing, setComposing] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  useBackHandler(composing || !!viewer, () => {
    if (viewer) setViewer(null);
    else setComposing(false);
  });

  const canPost = user.role === Role.TEACHER || user.role === Role.VICE_PRINCIPAL || user.role === Role.ADMIN;
  const canDeleteAny = user.role === Role.ADMIN || user.role === Role.VICE_PRINCIPAL;

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFailed(false);
    }
    try {
      const [list, sec, cls] = await Promise.all([
        listDiary(80),
        AppModule.settingsRepository.getSections(null),
        AppModule.settingsRepository.getClasses(null),
      ]);
      setEntries(list);
      if (sec.ok) setSections(sec.data);
      if (cls.ok) {
        const m: Record<string, SchoolClass> = {};
        cls.data.forEach((c) => (m[c.id] = c));
        setClassesMap(m);
      }
    } catch {
      if (!silent) setFailed(true);
    }
    if (!silent) setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  // pull-to-refresh, coming back to the app and the 5-minute refresh all reload the diary quietly
  useEffect(() => subscribeRefreshTouched(() => void load(true)), [load]);
  useEffect(() => {
    if (user.role === Role.ADMIN) void purgeOldDiaryPhotos().catch(() => undefined);
  }, [user.role]);

  const secTitle = (id: string | null) => {
    if (!id) return t('dy_all_sections');
    const s = sections.find((x) => x.id === id);
    return s ? formatClassSectionTitle(s, classesMap, language) : id;
  };

  const visible = useMemo(() => {
    if (!parentSectionIds) return entries;
    return entries.filter((e) => e.sectionId === null || parentSectionIds.includes(e.sectionId));
  }, [entries, parentSectionIds]);

  const postable = useMemo(() => {
    if (user.role === Role.TEACHER) return sections.filter((s) => s.classTeacherId === user.id);
    return sections;
  }, [sections, user]);

  const remove = async (e: DiaryEntry) => {
    if (!window.confirm(t('dy_delete_confirm'))) return;
    try {
      await deleteDiary(e);
      setEntries((p) => p.filter((x) => x.id !== e.id));
    } catch {
      window.alert(t('dy_failed'));
    }
  };

  return (
    <div className="space-y-3">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
      )}
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-bold text-[#14284B]">{t('dy_title')}</h2>
        {canPost && !composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="px-3.5 min-h-[40px] rounded-xl bg-[#F28C28] text-white text-sm font-bold cursor-pointer"
          >
            {t('dy_new')}
          </button>
        )}
      </div>

      {composing && (
        <Composer
          user={user}
          postable={postable}
          canAll={user.role !== Role.TEACHER}
          secTitle={secTitle}
          onCancel={() => setComposing(false)}
          onDone={() => {
            setComposing(false);
            void load();
          }}
        />
      )}

      {loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('dy_failed')} subtitle="" actionLabel={t('retry_button')} onAction={() => void load()} />
      ) : visible.length === 0 ? (
        <EmptyState title={t('dy_empty')} subtitle="" />
      ) : (
        <>
          {visible.slice(0, limit).map((e) => (
            <SchoolCard key={e.id} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#14284B]">{secTitle(e.sectionId)}</p>
                  <p className="text-[11px] text-[#6B7385]">
                    {e.date} · {t('dy_by')} {e.authorName || '—'}
                  </p>
                </div>
                {(canDeleteAny || e.authorId === user.id) && canPost && (
                  <button type="button" aria-label={t('dy_delete')} onClick={() => void remove(e)} className="p-2 text-[#C0392B] cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {e.body && <p className="text-sm text-[#14284B] whitespace-pre-wrap">{e.body}</p>}
              {e.imagePaths.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {e.imagePaths.map((p) => (
                    <Photo key={p} path={p} onOpen={setViewer} />
                  ))}
                </div>
              )}
            </SchoolCard>
          ))}
          {visible.length > limit && (
            <button type="button" onClick={() => setLimit((l) => l + 15)} className="w-full min-h-[44px] rounded-xl border border-[#E4E8F0] text-sm font-semibold text-[#14284B] cursor-pointer">
              {t('dy_older')}
            </button>
          )}
          <p className="text-[11px] text-[#6B7385] text-center">{t('dy_photo_note').replace('{n}', String(DIARY_PHOTO_DAYS))}</p>
        </>
      )}

      {viewer && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-3" onClick={() => setViewer(null)}>
          <img src={viewer} alt="" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

const Composer: React.FC<{
  user: Profile;
  postable: Section[];
  canAll: boolean;
  secTitle: (id: string | null) => string;
  onCancel: () => void;
  onDone: () => void;
}> = ({ user, postable, canAll, secTitle, onCancel, onDone }) => {
  const { stringResource: t, language } = useStringResource();
  const [target, setTarget] = useState<string>(canAll ? '__all__' : postable[0]?.id ?? '');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = async (files: FileList | null) => {
    if (!files) return;
    setErr('');
    const room = DIARY_MAX_PHOTOS - photos.length;
    const add: { blob: Blob; url: string }[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      try {
        const blob = await compressPhoto(f);
        add.push({ blob, url: URL.createObjectURL(blob) });
      } catch {
        setErr(t('dy_failed'));
      }
    }
    setPhotos((p) => [...p, ...add]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async () => {
    if (!body.trim() && photos.length === 0) {
      setErr(t('dy_need_content'));
      return;
    }
    if (!target) {
      setErr(t('dy_no_section'));
      return;
    }
    setBusy(true);
    setErr('');
    try {
      await postDiary({
        sectionId: target === '__all__' ? null : target,
        date: today(),
        body: body.trim(),
        photos: photos.map((p) => p.blob),
        authorId: user.id,
        authorName: language === 'ur' && user.fullNameUr ? user.fullNameUr : user.fullName,
      });
      onDone();
    } catch (e) {
      setErr(`${t('dy_failed')} ${e instanceof Error ? e.message : ''}`);
      setBusy(false);
    }
  };

  if (!canAll && postable.length === 0) {
    return (
      <SchoolCard className="space-y-2">
        <p className="text-sm text-[#6B7385]">{t('dy_no_section')}</p>
        <button type="button" onClick={onCancel} className="min-h-[40px] px-3 rounded-xl border border-[#E4E8F0] text-sm font-semibold cursor-pointer">
          {t('back_button_label')}
        </button>
      </SchoolCard>
    );
  }

  return (
    <SchoolCard className="space-y-3">
      <label className="block text-xs font-semibold text-[#6B7385]">
        {t('dy_target')}
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E4E8F0] bg-white px-3 text-sm text-[#14284B]"
        >
          {canAll && <option value="__all__">{t('dy_all_sections')}</option>}
          {postable.map((s) => (
            <option key={s.id} value={s.id}>
              {secTitle(s.id)}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={t('dy_text_ph')}
        className="w-full rounded-xl border border-[#E4E8F0] px-3 py-2 text-sm text-[#14284B]"
      />
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={p.url} className="relative">
              <img src={p.url} alt="" className="w-full h-24 object-cover rounded-xl" />
              <button
                type="button"
                aria-label={t('dy_delete')}
                onClick={() => setPhotos((x) => x.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void pick(e.target.files)} />
      {photos.length < DIARY_MAX_PHOTOS && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full min-h-[44px] rounded-xl border border-dashed border-[#14284B]/40 text-sm font-semibold text-[#14284B] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          {t('dy_add_photos').replace('{n}', String(DIARY_MAX_PHOTOS))}
        </button>
      )}
      {err && <p className="text-xs text-[#C0392B]">{err}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className="flex-1 min-h-[44px] rounded-xl border border-[#E4E8F0] text-sm font-semibold text-[#14284B] cursor-pointer">
          {t('dialog_cancel')}
        </button>
        <button type="button" onClick={() => void submit()} disabled={busy} className="flex-1 min-h-[44px] rounded-xl bg-[#F28C28] text-white text-sm font-bold disabled:opacity-60 cursor-pointer">
          {busy ? t('dy_posting') : t('dy_post')}
        </button>
      </div>
    </SchoolCard>
  );
};
