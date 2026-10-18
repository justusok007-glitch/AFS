import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BellRing,
  CalendarDays,
  Megaphone,
  CalendarCheck,
  Info,
  MessageSquare,
  Plus,
  Trash2,
  Wallet,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { formatSchoolDate, formatSchoolTime } from '../../../domain/formatters/SchoolFormatters';
import {
  AppNotification,
  Notice,
  NoticeAudience,
  NotificationType,
  Profile,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { selectCls } from '../principal/PrincipalShared';

/* ------------------------------------------------------------ notifications */

export function useUnreadNotifications(userId: string): { count: number; refresh: () => void } {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    void AppModule.noticeRepository.getNotificationsForUser(userId).then((r) => {
      if (r.ok) setCount(r.data.filter((n) => !n.readAt).length);
    });
  }, [userId]);
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);
  return { count, refresh };
}

export function useUnreadMessages(userId: string, enabled: boolean, studentId?: string): { count: number; refresh: () => void } {
  const [count, setCount] = useState(0);
  const refresh = useCallback(() => {
    if (!enabled) return;
    void AppModule.messageRepository.getUnreadMessageCount(userId, studentId).then((r) => {
      if (r.ok) setCount(r.data);
    });
  }, [userId, enabled, studentId]);
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);
  return { count, refresh };
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  [NotificationType.ATTENDANCE]: <CalendarCheck className="w-4 h-4" />,
  [NotificationType.FEE]: <Wallet className="w-4 h-4" />,
  [NotificationType.EXAM]: <Award className="w-4 h-4" />,
  [NotificationType.MESSAGE]: <MessageSquare className="w-4 h-4" />,
  [NotificationType.NOTICE]: <BellRing className="w-4 h-4" />,
  [NotificationType.SYSTEM]: <Info className="w-4 h-4" />,
};

export const NotificationsSheet: React.FC<{
  user: Profile;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}> = ({ user, open, onClose, onChanged }) => {
  const { stringResource: t, language } = useStringResource();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await AppModule.noticeRepository.getNotificationsForUser(user.id);
    if (r.ok) setItems(r.data);
    setLoading(false);
    return r.ok ? r.data : [];
  }, [user.id]);
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void (async () => {
      const loaded = await load();
      // Opening the list counts as reading: clear the badge now, keep the new items highlighted until closed.
      if (loaded.some((n) => !n.readAt)) {
        await AppModule.noticeRepository.markAllNotificationsRead(user.id);
        onChanged();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, load]);

  if (!open) return null;

  const read = async (n: AppNotification) => {
    if (n.readAt) return;
    await AppModule.noticeRepository.markNotificationRead(n.id, user.id);
    await load();
    onChanged();
  };
  const readAll = async () => {
    await AppModule.noticeRepository.markAllNotificationsRead(user.id);
    await load();
    onChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#14284B]/45 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl border border-[#E4E8F0] shadow-xl">
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
          <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('notifications_label')}</h3>
          <button type="button" onClick={() => void readAll()} className="text-xs font-semibold text-[#F28C28] cursor-pointer min-h-[36px]">{t('nf_mark_all')}</button>
        </div>
        <div className="overflow-y-auto px-4 pb-2 space-y-2 flex-1">
          {loading ? (
            <ShimmerPlaceholder lines={4} />
          ) : items.length === 0 ? (
            <p className="text-xs text-[#6B7385] py-6 text-center">{t('nf_none')}</p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => void read(n)}
                className={`w-full text-start flex gap-2.5 rounded-xl border p-2.5 cursor-pointer ${n.readAt ? 'border-[#E4E8F0] bg-white' : 'border-[#F28C28]/40 bg-[#F28C28]/8'}`}
              >
                <span className="w-8 h-8 rounded-xl bg-[#14284B]/8 text-[#14284B] flex items-center justify-center shrink-0">{TYPE_ICON[n.type]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-[#14284B]">{language === 'ur' && n.titleUr ? n.titleUr : n.title}</span>
                  <span className="block text-[11px] text-[#1B2233]">{language === 'ur' && n.bodyUr ? n.bodyUr : n.body}</span>
                  <span dir="ltr" className="block text-[10px] text-[#6B7385] text-start">{formatSchoolDate(n.createdAt)} {formatSchoolTime(n.createdAt)}</span>
                </span>
              </button>
            ))
          )}
        </div>
        <div className="p-4 pt-2">
          <PrimaryButton text={t('nf_close')} variant="navy" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ notices */

