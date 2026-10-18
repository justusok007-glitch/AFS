import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle2,
  Printer,
  Wallet,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import {
  FeePayment,
  FeeVoucher,
  PaymentAllocation,
  PaymentMethod,
  Profile,
  Role,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
import { StringKey } from '../../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  formatYearMonthLabel,
  VoucherStatusBadge,
} from '../parent/ParentHelpers';
import {
  AccountantLookups,
  domainErrorText,
  FeeSummaryCards,
  feeHeadName,
  PrintFrame,
  ReceiptDocument,
  staffName,
  StudentNameBlock,
  studentClassLabel,
  VoucherSlip,
  voucherTotals,
} from './AccountantShared';

export interface StudentFeeAccountProps {
  studentId: string;
  accountant: Profile;
  lookups: AccountantLookups;
  startWithPaymentForm?: boolean;
  onBack: () => void;
}

type View = 'account' | 'form' | 'success' | 'voucher';
type PrintSpec =
  | { kind: 'receipt'; payment: FeePayment }
  | { kind: 'voucher'; voucher: FeeVoucher };

const METHODS: PaymentMethod[] = [
  PaymentMethod.CASH,
  PaymentMethod.BANK,
  PaymentMethod.JAZZCASH,
  PaymentMethod.EASYPAISA,
];

