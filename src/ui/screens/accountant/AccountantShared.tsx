import { saveBlobFile } from '../../../data/nativeFiles';
import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import {
  CampusModel,
  DomainError,
  FeeHead,
  FeePayment,
  FeeVoucher,
  Profile,
  SchoolClass,
  Section,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import { PrimaryButton, SchoolCard } from '../../components/SchoolComposables';
import { SchoolLogo } from '../../components/SchoolLogo';
import { useStringResource } from '../../theme/LocaleContext';
import { formatYearMonthLabel } from '../parent/ParentHelpers';

export type Translate = (key: StringKey) => string;

/* ----------------------------------------------------------------------------
 * Small pure helpers
 * -------------------------------------------------------------------------- */

const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight',
  'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
  'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below1000(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(' ');
}

/** English words for a whole-rupee amount, using the South Asian grouping (Lakh/Crore). */
export function amountInWords(amount: number): string {
  let n = Math.floor(Math.abs(amount));
  if (n === 0) return 'Zero Rupees Only';
  const units: [number, string][] = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
  ];
  const parts: string[] = [];
  for (const [size, label] of units) {
    if (n >= size) {
      parts.push(`${below1000(Math.floor(n / size))} ${label}`);
      n %= size;
    }
  }
  if (n > 0) parts.push(below1000(n));
  return `${parts.join(' ')} Rupees Only`;
}

function csvCell(value: string | number): string {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Downloads rows as a UTF-8 CSV (with BOM so Excel shows Urdu correctly). */
export function downloadCsv(
  filename: string,
  rows: (string | number)[][]
): void {
  const text = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  void saveBlobFile(filename, blob);
}

/** 0300-1234567 / +92 300 1234567 -> 923001234567 (digits only, for wa.me). */
export function normalizePkPhone(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1);
  return d;
}

export function interpolate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in values ? String(values[k]) : `{${k}}`
  );
}

export function voucherTotals(v: FeeVoucher) {
  const net = v.items.reduce(
    (s, it) => s + Math.max(0, it.amount - it.waivedAmount),
    0
  );
  const paid = v.items.reduce((s, it) => s + (it.paidAmount ?? 0), 0);
  return { net, paid, balance: Math.max(0, net - paid) };
}

export function domainErrorText(
  error: DomainError,
  t: Translate,
  fallback: StringKey = 'domain_err_generic'
): string {
  return error.message || t(fallback);
}

/* ----------------------------------------------------------------------------
 * Lookups hook (classes, sections, fee heads, campuses, staff names)
 * -------------------------------------------------------------------------- */

export interface AccountantLookups {
  loading: boolean;
  failed: boolean;
  reload: () => void;
  classesMap: Record<string, SchoolClass>;
  sectionsMap: Record<string, Section>;
  feeHeadsMap: Record<string, FeeHead>;
  staffMap: Record<string, Profile>;
  campuses: CampusModel[];
  classes: SchoolClass[];
  schoolNameEn: string;
  schoolNameUr: string;
}

