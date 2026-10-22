import { useBackHandler } from '../../navigation/backStack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, MessageSquare, Plus, Search, Send } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { formatSchoolDate, formatSchoolTime } from '../../../domain/formatters/SchoolFormatters';
import { Conversation, Message, Profile, Role, Student } from '../../../domain/models/models';
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

interface ConvRow {
  conv: Conversation;
  last: Message | null;
  unread: number;
}

type View = { kind: 'list' } | { kind: 'new' } | { kind: 'chat'; convId: string };

const TEMPLATES: StringKey[] = ['ms_tpl_1', 'ms_tpl_2', 'ms_tpl_3', 'ms_tpl_4', 'ms_tpl_5'];

/** Parent (child given), teacher, or read-only Principal/Admin view of every conversation. */
export const MessagesTab: React.FC<{
  user: Profile;
  child?: Student;
  readOnly?: boolean;
  onBack?: () => void;
}> = ({ user, child, readOnly = false, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [view, setView] = useState<View>({ kind: 'list' });
  useBackHandler(view.kind !== 'list', () => {
    setView({ kind: 'list' });
    void load();
  });
  const [rows, setRows] = useState<ConvRow[]>([]);
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const pname = (p?: Profile) => (p ? (language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName) : '?');
  const sname = (s?: Student) => (s ? (language === 'ur' && s.nameUr ? s.nameUr : s.name) : '?');

  const load = useCallback(async () => {
    setFailed(false);
    const [cv, pr, st] = await Promise.all([
      AppModule.messageRepository.getConversationsForUser(user.id, user.role),
      AppModule.settingsRepository.getProfiles(null, null),
      AppModule.studentRepository.search({ query: '', campusId: null, classId: null, sectionId: null, status: null }),
    ]);
    if (!cv.ok || !pr.ok || !st.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const pm: Record<string, Profile> = {};
    pr.data.forEach((p) => (pm[p.id] = p));
    const sm: Record<string, Student> = {};
    st.data.forEach((s) => (sm[s.id] = s));
    setPeople(pm);
    setStudents(sm);
    const list = cv.data.filter((c) => !child || c.studentId === child.id);
    const out: ConvRow[] = [];
    for (const c of list) {
      const m = await AppModule.messageRepository.getMessages(c.id, user);
      const msgs = m.ok ? m.data : [];
      out.push({
        conv: c,
        last: msgs[msgs.length - 1] ?? null,
        unread: readOnly ? 0 : msgs.filter((x) => x.senderId !== user.id && !x.readAt).length,
      });
    }
    setRows(out);
    setLoading(false);
  }, [user, child, readOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed) {
    return <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { setLoading(true); void load(); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />;
  }

  if (view.kind === 'chat') {
    const row = rows.find((r) => r.conv.id === view.convId);
    const conv = row?.conv;
    if (!conv) {
      return <ShimmerPlaceholder lines={4} showHeader />;
    }
    return (
      <Chat
        user={user}
        conv={conv}
        title={readOnly ? `${pname(people[conv.parentId])} ↔ ${pname(people[conv.teacherId])}` : pname(people[user.id === conv.parentId ? conv.teacherId : conv.parentId])}
        about={sname(students[conv.studentId])}
        readOnly={readOnly}
        onBack={() => { setView({ kind: 'list' }); void load(); }}
      />
    );
  }

  if (view.kind === 'new') {
    return (
      <NewConversation
        user={user}
        child={child}
        onCancel={() => setView({ kind: 'list' })}
        onOpen={async (c) => {
          await load();
          setView({ kind: 'chat', convId: c.id });
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {onBack && (
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" /><span>{t('ms_back')}</span>
        </button>
      )}
      {readOnly ? (
        <p className="text-xs font-semibold text-[#14284B]">{t('ms_audit_title')}</p>
      ) : (
        <PrimaryButton text={t('ms_new')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setView({ kind: 'new' })} />
      )}
      {rows.length === 0 ? (
        <EmptyState title={t('ms_none')} description="" icon={<MessageSquare className="w-6 h-6 text-[#F28C28]" />} />
      ) : (
        rows.map(({ conv, last, unread }) => (
          <SchoolCard key={conv.id} className="p-3 space-y-0.5" onClick={() => setView({ kind: 'chat', convId: conv.id })}>
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-[#14284B] truncate">
                {readOnly ? `${pname(people[conv.parentId])} ↔ ${pname(people[conv.teacherId])}` : pname(people[user.id === conv.parentId ? conv.teacherId : conv.parentId])}
              </div>
              {unread > 0 && <StatusChip label={String(unread)} tone="warning" />}
            </div>
            <div className="text-[11px] text-[#6B7385]">{t('ms_about')} {sname(students[conv.studentId])}</div>
            {last && <div className="text-xs text-[#1B2233] truncate">{last.body}</div>}
          </SchoolCard>
        ))
      )}
    </div>
  );
};

/* ------------------------------------------------------------------- chat */

const Chat: React.FC<{
  user: Profile;
  conv: Conversation;
  title: string;
  about: string;
  readOnly: boolean;
  onBack: () => void;
}> = ({ user, conv, title, about, readOnly, onBack }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement | null>(null);

  const refresh = useCallback(async () => {
    const r = await AppModule.messageRepository.getMessages(conv.id, user);
    if (!r.ok) return;
    setMessages((prev) => (prev.length === r.data.length && prev.every((m, i) => m.readAt === r.data[i].readAt) ? prev : r.data));
    setLoading(false);
    if (!readOnly) await AppModule.messageRepository.markConversationRead(conv.id, user.id);
  }, [conv.id, user, readOnly]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    const r = await AppModule.messageRepository.sendMessage(conv.id, user.id, text);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setText('');
    void refresh();
  };

  const isTeacher = user.role === Role.TEACHER;

  return (
    <div className="space-y-2.5">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" /><span>{t('ms_back')}</span>
      </button>
      <SchoolCard className="py-2.5 space-y-0.5">
        <div className="text-sm font-bold text-[#14284B]">{title}</div>
        <div className="text-[11px] text-[#6B7385]">{t('ms_about')} {about}</div>
        <div className="text-[10px] text-[#6B7385]">{readOnly ? t('ms_read_only') : t('ms_note')}</div>
      </SchoolCard>

      <div className="flex flex-col gap-2 min-h-[220px]">
        {loading ? (
          <ShimmerPlaceholder lines={3} />
        ) : messages.length === 0 ? (
          <p className="text-xs text-center text-[#6B7385] py-8">{t('ms_empty_chat')}</p>
        ) : (
          messages.map((m) => {
            const mine = !readOnly && m.senderId === user.id;
            const fromParent = m.senderId === conv.parentId;
            return (
              <div key={m.id} className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? 'self-end bg-[#14284B] text-white' : readOnly && fromParent ? 'self-end bg-[#F28C28]/15 text-[#1B2233]' : 'self-start bg-white border border-[#E4E8F0] text-[#1B2233]'}`}>
                <div className="whitespace-pre-line break-words">{m.body}</div>
                <div dir="ltr" className={`mt-0.5 text-[10px] flex items-center gap-1.5 justify-end ${mine ? 'text-white/70' : 'text-[#6B7385]'}`}>
                  <span>{formatSchoolDate(m.createdAt)} {formatSchoolTime(m.createdAt)}</span>
                  {(mine || readOnly) && <span className={m.readAt ? 'text-[#7FD6A0]' : ''}>{m.readAt ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottom} />
      </div>

      {!readOnly && (
        <div className="space-y-2">
          {isTeacher && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {TEMPLATES.map((k) => (
                <button key={k} type="button" onClick={() => setText(t(k))} className="shrink-0 max-w-[220px] truncate px-2.5 min-h-[34px] rounded-full border border-[#E4E8F0] bg-white text-[11px] text-[#14284B] cursor-pointer">
                  {t(k)}
                </button>
              ))}
            </div>
          )}
          {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={text}
              maxLength={1000}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('ms_type')}
              className="flex-1 min-h-[48px] max-h-32 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] px-3 py-2.5 text-sm"
            />
            <button type="button" aria-label={t('ms_send')} disabled={busy || !text.trim()} onClick={() => void send()} className="w-12 h-12 rounded-2xl bg-[#F28C28] text-white flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer">
              <Send className={`w-5 h-5 ${isRtl ? '-scale-x-100' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------- new conversation */

const NewConversation: React.FC<{
  user: Profile;
  child?: Student;
  onCancel: () => void;
  onOpen: (c: Conversation) => void | Promise<void>;
}> = ({ user, child, onCancel, onOpen }) => {
  const { stringResource: t, language } = useStringResource();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [picked, setPicked] = useState<Student | null>(null);
  const [parents, setParents] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isParent = user.role === Role.PARENT;

  useEffect(() => {
    void (async () => {
      if (isParent && child) {
        const r = await AppModule.messageRepository.teachersOfStudent(child.id);
        if (r.ok) setTeachers(r.data);
      } else {
        const r = await AppModule.messageRepository.studentsForTeacher(user.id);
        if (r.ok) setStudents(r.data);
      }
      setLoading(false);
    })();
  }, [isParent, child, user.id]);

  const open = async (studentId: string, parentId: string, teacherId: string) => {
    setError(null);
    const r = await AppModule.messageRepository.getOrCreateConversation(studentId, parentId, teacherId);
    if (!r.ok) return setError(r.error.message);
    await onOpen(r.data);
  };

  const pickStudent = async (s: Student) => {
    setError(null);
    const r = await AppModule.studentRepository.parentsOfStudent(s.id);
    if (!r.ok || r.data.length === 0) return setError('This student has no parent account yet.');
    if (r.data.length === 1) return void open(s.id, r.data[0].id, user.id);
    setPicked(s);
    setParents(r.data);
  };

  const nm = (p: Profile) => (language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName);
  const q = query.trim().toLowerCase();
  const shown = students.filter((s) => !q || `${s.name} ${s.nameUr} ${s.admissionNo}`.toLowerCase().includes(q)).slice(0, 30);

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{isParent ? t('ms_pick_teacher') : picked ? t('ms_pick_parent') : t('ms_pick_student')}</h3>
        {loading ? (
          <ShimmerPlaceholder lines={3} />
        ) : isParent ? (
          teachers.length === 0 ? <p className="text-xs text-[#6B7385]">—</p> : teachers.map((p) => (
            <button key={p.id} type="button" onClick={() => child && void open(child.id, user.id, p.id)} className="w-full text-start rounded-xl border border-[#E4E8F0] px-3 py-2.5 text-sm font-semibold text-[#14284B] cursor-pointer">{nm(p)}</button>
          ))
        ) : picked ? (
          parents.map((p) => (
            <button key={p.id} type="button" onClick={() => void open(picked.id, p.id, user.id)} className="w-full text-start rounded-xl border border-[#E4E8F0] px-3 py-2.5 text-sm font-semibold text-[#14284B] cursor-pointer">{nm(p)} <span dir="ltr" className="font-mono text-[11px] text-[#6B7385]">{p.loginId}</span></button>
          ))
        ) : (
          <>
            <SchoolTextField label={t('st_search')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
            {shown.map((s) => (
              <button key={s.id} type="button" onClick={() => void pickStudent(s)} className="w-full text-start rounded-xl border border-[#E4E8F0] px-3 py-2 text-sm cursor-pointer">
                <b className="text-[#14284B]">{language === 'ur' && s.nameUr ? s.nameUr : s.name}</b> <span dir="ltr" className="text-[11px] text-[#6B7385]">{s.admissionNo}</span>
              </button>
            ))}
          </>
        )}
        {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
        <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onCancel} />
      </SchoolCard>
    </div>
  );
};
