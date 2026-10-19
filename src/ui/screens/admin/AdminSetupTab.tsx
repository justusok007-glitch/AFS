import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Layers, Medal, Plus, School, Trash2, Wallet } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { addDaysIso, today } from '../../../domain/clock';
import {
  ClassFeeStructure,
  DayOfWeek,
  GradingScaleEntry,
  Profile,
  Role,
  SchoolHoliday,
  SchoolSettings,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolDialog,
  SchoolTextField,
  ShimmerPlaceholder,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups } from '../accountant/AccountantShared';
import { selectCls } from '../principal/PrincipalShared';
import { AdminExamsSection } from './AdminExamsSection';

type SetupTab = 'school' | 'classes' | 'fees' | 'exams' | 'holidays' | 'grading';

export const AdminSetupTab: React.FC<{ admin: Profile; lookups: AccountantLookups }> = ({ admin, lookups }) => {
  const { stringResource: t, isRtl } = useStringResource();
  const [tab, setTab] = useState<SetupTab | null>(null);
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const Back = isRtl ? ArrowRight : ArrowLeft;
  const items: { id: SetupTab; label: string; icon: React.ReactNode }[] = [
    { id: 'school', label: t('su_tab_school'), icon: <School className="w-5 h-5" /> },
    { id: 'classes', label: t('su_tab_classes'), icon: <Layers className="w-5 h-5" /> },
    { id: 'fees', label: t('su_tab_fees'), icon: <Wallet className="w-5 h-5" /> },
    { id: 'exams', label: t('ex_tab'), icon: <ClipboardList className="w-5 h-5" /> },
    { id: 'holidays', label: t('su_tab_holidays'), icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'grading', label: t('su_tab_grading'), icon: <Medal className="w-5 h-5" /> },
  ];

  if (tab === null) {
    return (
      <div className="space-y-2.5">
        {items.map((it) => (
          <SchoolCard key={it.id} className="p-4 flex items-center gap-3" onClick={() => setTab(it.id)}>
            <span className="w-10 h-10 rounded-xl bg-[#F28C28]/12 text-[#F28C28] flex items-center justify-center shrink-0">{it.icon}</span>
            <span className="flex-1 font-heading text-sm font-bold text-[#14284B]">{it.label}</span>
            <Chevron className="w-4 h-4 text-[#6B7385]" />
          </SchoolCard>
        ))}
      </div>
    );
  }

  const current = items.find((i) => i.id === tab);
  return (
    <div className="space-y-3">
      <button type="button" onClick={() => setTab(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
        <Back className="w-4 h-4" />
        <span>{current?.label}</span>
      </button>
      {tab === 'school' && <SchoolSection admin={admin} onSaved={lookups.reload} />}
      {tab === 'classes' && <ClassesSection admin={admin} lookups={lookups} />}
      {tab === 'fees' && <FeesSection admin={admin} lookups={lookups} />}
      {tab === 'exams' && <AdminExamsSection admin={admin} lookups={lookups} />}
      {tab === 'holidays' && <HolidaysSection admin={admin} lookups={lookups} />}
      {tab === 'grading' && <GradingSection admin={admin} />}
    </div>
  );
};

/* ------------------------------------------------------------------ helpers */

function useLoad<T>(fn: () => Promise<{ ok: true; data: T } | { ok: false }>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    void fn().then((r) => {
      if (cancelled) return;
      if (r.ok) setData(r.data);
      else setFailed(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { data, loading, failed, reload: () => setTick((n) => n + 1) };
}

const Status: React.FC<{ error: string | null; ok: boolean }> = ({ error, ok }) => {
  const { stringResource: t } = useStringResource();
  if (error) return <p className="text-xs font-medium text-[#D64545]">{error}</p>;
  if (ok) return <p className="text-xs font-semibold text-[#2E9E5B]">{t('su_saved')}</p>;
  return null;
};

const LoadFail: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { stringResource: t } = useStringResource();
  return (
    <EmptyState title={t('error_loading_title')} description={t('error_loading_subtitle')} actionLabel={t('retry_button')} onAction={onRetry} icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />} />
  );
};

/* ------------------------------------------------------------------- school */

const DAYS: { id: DayOfWeek; key: StringKey }[] = [
  { id: DayOfWeek.SUNDAY, key: 'weekday_sun' },
  { id: DayOfWeek.MONDAY, key: 'weekday_mon' },
  { id: DayOfWeek.TUESDAY, key: 'weekday_tue' },
  { id: DayOfWeek.WEDNESDAY, key: 'weekday_wed' },
  { id: DayOfWeek.THURSDAY, key: 'weekday_thu' },
  { id: DayOfWeek.FRIDAY, key: 'weekday_fri' },
  { id: DayOfWeek.SATURDAY, key: 'weekday_sat' },
];

const SchoolSection: React.FC<{ admin: Profile; onSaved: () => void }> = ({ admin, onSaved }) => {
  const { stringResource: t } = useStringResource();
  const { data, loading, failed, reload } = useLoad(() => AppModule.settingsRepository.getSchoolSettings(), []);
  const [form, setForm] = useState<SchoolSettings | null>(null);
  const [phones, setPhones] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (data) {
      setForm(data);
      setPhones(data.officePhones.join(', '));
    }
  }, [data]);

  if (loading) return <ShimmerPlaceholder lines={5} showHeader />;
  if (failed || !form) return <LoadFail onRetry={reload} />;

  const save = async () => {
    setBusy(true);
    setError(null);
    setOk(false);
    const r = await AppModule.settingsRepository.updateSchoolSettings(
      { ...form, officePhones: phones.split(/[,\n]/).map((x) => x.trim()).filter(Boolean) },
      admin
    );
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setOk(true);
    onSaved();
    reload();
  };

  const toggleDay = (d: DayOfWeek) =>
    setForm({
      ...form,
      weeklyOffDays: form.weeklyOffDays.includes(d) ? form.weeklyOffDays.filter((x) => x !== d) : [...form.weeklyOffDays, d],
    });

  return (
    <SchoolCard className="space-y-3">
      <SchoolTextField label={t('su_name_en')} value={form.nameEn} onValueChange={(v) => setForm({ ...form, nameEn: v })} />
      <div><SchoolTextField urdu label={t('su_name_ur')} value={form.nameUr} onValueChange={(v) => setForm({ ...form, nameUr: v })} /></div>
      <SchoolTextField label={t('su_phones')} value={phones} onValueChange={setPhones} forceLtrValue />
      <SchoolTextField label={t('su_address')} value={form.address} onValueChange={(v) => setForm({ ...form, address: v })} />
      <SchoolTextField label={t('su_lock')} value={form.attendanceLockTime} onValueChange={(v) => setForm({ ...form, attendanceLockTime: v })} forceLtrValue />
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold">{t('su_off_days')}</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const on = form.weeklyOffDays.includes(d.id);
            return (
              <button key={d.id} type="button" onClick={() => toggleDay(d.id)} className={`px-3 min-h-[40px] rounded-xl border text-xs font-semibold cursor-pointer ${on ? 'bg-[#14284B] text-white border-[#14284B]' : 'bg-white text-[#14284B] border-[#E4E8F0]'}`}>
                {t(d.key)}
              </button>
            );
          })}
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
        <input type="checkbox" checked={form.showClassPosition !== false} onChange={(e) => setForm({ ...form, showClassPosition: e.target.checked })} />
        {t('rs_show_position')}
      </label>
      <Status error={error} ok={ok} />
      <PrimaryButton text={t('su_save')} variant="orange" loading={busy} onClick={() => void save()} />
    </SchoolCard>
  );
};