export function useAccountantLookups(): AccountantLookups {
  const [state, setState] = useState<Omit<AccountantLookups, 'reload'>>({
    loading: true,
    failed: false,
    classesMap: {},
    sectionsMap: {},
    feeHeadsMap: {},
    staffMap: {},
    campuses: [],
    classes: [],
    schoolNameEn: 'Al Furqan School Okara',
    schoolNameUr: 'الفرقان اسکول اوکاڑہ',
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, failed: false }));
    const [cl, se, fh, ca, pr, ss] = await Promise.all([
      AppModule.settingsRepository.getClasses(null),
      AppModule.settingsRepository.getSections(null),
      AppModule.feeRepository.getFeeHeads(),
      AppModule.settingsRepository.getCampuses(),
      AppModule.settingsRepository.getProfiles(null, null),
      AppModule.settingsRepository.getSchoolSettings(),
    ]);
    if (!cl.ok || !se.ok || !fh.ok || !ca.ok) {
      setState((s) => ({ ...s, loading: false, failed: true }));
      return;
    }
    const classesMap: Record<string, SchoolClass> = {};
    cl.data.forEach((c) => (classesMap[c.id] = c));
    const sectionsMap: Record<string, Section> = {};
    se.data.forEach((c) => (sectionsMap[c.id] = c));
    const feeHeadsMap: Record<string, FeeHead> = {};
    fh.data.forEach((c) => (feeHeadsMap[c.id] = c));
    const staffMap: Record<string, Profile> = {};
    if (pr.ok) pr.data.forEach((p) => (staffMap[p.id] = p));
    setState({
      loading: false,
      failed: false,
      classesMap,
      sectionsMap,
      feeHeadsMap,
      staffMap,
      campuses: ca.data,
      classes: [...cl.data].sort((a, b) => a.sortOrder - b.sortOrder),
      schoolNameEn: ss.ok ? ss.data.nameEn : 'Al Furqan School Okara',
      schoolNameUr: ss.ok ? ss.data.nameUr : 'الفرقان اسکول اوکاڑہ',
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: () => void load() };
}

export function studentClassLabel(
  student: Student,
  lookups: Pick<AccountantLookups, 'classesMap' | 'sectionsMap'>,
  language: 'en' | 'ur'
): string {
  const sec = lookups.sectionsMap[student.sectionId];
  const cls = sec ? lookups.classesMap[sec.classId] : undefined;
  if (!cls) return '';
  const name = language === 'ur' ? cls.nameUr : cls.nameEn;
  return sec ? `${name} - ${sec.name}` : name;
}

export function studentClassId(
  student: Student,
  lookups: Pick<AccountantLookups, 'sectionsMap'>
): string | null {
  return lookups.sectionsMap[student.sectionId]?.classId ?? null;
}

export function feeHeadName(
  feeHeadId: string,
  fallback: string,
  lookups: Pick<AccountantLookups, 'feeHeadsMap'>,
  language: 'en' | 'ur'
): string {
  const h = lookups.feeHeadsMap[feeHeadId];
  if (!h) return fallback;
  return language === 'ur' ? h.nameUr : h.nameEn;
}

export function staffName(
  id: string,
  lookups: Pick<AccountantLookups, 'staffMap'>,
  language: 'en' | 'ur'
): string {
  const p = lookups.staffMap[id];
  if (!p) return id;
  return language === 'ur' && p.fullNameUr ? p.fullNameUr : p.fullName;
}

/* ----------------------------------------------------------------------------
 * Student name block: name wraps to 2 lines, admission no on one small line
 * -------------------------------------------------------------------------- */

