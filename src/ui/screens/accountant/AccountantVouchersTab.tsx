import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, FileText, Printer, Search } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { currentMonth } from '../../../domain/clock';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import {
  FeeVoucher,
  Profile,
  Student,
  VoucherGenerationPreview,
  VoucherStatus,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { formatYearMonthLabel, VoucherStatusBadge } from '../parent/ParentHelpers';
import {
  AccountantLookups,
  domainErrorText,
  PrintFrame,
  StudentNameBlock,
  studentClassLabel,
  VoucherSlip,
  voucherTotals,
} from './AccountantShared';
import { StudentFeeAccount } from './StudentFeeAccount';

type SubTab = 'generate' | 'list' | 'print';
const PAGE = 50;

const selectCls =
  'w-full min-h-[44px] px-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm text-[#14284B]';

export const AccountantVouchersTab: React.FC<{
  accountant: Profile;
  lookups: AccountantLookups;
}> = ({ accountant, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const [sub, setSub] = useState<SubTab>('generate');
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  // shared data for list/print
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const [vo, st] = await Promise.all([
      AppModule.feeRepository.getAllVouchers(),
      AppModule.studentRepository.search({ query: '', status: null }),
    ]);
    if (!vo.ok || !st.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    const map: Record<string, Student> = {};
    st.data.forEach((s) => (map[s.id] = s));
    setVouchers(vo.data);
    setStudents(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ----- generate ----- */
  const [genCampus, setGenCampus] = useState('');
  const [genClass, setGenClass] = useState('ALL');
  const [genMonth, setGenMonth] = useState(currentMonth());
  const [genDue, setGenDue] = useState(`${currentMonth()}-10`);
  const [genError, setGenError] = useState<string | null>(null);
  const [preview, setPreview] = useState<VoucherGenerationPreview | null>(null);
  const [genBusy, setGenBusy] = useState(false);
  const [genDone, setGenDone] = useState<number | null>(null);

  useEffect(() => {
    if (!genCampus && lookups.campuses.length > 0) {
      setGenCampus(lookups.campuses[0].id);
    }
  }, [lookups.campuses, genCampus]);

  const resetPreview = () => {
    setPreview(null);
    setGenDone(null);
    setGenError(null);
  };

  const runPreview = async () => {
    setGenError(null);
    setGenDone(null);
    if (!genCampus) return setGenError(t('acc_err_campus_required'));
    if (!genMonth || !genDue || genDue < `${genMonth}-01`) {
      return setGenError(t('acc_err_due_invalid'));
    }
    setGenBusy(true);
    const res = await AppModule.feeRepository.previewMonthlyVouchers(
      genCampus,
      genClass === 'ALL' ? null : genClass,
      genMonth
    );
    setGenBusy(false);
    if (!res.ok) return setGenError(domainErrorText(res.error, t, 'acc_gen_failed'));
    setPreview(res.data);
  };

  const runGenerate = async () => {
    setGenBusy(true);
    const res = await AppModule.feeRepository.generateMonthlyVouchers(
      genCampus,
      genClass === 'ALL' ? null : genClass,
      genMonth,
      genDue,
      accountant.id
    );
    setGenBusy(false);
    if (!res.ok) return setGenError(domainErrorText(res.error, t, 'acc_gen_failed'));
    setGenDone(res.data.length);
    setPreview(null);
    void load();
  };

  const genClasses = lookups.classes.filter((c) => c.campusId === genCampus);

  /* ----- list filters ----- */
  const [fCampus, setFCampus] = useState('ALL');
  const [fClass, setFClass] = useState('ALL');
  const [fMonth, setFMonth] = useState('');
  const [fStatus, setFStatus] = useState<'ALL' | VoucherStatus>('ALL');
  const [fQuery, setFQuery] = useState('');

  const filtered = useMemo(() => {
    const q = fQuery.trim().toLowerCase();
    return vouchers
      .filter((v) => {
        const s = students[v.studentId];
        if (!s) return false;
        if (fCampus !== 'ALL' && v.campusId !== fCampus) return false;
        if (fClass !== 'ALL' && lookups.sectionsMap[s.sectionId]?.classId !== fClass) return false;
        if (fMonth && v.billingMonth !== fMonth) return false;
        if (fStatus !== 'ALL' && v.status !== fStatus) return false;
        if (q) {
          const hay = `${s.name} ${s.nameUr} ${s.admissionNo} ${v.voucherNo}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) =>
        a.billingMonth === b.billingMonth
          ? a.voucherNo.localeCompare(b.voucherNo)
          : b.billingMonth.localeCompare(a.billingMonth)
      );
  }, [vouchers, students, fCampus, fClass, fMonth, fStatus, fQuery, lookups.sectionsMap]);

  /* ----- print ----- */
  const [pClass, setPClass] = useState('');
  const [pMonth, setPMonth] = useState(currentMonth());
  const [printing, setPrinting] = useState(false);
  const printable = useMemo(
    () =>
      pClass
        ? vouchers
            .filter((v) => {
              const s = students[v.studentId];
              return (
                s &&
                v.billingMonth === pMonth &&
                lookups.sectionsMap[s.sectionId]?.classId === pClass
              );
            })
            .sort((a, b) => a.voucherNo.localeCompare(b.voucherNo))
        : [],
    [vouchers, students, pClass, pMonth, lookups.sectionsMap]
  );

  if (openStudentId) {
    return (
      <StudentFeeAccount
        studentId={openStudentId}
        accountant={accountant}
        lookups={lookups}
        onBack={() => {
          setOpenStudentId(null);
          void load();
        }}
      />
    );
  }

  if (loading || lookups.loading) return <ShimmerPlaceholder lines={4} showHeader />;
  if (failed || lookups.failed) {
    return (
      <EmptyState
        title={t('error_loading_title')}
        description={t('error_loading_subtitle')}
        actionLabel={t('retry_button')}
        onAction={() => {
          lookups.reload();
          void load();
        }}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const className = (id: string) => {
    const c = lookups.classesMap[id];
    return c ? (language === 'ur' ? c.nameUr : c.nameEn) : '';
  };
  const campusTabs = lookups.campuses.map((c) => ({
    id: c.id,
    label: language === 'ur' ? c.nameUr : c.nameEn,
  }));

  return (
    <div className="space-y-3">
      <TabRow
        tabs={[
          { id: 'generate' as SubTab, label: t('acc_vtab_generate') },
          { id: 'list' as SubTab, label: t('acc_vtab_list') },
          { id: 'print' as SubTab, label: t('acc_vtab_print') },
        ]}
        selected={sub}
        onSelect={setSub}
      />

      {sub === 'generate' && (
        <SchoolCard className="space-y-3.5">
          <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('acc_gen_title')}</h3>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('acc_gen_campus_label')}</label>
            <TabRow
              tabs={campusTabs}
              selected={genCampus}
              onSelect={(v) => {
                setGenCampus(v);
                setGenClass('ALL');
                resetPreview();
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold">{t('acc_gen_class_label')}</label>
            <select
              className={selectCls}
              value={genClass}
              onChange={(e) => {
                setGenClass(e.target.value);
                resetPreview();
              }}
            >
              <option value="ALL">{t('acc_all_classes')}</option>
              {genClasses.map((c) => (
                <option key={c.id} value={c.id}>{className(c.id)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('acc_gen_month_label')}</label>
              <input
                type="month"
                dir="ltr"
                className={selectCls}
                value={genMonth}
                onChange={(e) => {
                  setGenMonth(e.target.value);
                  if (e.target.value) setGenDue(`${e.target.value}-10`);
                  resetPreview();
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold">{t('acc_gen_due_label')}</label>
              <input
                type="date"
                dir="ltr"
                className={selectCls}
                value={genDue}
                onChange={(e) => {
                  setGenDue(e.target.value);
                  resetPreview();
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7385]">{t('acc_gen_safe_note')}</p>
          {genError && (
            <p className="text-xs font-medium text-[#D64545] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{genError}</span>
            </p>
          )}
          {genDone !== null && (
            <p className="text-sm font-semibold text-[#2E9E5B]">
              {t('acc_gen_done')}: {genDone}
            </p>
          )}
          {preview && (
            <div className="rounded-2xl bg-[#F6F8FC] p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span>{t('acc_gen_preview_create')}</span><b dir="ltr">{preview.willCreate}</b></div>
              <div className="flex justify-between"><span>{t('acc_gen_preview_skipped')}</span><b dir="ltr">{preview.skippedAlreadyHaveVoucher}</b></div>
              <div className="flex justify-between"><span>{t('acc_gen_preview_total')}</span><b dir="ltr">{formatRupees(preview.totalExpectedRupees)}</b></div>
              {preview.willCreate === 0 && (
                <p className="text-[#6B7385]">{t('acc_gen_nothing')}</p>
              )}
            </div>
          )}
          {preview && preview.willCreate > 0 ? (
            <PrimaryButton
              text={t('acc_gen_confirm_btn')}
              variant="orange"
              loading={genBusy}
              onClick={() => void runGenerate()}
            />
          ) : (
            <PrimaryButton
              text={t('acc_gen_preview_btn')}
              variant="navy"
              loading={genBusy}
              onClick={() => void runPreview()}
            />
          )}
        </SchoolCard>
      )}

      {sub === 'list' && (
        <>
          <SchoolCard className="space-y-2.5">
            <SchoolTextField
              label={t('acc_voucher_search_placeholder')}
              value={fQuery}
              onValueChange={setFQuery}
              leadingIcon={<Search className="w-4 h-4" />}
            />
            <div className="grid grid-cols-2 gap-2">
              <select className={selectCls} value={fCampus} onChange={(e) => { setFCampus(e.target.value); setFClass('ALL'); }}>
                <option value="ALL">{t('campus_both')}</option>
                {lookups.campuses.map((c) => (
                  <option key={c.id} value={c.id}>{language === 'ur' ? c.nameUr : c.nameEn}</option>
                ))}
              </select>
              <select className={selectCls} value={fClass} onChange={(e) => setFClass(e.target.value)}>
                <option value="ALL">{t('acc_all_classes')}</option>
                {lookups.classes.filter((c) => fCampus === 'ALL' || c.campusId === fCampus).map((c) => (
                  <option key={c.id} value={c.id}>{className(c.id)}</option>
                ))}
              </select>
              <input type="month" dir="ltr" className={selectCls} value={fMonth} onChange={(e) => setFMonth(e.target.value)} aria-label={t('acc_gen_month_label')} />
              <select className={selectCls} value={fStatus} onChange={(e) => setFStatus(e.target.value as 'ALL' | VoucherStatus)}>
                <option value="ALL">{t('acc_status_all')}</option>
                {[VoucherStatus.UNPAID, VoucherStatus.PARTIAL, VoucherStatus.PAID].map((s) => (
                  <option key={s} value={s}>{t(`voucher_status_${s}` as StringKey)}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-[#6B7385]">
              <span dir="ltr">{filtered.length}</span> {t('acc_vouchers_found')}
            </p>
          </SchoolCard>
          {filtered.length === 0 ? (
            <EmptyState
              title={t('acc_vouchers_none_title')}
              description=""
              icon={<FileText className="w-6 h-6 text-[#F28C28]" />}
            />
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, PAGE).map((v) => {
                const s = students[v.studentId];
                return (
                  <SchoolCard key={v.id} className="p-3 space-y-1.5" onClick={() => setOpenStudentId(v.studentId)}>
                    <div className="flex items-start justify-between gap-2">
                      <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
                      <VoucherStatusBadge status={v.status} />
                    </div>
                    <div dir="ltr" className="flex justify-between text-[11px] text-[#6B7385] font-mono">
                      <span>{v.voucherNo} · {formatYearMonthLabel(v.billingMonth, t)}</span>
                      <span>{formatRupees(voucherTotals(v).balance)}</span>
                    </div>
                  </SchoolCard>
                );
              })}
              {filtered.length > PAGE && (
                <p className="text-[11px] text-center text-[#6B7385]">{t('acc_showing_first')}</p>
              )}
            </div>
          )}
        </>
      )}

      {sub === 'print' && (
        <SchoolCard className="space-y-3">
          <h3 className="font-heading text-sm font-bold text-[#14284B]">{t('acc_print_vouchers_title')}</h3>
          <select className={selectCls} value={pClass} onChange={(e) => setPClass(e.target.value)}>
            <option value="">{t('acc_class_col')}…</option>
            {lookups.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {className(c.id)} — {lookups.campuses.find((x) => x.id === c.campusId)?.code}
              </option>
            ))}
          </select>
          <input type="month" dir="ltr" className={selectCls} value={pMonth} onChange={(e) => setPMonth(e.target.value)} aria-label={t('acc_gen_month_label')} />
          {!pClass ? (
            <p className="text-xs text-[#6B7385]">{t('acc_print_class_required')}</p>
          ) : printable.length === 0 ? (
            <p className="text-xs text-[#6B7385]">{t('acc_print_none_found')}</p>
          ) : (
            <p className="text-xs font-semibold text-[#2E9E5B]">
              <span dir="ltr">{printable.length}</span> {t('acc_print_ready_count')}
            </p>
          )}
          <PrimaryButton
            text={t('acc_print_vouchers_btn')}
            variant="navy"
            icon={<Printer className="w-4 h-4 text-[#F28C28]" />}
            disabled={printable.length === 0}
            onClick={() => setPrinting(true)}
          />
        </SchoolCard>
      )}

      {printing && (
        <PrintFrame onClose={() => setPrinting(false)}>
          {printable.map((v) => (
            <VoucherSlip key={v.id} voucher={v} student={students[v.studentId]} lookups={lookups} />
          ))}
        </PrintFrame>
      )}
    </div>
  );
};