/* ------------------------------------------------------------------ classes */

const ClassesSection: React.FC<{ admin: Profile; lookups: AccountantLookups }> = ({ admin, lookups }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const [campus, setCampus] = useState(lookups.campuses[0]?.id ?? '');
  const [addingClass, setAddingClass] = useState(false);
  const [cEn, setCEn] = useState('');
  const [cUr, setCUr] = useState('');
  const [subRows, setSubRows] = useState<{ en: string; ur: string }[]>([]);
  const [secEdits, setSecEdits] = useState<Record<string, string>>({});
  const [addingSectionFor, setAddingSectionFor] = useState<string | null>(null);
  const [secName, setSecName] = useState('');
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const teachers = Object.values(lookups.staffMap).filter((p) => p.role === Role.TEACHER && p.isActive);

  useEffect(() => {
    void (async () => {
      const r = await AppModule.studentRepository.search({ query: '', campusId: null, classId: null, sectionId: null, status: null });
      if (!r.ok) return;
      const m: Record<string, number> = {};
      r.data.forEach((s) => (m[s.sectionId] = (m[s.sectionId] ?? 0) + 1));
      setCounts(m);
    })();
  }, [lookups.sectionsMap]);

  if (lookups.loading) return <ShimmerPlaceholder lines={5} showHeader />;
  if (lookups.failed) return <LoadFail onRetry={lookups.reload} />;

  const classes = lookups.classes.filter((c) => c.campusId === (campus || lookups.campuses[0]?.id));
  const activeCampus = campus || lookups.campuses[0]?.id || '';

  const openEditClass = async (c: { id: string; nameEn: string; nameUr: string }) => {
    setEditClassId(c.id);
    setCEn(c.nameEn);
    setCUr(c.nameUr);
    const edits: Record<string, string> = {};
    Object.values(lookups.sectionsMap).filter((x) => x.classId === c.id).forEach((x) => (edits[x.id] = x.name));
    setSecEdits(edits);
    const r = await AppModule.settingsRepository.getClassSubjects(c.id);
    setSubRows(r.ok ? r.data.map((x) => ({ en: x.nameEn, ur: x.nameUr })) : []);
    setAddingClass(true);
  };
  const saveClass = async () => {
    setError(null);
    const subjects = subRows.map((x) => ({ nameEn: x.en, nameUr: x.ur }));
    const r = await AppModule.settingsRepository.saveClass({ id: editClassId ?? undefined, campusId: activeCampus, nameEn: cEn, nameUr: cUr, subjects }, admin);
    if (!r.ok) return setError(r.error.message);
    for (const [secId, name] of Object.entries(secEdits)) {
      const sec = lookups.sectionsMap[secId];
      if (!sec || sec.name === name) continue;
      const sr = await AppModule.settingsRepository.saveSection({ id: secId, classId: sec.classId, name, classTeacherId: sec.classTeacherId }, admin);
      if (!sr.ok) {
        lookups.reload();
        return setError(sr.error.message);
      }
    }
    setSecEdits({});
    setAddingClass(false);
    setEditClassId(null);
    setCEn('');
    setCUr('');
    setSubRows([]);
    lookups.reload();
  };
  const addSection = async (classId: string) => {
    setError(null);
    const r = await AppModule.settingsRepository.saveSection({ classId, name: secName, classTeacherId: null }, admin);
    if (!r.ok) return setError(r.error.message);
    setAddingSectionFor(null);
    setSecName('');
    lookups.reload();
  };
  const setTeacher = async (secId: string, teacherId: string) => {
    setError(null);
    const sec = lookups.sectionsMap[secId];
    const r = await AppModule.settingsRepository.saveSection({ id: secId, classId: sec.classId, name: sec.name, classTeacherId: teacherId || null }, admin);
    if (!r.ok) return setError(r.error.message);
    lookups.reload();
  };
  const removeSection = async () => {
    if (!deleteId) return;
    const r = await AppModule.settingsRepository.deleteSection(deleteId, admin);
    setDeleteId(null);
    if (!r.ok) return setError(r.error.message);
    lookups.reload();
  };

  if (addingClass) {
    const closeForm = () => { setAddingClass(false); setEditClassId(null); setSubRows([]); setSecEdits({}); setError(null); };
    return (
      <div className="space-y-3">
        <button type="button" onClick={closeForm} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{t('back_button_label')}</span>
        </button>
        <h2 className="font-heading text-sm font-bold text-[#14284B]">{editClassId ? t('su_edit') : t('su_add_class')}</h2>
        <SchoolCard className="space-y-2.5">
          <SchoolTextField label={t('su_class_name_en')} value={cEn} onValueChange={setCEn} />
          <div><SchoolTextField urdu label={t('su_class_name_ur')} value={cUr} onValueChange={setCUr} /></div>
          {editClassId && Object.keys(secEdits).length > 0 && (
            <div className="space-y-2 border-t border-[#E4E8F0] pt-2.5">
              <h4 className="text-xs font-bold text-[#14284B]">{t('su_sections_heading')}</h4>
              {Object.entries(secEdits).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => (
                <SchoolTextField key={id} label={t('su_section_name')} value={name} onValueChange={(v) => setSecEdits({ ...secEdits, [id]: v })} />
              ))}
            </div>
          )}
          <div className="space-y-2 border-t border-[#E4E8F0] pt-2.5">
            <h4 className="text-xs font-bold text-[#14284B]">{t('su_subjects_heading')}</h4>
            {subRows.map((r, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1"><SchoolTextField label={t('su_subject_en')} value={r.en} onValueChange={(v) => setSubRows(subRows.map((x, j) => (j === i ? { ...x, en: v } : x)))} /></div>
                <div className="flex-1"><SchoolTextField urdu label={t('su_subject_ur')} value={r.ur} onValueChange={(v) => setSubRows(subRows.map((x, j) => (j === i ? { ...x, ur: v } : x)))} /></div>
                <button type="button" aria-label={t('su_delete')} className="p-2 mb-1 text-[#D64545] cursor-pointer" onClick={() => setSubRows(subRows.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button type="button" className="text-xs font-semibold text-[#14284B] cursor-pointer min-h-[36px] inline-flex items-center gap-1" onClick={() => setSubRows([...subRows, { en: '', ur: '' }])}>
              <Plus className="w-3.5 h-3.5 text-[#F28C28]" />{t('su_add_subject')}
            </button>
          </div>
          {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={closeForm} />
            <PrimaryButton text={t('su_save')} variant="orange" onClick={() => void saveClass()} />
          </div>
        </SchoolCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TabRow
        tabs={lookups.campuses.map((c) => ({ id: c.id, label: language === 'ur' ? c.nameUr : c.nameEn }))}
        selected={activeCampus}
        onSelect={setCampus}
      />
      <SchoolDialog open={deleteId !== null} title={t('su_delete')} message={deleteId ? (lookups.sectionsMap[deleteId]?.name ?? '') : ''} confirmText={t('su_delete')} cancelText={t('acc_cancel_btn')} onConfirm={() => void removeSection()} onDismiss={() => setDeleteId(null)} />
      {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}

      {classes.map((c) => {
        const secs = Object.values(lookups.sectionsMap).filter((s) => s.classId === c.id).sort((a, b) => a.name.localeCompare(b.name));
        return (
          <SchoolCard key={c.id} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-heading text-sm font-bold text-[#14284B]">{language === 'ur' ? c.nameUr : c.nameEn}</div>
              </div>
              <button type="button" className="text-xs font-semibold text-[#F28C28] cursor-pointer min-h-[36px]" onClick={() => void openEditClass(c)}>
                {t('su_edit')}
              </button>
            </div>
            {secs.map((s) => (
              <div key={s.id} className="flex items-center gap-2 border-t border-[#E4E8F0] pt-2">
                <div className="w-14 shrink-0 text-xs font-bold">{s.name}<div className="text-[10px] font-normal text-[#6B7385]"><span dir="ltr">{counts[s.id] ?? 0}</span> {t('su_students_n')}</div></div>
                <select className={`${selectCls} flex-1`} value={s.classTeacherId ?? ''} onChange={(e) => void setTeacher(s.id, e.target.value)}>
                  <option value="">{t('su_no_teacher')}</option>
                  {teachers.filter((p) => !p.campusId || p.campusId === c.campusId).map((p) => (<option key={p.id} value={p.id}>{language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName}</option>))}
                </select>
                <button type="button" aria-label={t('su_delete')} className="p-2 text-[#D64545] cursor-pointer" onClick={() => setDeleteId(s.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {addingSectionFor === c.id ? (
              <div className="flex items-end gap-2">
                <div className="flex-1"><SchoolTextField label={t('su_section_name')} value={secName} onValueChange={setSecName} /></div>
                <PrimaryButton text={t('su_save')} variant="orange" onClick={() => void addSection(c.id)} />
              </div>
            ) : (
              <button type="button" className="text-xs font-semibold text-[#14284B] cursor-pointer min-h-[36px] inline-flex items-center gap-1" onClick={() => { setAddingSectionFor(c.id); setSecName(''); }}>
                <Plus className="w-3.5 h-3.5 text-[#F28C28]" />{t('su_add_section')}
              </button>
            )}
          </SchoolCard>
        );
      })}

        <PrimaryButton text={t('su_add_class')} variant="outline" icon={<Plus className="w-4 h-4 text-[#F28C28]" />} onClick={() => { setAddingClass(true); setEditClassId(null); setCEn(''); setCUr(''); setSubRows([{ en: '', ur: '' }]); }} />
    </div>
  );
};

/* --------------------------------------------------------------------- fees */

const FeesSection: React.FC<{ admin: Profile; lookups: AccountantLookups }> = ({ admin, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [classId, setClassId] = useState('');
  const activeClass = classId || lookups.classes[0]?.id || '';
  const { data, loading, failed, reload } = useLoad(
    () => (activeClass ? AppModule.feeRepository.getClassFeeStructures(activeClass) : Promise.resolve({ ok: true as const, data: [] as ClassFeeStructure[] })),
    [activeClass]
  );
  const [vals, setVals] = useState({ tuition: '', annual: '', month: '8', admission: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!data) return;
    const f = (h: string) => data.find((x) => x.feeHeadId === h);
    setVals({
      tuition: String(f('fh_tuition')?.amount ?? 0),
      annual: String(f('fh_annual')?.amount ?? 0),
      month: String(f('fh_annual')?.chargeMonth ?? 8),
      admission: String(f('fh_admission')?.amount ?? 0),
    });
    setOk(false);
  }, [data]);

  if (lookups.loading) return <ShimmerPlaceholder lines={5} showHeader />;

  const save = async () => {
    setError(null);
    setOk(false);
    const num = (v: string) => (v.trim() === '' ? 0 : Number(v));
    const month = Number(vals.month);
    if (!Number.isInteger(month) || month < 1 || month > 12) return setError(t('su_annual_month'));
    setBusy(true);
    const rows = [
      { classId: activeClass, feeHeadId: 'fh_tuition', amount: num(vals.tuition), chargeMonth: null },
      { classId: activeClass, feeHeadId: 'fh_annual', amount: num(vals.annual), chargeMonth: month },
      { classId: activeClass, feeHeadId: 'fh_admission', amount: num(vals.admission), chargeMonth: null },
    ];
    for (const row of rows) {
      const r = await AppModule.feeRepository.saveClassFeeStructure(row, admin.id);
      if (!r.ok) {
        setBusy(false);
        return setError(r.error.message);
      }
    }
    setBusy(false);
    setOk(true);
    reload();
  };

  return (
    <SchoolCard className="space-y-3">
      <select className={selectCls} value={activeClass} onChange={(e) => setClassId(e.target.value)}>
        {lookups.classes.map((c) => {
          const campus = lookups.campuses.find((x) => x.id === c.campusId);
          return (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn} ({campus?.code})</option>);
        })}
      </select>
      <p className="text-[11px] text-[#6B7385]">{t('su_fee_hint')}</p>
      {loading ? (
        <ShimmerPlaceholder lines={3} />
      ) : failed ? (
        <LoadFail onRetry={reload} />
      ) : (
        <>
          <SchoolTextField label={t('su_tuition')} value={vals.tuition} onValueChange={(v) => setVals({ ...vals, tuition: v })} forceLtrValue />
          <div className="grid grid-cols-2 gap-2.5">
            <SchoolTextField label={t('st_annual_charges')} value={vals.annual} onValueChange={(v) => setVals({ ...vals, annual: v })} forceLtrValue />
            <SchoolTextField label={t('su_annual_month')} value={vals.month} onValueChange={(v) => setVals({ ...vals, month: v })} forceLtrValue />
          </div>
          <SchoolTextField label={t('st_admission_fee')} value={vals.admission} onValueChange={(v) => setVals({ ...vals, admission: v })} forceLtrValue />
          <Status error={error} ok={ok} />
          <PrimaryButton text={t('su_save')} variant="orange" loading={busy} onClick={() => void save()} />
        </>
      )}
    </SchoolCard>
  );
};

/* ----------------------------------------------------------------- holidays */

const HolidaysSection: React.FC<{ admin: Profile; lookups: AccountantLookups }> = ({ admin, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const year = Number(today().slice(0, 4));
  const { data, loading, failed, reload } = useLoad(() => AppModule.settingsRepository.getHolidays(year, null), [year]);
  const [adding, setAdding] = useState(false);
  const [tEn, setTEn] = useState('');
  const [tUr, setTUr] = useState('');
  const [date, setDate] = useState(today());
  const [dateTo, setDateTo] = useState('');
  const [campus, setCampus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    const last = dateTo && dateTo > date ? dateTo : date;
    const days: string[] = [];
    for (let d = date; d <= last && days.length < 31; d = addDaysIso(d, 1)) days.push(d);
    for (const d of days) {
      const h: SchoolHoliday = { id: `hol_${d}_${Date.now().toString(36)}`, titleEn: tEn, titleUr: tUr, date: d, campusId: campus || null };
      const r = await AppModule.settingsRepository.saveHoliday(h, admin);
      if (!r.ok) return setError(r.error.message);
    }
    setAdding(false);
    setTEn('');
    setTUr('');
    setDateTo('');
    reload();
  };
  const remove = async (id: string) => {
    const r = await AppModule.settingsRepository.deleteHoliday(id, admin);
    if (!r.ok) return setError(r.error.message);
    reload();
  };

  if (loading || lookups.loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed || !data) return <LoadFail onRetry={reload} />;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-3">
      {adding ? (
        <SchoolCard className="space-y-2.5">
          <SchoolTextField label={t('su_title_en')} value={tEn} onValueChange={setTEn} />
          <div><SchoolTextField urdu label={t('su_title_ur')} value={tUr} onValueChange={setTUr} /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('su_date')}</label>
              <input type="date" dir="ltr" className={selectCls} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('su_date_to')}</label>
              <input type="date" dir="ltr" className={selectCls} value={dateTo} min={date} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <select className={selectCls} value={campus} onChange={(e) => setCampus(e.target.value)}>
            <option value="">{t('campus_both')}</option>
            {lookups.campuses.map((c) => (<option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>))}
          </select>
          {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={() => setAdding(false)} />
            <PrimaryButton text={t('su_save')} variant="orange" onClick={() => void add()} />
          </div>
        </SchoolCard>
      ) : (
        <PrimaryButton text={t('su_add_holiday')} variant="orange" icon={<Plus className="w-4 h-4" />} onClick={() => setAdding(true)} />
      )}
      {!adding && error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
      {sorted.length === 0 ? (
        <EmptyState title={t('su_no_holidays')} description="" />
      ) : (
        <div className="space-y-2">
          {sorted.map((h) => {
            const c = lookups.campuses.find((x) => x.id === h.campusId);
            return (
              <SchoolCard key={h.id} className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{language === 'ur' && h.titleUr ? h.titleUr : h.titleEn}</div>
                  <div className="text-[11px] text-[#6B7385]"><span dir="ltr">{h.date}</span> · {c ? (language === 'ur' ? c.nameUr : c.nameEn) : t('campus_both')}</div>
                </div>
                <button type="button" aria-label={t('su_delete')} className="p-2 text-[#D64545] cursor-pointer" onClick={() => void remove(h.id)}><Trash2 className="w-4 h-4" /></button>
              </SchoolCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ grading */

const GradingSection: React.FC<{ admin: Profile }> = ({ admin }) => {
  const { stringResource: t } = useStringResource();
  const { data, loading, failed, reload } = useLoad(() => AppModule.settingsRepository.getGradingScale(), []);
  const [rows, setRows] = useState<{ grade: string; min: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const sync = useCallback((d: GradingScaleEntry[]) => setRows(d.map((e) => ({ grade: e.grade, min: String(e.minPercent) }))), []);
  useEffect(() => {
    if (data) sync(data);
  }, [data, sync]);

  if (loading) return <ShimmerPlaceholder lines={5} showHeader />;
  if (failed || !data) return <LoadFail onRetry={reload} />;

  const save = async () => {
    setBusy(true);
    setError(null);
    setOk(false);
    const entries: GradingScaleEntry[] = rows.map((r) => {
      const old = data.find((e) => e.grade === r.grade);
      return { ...old, grade: r.grade, minPercent: r.min.trim() === '' ? NaN : Number(r.min) };
    });
    const r = await AppModule.settingsRepository.saveGradingScale(entries, admin);
    setBusy(false);
    if (!r.ok) return setError(r.error.message);
    setOk(true);
    sync(r.data);
  };

  return (
    <SchoolCard className="space-y-3">
      <p className="text-[11px] text-[#6B7385]">{t('su_grade_hint')}</p>
      {rows.map((r, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="flex-1"><SchoolTextField label={t('su_grade')} value={r.grade} onValueChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, grade: v } : x)))} forceLtrValue /></div>
          <div className="flex-1"><SchoolTextField label={t('su_min_percent')} value={r.min} onValueChange={(v) => setRows(rows.map((x, j) => (j === i ? { ...x, min: v } : x)))} forceLtrValue /></div>
          <button type="button" aria-label={t('su_delete')} className="p-3 text-[#D64545] cursor-pointer" onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button type="button" className="text-xs font-semibold text-[#14284B] cursor-pointer min-h-[36px] inline-flex items-center gap-1" onClick={() => setRows([...rows, { grade: '', min: '' }])}>
        <Plus className="w-3.5 h-3.5 text-[#F28C28]" />{t('su_add_grade')}
      </button>
      <Status error={error} ok={ok} />
      <PrimaryButton text={t('su_save')} variant="orange" loading={busy} onClick={() => void save()} />
    </SchoolCard>
  );
};