export const StudentNameBlock: React.FC<{
  student: Student;
  classLabel?: string;
}> = ({ student, classLabel }) => {
  const { language } = useStringResource();
  const name = language === 'ur' && student.nameUr ? student.nameUr : student.name;
  return (
    <div className="min-w-0">
      <div
        className={`text-sm font-bold text-[#14284B] leading-snug line-clamp-2 ${
          language === 'ur' ? 'font-urdu' : ''
        }`}
      >
        {name}
      </div>
      <div
        dir="ltr"
        className="text-[11px] text-[#6B7385] truncate text-start"
      >
        {student.admissionNo}
        {classLabel ? ` · ${classLabel}` : ''}
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * Fee summary cards (six cards)
 * -------------------------------------------------------------------------- */

export const FeeSummaryCards: React.FC<{ summary: StudentFeeSummary }> = ({
  summary,
}) => {
  const { stringResource: t } = useStringResource();

  const statusLabel = (s: string) => t(`voucher_status_${s}` as StringKey);
  const money = (label: string, value: number, accent?: string) => (
    <SchoolCard className="p-3 space-y-1">
      <div className="text-[11px] font-semibold text-[#6B7385]">{label}</div>
      <div
        dir="ltr"
        className={`font-mono text-base font-bold tabular-nums text-start ${
          accent ?? 'text-[#14284B]'
        }`}
      >
        {formatRupees(value)}
      </div>
    </SchoolCard>
  );
  const badge = (label: string, amount: number, status: string) => (
    <SchoolCard className="p-3 space-y-1">
      <div className="text-[11px] font-semibold text-[#6B7385]">{label}</div>
      <div
        dir="ltr"
        className="font-mono text-base font-bold tabular-nums text-[#14284B] text-start"
      >
        {formatRupees(amount)}
      </div>
      <span className="inline-block px-2 py-0.5 rounded-lg bg-[#E4E8F0]/70 text-[10px] font-semibold text-[#14284B]">
        {statusLabel(status)}
      </span>
    </SchoolCard>
  );

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {money(t('fee_card_monthly'), summary.monthlyFee)}
      {money(t('fee_card_paid'), summary.paidThisMonth, 'text-[#2E9E5B]')}
      {money(
        t('fee_card_pending'),
        summary.pending,
        summary.pending > 0 ? 'text-[#D64545]' : 'text-[#2E9E5B]'
      )}
      {money(t('fee_card_arrears'), summary.previousArrears)}
      {badge(
        t('fee_card_annual'),
        summary.annualChargesAmount,
        summary.annualChargesStatus
      )}
      {badge(
        t('fee_card_admission'),
        summary.admissionFeeAmount,
        summary.admissionFeeStatus
      )}
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * Print frame (portal to <body>; #root is hidden while printing)
 * -------------------------------------------------------------------------- */

export const PrintFrame: React.FC<{
  onClose: () => void;
  children: React.ReactNode;
}> = ({ onClose, children }) => {
  const { stringResource: t, language, isRtl } = useStringResource();

  useEffect(() => {
    document.body.classList.add('printing-overlay');
    return () => document.body.classList.remove('printing-overlay');
  }, []);

  return createPortal(
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      lang={language}
      className="print-overlay-screen"
    >
      <div className="no-print print-toolbar">
        <PrimaryButton
          text={t('print_trigger_now')}
          variant="orange"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        />
        <PrimaryButton
          text={t('print_close_preview')}
          variant="outline"
          icon={<X className="w-4 h-4" />}
          onClick={onClose}
        />
      </div>
      <div className="print-pages">{children}</div>
    </div>,
    document.body
  );
};

export const SchoolHeader: React.FC<{
  lookups: Pick<AccountantLookups, 'schoolNameEn' | 'schoolNameUr'>;
  subtitle: string;
}> = ({ lookups, subtitle }) => (
  <div className="flex items-center gap-3 border-b border-[#14284B] pb-2 mb-2">
    <SchoolLogo size={44} />
    <div className="min-w-0 flex-1">
      <div className="font-heading text-sm font-bold text-[#14284B] leading-tight">
        {lookups.schoolNameEn}
      </div>
      <div className="font-urdu text-sm text-[#14284B] leading-snug" dir="rtl">
        {lookups.schoolNameUr}
      </div>
    </div>
    <div className="text-xs font-bold text-[#F28C28] uppercase text-end">
      {subtitle}
    </div>
  </div>
);

export const Row: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="flex items-baseline justify-between gap-3 text-xs py-0.5">
    <span className="text-[#6B7385] shrink-0">{label}</span>
    <span className="font-semibold text-[#1B2233] text-end">{value}</span>
  </div>
);

/* ----------------------------------------------------------------------------
 * Receipt document
 * -------------------------------------------------------------------------- */

export const ReceiptDocument: React.FC<{
  payment: FeePayment;
  student: Student;
  lookups: AccountantLookups;
}> = ({ payment, student, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const methodLabel = t(`method_${payment.method}` as StringKey);
  const receivedBy = staffName(payment.receivedBy, lookups, language);

  return (
    <div className="print-sheet-doc receipt-doc">
      <SchoolHeader lookups={lookups} subtitle={t('print_receipt_document_title')} />
      <Row label={t('acc_receipt_col')} value={<span dir="ltr">{payment.receiptNo}</span>} />
      <Row label={t('acc_pick_date')} value={formatSchoolDate(payment.paidOn)} />
      <Row
        label={t('acc_student_col')}
        value={
          <span className={language === 'ur' ? 'font-urdu' : ''}>
            {language === 'ur' && student.nameUr ? student.nameUr : student.name}{' '}
            <span dir="ltr">({student.admissionNo})</span>
          </span>
        }
      />
      <Row label={t('acc_class_col')} value={studentClassLabel(student, lookups, language)} />
      <Row label={t('acc_father_label')} value={student.fatherName} />
      <Row label={t('acc_method_col')} value={methodLabel} />
      {payment.reference ? (
        <Row label={t('acc_reference_short')} value={<span dir="ltr">{payment.reference}</span>} />
      ) : null}
      <div className="my-2 rounded-xl border border-[#14284B] p-2.5 text-center">
        <div dir="ltr" className="font-mono text-xl font-bold text-[#14284B]">
          {formatRupees(payment.amount)}
        </div>
        <div className="text-[11px] text-[#6B7385]" dir="ltr">
          {amountInWords(payment.amount)}
        </div>
      </div>
      <Row label={t('acc_received_by_label')} value={receivedBy} />
      <div className="mt-6 flex justify-between text-[10px] text-[#6B7385]">
        <span>{t('print_computer_generated_note')}</span>
        <span className="border-t border-[#1B2233] pt-0.5 min-w-[110px] text-center">
          {t('acc_signature_label')}
        </span>
      </div>
    </div>
  );
};

/* ----------------------------------------------------------------------------
 * Voucher slip (two fit on one A4 page)
 * -------------------------------------------------------------------------- */

export const VoucherSlip: React.FC<{
  voucher: FeeVoucher;
  student: Student;
  lookups: AccountantLookups;
}> = ({ voucher, student, lookups }) => {
  const { stringResource: t, language } = useStringResource();
  const totals = voucherTotals(voucher);
  return (
    <div className="voucher-slip">
      <SchoolHeader lookups={lookups} subtitle={t('print_voucher_document_title')} />
      <Row label={t('fee_voucher_no_label')} value={<span dir="ltr">{voucher.voucherNo}</span>} />
      <Row label={t('acc_student_col')} value={
        <span className={language === 'ur' ? 'font-urdu' : ''}>
          {language === 'ur' && student.nameUr ? student.nameUr : student.name}{' '}
          <span dir="ltr">({student.admissionNo})</span>
        </span>
      } />
      <Row label={t('acc_class_col')} value={studentClassLabel(student, lookups, language)} />
      <Row label={t('acc_father_label')} value={student.fatherName} />
      <Row label={t('acc_gen_month_label')} value={formatYearMonthLabel(voucher.billingMonth, t)} />
      <Row label={t('acc_gen_due_label')} value={formatSchoolDate(voucher.dueDate)} />
      <table className="w-full text-xs mt-2 border-collapse">
        <tbody>
          {voucher.items.map((it, i) => (
            <tr key={i} className="border-b border-[#E4E8F0]">
              <td className="py-1">{feeHeadName(it.feeHeadId, it.description, lookups, language)}</td>
              <td dir="ltr" className="py-1 text-end font-mono">
                {formatRupees(Math.max(0, it.amount - it.waivedAmount))}
              </td>
            </tr>
          ))}
          <tr>
            <td className="pt-1.5 font-bold text-[#14284B]">{t('fee_card_pending')}</td>
            <td dir="ltr" className="pt-1.5 text-end font-mono font-bold text-[#14284B]">
              {formatRupees(totals.balance)}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-2 text-[10px] text-[#6B7385]">{t('print_school_address')}</div>
    </div>
  );
};

export { formatYearMonthLabel };