const NoticeItem: React.FC<{ n: Notice; showExpired?: boolean; onDelete?: () => void }> = ({ n, showExpired, onDelete }) => {
  const { stringResource: t } = useStringResource();
  const expired = !!n.expiresAt && n.expiresAt <= new Date().toISOString();
  return (
    <div className="border-t border-[#E4E8F0] pt-2 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold text-[#14284B]">{n.title}</div>
        <div className="flex items-center gap-1.5 shrink-0">
          {showExpired && <StatusChip label={expired ? t('nt_expired') : t(`nt_aud_${n.audience}` as StringKey)} tone={expired ? 'error' : 'info'} />}
          {onDelete && (
            <button type="button" aria-label={t('nt_delete')} onClick={onDelete} className="p-1.5 text-[#D64545] cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </div>
      <p className="text-xs text-[#1B2233] whitespace-pre-line">{n.body}</p>
      <div dir="ltr" className="text-[11px] text-[#6B7385] text-start flex items-center gap-1.5 pt-1"><CalendarDays className="w-3.5 h-3.5" />{formatSchoolDate(n.createdAt)}</div>
    </div>
  );
};

/** Latest 3 notices on a Home page, with "View all". */
export const NoticesCard: React.FC<{ user: Profile }> = ({ user }) => {
  const { stringResource: t } = useStringResource();
  const [items, setItems] = useState<Notice[] | null>(null);
  const [all, setAll] = useState(false);
  useEffect(() => {
    void AppModule.noticeRepository.getNoticesForUser(user).then((r) => setItems(r.ok ? r.data : []));
  }, [user]);
  const shown = items ? (all ? items : items.slice(0, 3)) : [];
  return (
    <SchoolCard className="ps-notice space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
          <span className="ps-notice-icon w-8 h-8 rounded-xl bg-[#F28C28]/12 flex items-center justify-center"><Megaphone className="w-4 h-4 text-[#F28C28]" /></span>
          <span>{t('nt_title')}</span>
        </div>
        {items && items.length > 3 && (
          <button type="button" onClick={() => setAll((v) => !v)} className="text-xs font-semibold text-[#F28C28] cursor-pointer min-h-[32px]">
            {all ? t('nt_show_less') : t('nt_view_all')}
          </button>
        )}
      </div>
      {items === null ? <ShimmerPlaceholder lines={2} /> : shown.length === 0 ? <p className="text-xs text-[#6B7385]">{t('nt_none')}</p> : shown.map((n) => <NoticeItem key={n.id} n={n} />)}
    </SchoolCard>
  );
};

/** Principal / Admin: list, publish and delete notices. */
export const NoticesManager: React.FC<{ actor: Profile; lookups: AccountantLookups; onBack: () => void }> = ({ actor, lookups, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<NoticeAudience>(NoticeAudience.ALL);
  const [audienceId, setAudienceId] = useState('');
  const [expiry, setExpiry] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await AppModule.noticeRepository.getAllNotices(actor);
    if (!r.ok) setFailed(true);
    else setItems(r.data);
    setLoading(false);
  }, [actor]);
  useEffect(() => {
    void load();
  }, [load]);

  const publish = async () => {
    setBusy(true);
    setError(null);
    const r = await AppModule.noticeRepository.createNotice(
      {
        id: '',
        title,
        body,
        audience,
        audienceId: audienceId || null,
        createdBy: actor.id,
        createdAt: '',
        expiresAt: expiry ? `${expiry}T23:59:59+05:00` : null,
      },
      actor
    );
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setCreating(false);
    setTitle('');
    setBody('');
    setExpiry('');
    void load();
  };
  const remove = async (id: string) => {
    const r = await AppModule.noticeRepository.deleteNotice(id, actor);
    if (!r.ok) setError(r.error.message);
    void load();
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('ms_back')}</span>
      </button>
      {creating ? (
        <SchoolCard className="space-y-2.5">
          <SchoolTextField label={t('nt_field_title')} value={title} onValueChange={setTitle} />
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('nt_field_body')}</label>
            <textarea className={`${selectCls} py-2 min-h-[110px]`} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <select className={selectCls} value={audience} onChange={(e) => { setAudience(e.target.value as NoticeAudience); setAudienceId(''); }}>
            {[NoticeAudience.ALL, NoticeAudience.PARENTS, NoticeAudience.STAFF, NoticeAudience.CAMPUS, NoticeAudience.CLASS].map((a) => (<option key={a} value={a}>{t(`nt_aud_${a}` as StringKey)}</option>))}
          </select>
          {audience === NoticeAudience.CAMPUS && (
            <select className={selectCls} value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
              <option value="">—</option>
              {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
            </select>
          )}
          {audience === NoticeAudience.CLASS && (
            <select className={selectCls} value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
              <option value="">—</option>
              {lookups.classes.map((c) => {
                const campus = lookups.campuses.find((x) => x.id === c.campusId);
                return (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn} ({campus?.code})</option>);
              })}
            </select>
          )}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('nt_expiry')}</label>
            <input type="date" dir="ltr" className={selectCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={() => setCreating(false)} />
            <PrimaryButton text={t('nt_publish')} variant="orange" loading={busy} onClick={() => void publish()} />
          </div>
        </SchoolCard>
      ) : (
        <PrimaryButton text={t('nt_new')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setCreating(true)} />
      )}
      {!creating && error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      {loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { setFailed(false); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : items.length === 0 ? (
        <EmptyState title={t('nt_none')} description="" />
      ) : (
        <SchoolCard className="space-y-2">
          {items.map((n) => (<NoticeItem key={n.id} n={n} showExpired onDelete={() => void remove(n.id)} />))}
        </SchoolCard>
      )}
    </div>
  );
};

/** Home-page card with the live unread-message count. */
export const UnreadMessagesCard: React.FC<{ user: Profile; onOpen?: () => void }> = ({ user, onOpen }) => {
  const { stringResource: t } = useStringResource();
  const [n, setN] = useState(0);
  useEffect(() => {
    const load = () => void AppModule.messageRepository.getUnreadMessageCount(user.id).then((r) => r.ok && setN(r.data));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [user.id]);
  return (
    <SchoolCard className="space-y-2" onClick={onOpen}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
          <MessageSquare className="w-4 h-4 text-[#F28C28]" />
          <span>{t('teacher_unread_messages_title')}</span>
        </div>
        <StatusChip label={String(n)} tone={n > 0 ? 'warning' : 'success'} />
      </div>
    </SchoolCard>
  );
};
