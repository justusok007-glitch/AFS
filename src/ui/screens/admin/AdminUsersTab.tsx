import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Plus,
  Printer,
  Search,
  UserX,
  UserCheck,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  ParentRelation,
  Profile,
  Role,
  Student,
  Subject,
  TeacherAssignment,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolDialog,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
  TabRow,
} from '../../components/SchoolComposables';
import { SchoolLogo } from '../../components/SchoolLogo';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  PrintFrame,
  StudentNameBlock,
  studentClassLabel,
} from '../accountant/AccountantShared';
import { selectCls } from '../principal/PrincipalShared';
import { CredentialDialog, CredentialSlip } from './AdminShared';

const ROLES: Role[] = [Role.PARENT, Role.TEACHER, Role.PRINCIPAL, Role.VICE_PRINCIPAL, Role.ACCOUNTANT, Role.ATTENDANCE_COORDINATOR, Role.ADMIN];
const roleKey = (r: Role) => `role_${r.toLowerCase()}` as StringKey;

export const AdminUsersTab: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  slips: CredentialSlip[];
  onAddSlip: (s: CredentialSlip) => void;
  onClearSlips: () => void;
}> = ({ admin, lookups, slips, onAddSlip, onClearSlips }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [credential, setCredential] = useState<CredentialSlip | null>(null);
  const [printSlips, setPrintSlips] = useState<CredentialSlip[] | null>(null);
  const [showSlips, setShowSlips] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const r = await AppModule.settingsRepository.getProfiles(null, null);
    if (!r.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setUsers(r.data);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => {
        if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
        if (statusFilter === 'active' && !u.isActive) return false;
        if (statusFilter === 'inactive' && u.isActive) return false;
        if (q && !`${u.fullName} ${u.fullNameUr} ${u.loginId} ${u.phone}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => a.loginId.localeCompare(b.loginId));
  }, [users, query, roleFilter, statusFilter]);

  const userName = (u: Profile) => (language === 'ur' && u.fullNameUr ? u.fullNameUr : u.fullName);

  const credentialOverlay = credential && (
    <CredentialDialog credential={credential} onPrint={() => setPrintSlips([credential])} onDone={() => setCredential(null)} />
  );

  const slipsPrint = printSlips && (
    <PrintFrame onClose={() => setPrintSlips(null)}>
      <SlipSheet slips={printSlips} lookups={lookups} />
    </PrintFrame>
  );

  if (selectedId) {
    const u = users.find((x) => x.id === selectedId);
    if (u) {
      return (
        <>
          {credentialOverlay}
          {slipsPrint}
          <UserDetail
            admin={admin}
            user={u}
            lookups={lookups}
            onBack={() => {
              setSelectedId(null);
              void load();
            }}
            onCredential={(c) => {
              onAddSlip(c);
              setCredential(c);
            }}
            BackIcon={BackIcon}
          />
        </>
      );
    }
  }

  return (
    <div className="space-y-3">
      {credentialOverlay}
      {slipsPrint}
      <div className="grid grid-cols-2 gap-2.5">
        <PrimaryButton text={t('ad_users_new_btn')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setCreating((v) => !v)} />
        <PrimaryButton text={`${t('ad_slips_btn')} (${slips.length})`} variant="outline" icon={<Printer className="w-4 h-4 text-[#F28C28]" />} onClick={() => setShowSlips((v) => !v)} />
      </div>

      {showSlips && (
        <SchoolCard className="space-y-2">
          {slips.length === 0 ? (
            <p className="text-xs text-[#6B7385]">{t('ad_slips_empty')}</p>
          ) : (
            <>
              {slips.map((s) => (
                <div key={s.profile.id} className="flex justify-between text-xs">
                  <span>{userName(s.profile)}</span>
                  <b dir="ltr" className="font-mono">{s.profile.loginId}</b>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton text={t('ad_cred_print')} variant="navy" onClick={() => setPrintSlips(slips)} />
                <PrimaryButton text={t('ad_slips_clear')} variant="outline" onClick={onClearSlips} />
              </div>
            </>
          )}
        </SchoolCard>
      )}

      {creating && (
        <CreateUserForm
          admin={admin}
          lookups={lookups}
          onCancel={() => setCreating(false)}
          onCreated={(c) => {
            setCreating(false);
            onAddSlip(c);
            setCredential(c);
            void load();
          }}
        />
      )}

      <SchoolCard className="space-y-2.5">
        <SchoolTextField label={t('ad_users_search')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
        <select className={selectCls} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="ALL">{t('ad_users_all_roles')}</option>
          {ROLES.map((r) => (<option key={r} value={r}>{t(roleKey(r))}</option>))}
        </select>
        <TabRow
          tabs={[
            { id: 'all' as const, label: t('ad_users_all_status') },
            { id: 'active' as const, label: t('ad_users_active') },
            { id: 'inactive' as const, label: t('ad_users_inactive') },
          ]}
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      </SchoolCard>

      {loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('ad_users_none')} description="" />
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <SchoolCard key={u.id} className="p-3 flex items-center justify-between gap-2" onClick={() => setSelectedId(u.id)}>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#14284B] leading-snug line-clamp-2">{userName(u)}</div>
                <div dir="ltr" className="text-[11px] text-[#6B7385] text-start">{u.loginId} · {t(roleKey(u.role))}</div>
              </div>
              <StatusChip label={u.isActive ? t('ad_users_active') : t('ad_users_inactive')} tone={u.isActive ? 'success' : 'error'} />
            </SchoolCard>
          ))}
        </div>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- create */

const CreateUserForm: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onCancel: () => void;
  onCreated: (c: CredentialSlip) => void;
}> = ({ admin, lookups, onCancel, onCreated }) => {
  const { stringResource: t, language } = useStringResource();
  const [role, setRole] = useState<Role>(Role.PARENT);
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState('');
  const [coordClasses, setCoordClasses] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const needsCampus = role === Role.PARENT || role === Role.TEACHER || role === Role.ACCOUNTANT;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (nameEn.trim().length < 3) e.nameEn = t('ad_err_name_en');
    if (nameUr.trim().length < 2) e.nameUr = t('ad_err_name_ur');
    if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s-]/g, ''))) e.phone = t('ad_err_phone');
    if (needsCampus && !campus) e.campus = t('ad_err_campus');
    if (role === Role.ATTENDANCE_COORDINATOR && coordClasses.length === 0) e.coord = t('ad_coord_pick_class');
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;
    setSaving(true);
    const r = await AppModule.settingsRepository.createProfile(
      { role, fullName: nameEn, fullNameUr: nameUr, phone, campusId: campus || null },
      admin
    );
    if (r.ok && role === Role.ATTENDANCE_COORDINATOR) {
      await saveCoordinatorClasses(admin, r.data.profile.id, coordClasses, [], lookups);
    }
    setSaving(false);
    if (!r.ok) {
      setFormError(r.error.message || t('ad_err_generic'));
      return;
    }
    onCreated({ profile: r.data.profile, password: r.data.password });
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ad_form_title')}</h3>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">{t('ad_form_role')}</label>
        <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ROLES.map((r) => (<option key={r} value={r}>{t(roleKey(r))}</option>))}
        </select>
      </div>
      <SchoolTextField label={t('ad_form_name_en')} value={nameEn} onValueChange={setNameEn} errorText={errors.nameEn} />
      <div>
        <SchoolTextField urdu label={t('ad_form_name_ur')} value={nameUr} onValueChange={setNameUr} errorText={errors.nameUr} />
      </div>
      <SchoolTextField label={t('ad_form_phone')} value={phone} onValueChange={setPhone} errorText={errors.phone} forceLtrValue />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">{t('ad_form_campus')}</label>
        <select className={selectCls} value={campus} onChange={(e) => setCampus(e.target.value)}>
          <option value="">{needsCampus ? '—' : t('ad_form_campus_all')}</option>
          {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
        </select>
        {errors.campus && <p className="text-xs font-medium text-[#D64545]">{errors.campus}</p>}
      </div>
      {role === Role.ATTENDANCE_COORDINATOR && (
        <ClassPicker lookups={lookups} value={coordClasses} onChange={setCoordClasses} error={errors.coord} />
      )}
      {formError && <p className="text-xs font-medium text-[#D64545]">{formError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onCancel} />
        <PrimaryButton text={t('ad_form_create_btn')} variant="orange" loading={saving} onClick={() => void submit()} />
      </div>
    </SchoolCard>
  );
};

/* ---------------------------------------------------------------- detail */

const UserDetail: React.FC<{
  admin: Profile;
  user: Profile;
  lookups: AccountantLookups;
  onBack: () => void;
  onCredential: (c: CredentialSlip) => void;
  BackIcon: React.ComponentType<{ className?: string }>;
}> = ({ admin, user, lookups, onBack, onCredential, BackIcon }) => {
  const { stringResource: t, language } = useStringResource();
  const [current, setCurrent] = useState<Profile>(user);
  const [confirm, setConfirm] = useState<'reset' | 'active' | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = current.id === admin.id;

  const doConfirm = async () => {
    setBusy(true);
    setError(null);
    if (confirm === 'reset') {
      const r = await AppModule.settingsRepository.resetPassword(current.id, admin);
      if (r.ok) onCredential({ profile: r.data.profile, password: r.data.password });
      else setError(r.error.message || t('ad_err_generic'));
    } else if (confirm === 'active') {
      const r = await AppModule.settingsRepository.setProfileActive(current.id, !current.isActive, admin);
      if (r.ok) setCurrent(r.data);
      else setError(r.error.message || t('ad_err_generic'));
    }
    setBusy(false);
    setConfirm(null);
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" />
        <span>{t('back_button_label')}</span>
      </button>
      <SchoolCard className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-bold text-[#14284B]">{current.fullName}</div>
            <div className="font-urdu text-sm text-[#14284B]" dir="rtl">{current.fullNameUr}</div>
          </div>
          <StatusChip label={current.isActive ? t('ad_users_active') : t('ad_users_inactive')} tone={current.isActive ? 'success' : 'error'} />
        </div>
        <div dir="ltr" className="text-xs text-[#6B7385] text-start font-mono">{current.loginId} · {current.phone}</div>
        <div className="text-xs text-[#6B7385]">
          {t(roleKey(current.role))} · {current.campusId ? (() => { const c = lookups.campuses.find((x) => x.id === current.campusId); return c ? (language === 'ur' ? c.nameUr : c.nameEn) : ''; })() : t('ad_form_campus_all')}
        </div>
      </SchoolCard>

      {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      {editing ? (
        <AccountEditor admin={admin} user={current} onCancel={() => setEditing(false)} onSaved={(p) => { setCurrent(p); setEditing(false); }} />
      ) : (
        <PrimaryButton text={t('ac_edit_btn')} variant="orange" onClick={() => setEditing(true)} />
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <PrimaryButton text={t('ad_detail_reset')} variant="navy" icon={<KeyRound className="w-4 h-4 text-[#F28C28]" />} onClick={() => setConfirm('reset')} />
        <PrimaryButton
          text={current.isActive ? t('ad_detail_deactivate') : t('ad_detail_reactivate')}
          variant="outline"
          icon={current.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          disabled={isSelf && current.isActive}
          onClick={() => setConfirm('active')}
        />
      </div>
      {isSelf && <p className="text-[11px] text-[#6B7385]">{t('ad_detail_self_warning')}</p>}

      <SchoolDialog
        open={confirm !== null}
        title={confirm === 'reset' ? t('ad_detail_reset') : current.isActive ? t('ad_detail_deactivate') : t('ad_detail_reactivate')}
        message={confirm === 'reset' ? t('ad_detail_reset_confirm') : current.isActive ? t('ad_detail_deactivate_confirm') : ''}
        confirmText={busy ? '…' : t('ad_detail_confirm')}
        cancelText={t('acc_cancel_btn')}
        onConfirm={() => void doConfirm()}
        onDismiss={() => setConfirm(null)}
      />

      {current.role === Role.PARENT && <ParentChildren parent={current} lookups={lookups} />}
      {current.role === Role.TEACHER && <TeacherAssignments admin={admin} teacher={current} lookups={lookups} />}
      {current.role === Role.ATTENDANCE_COORDINATOR && <CoordinatorClasses admin={admin} coordinator={current} lookups={lookups} />}
    </div>
  );
};

/** Admin edits an account directly: name, phone, user name and password. Shared by every role. */
export const AccountEditor: React.FC<{
  admin: Profile;
  user: Profile;
  onCancel: () => void;
  onSaved: (p: Profile) => void;
}> = ({ admin, user, onCancel, onSaved }) => {
  const { stringResource: t } = useStringResource();
  const [nameEn, setNameEn] = useState(user.fullName);
  const [nameUr, setNameUr] = useState(user.fullNameUr);
  const [phone, setPhone] = useState(user.phone);
  const [loginId, setLoginId] = useState(user.loginId);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = async () => {
    setSaving(true);
    setErr(null);
    const r = await AppModule.settingsRepository.updateAccount(
      user.id,
      { fullName: nameEn, fullNameUr: nameUr, phone, loginId, password: password || undefined },
      admin
    );
    setSaving(false);
    if (!r.ok) return setErr(r.error.message);
    setDone(true);
    onSaved(r.data);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('ac_edit_title')}</h3>
      <SchoolTextField label={t('ad_form_name_en')} value={nameEn} onValueChange={setNameEn} />
      <div><SchoolTextField urdu label={t('ad_form_name_ur')} value={nameUr} onValueChange={setNameUr} /></div>
      <SchoolTextField label={t('ad_form_phone')} value={phone} onValueChange={setPhone} forceLtrValue />
      <SchoolTextField label={t('ac_username')} value={loginId} onValueChange={setLoginId} forceLtrValue />
      <SchoolTextField label={t('ac_new_password')} value={password} onValueChange={setPassword} placeholder={t('ac_password_hint')} forceLtrValue />
      {err && <p className="text-xs font-medium text-[#D64545]">{err}</p>}
      {done && <p className="text-xs font-semibold text-[#2E9E5B]">{t('ex_saved')}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onCancel} />
        <PrimaryButton text={t('su_save')} variant="orange" loading={saving} onClick={() => void save()} />
      </div>
    </SchoolCard>
  );
};

const ParentChildren: React.FC<{ parent: Profile; lookups: AccountantLookups }> = ({ parent, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [children, setChildren] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [relation, setRelation] = useState<ParentRelation>(ParentRelation.FATHER);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await AppModule.studentRepository.childrenOfParent(parent.id);
    setChildren(r.ok ? r.data : []);
    setLoading(false);
  }, [parent.id]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await AppModule.studentRepository.search({ query: q, status: null });
      if (!cancelled) setResults(r.ok ? r.data.slice(0, 8) : []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <SchoolCard className="space-y-2.5">
      <h3 className="text-xs font-bold text-[#14284B]">{t('ad_children_title')}</h3>
      {loading ? (
        <ShimmerPlaceholder lines={2} />
      ) : children.length === 0 ? (
        <p className="text-xs text-[#6B7385]">{t('ad_children_none')}</p>
      ) : (
        children.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5">
            <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
            <button type="button" className="text-xs font-semibold text-[#D64545] cursor-pointer shrink-0" onClick={async () => { await AppModule.studentRepository.unlinkParent(parent.id, s.id); void load(); }}>
              {t('ad_children_unlink')}
            </button>
          </div>
        ))
      )}
      <SchoolTextField label={t('ad_children_link_search')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
      <select className={selectCls} value={relation} onChange={(e) => setRelation(e.target.value as ParentRelation)}>
        {[ParentRelation.FATHER, ParentRelation.MOTHER, ParentRelation.GUARDIAN].map((r) => (
          <option key={r} value={r}>{t(`ad_rel_${r}` as StringKey)}</option>
        ))}
      </select>
      {results.filter((s) => !children.some((c) => c.id === s.id)).map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5">
          <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
          <button type="button" className="text-xs font-semibold text-[#F28C28] cursor-pointer shrink-0" onClick={async () => { await AppModule.studentRepository.linkParent(parent.id, s.id, relation); setQuery(''); void load(); }}>
            {t('ad_children_link')}
          </button>
        </div>
      ))}
    </SchoolCard>
  );
};

/** Tick the classes a coordinator can see and mark (every section of a ticked class). */
const ClassPicker: React.FC<{
  lookups: AccountantLookups;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}> = ({ lookups, value, onChange, error }) => {
  const { stringResource: t, language } = useStringResource();
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold">{t('ad_coord_classes')}</label>
      <p className="text-[11px] text-[#6B7385]">{t('ad_coord_classes_hint')}</p>
      <div className="grid grid-cols-2 gap-x-2">
        {lookups.classes.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-xs min-h-[36px]">
            <input
              type="checkbox"
              checked={value.includes(c.id)}
              onChange={(e) => onChange(e.target.checked ? [...value, c.id] : value.filter((x) => x !== c.id))}
            />
            {language === 'ur' ? c.nameUr : c.nameEn}
          </label>
        ))}
      </div>
      {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
    </div>
  );
};

/** Makes the coordinator's assignments match the ticked classes. */
async function saveCoordinatorClasses(
  admin: Profile,
  coordinatorId: string,
  wanted: string[],
  existing: TeacherAssignment[],
  lookups: AccountantLookups
): Promise<string | null> {
  const sectionsOf = (classId: string) => Object.values(lookups.sectionsMap).filter((s) => s.classId === classId);
  const wantedSections = new Set(wanted.flatMap((c) => sectionsOf(c).map((s) => s.id)));
  for (const a of existing) {
    if (!wantedSections.has(a.sectionId)) {
      const r = await AppModule.settingsRepository.deleteTeacherAssignment(a.id, admin);
      if (!r.ok) return r.error.message;
    }
  }
  const have = new Set(existing.map((a) => a.sectionId));
  let n = 0;
  for (const secId of wantedSections) {
    if (have.has(secId)) continue;
    const r = await AppModule.settingsRepository.saveTeacherAssignment(
      {
        id: `ta_${Date.now()}_${n++}`,
        teacherId: coordinatorId,
        sectionId: secId,
        subjectId: null,
        canMarkAttendance: true,
        canEnterMarks: false,
      },
      admin
    );
    if (!r.ok) return r.error.message;
  }
  return null;
}

const CoordinatorClasses: React.FC<{ admin: Profile; coordinator: Profile; lookups: AccountantLookups }> = ({ admin, coordinator, lookups }) => {
  const { stringResource: t } = useStringResource();
  const [items, setItems] = useState<TeacherAssignment[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const a = await AppModule.settingsRepository.getTeacherAssignments(coordinator.id);
    const list = a.ok ? a.data : [];
    setItems(list);
    const classIds = new Set(list.map((x) => lookups.sectionsMap[x.sectionId]?.classId).filter(Boolean) as string[]);
    setPicked(Array.from(classIds));
    setLoading(false);
  }, [coordinator.id, lookups.sectionsMap]);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    setError(null);
    const err = await saveCoordinatorClasses(admin, coordinator.id, picked, items, lookups);
    setSaving(false);
    if (err) return setError(err);
    setMsg(t('ex_saved'));
    void load();
  };

  return (
    <SchoolCard className="space-y-2.5">
      {loading ? (
        <ShimmerPlaceholder lines={2} />
      ) : (
        <>
          <ClassPicker lookups={lookups} value={picked} onChange={setPicked} />
          {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
          {msg && <p className="text-xs font-semibold text-[#2E9E5B]">{msg}</p>}
          <PrimaryButton text={t('su_save')} variant="orange" loading={saving} onClick={() => void save()} />
        </>
      )}
    </SchoolCard>
  );
};

const TeacherAssignments: React.FC<{ admin: Profile; teacher: Profile; lookups: AccountantLookups }> = ({ admin, teacher, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [items, setItems] = useState<TeacherAssignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [canAtt, setCanAtt] = useState(true);
  const [canMarks, setCanMarks] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [a, s] = await Promise.all([
      AppModule.settingsRepository.getTeacherAssignments(teacher.id),
      AppModule.settingsRepository.getSubjects(),
    ]);
    setItems(a.ok ? a.data : []);
    setSubjects(s.ok ? s.data : []);
    setLoading(false);
  }, [teacher.id]);
  useEffect(() => {
    void load();
  }, [load]);

  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : id;
  };
  const sectionLabel = (id: string) => {
    const s = lookups.sectionsMap[id];
    return s ? `${className(s.classId)} - ${s.name}` : id;
  };
  const subjectLabel = (id: string | null) => {
    if (!id) return t('ad_assign_no_subject');
    const s = subjects.find((x) => x.id === id);
    return s ? (language === 'ur' ? s.nameUr : s.nameEn) : id;
  };

  const add = async () => {
    if (!sectionId) return setError(t('ad_assign_pick_section'));
    setError(null);
    const r = await AppModule.settingsRepository.saveTeacherAssignment(
      {
        id: `ta_${Date.now()}`,
        teacherId: teacher.id,
        sectionId,
        subjectId: subjectId || null,
        canMarkAttendance: canAtt,
        canEnterMarks: canMarks,
      },
      admin
    );
    if (!r.ok) return setError(r.error.message || t('ad_err_generic'));
    setSectionId('');
    setSubjectId('');
    void load();
  };

  return (
    <SchoolCard className="space-y-2.5">
      <h3 className="text-xs font-bold text-[#14284B]">{t('ad_assign_title')}</h3>
      {loading ? (
        <ShimmerPlaceholder lines={2} />
      ) : items.length === 0 ? (
        <p className="text-xs text-[#6B7385]">{t('ad_assign_none')}</p>
      ) : (
        items.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-2 border-t border-[#E4E8F0] pt-1.5 text-xs">
            <div className="min-w-0">
              <div className="font-semibold text-[#14284B]">{sectionLabel(a.sectionId)}</div>
              <div className="text-[11px] text-[#6B7385]">
                {subjectLabel(a.subjectId)}{a.canMarkAttendance ? ` · ${t('ad_assign_attendance')}` : ''}{a.canEnterMarks ? ` · ${t('ad_assign_marks')}` : ''}
              </div>
            </div>
            <button type="button" className="text-xs font-semibold text-[#D64545] cursor-pointer shrink-0" onClick={async () => { await AppModule.settingsRepository.deleteTeacherAssignment(a.id, admin); void load(); }}>
              {t('ad_assign_delete')}
            </button>
          </div>
        ))
      )}
      <div className="border-t border-[#E4E8F0] pt-2.5 space-y-2">
        <h4 className="text-xs font-bold text-[#14284B]">{t('ad_assign_add')}</h4>
        <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)} aria-label={t('ad_assign_section')}>
          <option value="">{t('ad_assign_section')}…</option>
          {lookups.classes.flatMap((c) =>
            Object.values(lookups.sectionsMap).filter((s) => s.classId === c.id).map((s) => (
              <option key={s.id} value={s.id}>{className(c.id)} - {s.name}</option>
            ))
          )}
        </select>
        <select className={selectCls} value={subjectId} onChange={(e) => setSubjectId(e.target.value)} aria-label={t('ad_assign_subject')}>
          <option value="">{t('ad_assign_no_subject')}</option>
          {subjects.map((s) => (<option key={s.id} value={s.id}>{language === 'ur' ? s.nameUr : s.nameEn}</option>))}
        </select>
        <label className="flex items-center gap-2 text-xs min-h-[36px]"><input type="checkbox" checked={canAtt} onChange={(e) => setCanAtt(e.target.checked)} />{t('ad_assign_attendance')}</label>
        <label className="flex items-center gap-2 text-xs min-h-[36px]"><input type="checkbox" checked={canMarks} onChange={(e) => setCanMarks(e.target.checked)} />{t('ad_assign_marks')}</label>
        {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
        <PrimaryButton text={t('ad_assign_add')} variant="orange" onClick={() => void add()} />
      </div>
    </SchoolCard>
  );
};

/* ---------------------------------------------------------------- slips */

export const SlipSheet: React.FC<{ slips: CredentialSlip[]; lookups: AccountantLookups }> = ({ slips, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [childrenByParent, setChildrenByParent] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out: Record<string, string[]> = {};
      for (const s of slips) {
        if (s.profile.role !== Role.PARENT) continue;
        const r = await AppModule.studentRepository.childrenOfParent(s.profile.id);
        out[s.profile.id] = r.ok ? r.data.map((c) => (language === 'ur' && c.nameUr ? c.nameUr : c.name)) : [];
      }
      if (!cancelled) setChildrenByParent(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [slips, language]);

  return (
    <div className="cred-grid">
      {slips.map((s) => (
        <div key={s.profile.id} className="cred-slip">
          <div className="flex items-center gap-2 border-b border-[#14284B] pb-1.5 mb-1.5">
            <SchoolLogo size={34} />
            <div className="min-w-0">
              <div className="font-heading text-[11px] font-bold text-[#14284B] leading-tight">{lookups.schoolNameEn}</div>
              <div className="font-urdu text-[11px] text-[#14284B]" dir="rtl">{lookups.schoolNameUr}</div>
            </div>
          </div>
          <div className="text-xs font-bold">{language === 'ur' && s.profile.fullNameUr ? s.profile.fullNameUr : s.profile.fullName}</div>
          <div className="text-[10px] text-[#6B7385]">{t(roleKey(s.profile.role))}</div>
          {childrenByParent[s.profile.id]?.length ? (
            <div className="text-[10px]">{t('ad_slip_children')}: {childrenByParent[s.profile.id].join('، ')}</div>
          ) : null}
          <div className="mt-1.5 rounded-lg bg-[#F6F8FC] p-2 text-xs space-y-0.5">
            <div className="flex justify-between"><span>{t('ad_cred_login_id')}</span><b dir="ltr" className="font-mono">{s.profile.loginId}</b></div>
            <div className="flex justify-between"><span>{t('ad_cred_password')}</span><b dir="ltr" className="font-mono">{s.password}</b></div>
          </div>
          <p className="text-[9px] text-[#6B7385] mt-1.5 leading-snug">{t('ad_slip_install')}</p>
        </div>
      ))}
    </div>
  );
};
