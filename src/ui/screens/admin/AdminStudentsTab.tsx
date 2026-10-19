import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Phone,
  Plus,
  Search,
  Upload,
  UserMinus,
  Users,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  Gender,
  OpeningFees,
  ParentAttendanceSummary,
  ParentSpec,
  Profile,
  ParentRelation,
  Role,
  Student,
  StudentStatus,
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
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  PrintFrame,
  StudentNameBlock,
  studentClassLabel,
} from '../accountant/AccountantShared';
import { StudentFeeAccount } from '../accountant/StudentFeeAccount';
import { ParentAttendanceTab } from '../parent/ParentAttendanceTab';
import { ParentResultsTab } from '../parent/ParentResultsTab';
import { percentColor, selectCls } from '../principal/PrincipalShared';
import { CredentialDialog, CredentialSlip } from './AdminShared';
import { AdminBulkStudents } from './AdminBulkStudents';
import { AccountEditor, SlipSheet } from './AdminUsersTab';

type View =
  | { kind: 'list' }
  | { kind: 'admit' }
  | { kind: 'promote' }
  | { kind: 'bulk' }
  | { kind: 'profile'; studentId: string };

const PAGE = 50;

/** "Class 5 - A (Boys)" style options for every section. */
export function useSectionOptions(lookups: AccountantLookups) {
  const { language } = useStringResource();
  return useMemo(() => {
    const out: { id: string; label: string; classId: string; campusId: string }[] = [];
    lookups.classes.forEach((c) => {
      const campus = lookups.campuses.find((x) => x.id === c.campusId);
      Object.values(lookups.sectionsMap)
        .filter((s) => s.classId === c.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((s) =>
          out.push({
            id: s.id,
            classId: c.id,
            campusId: c.campusId,
            label: `${language === 'ur' ? c.nameUr : c.nameEn} - ${s.name} (${campus?.code ?? ''})`,
          })
        );
    });
    return out;
  }, [lookups, language]);
}

export const AdminStudentsTab: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  onAddSlip: (s: CredentialSlip) => void;
}> = ({ admin, lookups, onAddSlip }) => {
  const { stringResource: t, language } = useStringResource();
  const sectionOptions = useSectionOptions(lookups);
  const [view, setView] = useState<View>({ kind: 'list' });
  const [credential, setCredential] = useState<CredentialSlip | null>(null);
  const [printSlips, setPrintSlips] = useState<CredentialSlip[] | null>(null);

  // list
  const [query, setQuery] = useState('');
  const [campus, setCampus] = useState('ALL');
  const [cls, setCls] = useState('ALL');
  const [sec, setSec] = useState('ALL');
  const [status, setStatus] = useState<'ACTIVE' | 'LEFT' | 'ALL'>('ACTIVE');
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      const r = await AppModule.studentRepository.search({
        query: query.trim(),
        campusId: campus === 'ALL' ? null : campus,
        classId: cls === 'ALL' ? null : cls,
        sectionId: sec === 'ALL' ? null : sec,
        status: status === 'ALL' ? null : (status as StudentStatus),
      });
      if (cancelled) return;
      if (!r.ok) setFailed(true);
      else setResults(r.data);
      setLoading(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, campus, cls, sec, status, tick]);

  const credentialDialog = credential && (
    <CredentialDialog
      credential={credential}
      onPrint={() => setPrintSlips([credential])}
      onDone={() => setCredential(null)}
    />
  );
  const slipPrint = printSlips && (
    <PrintFrame onClose={() => setPrintSlips(null)}>
      <SlipSheet slips={printSlips} lookups={lookups} />
    </PrintFrame>
  );

  if (view.kind === 'admit') {
    return (
      <>
        {credentialDialog}
        {slipPrint}
        <StudentForm
          admin={admin}
          lookups={lookups}
          sectionOptions={sectionOptions}
          onCancel={() => setView({ kind: 'list' })}
          onSaved={(s, cred) => {
            setTick((n) => n + 1);
            if (cred) {
              onAddSlip(cred);
              setCredential(cred);
            }
            setView({ kind: 'profile', studentId: s.id });
          }}
        />
      </>
    );
  }
  if (view.kind === 'bulk') {
    return (
      <>
        {slipPrint}
        <AdminBulkStudents
          admin={admin}
          sectionOptions={sectionOptions}
          onAddSlip={onAddSlip}
          onPrintSlips={setPrintSlips}
          onClose={() => {
            setTick((n) => n + 1);
            setView({ kind: 'list' });
          }}
        />
      </>
    );
  }
  if (view.kind === 'promote') {
    return (
      <PromotionWizard
        admin={admin}
        lookups={lookups}
        sectionOptions={sectionOptions}
        onBack={() => {
          setTick((n) => n + 1);
          setView({ kind: 'list' });
        }}
      />
    );
  }
  if (view.kind === 'profile') {
    return (
      <>
        {credentialDialog}
        {slipPrint}
        <StudentProfile
          admin={admin}
          lookups={lookups}
          sectionOptions={sectionOptions}
          studentId={view.studentId}
          onBack={() => {
            setTick((n) => n + 1);
            setView({ kind: 'list' });
          }}
        />
      </>
    );
  }

  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn })),
  ];
  const classOptions = lookups.classes.filter((c) => campus === 'ALL' || c.campusId === campus);
  const sectionChoices = Object.values(lookups.sectionsMap).filter((s) => cls !== 'ALL' && s.classId === cls);

  return (
    <div className="space-y-3">
      {credentialDialog}
      {slipPrint}
      <div className="grid grid-cols-2 gap-2.5">
        <PrimaryButton text={t('st_new_btn')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setView({ kind: 'admit' })} />
        <PrimaryButton text={t('st_bulk_btn')} variant="outline" icon={<Upload className="w-4 h-4 text-[#F28C28]" />} onClick={() => setView({ kind: 'bulk' })} />
      </div>
      <PrimaryButton text={t('st_promote_btn')} variant="outline" icon={<Users className="w-4 h-4 text-[#F28C28]" />} onClick={() => setView({ kind: 'promote' })} />

      <SchoolCard className="space-y-2.5">
        <SchoolTextField label={t('st_search')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
        <TabRow tabs={campusTabs} selected={campus} onSelect={(v) => { setCampus(v); setCls('ALL'); setSec('ALL'); }} />
        <div className="grid grid-cols-2 gap-2">
          <select className={selectCls} value={cls} onChange={(e) => { setCls(e.target.value); setSec('ALL'); }}>
            <option value="ALL">{t('acc_all_classes')}</option>
            {classOptions.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
          </select>
          <select className={selectCls} value={sec} onChange={(e) => setSec(e.target.value)} disabled={cls === 'ALL'}>
            <option value="ALL">{t('pr_all_sections')}</option>
            {sectionChoices.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>
        <TabRow
          tabs={[
            { id: 'ACTIVE' as const, label: t('st_status_active') },
            { id: 'LEFT' as const, label: t('st_status_left') },
            { id: 'ALL' as const, label: t('st_status_all') },
          ]}
          selected={status}
          onSelect={setStatus}
        />
        <p className="text-[11px] text-[#6B7385]"><span dir="ltr">{results.length}</span></p>
      </SchoolCard>

      {loading || lookups.loading ? (
        <ShimmerPlaceholder lines={4} showHeader />
      ) : failed || lookups.failed ? (
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => { lookups.reload(); setTick((n) => n + 1); }} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      ) : results.length === 0 ? (
        <EmptyState title={t('st_none')} description="" />
      ) : (
        <div className="space-y-2">
          {results.slice(0, PAGE).map((s) => (
            <SchoolCard key={s.id} className="p-3 flex items-center justify-between gap-2" onClick={() => setView({ kind: 'profile', studentId: s.id })}>
              <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
              {s.status === StudentStatus.LEFT && <StatusChip label={t('st_status_left')} tone="error" />}
            </SchoolCard>
          ))}
          {results.length > PAGE && <p className="text-[11px] text-center text-[#6B7385]">{t('acc_showing_first')}</p>}
        </div>
      )}
    </div>
  );
};

/* ----------------------------------------------------------- form (admit/edit) */

const StudentForm: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  sectionOptions: ReturnType<typeof useSectionOptions>;
  existing?: Student;
  onCancel: () => void;
  onSaved: (s: Student, cred?: CredentialSlip) => void;
}> = ({ admin, lookups, sectionOptions, existing, onCancel, onSaved }) => {
  const { stringResource: t } = useStringResource();
  const [name, setName] = useState(existing?.name ?? '');
  const [nameUr, setNameUr] = useState(existing?.nameUr ?? '');
  const [father, setFather] = useState(existing?.fatherName ?? '');
  const [fatherUr, setFatherUr] = useState('');
  const [gender, setGender] = useState<Gender>(existing?.gender ?? Gender.MALE);
  const [dob, setDob] = useState(existing?.dateOfBirth ?? '');
  const [admDate, setAdmDate] = useState(existing?.admissionDate ?? today());
  const [phone, setPhone] = useState(existing?.guardianPhone ?? '');
  const [phone2, setPhone2] = useState(existing?.guardianPhone2 ?? '');
  const [parentUser, setParentUser] = useState('');
  const [parentPw, setParentPw] = useState('');
  const [actualFee, setActualFee] = useState('');
  const [netFee, setNetFee] = useState('');
  const [annual, setAnnual] = useState('');
  const [annualPaid, setAnnualPaid] = useState(false);
  const [admFee, setAdmFee] = useState('');
  const [admPaid, setAdmPaid] = useState(false);
  const [netTouched, setNetTouched] = useState(false);
  const [sectionId, setSectionId] = useState(existing?.sectionId ?? '');
  const [parentMode, setParentMode] = useState<'none' | 'create' | 'link'>('none');
  const [parentQuery, setParentQuery] = useState('');
  const [parents, setParents] = useState<Profile[]>([]);
  const [parentId, setParentId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [linked, setLinked] = useState<Profile[]>([]);
  const [editParent, setEditParent] = useState<Profile | null>(null);
  const reloadLinked = useCallback(async () => {
    if (!existing) return;
    const r = await AppModule.studentRepository.parentsOfStudent(existing.id);
    setLinked(r.ok ? r.data : []);
  }, [existing]);
  useEffect(() => {
    void reloadLinked();
  }, [reloadLinked]);
  useEffect(() => {
    if (!existing) return;
    void (async () => {
      const r = await AppModule.settingsRepository.getProfiles(Role.PARENT, null);
      setParents(r.ok ? r.data : []);
    })();
  }, [existing]);

  useEffect(() => {
    if (parentMode !== 'link') return;
    void (async () => {
      const r = await AppModule.settingsRepository.getProfiles(Role.PARENT, null);
      setParents(r.ok ? r.data : []);
    })();
  }, [parentMode]);

  // Prefill the fee boxes from the class fee structure whenever the section changes.
  useEffect(() => {
    if (existing || !sectionId) return;
    const sec = lookups.sectionsMap[sectionId];
    if (!sec) return;
    let cancelled = false;
    void (async () => {
      const r = await AppModule.feeRepository.getClassFeeStructures(sec.classId);
      if (cancelled || !r.ok) return;
      const amt = (head: string) => r.data.find((x) => x.feeHeadId === head)?.amount ?? 0;
      setActualFee(String(amt('fh_tuition')));
      if (!netTouched) setNetFee(String(amt('fh_tuition')));
      setAnnual(String(amt('fh_annual')));
      setAdmFee(String(amt('fh_admission')));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, existing, lookups.sectionsMap]);

  const parentMatches = parents
    .filter((p) => {
      const q = parentQuery.trim().toLowerCase();
      return q.length >= 2 && `${p.fullName} ${p.fullNameUr} ${p.loginId} ${p.phone}`.toLowerCase().includes(q);
    })
    .slice(0, 6);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = t('st_err_name_en');
    if (nameUr.trim().length < 2) e.nameUr = t('st_err_name_ur');
    if (father.trim().length < 3) e.father = t('st_err_father');
    if (!/^\+?\d{10,13}$/.test(phone.replace(/[\s-]/g, ''))) e.phone = t('st_err_phone');
    if (dob && dob >= today()) e.dob = t('st_err_dob');
    if (phone2.trim() && !/^\+?\d{10,13}$/.test(phone2.replace(/[\s-]/g, ''))) e.phone2 = t('st_err_phone');
    if (!sectionId) e.section = t('st_err_section');
    if (!admDate || admDate > today()) e.adm = t('st_err_admission_date');
    if (!existing && parentMode === 'create' && fatherUr.trim().length < 2) e.fatherUr = t('st_err_father_ur');
    if (!existing && parentMode === 'link' && !parentId) e.parent = t('st_parent_pick');
    const money = (v: string) => (v.trim() === '' ? 0 : Number(v));
    const amounts = [actualFee, netFee, annual, admFee].map(money);
    if (!existing) {
      if (amounts.some((n) => !Number.isInteger(n) || n < 0)) e.fees = t('st_err_fee');
      else if (amounts[1] > amounts[0]) e.fees = t('st_err_net_gt');
      if (parentMode === 'create' && parentPw.trim() && parentPw.trim().length < 6) e.parentPw = t('st_err_pw');
    }
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length) return;

    setSaving(true);
    if (existing) {
      const sec = lookups.sectionsMap[sectionId];
      const cl = sec ? lookups.classesMap[sec.classId] : undefined;
      const r = await AppModule.studentRepository.update(
        {
          ...existing,
          name: name.trim(),
          nameUr: nameUr.trim(),
          fatherName: father.trim(),
          gender,
          dateOfBirth: dob,
          admissionDate: admDate,
          guardianPhone: phone.replace(/[\s-]/g, ''),
          guardianPhone2: phone2.replace(/[\s-]/g, '') || undefined,
          sectionId,
          campusId: cl?.campusId ?? existing.campusId,
        },
        admin.id
      );
      setSaving(false);
      if (!r.ok) return setFormError(r.error.message);
      return onSaved(r.data);
    }

    const parent: ParentSpec | undefined =
      parentMode === 'create'
        ? { mode: 'create', fatherNameUr: fatherUr, loginId: parentUser.trim() || undefined, password: parentPw.trim() || undefined }
        : parentMode === 'link'
          ? { mode: 'link', parentId }
          : undefined;
    const opening: OpeningFees = {
      actualFee: amounts[0],
      netFee: amounts[1],
      annualCharges: amounts[2],
      annualPaid,
      admissionFee: amounts[3],
      admissionPaid: admPaid,
    };
    const r = await AppModule.studentRepository.admitStudent(
      { name, nameUr, fatherName: father, gender, dateOfBirth: dob, sectionId, admissionDate: admDate, guardianPhone: phone, guardianPhone2: phone2, parent, opening },
      admin
    );
    setSaving(false);
    if (!r.ok) return setFormError(r.error.message);
    const cred: CredentialSlip | undefined =
      r.data.parent && r.data.parentPassword
        ? { profile: r.data.parent, password: r.data.parentPassword }
        : undefined;
    onSaved(r.data.student, cred);
  };

  return (
    <SchoolCard className="space-y-3">
      <h3 className="font-heading text-sm font-bold text-[#14284B]">{existing ? t('st_form_edit_title') : t('st_form_admit_title')}</h3>
      <SchoolTextField label={t('st_name_en')} value={name} onValueChange={setName} errorText={errors.name} />
      <div><SchoolTextField urdu label={t('st_name_ur')} value={nameUr} onValueChange={setNameUr} errorText={errors.nameUr} /></div>
      <SchoolTextField label={t('st_father')} value={father} onValueChange={setFather} errorText={errors.father} />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">{t('st_gender')}</label>
        <TabRow
          tabs={[
            { id: Gender.MALE, label: t('st_gender_MALE') },
            { id: Gender.FEMALE, label: t('st_gender_FEMALE') },
          ]}
          selected={gender}
          onSelect={setGender}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('st_dob_opt')}</label>
          <input type="date" dir="ltr" className={selectCls} value={dob} max={today()} onChange={(e) => setDob(e.target.value)} />
          {errors.dob && <p className="text-xs font-medium text-[#D64545]">{errors.dob}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold">{t('st_admission_date')}</label>
          <input type="date" dir="ltr" className={selectCls} value={admDate} max={today()} onChange={(e) => setAdmDate(e.target.value)} />
          {errors.adm && <p className="text-xs font-medium text-[#D64545]">{errors.adm}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">{t('st_section_label')}</label>
        <select className={selectCls} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          <option value="">{t('st_pick_section')}</option>
          {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
        </select>
        {errors.section && <p className="text-xs font-medium text-[#D64545]">{errors.section}</p>}
      </div>
      <SchoolTextField label={t('st_phone')} value={phone} onValueChange={setPhone} errorText={errors.phone} forceLtrValue />
      <SchoolTextField label={t('st_phone2')} value={phone2} onValueChange={setPhone2} errorText={errors.phone2} forceLtrValue />

      {!existing && (
        <div className="space-y-2 border-t border-[#E4E8F0] pt-3">
          <label className="block text-xs font-bold text-[#14284B]">{t('st_fees_heading')}</label>
          <div className="grid grid-cols-2 gap-2.5">
            <SchoolTextField label={t('st_actual_fee')} value={actualFee} onValueChange={(v) => { setActualFee(v); if (!netTouched) setNetFee(v); }} forceLtrValue />
            <SchoolTextField label={t('st_net_fee')} value={netFee} onValueChange={(v) => { setNetFee(v); setNetTouched(true); }} forceLtrValue />
          </div>
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <SchoolTextField label={t('st_annual_charges')} value={annual} onValueChange={setAnnual} forceLtrValue />
            <TabRow tabs={[{ id: 'no' as const, label: t('st_unpaid') }, { id: 'yes' as const, label: t('st_paid') }]} selected={annualPaid ? 'yes' : 'no'} onSelect={(v) => setAnnualPaid(v === 'yes')} />
          </div>
          <div className="grid grid-cols-2 gap-2.5 items-end">
            <SchoolTextField label={t('st_admission_fee')} value={admFee} onValueChange={setAdmFee} forceLtrValue />
            <TabRow tabs={[{ id: 'no' as const, label: t('st_unpaid') }, { id: 'yes' as const, label: t('st_paid') }]} selected={admPaid ? 'yes' : 'no'} onSelect={(v) => setAdmPaid(v === 'yes')} />
          </div>
          {errors.fees && <p className="text-xs font-medium text-[#D64545]">{errors.fees}</p>}
        </div>
      )}

      {!existing && (
        <div className="space-y-2 border-t border-[#E4E8F0] pt-3">
          <label className="block text-xs font-bold text-[#14284B]">{t('st_parent_heading')}</label>
          <TabRow
            tabs={[
              { id: 'none' as const, label: t('st_parent_none') },
              { id: 'create' as const, label: t('st_parent_create') },
              { id: 'link' as const, label: t('st_parent_link') },
            ]}
            selected={parentMode}
            onSelect={(m) => { setParentMode(m); setParentId(''); }}
          />
          {parentMode === 'create' && (
            <div className="space-y-2">
              <div><SchoolTextField urdu label={t('st_father_ur')} value={fatherUr} onValueChange={setFatherUr} errorText={errors.fatherUr} /></div>
              <SchoolTextField label={t('st_parent_username')} value={parentUser} onValueChange={setParentUser} forceLtrValue />
              <SchoolTextField label={t('st_parent_password')} value={parentPw} onValueChange={setParentPw} errorText={errors.parentPw} forceLtrValue />
            </div>
          )}
          {parentMode === 'link' && (
            <div className="space-y-1.5">
              <SchoolTextField label={t('st_parent_search')} value={parentQuery} onValueChange={setParentQuery} leadingIcon={<Search className="w-4 h-4" />} errorText={errors.parent} />
              {parentMatches.map((p) => (
                <button key={p.id} type="button" onClick={() => setParentId(p.id)} className={`w-full text-start rounded-xl border px-3 py-2 text-xs cursor-pointer ${parentId === p.id ? 'border-[#F28C28] bg-[#F28C28]/10' : 'border-[#E4E8F0]'}`}>
                  <b>{p.fullName}</b> <span dir="ltr" className="font-mono text-[#6B7385]">{p.loginId} · {p.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {existing && (
        <div className="space-y-2 border-t border-[#E4E8F0] pt-3">
          <label className="block text-xs font-bold text-[#14284B]">{t('ac_parent_heading')}</label>
          {linked.length === 0 && <p className="text-xs text-[#6B7385]">{t('ac_parent_none')}</p>}
          {linked.map((p) => (
            <div key={p.id} className="rounded-xl border border-[#E4E8F0] px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 text-xs">
                  <b>{p.fullName}</b>
                  <div dir="ltr" className="font-mono text-[#6B7385] text-start">{p.loginId} · {p.phone}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button type="button" className="text-xs font-semibold text-[#F28C28] cursor-pointer min-h-[36px]" onClick={() => setEditParent(editParent?.id === p.id ? null : p)}>{t('ac_edit_btn')}</button>
                  <button type="button" className="text-xs font-semibold text-[#D64545] cursor-pointer min-h-[36px]" onClick={() => void (async () => { await AppModule.studentRepository.unlinkParent(p.id, existing.id); if (editParent?.id === p.id) setEditParent(null); void reloadLinked(); })()}>{t('ac_parent_unlink')}</button>
                </div>
              </div>
              {editParent?.id === p.id && (
                <AccountEditor admin={admin} user={p} onCancel={() => setEditParent(null)} onSaved={(np) => { setLinked(linked.map((x) => (x.id === np.id ? np : x))); setEditParent(np); }} />
              )}
            </div>
          ))}
          <SchoolTextField label={t('ac_parent_link_search')} value={parentQuery} onValueChange={setParentQuery} leadingIcon={<Search className="w-4 h-4" />} />
          {parentMatches.filter((p) => !linked.some((l) => l.id === p.id)).map((p) => (
            <button key={p.id} type="button" onClick={() => void (async () => { await AppModule.studentRepository.linkParent(p.id, existing.id, ParentRelation.FATHER); setParentQuery(''); void reloadLinked(); })()} className="w-full text-start rounded-xl border border-[#E4E8F0] px-3 py-2 text-xs cursor-pointer">
              <b>{p.fullName}</b> <span dir="ltr" className="font-mono text-[#6B7385]">{p.loginId} · {p.phone}</span>
            </button>
          ))}
        </div>
      )}

      {formError && <p className="text-xs font-medium text-[#D64545]">{formError}</p>}
      <div className="grid grid-cols-2 gap-2">
        <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onCancel} />
        <PrimaryButton text={existing ? t('st_save_edit') : t('st_save_admit')} variant="orange" loading={saving} onClick={() => void submit()} />
      </div>
    </SchoolCard>
  );
};

/* --------------------------------------------------------------------- profile */

type ProfileTab = 'info' | 'attendance' | 'fees' | 'results';

const StudentProfile: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  sectionOptions: ReturnType<typeof useSectionOptions>;
  studentId: string;
  onBack: () => void;
}> = ({ admin, lookups, sectionOptions, studentId, onBack }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [student, setStudent] = useState<Student | null>(null);
  const [parents, setParents] = useState<Profile[]>([]);
  const [tab, setTab] = useState<ProfileTab>('info');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState<'transfer' | 'left' | null>(null);
  const [reason, setReason] = useState('');
  const [newSection, setNewSection] = useState('');
  const [leftDate, setLeftDate] = useState(today());
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [att, setAtt] = useState<ParentAttendanceSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [s, ps] = await Promise.all([
      AppModule.studentRepository.getById(studentId),
      AppModule.studentRepository.parentsOfStudent(studentId),
    ]);
    if (!s.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setStudent(s.data);
    const links: Profile[] = ps.ok ? ps.data : [];
    setParents(links);
    setLoading(false);
  }, [studentId]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab !== 'attendance') return;
    void (async () => {
      const r = await AppModule.attendanceRepository.getParentSummary(studentId, today().slice(0, 7));
      setAtt(r.ok ? r.data : null);
    })();
  }, [tab, studentId]);

  const backBtn = (
    <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
      <BackIcon className="w-4 h-4" />
      <span>{t('back_button_label')}</span>
    </button>
  );

  if (loading) return <div className="space-y-3">{backBtn}<ShimmerPlaceholder lines={4} showHeader /></div>;
  if (failed || !student) {
    return (
      <div className="space-y-3">
        {backBtn}
        <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={() => void load()} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
      </div>
    );
  }

  const confirmDialog = async () => {
    if (!reason.trim()) return setDialogError(t('st_err_reason'));
    setBusy(true);
    setDialogError(null);
    const r =
      dialog === 'transfer'
        ? newSection
          ? await AppModule.studentRepository.transferStudent(student.id, newSection, reason, admin)
          : null
        : await AppModule.studentRepository.markLeft(student.id, leftDate, reason, admin.id);
    setBusy(false);
    if (r === null) return setDialogError(t('st_err_section'));
    if (!r.ok) return setDialogError(r.error.message);
    setDialog(null);
    setReason('');
    setNewSection('');
    await load();
  };

  if (editing) {
    return (
      <div className="space-y-3">
        {backBtn}
        <StudentForm
          admin={admin}
          lookups={lookups}
          sectionOptions={sectionOptions}
          existing={student}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void load();
          }}
        />
      </div>
    );
  }

  if (tab === 'fees') {
    return (
      <div className="space-y-3">
        <TabRow tabs={profileTabs(t)} selected={tab} onSelect={setTab} />
        <StudentFeeAccount studentId={student.id} accountant={admin} lookups={lookups} onBack={() => setTab('info')} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {backBtn}
      <TabRow tabs={profileTabs(t)} selected={tab} onSelect={setTab} />

      {tab === 'info' && (
        <>
          <SchoolCard className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <StudentNameBlock student={student} classLabel={studentClassLabel(student, lookups, language)} />
              <StatusChip label={student.status === StudentStatus.ACTIVE ? t('st_status_active') : t('st_status_left')} tone={student.status === StudentStatus.ACTIVE ? 'success' : 'error'} />
            </div>
            <div className="text-xs space-y-0.5">
              <div className="font-urdu text-sm" dir="rtl">{student.nameUr}</div>
              <div>{t('st_father')}: <b>{student.fatherName}</b></div>
              <div>{t('st_gender')}: <b>{t(`st_gender_${student.gender}` as StringKey)}</b></div>
              {student.dateOfBirth && <div>{t('st_dob')}: <b dir="ltr">{formatSchoolDate(student.dateOfBirth)}</b></div>}
              <div>{t('st_admission_date')}: <b dir="ltr">{formatSchoolDate(student.admissionDate)}</b></div>
              <div>{t('st_roll')}: <b dir="ltr">{student.rollNo}</b></div>
              <div className="flex items-center gap-2">
                <span>{t('st_phone')}:</span>
                <a href={`tel:${student.guardianPhone}`} dir="ltr" className="font-bold text-[#14284B] inline-flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#F28C28]" />{student.guardianPhone}
                </a>
              </div>
              {student.guardianPhone2 && (
                <div className="flex items-center gap-2">
                  <span>{t('st_phone2')}:</span>
                  <a href={`tel:${student.guardianPhone2}`} dir="ltr" className="font-bold text-[#14284B] inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#F28C28]" />{student.guardianPhone2}
                  </a>
                </div>
              )}
            </div>
          </SchoolCard>

          <SchoolCard className="space-y-1.5">
            <h3 className="text-xs font-bold text-[#14284B]">{t('st_linked_parents')}</h3>
            {parents.length === 0 ? (
              <p className="text-xs text-[#6B7385]">{t('st_no_parents')}</p>
            ) : (
              parents.map((p) => (
                <div key={p.id} className="flex justify-between text-xs">
                  <span>{language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName}</span>
                  <b dir="ltr" className="font-mono">{p.loginId}</b>
                </div>
              ))
            )}
          </SchoolCard>

          <div className="grid grid-cols-3 gap-2">
            <PrimaryButton text={t('st_edit_btn')} variant="navy" onClick={() => setEditing(true)} />
            <PrimaryButton text={t('st_transfer_btn')} variant="outline" disabled={student.status !== StudentStatus.ACTIVE} onClick={() => { setDialog('transfer'); setDialogError(null); }} />
            <PrimaryButton text={t('st_left_btn')} variant="outline" icon={<UserMinus className="w-4 h-4" />} disabled={student.status !== StudentStatus.ACTIVE} onClick={() => { setDialog('left'); setDialogError(null); }} />
          </div>
        </>
      )}

      {tab === 'attendance' && <ParentAttendanceTab selectedChild={student} />}

      {tab === 'results' && (
        <ParentResultsTab parent={admin} child={student} allowPrint />
      )}

      <SchoolDialog
        open={dialog !== null}
        title={dialog === 'transfer' ? t('st_transfer_title') : t('st_left_title')}
        message={dialog === 'left' ? t('st_left_note') : ''}
        confirmText={busy ? '…' : dialog === 'transfer' ? t('st_transfer_confirm') : t('st_left_confirm')}
        cancelText={t('acc_cancel_btn')}
        onConfirm={() => void confirmDialog()}
        onDismiss={() => setDialog(null)}
      />
      {dialog && (
        <div className="fixed inset-x-0 bottom-0 z-[60] p-3 bg-white border-t border-[#E4E8F0] space-y-2 shadow-2xl">
          {dialog === 'transfer' && (
            <select className={selectCls} value={newSection} onChange={(e) => setNewSection(e.target.value)}>
              <option value="">{t('st_pick_section')}</option>
              {sectionOptions.filter((o) => o.id !== student.sectionId).map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
            </select>
          )}
          {dialog === 'left' && (
            <input type="date" dir="ltr" className={selectCls} value={leftDate} max={today()} onChange={(e) => setLeftDate(e.target.value)} aria-label={t('st_left_date')} />
          )}
          <SchoolTextField label={dialog === 'transfer' ? t('st_transfer_reason') : t('st_left_reason')} value={reason} onValueChange={setReason} errorText={dialogError} />
        </div>
      )}
    </div>
  );
};

function profileTabs(t: (k: StringKey) => string) {
  return [
    { id: 'info' as ProfileTab, label: t('st_tab_info') },
    { id: 'attendance' as ProfileTab, label: t('st_tab_attendance') },
    { id: 'fees' as ProfileTab, label: t('st_tab_fees') },
    { id: 'results' as ProfileTab, label: t('st_tab_results') },
  ];
}

/* ------------------------------------------------------------------ promotion */

const PromotionWizard: React.FC<{
  admin: Profile;
  lookups: AccountantLookups;
  sectionOptions: ReturnType<typeof useSectionOptions>;
  onBack: () => void;
}> = ({ admin, sectionOptions, onBack, lookups }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'pick' | 'preview' | 'done'>('pick');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [movedCount, setMovedCount] = useState(0);

  useEffect(() => {
    if (!from) {
      setStudents([]);
      return;
    }
    void (async () => {
      const r = await AppModule.studentRepository.search({ sectionId: from, status: StudentStatus.ACTIVE });
      const list = r.ok ? [...r.data].sort((a, b) => a.rollNo - b.rollNo) : [];
      setStudents(list);
      setSelected(new Set(list.map((s) => s.id)));
    })();
  }, [from]);

  const fromOpt = sectionOptions.find((o) => o.id === from);
  const toOpt = sectionOptions.find((o) => o.id === to);

  const preview = () => {
    if (!from || !to || from === to) return setError(t('st_promo_same'));
    if (fromOpt && toOpt && fromOpt.campusId !== toOpt.campusId) return setError(t('st_promo_campus'));
    if (selected.size === 0) return setError(t('st_promo_none'));
    setError(null);
    setStep('preview');
  };

  const confirm = async () => {
    setBusy(true);
    const r = await AppModule.studentRepository.promoteClass(from, to, Array.from(selected), admin.id);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setMovedCount(r.data);
    setStep('done');
  };

  return (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <BackIcon className="w-4 h-4" /><span>{t('back_button_label')}</span>
      </button>
      <SchoolCard className="space-y-3">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('st_promo_title')}</h3>
        {step === 'done' ? (
          <p className="text-sm font-semibold text-[#2E9E5B]">{t('st_promo_done')}: <span dir="ltr">{movedCount}</span></p>
        ) : (
          <>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('st_promo_from')}</label>
              <select className={selectCls} value={from} disabled={step === 'preview'} onChange={(e) => setFrom(e.target.value)}>
                <option value="">{t('st_pick_section')}</option>
                {sectionOptions.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('st_promo_to')}</label>
              <select className={selectCls} value={to} disabled={step === 'preview'} onChange={(e) => setTo(e.target.value)}>
                <option value="">{t('st_pick_section')}</option>
                {sectionOptions.filter((o) => !fromOpt || o.campusId === fromOpt.campusId).map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
              </select>
            </div>
            {students.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold">{t('st_promo_students')}</div>
                {students.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 min-h-[40px] border-t border-[#E4E8F0] text-xs">
                    <input
                      type="checkbox"
                      disabled={step === 'preview'}
                      checked={selected.has(s.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setSelected(next);
                      }}
                    />
                    <span className="min-w-0 line-clamp-2">{language === 'ur' && s.nameUr ? s.nameUr : s.name}</span>
                    <span dir="ltr" className="ms-auto text-[10px] text-[#6B7385]">{s.rollNo}</span>
                  </label>
                ))}
              </div>
            )}
            {step === 'preview' && (
              <div className="rounded-xl bg-[#F6F8FC] p-3 text-xs space-y-1">
                <div><b dir="ltr">{selected.size}</b> {t('st_promo_summary')}</div>
                <div dir="ltr" className="text-[#6B7385]">{fromOpt?.label} → {toOpt?.label}</div>
                <div dir="ltr" className="text-[#6B7385]">{students.length - selected.size} stay</div>
              </div>
            )}
            {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
            {step === 'pick' ? (
              <PrimaryButton text={t('st_promo_preview')} variant="navy" onClick={preview} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={() => setStep('pick')} />
                <PrimaryButton text={t('st_promo_confirm')} variant="orange" loading={busy} onClick={() => void confirm()} />
              </div>
            )}
          </>
        )}
      </SchoolCard>
      <span className="hidden">{lookups.campuses.length}</span>
    </div>
  );
};