export const StudentFeeAccount: React.FC<StudentFeeAccountProps> = ({
  studentId,
  accountant,
  lookups,
  startWithPaymentForm = false,
  onBack,
}) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [summary, setSummary] = useState<StudentFeeSummary | null>(null);
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [view, setView] = useState<View>('account');
  const [openedForm, setOpenedForm] = useState(false);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [printSpec, setPrintSpec] = useState<PrintSpec | null>(null);
  const isAdmin = accountant.role === Role.ADMIN;
  const [adminAction, setAdminAction] = useState<AdminAction | null>(null);

  // payment form
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [paidOn, setPaidOn] = useState(today());
  const [reference, setReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    amount?: string;
    reference?: string;
    date?: string;
  }>({});
  const [saving, setSaving] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    payment: FeePayment;
    allocations: PaymentAllocation[];
  } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFailed(false);
    const [st, sm, vo, pa] = await Promise.all([
      AppModule.studentRepository.getById(studentId),
      AppModule.feeRepository.feeSummaryForStudent(studentId),
      AppModule.feeRepository.getVouchersForStudent(studentId),
      AppModule.feeRepository.getPaymentsForStudent(studentId),
    ]);
    if (!st.ok || !sm.ok || !vo.ok || !pa.ok) {
      setFailed(true);
      setLoading(false);
      return;
    }
    setStudent(st.data);
    setSummary(sm.data);
    setVouchers(
      [...vo.data].sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))
    );
    setPayments(
      [...pa.data].sort((a, b) =>
        b.paidOn === a.paidOn
          ? b.receiptNo.localeCompare(a.receiptNo)
          : b.paidOn.localeCompare(a.paidOn)
      )
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPending = vouchers.reduce(
    (s, v) => s + voucherTotals(v).balance,
    0
  );

  const openForm = useCallback(() => {
    setAmountText('');
    setMethod(PaymentMethod.CASH);
    setPaidOn(today());
    setReference('');
    setRemarks('');
    setFormError(null);
    setFieldErrors({});
    setView('form');
  }, []);

  useEffect(() => {
    if (startWithPaymentForm && !openedForm && !loading && student) {
      setOpenedForm(true);
      openForm();
    }
  }, [startWithPaymentForm, openedForm, loading, student, openForm]);

  const submitPayment = async () => {
    const errors: typeof fieldErrors = {};
    const amount = Number(amountText.replace(/,/g, '').trim());
    if (totalPending <= 0) {
      setFormError(t('acc_err_no_pending'));
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      errors.amount = t('acc_err_amount_required');
    } else if (amount > totalPending) {
      errors.amount = t('acc_err_amount_exceeds');
    }
    if (method !== PaymentMethod.CASH && !reference.trim()) {
      errors.reference = t('acc_err_reference_required');
    }
    if (!paidOn || paidOn > today()) {
      errors.date = t('acc_err_date_future');
    }
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await AppModule.feeRepository.recordPayment(
        studentId,
        amount,
        paidOn,
        method,
        accountant.id,
        reference.trim() || null,
        remarks.trim() || null
      );
      if (!res.ok) {
        setFormError(domainErrorText(res.error, t, 'acc_err_save_failed'));
        return;
      }
      setLastPayment(res.data);
      await load(true);
      setView('success');
    } catch {
      setFormError(t('acc_err_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  const voucherById = (id: string) => vouchers.find((v) => v.id === id);

  if (loading) {
    return (
      <div className="space-y-3">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
      </div>
    );
  }

  if (failed || !student || !summary) {
    return (
      <div className="space-y-3">
        <PrimaryButton
          text={t('back_button_label')}
          variant="outline"
          icon={<BackIcon className="w-4 h-4" />}
          onClick={onBack}
        />
        <EmptyState
          title={t('error_loading_title')}
          description={t('error_loading_subtitle')}
          actionLabel={t('retry_button')}
          onAction={() => void load()}
          icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
        />
      </div>
    );
  }

  const classLabel = studentClassLabel(student, lookups, language);

  const studentHeader = (
    <SchoolCard className="p-3.5 space-y-1">
      <StudentNameBlock student={student} classLabel={classLabel} />
      <div className="text-[11px] text-[#6B7385]">
        {t('acc_father_label')}: {student.fatherName}
      </div>
    </SchoolCard>
  );

  const backBar = (label: string, action: () => void) => (
    <button
      type="button"
      onClick={action}
      className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer"
    >
      <BackIcon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  /* ---------- print overlay ---------- */
  const adminDialog = adminAction ? (
    <AdminActionDialog
      action={adminAction}
      admin={accountant}
      onClose={() => setAdminAction(null)}
      onDone={() => {
        setAdminAction(null);
        void load(true);
      }}
    />
  ) : null;

  const printOverlay = printSpec ? (
    <PrintFrame onClose={() => setPrintSpec(null)}>
      {printSpec.kind === 'receipt' ? (
        <ReceiptDocument
          payment={printSpec.payment}
          student={student}
          lookups={lookups}
        />
      ) : (
        <VoucherSlip
          voucher={printSpec.voucher}
          student={student}
          lookups={lookups}
        />
      )}
    </PrintFrame>
  ) : null;

  /* ---------- success ---------- */
  if (view === 'success' && lastPayment) {
    const { payment, allocations } = lastPayment;
    return (
      <div className="space-y-3">
        {printOverlay}
        <SchoolCard className="text-center space-y-2 py-5">
          <CheckCircle2 className="w-12 h-12 text-[#2E9E5B] mx-auto" />
          <h2 className="font-heading text-base font-bold text-[#14284B]">
            {t('acc_success_title')}
          </h2>
          <div dir="ltr" className="font-mono text-2xl font-bold text-[#14284B]">
            {formatRupees(payment.amount)}
          </div>
          <div className="text-xs text-[#6B7385]">
            {t('acc_receipt_col')}: <span dir="ltr" className="font-mono font-bold">{payment.receiptNo}</span>
          </div>
        </SchoolCard>
        {studentHeader}
        <SchoolCard className="space-y-2">
          <h3 className="text-xs font-bold text-[#14284B]">{t('acc_applied_to_heading')}</h3>
          {allocations.length === 0 ? (
            <p className="text-xs text-[#6B7385]">—</p>
          ) : (
            allocations.map((a) => {
              const v = voucherById(a.voucherId);
              return (
                <div key={a.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    <span dir="ltr" className="font-mono">{v?.voucherNo ?? ''}</span>{' '}
                    {v ? `· ${formatYearMonthLabel(v.billingMonth, t)} · ` : ''}
                    {feeHeadName(a.feeHeadId ?? '', '', lookups, language)}
                  </span>
                  <span dir="ltr" className="font-mono font-bold text-[#14284B] shrink-0">
                    {formatRupees(a.allocatedAmount)}
                  </span>
                </div>
              );
            })
          )}
        </SchoolCard>
        <PrimaryButton
          text={t('print_receipt_button')}
          variant="navy"
          icon={<Printer className="w-4 h-4 text-[#F28C28]" />}
          onClick={() => setPrintSpec({ kind: 'receipt', payment })}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <PrimaryButton
            text={t('acc_new_payment_btn')}
            variant="orange"
            onClick={openForm}
            disabled={totalPending <= 0}
          />
          <PrimaryButton
            text={t('acc_account_title')}
            variant="outline"
            onClick={() => setView('account')}
          />
        </div>
      </div>
    );
  }

  /* ---------- payment form ---------- */
  if (view === 'form') {
    return (
      <div className="space-y-3">
        {backBar(t('back_button_label'), () => setView('account'))}
        {studentHeader}
        <SchoolCard className="space-y-1 text-center py-3">
          <div className="text-[11px] font-semibold text-[#6B7385]">
            {t('acc_pending_balance_label')}
          </div>
          <div dir="ltr" className="font-mono text-xl font-bold text-[#D64545]">
            {formatRupees(totalPending)}
          </div>
        </SchoolCard>
        <SchoolCard className="space-y-3.5">
          <SchoolTextField
            label={t('acc_amount_label')}
            value={amountText}
            onValueChange={(v) => setAmountText(v.replace(/[^\d]/g, ''))}
            errorText={fieldErrors.amount}
            forceLtrValue
          />
          <button
            type="button"
            onClick={() => setAmountText(String(totalPending))}
            className="text-xs font-semibold text-[#F28C28] cursor-pointer"
          >
            {t('acc_pay_full_btn')}
          </button>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1B2233]">
              {t('acc_method_label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`min-h-[44px] rounded-xl text-xs font-semibold border cursor-pointer ${
                    method === m
                      ? 'bg-[#14284B] text-white border-[#14284B]'
                      : 'bg-white text-[#14284B] border-[#E4E8F0]'
                  }`}
                >
                  {t(`method_${m}` as StringKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#1B2233]">
              {t('acc_payment_date_label')}
            </label>
            <input
              type="date"
              dir="ltr"
              value={paidOn}
              max={today()}
              onChange={(e) => setPaidOn(e.target.value)}
              className="w-full min-h-[48px] px-3.5 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm"
            />
            {fieldErrors.date && (
              <p className="text-xs font-medium text-[#D64545]">{fieldErrors.date}</p>
            )}
          </div>

          {method !== PaymentMethod.CASH && (
            <div className="space-y-1">
              <SchoolTextField
                label={t('acc_reference_label')}
                value={reference}
                onValueChange={setReference}
                errorText={fieldErrors.reference}
                forceLtrValue
              />
              <p className="text-[11px] text-[#6B7385]">{t('acc_reference_hint')}</p>
            </div>
          )}

          <SchoolTextField
            label={t('acc_remarks_label')}
            value={remarks}
            onValueChange={setRemarks}
          />

          {formError && (
            <p className="text-xs font-medium text-[#D64545] flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </p>
          )}
          <PrimaryButton
            text={t('acc_save_payment_btn')}
            variant="orange"
            loading={saving}
            onClick={() => void submitPayment()}
            icon={<Wallet className="w-4 h-4" />}
          />
        </SchoolCard>
      </div>
    );
  }

  /* ---------- voucher detail ---------- */
  if (view === 'voucher') {
    const voucher = vouchers.find((v) => v.id === selectedVoucherId);
    if (!voucher) {
      return (
        <div className="space-y-3">
          {backBar(t('back_button_label'), () => setView('account'))}
          <EmptyState title={t('error_loading_title')} description="" />
        </div>
      );
    }
    const totals = voucherTotals(voucher);
    const related = payments.filter((p) =>
      (p.allocations ?? []).some((a) => a.voucherId === voucher.id)
    );
    return (
      <div className="space-y-3">
        {printOverlay}
        {adminDialog}
        {backBar(t('back_button_label'), () => setView('account'))}
        <SchoolCard className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold text-[#6B7385]">
                {t('fee_voucher_detail_title')}
              </div>
              <div dir="ltr" className="font-mono text-sm font-bold text-[#14284B] text-start">
                {voucher.voucherNo}
              </div>
              <div className="text-xs text-[#6B7385]">
                {formatYearMonthLabel(voucher.billingMonth, t)} · {t('acc_gen_due_label')}:{' '}
                {formatSchoolDate(voucher.dueDate)}
              </div>
            </div>
            <VoucherStatusBadge status={voucher.status} />
          </div>
          {voucher.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs border-t border-[#E4E8F0] pt-1.5">
              <span className="min-w-0">{feeHeadName(it.feeHeadId, it.description, lookups, language)}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span dir="ltr" className="font-mono font-bold text-[#14284B]">
                  {formatRupees(Math.max(0, it.amount - it.waivedAmount))}
                </span>
                {isAdmin && (it.amount - (it.paidAmount ?? 0) > 0 || it.waivedAmount > 0) && (
                  <button type="button" className="text-[11px] font-bold text-[#F28C28] cursor-pointer min-h-[32px] px-1" onClick={() => setAdminAction({ kind: 'waive', voucher, feeHeadId: it.feeHeadId, amount: it.amount, paid: it.paidAmount ?? 0, waived: it.waivedAmount })}>
                    {t('ad_waive_btn')}
                  </button>
                )}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs border-t border-[#E4E8F0] pt-1.5">
            <span className="font-semibold">{t('fee_card_pending')}</span>
            <span dir="ltr" className="font-mono font-bold text-[#D64545]">
              {formatRupees(totals.balance)}
            </span>
          </div>
        </SchoolCard>
        <PrimaryButton
          text={t('print_trigger_now')}
          variant="navy"
          icon={<Printer className="w-4 h-4 text-[#F28C28]" />}
          onClick={() => setPrintSpec({ kind: 'voucher', voucher })}
        />
        <SchoolCard className="space-y-2">
          <h3 className="text-xs font-bold text-[#14284B]">{t('fee_voucher_payments_heading')}</h3>
          {related.length === 0 ? (
            <p className="text-xs text-[#6B7385]">{t('fee_voucher_no_payments')}</p>
          ) : (
            related.map((p) => (
              <PaymentRow key={p.id} payment={p} lookups={lookups} onPrint={() => setPrintSpec({ kind: 'receipt', payment: p })} onVoid={isAdmin ? () => setAdminAction({ kind: 'void', payment: p }) : undefined} />
            ))
          )}
          <p className="text-[11px] text-[#6B7385]">{t('acc_void_note')}</p>
        </SchoolCard>
      </div>
    );
  }

  /* ---------- account (default) ---------- */
  return (
    <div className="space-y-3">
      {printOverlay}
      {adminDialog}
      {backBar(t('acc_back_to_search_btn'), onBack)}
      {studentHeader}
      <FeeSummaryCards summary={summary} />
      <PrimaryButton
        text={t('acc_receive_payment_btn')}
        variant="orange"
        icon={<Wallet className="w-4 h-4" />}
        onClick={openForm}
        disabled={totalPending <= 0}
      />
      {totalPending <= 0 && (
        <p className="text-xs text-center text-[#2E9E5B] font-semibold">{t('acc_no_dues_tag')}</p>
      )}

      <h3 className="text-xs font-bold text-[#14284B] pt-1">{t('fee_vouchers_section_title')}</h3>
      {vouchers.length === 0 ? (
        <EmptyState title={t('acc_vouchers_none_title')} description="" />
      ) : (
        vouchers.map((v) => {
          const tot = voucherTotals(v);
          return (
            <SchoolCard
              key={v.id}
              className="p-3 flex items-center justify-between gap-2"
              onClick={() => {
                setSelectedVoucherId(v.id);
                setView('voucher');
              }}
            >
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#14284B]">
                  {formatYearMonthLabel(v.billingMonth, t)}
                </div>
                <div dir="ltr" className="text-[11px] text-[#6B7385] font-mono text-start">
                  {v.voucherNo} · {formatRupees(tot.balance)} {t('acc_pending_word')}
                </div>
              </div>
              <VoucherStatusBadge status={v.status} />
            </SchoolCard>
          );
        })
      )}

      <h3 className="text-xs font-bold text-[#14284B] pt-1">{t('fee_payment_history_title')}</h3>
      {payments.length === 0 ? (
        <p className="text-xs text-[#6B7385]">—</p>
      ) : (
        <SchoolCard className="space-y-2">
          {payments.map((p) => (
            <PaymentRow key={p.id} payment={p} lookups={lookups} onPrint={() => setPrintSpec({ kind: 'receipt', payment: p })} onVoid={isAdmin ? () => setAdminAction({ kind: 'void', payment: p }) : undefined} />
          ))}
        </SchoolCard>
      )}
    </div>
  );
};

const PaymentRow: React.FC<{
  payment: FeePayment;
  lookups: AccountantLookups;
  onPrint: () => void;
  onVoid?: () => void;
}> = ({ payment, lookups, onPrint, onVoid }) => {
  const { stringResource: t, language } = useStringResource();
  return (
    <div className={`flex items-center justify-between gap-2 text-xs ${payment.isVoid ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <div className="font-semibold text-[#14284B]">
          <span dir="ltr" className="font-mono">{payment.receiptNo}</span>
          {payment.isVoid && (
            <span className="ms-1.5 px-1.5 py-0.5 rounded-md bg-[#D64545]/15 text-[#D64545] text-[10px] font-bold">
              {t('acc_void_badge')}
            </span>
          )}
        </div>
        <div className="text-[11px] text-[#6B7385]">
          {formatSchoolDate(payment.paidOn)} · {t(`method_${payment.method}` as StringKey)} ·{' '}
          {staffName(payment.receivedBy, lookups, language)}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span dir="ltr" className={`font-mono font-bold ${payment.isVoid ? 'line-through' : 'text-[#14284B]'}`}>
          {formatRupees(payment.amount)}
        </span>
        {!payment.isVoid && (
          <button type="button" onClick={onPrint} aria-label={t('print_receipt_button')} className="p-1.5 rounded-lg hover:bg-[#F6F8FC] cursor-pointer">
            <Printer className="w-4 h-4 text-[#F28C28]" />
          </button>
        )}
        {!payment.isVoid && onVoid && (
          <button type="button" onClick={onVoid} aria-label={t('ad_void_btn')} className="p-1.5 rounded-lg hover:bg-[#F6F8FC] cursor-pointer">
            <Ban className="w-4 h-4 text-[#D64545]" />
          </button>
        )}
      </div>
    </div>
  );
};

type AdminAction =
  | { kind: 'void'; payment: FeePayment }
  | { kind: 'waive'; voucher: FeeVoucher; feeHeadId: string; amount: number; paid: number; waived: number };

/** Admin-only: void a payment or waive part of a fee item. A reason is mandatory and goes to the audit log. */
const AdminActionDialog: React.FC<{
  action: AdminAction;
  admin: Profile;
  onClose: () => void;
  onDone: () => void;
}> = ({ action, admin, onClose, onDone }) => {
  const { stringResource: t } = useStringResource();
  const maxWaive = action.kind === 'waive' ? Math.max(0, action.amount - action.paid) : 0;
  const [amount, setAmount] = useState(action.kind === 'waive' ? String(action.waived) : '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setError(null);
    if (!reason.trim()) return setError(t('st_err_reason'));
    setBusy(true);
    let res;
    if (action.kind === 'void') {
      res = await AppModule.feeRepository.voidPayment(admin, action.payment.id, reason);
    } else {
      const n = amount.trim() === '' ? NaN : Number(amount);
      if (!Number.isInteger(n) || n < 0 || n > maxWaive) {
        setBusy(false);
        return setError(t('ad_waive_err'));
      }
      res = await AppModule.feeRepository.waiveItem(admin, action.voucher.id, action.feeHeadId, n, reason);
    }
    setBusy(false);
    if (!res.ok) return setError(res.error.message);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14284B]/45 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E4E8F0] p-5 shadow-xl space-y-3">
        <h3 className="font-heading text-sm font-bold text-[#14284B]">
          {action.kind === 'void' ? t('ad_void_title') : t('ad_waive_title')}
        </h3>
        {action.kind === 'void' ? (
          <p className="text-xs text-[#6B7385]">
            <span dir="ltr" className="font-mono font-bold">{action.payment.receiptNo}</span> · <span dir="ltr">{formatRupees(action.payment.amount)}</span>
            <br />{t('ad_void_note')}
          </p>
        ) : (
          <>
            <SchoolTextField label={t('ad_waive_amount')} value={amount} onValueChange={setAmount} forceLtrValue />
            <p className="text-[11px] text-[#6B7385]">{t('ad_waive_max')} <span dir="ltr" className="font-mono font-bold">{formatRupees(maxWaive)}</span></p>
          </>
        )}
        <SchoolTextField label={t('ad_reason_label')} value={reason} onValueChange={setReason} />
        {error && <p className="text-xs font-medium text-[#D64545]">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <PrimaryButton text={t('acc_cancel_btn')} variant="outline" onClick={onClose} />
          <PrimaryButton text={t('ad_confirm_btn')} variant="orange" loading={busy} onClick={() => void confirm()} />
        </div>
      </div>
    </div>
  );
};
