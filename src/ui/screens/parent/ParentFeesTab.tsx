import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  Receipt,
  Wallet,
  X,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { subscribeToClock } from '../../../domain/clock';
import {
  formatRupees,
  formatSchoolDate,
} from '../../../domain/formatters/SchoolFormatters';
import {
  FeeHead,
  FeePayment,
  FeeVoucher,
  SchoolClass,
  Section,
  Student,
  StudentFeeSummary,
} from '../../../domain/models/models';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { SchoolLogo } from '../../components/SchoolLogo';
import { useStringResource } from '../../theme/LocaleContext';
import {
  formatPaymentMethodLabel,
  formatYearMonthLabel,
  PullToRefreshContainer,
  VoucherStatusBadge,
} from './ParentHelpers';

export interface ParentFeesTabProps {
  selectedChild: Student;
  schoolClass?: SchoolClass;
  section?: Section;
}

type PrintDocumentSpec =
  | { kind: 'voucher'; voucher: FeeVoucher }
  | { kind: 'receipt'; payment: FeePayment; allocatedVoucherNo?: string };

export const ParentFeesTab: React.FC<ParentFeesTabProps> = ({
  selectedChild,
  schoolClass,
  section,
}) => {
  const { stringResource, language, isRtl } = useStringResource();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [feeSummary, setFeeSummary] = useState<StudentFeeSummary | null>(null);
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [feeHeadsMap, setFeeHeadsMap] = useState<Record<string, FeeHead>>({});

  // Detail view for a selected voucher
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(
    null
  );

  // Print preview modal (Voucher or Receipt)
  const [printDoc, setPrintDoc] = useState<PrintDocumentSpec | null>(null);

  const loadChildFeesData = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const [summaryRes, vouchersRes, paymentsRes, headsRes] =
          await Promise.all([
            AppModule.feeRepository.feeSummaryForStudent(selectedChild.id),
            AppModule.feeRepository.getVouchersForStudent(selectedChild.id),
            AppModule.feeRepository.getPaymentsForStudent(selectedChild.id),
            AppModule.feeRepository.getFeeHeads(),
          ]);

        if (!summaryRes.ok) {
          setErrorMessage(summaryRes.error.message);
          return;
        }
        if (!vouchersRes.ok) {
          setErrorMessage(vouchersRes.error.message);
          return;
        }
        if (!paymentsRes.ok) {
          setErrorMessage(paymentsRes.error.message);
          return;
        }

        const fhMap: Record<string, FeeHead> = {};
        if (headsRes.ok) {
          headsRes.data.forEach((fh) => {
            fhMap[fh.id] = fh;
          });
        }

        setFeeHeadsMap(fhMap);
        setFeeSummary(summaryRes.data);
        setVouchers(vouchersRes.data);
        // Never show voided payments to parents
        setPayments(paymentsRes.data.filter((p) => !p.isVoid));
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unexpected error'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedChild.id]
  );

  useEffect(() => {
    setSelectedVoucherId(null);
    setPrintDoc(null);
    loadChildFeesData(false);
  }, [loadChildFeesData]);

  useEffect(() => {
    return subscribeToClock(() => {
      loadChildFeesData(false);
    });
  }, [loadChildFeesData]);

  const classSectionText = (() => {
    const className = schoolClass
      ? language === 'ur'
        ? schoolClass.nameUr
        : schoolClass.nameEn
      : selectedChild.sectionId;
    const secName = section ? `-${section.name}` : '';
    return `${className}${secName}`;
  })();

  const campusText =
    selectedChild.campusId === 'campus_b'
      ? stringResource('campus_boys')
      : stringResource('campus_girls');

  const getFeeHeadDisplayName = (
    feeHeadId: string,
    fallbackDesc: string
  ): string => {
    const head = feeHeadsMap[feeHeadId];
    if (!head) return fallbackDesc;
    return language === 'ur' ? head.nameUr : head.nameEn;
  };

  const getVoucherTotals = (v: FeeVoucher) => {
    const totalGross = v.items.reduce((s, it) => s + it.amount, 0);
    const totalWaived = v.items.reduce((s, it) => s + it.waivedAmount, 0);
    const totalNet = v.items.reduce(
      (s, it) => s + Math.max(0, it.amount - it.waivedAmount),
      0
    );
    const totalPaid = v.items.reduce((s, it) => s + (it.paidAmount ?? 0), 0);
    const balance = Math.max(0, totalNet - totalPaid);
    return { totalGross, totalWaived, totalNet, totalPaid, balance };
  };

  const getPaymentsForVoucher = (v: FeeVoucher): FeePayment[] => {
    return payments.filter((p) => {
      if (p.allocations && p.allocations.length > 0) {
        return p.allocations.some((a) => a.voucherId === v.id);
      }
      return p.paidOn.startsWith(v.billingMonth);
    });
  };

  const triggerPrintDocument = (spec: PrintDocumentSpec) => {
    setPrintDoc(spec);
    window.setTimeout(() => {
      window.print();
    }, 180);
  };

  if (loading) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={3} showHeader />
      </div>
    );
  }

  if (errorMessage || !feeSummary) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={stringResource('error_loading_subtitle')}
        actionLabel={stringResource('retry_button')}
        onAction={() => loadChildFeesData(false)}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const selectedVoucher =
    vouchers.find((v) => v.id === selectedVoucherId) ?? null;

  return (
    <>
      <div className={printDoc ? 'no-print' : ''}>
        {/* ==================== VOUCHER DETAIL PAGE ==================== */}
        {selectedVoucher ? (
          <div className="space-y-3.5">
            {/* Back & Print Header Card */}
            <SchoolCard className="flex items-center justify-between gap-2 py-3 px-3.5">
              <button
                type="button"
                onClick={() => setSelectedVoucherId(null)}
                className="min-h-[38px] px-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] text-[#14284B] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#14284B]/8 transition-colors cursor-pointer"
              >
                {isRtl ? (
                  <ArrowRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowLeft className="w-3.5 h-3.5" />
                )}
                <span>{stringResource('back_button_label')}</span>
              </button>

              <VoucherStatusBadge status={selectedVoucher.status} />
            </SchoolCard>

            {(() => {
              const totals = getVoucherTotals(selectedVoucher);
              const voucherPayments = getPaymentsForVoucher(selectedVoucher);
              const hasAnyWaived = selectedVoucher.items.some(
                (it) => it.waivedAmount > 0
              );

              return (
                <>
                  {/* Voucher Metadata Card */}
                  <SchoolCard className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-[#6B7385]">
                          {stringResource('fee_voucher_detail_title')}
                        </div>
                        <h3 className="font-heading text-base font-bold text-[#14284B]">
                          {formatYearMonthLabel(
                            selectedVoucher.billingMonth,
                            stringResource
                          )}
                        </h3>
                      </div>
                      <span
                        dir="ltr"
                        className="px-2.5 py-1 rounded-xl bg-[#14284B] text-white font-mono text-xs font-bold"
                      >
                        {selectedVoucher.voucherNo}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#E4E8F0] text-xs">
                      <div className="p-2.5 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0]">
                        <div className="text-[11px] text-[#6B7385]">
                          {stringResource('fee_issue_date_label')}
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono font-bold text-[#14284B] mt-0.5 text-start"
                        >
                          {formatSchoolDate(selectedVoucher.issueDate)}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0]">
                        <div className="text-[11px] text-[#6B7385]">
                          {stringResource('fee_due_date_label')}
                        </div>
                        <div
                          dir="ltr"
                          className="font-mono font-bold text-[#14284B] mt-0.5 text-start"
                        >
                          {formatSchoolDate(selectedVoucher.dueDate)}
                        </div>
                      </div>
                    </div>

                    {/* Itemized Fee List */}
                    <div className="pt-2 border-t border-[#E4E8F0] space-y-2">
                      <div className="font-heading text-xs font-bold text-[#14284B]">
                        {stringResource('fee_items_heading')}
                      </div>

                      <div className="space-y-2">
                        {selectedVoucher.items.map((item, idx) => {
                          const netItem = Math.max(
                            0,
                            item.amount - item.waivedAmount
                          );
                          return (
                            <div
                              key={`${item.feeHeadId}_${idx}`}
                              className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-[#1B2233]">
                                  {getFeeHeadDisplayName(
                                    item.feeHeadId,
                                    item.description
                                  )}
                                </span>
                                <span
                                  dir="ltr"
                                  className="font-mono text-xs font-bold text-[#14284B] tabular-nums"
                                >
                                  {formatRupees(netItem)}
                                </span>
                              </div>

                              {(hasAnyWaived || item.waivedAmount > 0) && (
                                <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B7385]">
                                  <span>
                                    {stringResource('fee_item_amount_col')}:{' '}
                                    <span dir="ltr" className="font-mono">
                                      {formatRupees(item.amount)}
                                    </span>
                                  </span>
                                  {item.waivedAmount > 0 && (
                                    <span className="text-[#2E9E5B] font-semibold">
                                      {stringResource('fee_item_waived_col')}:{' '}
                                      <span dir="ltr" className="font-mono">
                                        -{formatRupees(item.waivedAmount)}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Voucher Totals Summary: Total, Amount Paid, Balance */}
                    <div className="pt-3 border-t border-[#E4E8F0] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#6B7385]">
                          {stringResource('fee_total_label')}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-[#14284B] tabular-nums"
                        >
                          {formatRupees(totals.totalNet)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#6B7385]">
                          {stringResource('fee_amount_paid_label')}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-[#2E9E5B] tabular-nums"
                        >
                          {formatRupees(totals.totalPaid)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E4E8F0] text-sm">
                        <span className="font-heading font-bold text-[#14284B]">
                          {stringResource('fee_balance_label')}
                        </span>
                        <span
                          dir="ltr"
                          className={`font-heading font-bold tabular-nums ${
                            totals.balance > 0
                              ? 'text-[#F28C28]'
                              : 'text-[#2E9E5B]'
                          }`}
                        >
                          {formatRupees(totals.balance)}
                        </span>
                      </div>
                    </div>

                    <PrimaryButton
                      text={stringResource('print_save_pdf_button')}
                      variant="orange"
                      icon={<Printer className="w-4 h-4" />}
                      onClick={() =>
                        triggerPrintDocument({
                          kind: 'voucher',
                          voucher: selectedVoucher,
                        })
                      }
                    />
                  </SchoolCard>

                  {/* Payments Received Against This Voucher */}
                  <SchoolCard className="space-y-3">
                    <div className="font-heading text-xs font-bold text-[#14284B] flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#F28C28]" />
                      <span>
                        {stringResource('fee_voucher_payments_heading')}
                      </span>
                    </div>

                    {voucherPayments.length === 0 ? (
                      <p className="text-xs text-[#6B7385] py-2">
                        {stringResource('fee_voucher_no_payments')}
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {voucherPayments.map((pay) => (
                          <div
                            key={pay.id}
                            className="p-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <div
                                  dir="ltr"
                                  className="font-mono text-xs font-bold text-[#14284B] text-start"
                                >
                                  {pay.receiptNo}
                                </div>
                                <div className="text-[11px] text-[#6B7385] flex items-center gap-1.5 mt-0.5">
                                  <span dir="ltr" className="font-mono">
                                    {formatSchoolDate(pay.paidOn)}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {formatPaymentMethodLabel(
                                      pay.method,
                                      stringResource
                                    )}
                                  </span>
                                </div>
                              </div>

                              <span
                                dir="ltr"
                                className="font-heading text-sm font-bold text-[#2E9E5B] tabular-nums"
                              >
                                {formatRupees(pay.amount)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                triggerPrintDocument({
                                  kind: 'receipt',
                                  payment: pay,
                                  allocatedVoucherNo: selectedVoucher.voucherNo,
                                })
                              }
                              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E4E8F0] text-[#14284B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#14284B]/6 transition-colors cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#F28C28]" />
                              <span>
                                {stringResource('print_receipt_button')}
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </SchoolCard>
                </>
              );
            })()}
          </div>
        ) : (
          /* ==================== MAIN FEES OVERVIEW ==================== */
          <PullToRefreshContainer
            refreshing={refreshing}
            onRefresh={() => loadChildFeesData(true)}
          >
            {/* 1. Six Summary Cards in a 2-Column Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Monthly Fee */}
              <SchoolCard className="space-y-1.5">
                <div className="text-xs font-medium text-[#6B7385] truncate">
                  {stringResource('fee_card_monthly')}
                </div>
                <div
                  dir="ltr"
                  className="font-heading text-lg font-bold text-[#14284B] tabular-nums text-start"
                >
                  {formatRupees(feeSummary.monthlyFee)}
                </div>
              </SchoolCard>

              {/* Card 2: Paid This Month (in green) */}
              <SchoolCard className="space-y-1.5">
                <div className="text-xs font-medium text-[#6B7385] truncate">
                  {stringResource('fee_card_paid')}
                </div>
                <div
                  dir="ltr"
                  className="font-heading text-lg font-bold text-[#2E9E5B] tabular-nums text-start"
                >
                  {formatRupees(feeSummary.paidThisMonth)}
                </div>
              </SchoolCard>

              {/* Card 3: Pending (in orange) */}
              <SchoolCard className="space-y-1.5">
                <div className="text-xs font-medium text-[#6B7385] truncate">
                  {stringResource('fee_card_pending')}
                </div>
                <div
                  dir="ltr"
                  className="font-heading text-lg font-bold text-[#F28C28] tabular-nums text-start"
                >
                  {formatRupees(feeSummary.pending)}
                </div>
              </SchoolCard>

              {/* Card 4: Previous Arrears (in red when above zero) */}
              <SchoolCard className="space-y-1.5">
                <div className="text-xs font-medium text-[#6B7385] truncate">
                  {stringResource('fee_card_arrears')}
                </div>
                <div
                  dir="ltr"
                  className={`font-heading text-lg font-bold tabular-nums text-start ${
                    feeSummary.previousArrears > 0
                      ? 'text-[#D64545]'
                      : 'text-[#14284B]'
                  }`}
                >
                  {formatRupees(feeSummary.previousArrears)}
                </div>
              </SchoolCard>

              {/* Card 5: Annual Charges (with Paid/Unpaid badge) */}
              <SchoolCard className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-[#6B7385] truncate">
                    {stringResource('fee_card_annual')}
                  </span>
                  <VoucherStatusBadge status={feeSummary.annualChargesStatus} />
                </div>
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#14284B] tabular-nums text-start"
                >
                  {formatRupees(feeSummary.annualChargesAmount)}
                </div>
              </SchoolCard>

              {/* Card 6: Admission Fee (with Paid/Unpaid badge) */}
              <SchoolCard className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-medium text-[#6B7385] truncate">
                    {stringResource('fee_card_admission')}
                  </span>
                  <VoucherStatusBadge status={feeSummary.admissionFeeStatus} />
                </div>
                <div
                  dir="ltr"
                  className="font-heading text-base font-bold text-[#14284B] tabular-nums text-start"
                >
                  {formatRupees(feeSummary.admissionFeeAmount)}
                </div>
              </SchoolCard>
            </div>

            {/* 2. Vouchers List (Newest First) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-heading text-xs font-bold text-[#14284B] flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-[#F28C28]" />
                  <span>{stringResource('fee_vouchers_section_title')}</span>
                </h3>
                <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">
                  {vouchers.length}
                </span>
              </div>

              {vouchers.length === 0 ? (
                <EmptyState
                  title={stringResource('fee_vouchers_empty_title')}
                  subtitle={stringResource('fee_vouchers_empty_subtitle')}
                />
              ) : (
                <div className="space-y-2.5">
                  {vouchers.map((voucher) => {
                    const totals = getVoucherTotals(voucher);
                    return (
                      <SchoolCard
                        key={voucher.id}
                        onClick={() => setSelectedVoucherId(voucher.id)}
                        className="flex items-center justify-between gap-3 py-3.5 px-4"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm font-bold text-[#14284B] truncate">
                              {formatYearMonthLabel(
                                voucher.billingMonth,
                                stringResource
                              )}
                            </span>
                            <span
                              dir="ltr"
                              className="px-2 py-0.5 rounded-md bg-[#F6F8FC] border border-[#E4E8F0] font-mono text-[11px] font-semibold text-[#14284B]"
                            >
                              {voucher.voucherNo}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6B7385] flex items-center gap-1.5">
                            <span>{stringResource('fee_due_date_label')}:</span>
                            <span dir="ltr" className="font-mono">
                              {formatSchoolDate(voucher.dueDate)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="text-end space-y-1">
                            <div
                              dir="ltr"
                              className="font-heading text-sm font-bold text-[#14284B] tabular-nums"
                            >
                              {formatRupees(totals.totalNet)}
                            </div>
                            <VoucherStatusBadge status={voucher.status} />
                          </div>
                          {isRtl ? (
                            <ChevronLeft className="w-4 h-4 text-[#6B7385]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#6B7385]" />
                          )}
                        </div>
                      </SchoolCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Payment History (Newest First, Voided Payments Excluded) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-heading text-xs font-bold text-[#14284B] flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-[#F28C28]" />
                  <span>{stringResource('fee_payment_history_title')}</span>
                </h3>
                <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">
                  {payments.length}
                </span>
              </div>

              {payments.length === 0 ? (
                <EmptyState
                  title={stringResource('fee_payment_history_empty_title')}
                  subtitle={stringResource(
                    'fee_payment_history_empty_subtitle'
                  )}
                />
              ) : (
                <div className="space-y-2.5">
                  {payments.map((payment) => (
                    <SchoolCard key={payment.id} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div
                            dir="ltr"
                            className="font-mono text-xs font-bold text-[#14284B] text-start"
                          >
                            {payment.receiptNo}
                          </div>
                          <div className="text-[11px] text-[#6B7385] flex items-center gap-1.5 mt-0.5">
                            <span dir="ltr" className="font-mono">
                              {formatSchoolDate(payment.paidOn)}
                            </span>
                            <span>·</span>
                            <span>
                              {formatPaymentMethodLabel(
                                payment.method,
                                stringResource
                              )}
                            </span>
                          </div>
                        </div>

                        <div
                          dir="ltr"
                          className="font-heading text-base font-bold text-[#2E9E5B] tabular-nums"
                        >
                          {formatRupees(payment.amount)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          triggerPrintDocument({
                            kind: 'receipt',
                            payment,
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] text-[#14284B] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#14284B]/8 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#F28C28]" />
                        <span>{stringResource('print_receipt_button')}</span>
                      </button>
                    </SchoolCard>
                  ))}
                </div>
              )}
            </div>
          </PullToRefreshContainer>
        )}
      </div>

      {/* ==================== PRINT-FRIENDLY VOUCHER / RECEIPT OVERLAY ==================== */}
      {printDoc && (
        <div
          className="fixed inset-0 z-50 bg-[#14284B]/55 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E4E8F0] shadow-2xl p-5 space-y-4 print-sheet">
            {/* Top Action Bar (Hidden in Print) */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E4E8F0] no-print">
              <PrimaryButton
                text={stringResource('print_trigger_now')}
                variant="orange"
                fullWidth={false}
                icon={<Printer className="w-4 h-4" />}
                onClick={() => window.print()}
              />
              <button
                type="button"
                onClick={() => setPrintDoc(null)}
                className="min-h-[40px] px-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] text-[#14284B] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#E4E8F0]/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>{stringResource('print_close_preview')}</span>
              </button>
            </div>

            {/* Print Header: Exact PNG Logo + English & Urdu School Name */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-[#14284B]">
              <div className="flex items-center gap-3">
                <SchoolLogo size={54} />
                <div>
                  <h2 className="font-heading text-base font-bold text-[#14284B] leading-snug">
                    {stringResource('app_name_en_fixed')}
                  </h2>
                  <p
                    dir="rtl"
                    className="font-urdu text-base font-bold text-[#14284B] leading-[2.4] py-0.5"
                  >
                    {stringResource('app_name_ur_fixed')}
                  </p>
                  <p className="text-[10px] text-[#6B7385]">
                    {stringResource('print_school_address')}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Title */}
            <div className="flex items-center justify-between gap-2 bg-[#F6F8FC] px-3 py-2 rounded-xl border border-[#E4E8F0]">
              <span className="font-heading text-xs font-bold text-[#14284B]">
                {printDoc.kind === 'voucher'
                  ? stringResource('print_voucher_document_title')
                  : stringResource('print_receipt_document_title')}
              </span>
              <span
                dir="ltr"
                className="font-mono text-xs font-bold text-[#F28C28]"
              >
                {printDoc.kind === 'voucher'
                  ? printDoc.voucher.voucherNo
                  : printDoc.payment.receiptNo}
              </span>
            </div>

            {/* Student Details Block */}
            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-xl border border-[#E4E8F0]">
              <div>
                <div className="text-[10px] text-[#6B7385]">
                  {stringResource('home_user_name_label')}
                </div>
                <div className="font-heading font-bold text-[#14284B]">
                  {selectedChild.name} ({selectedChild.nameUr})
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7385]">
                  {stringResource('child_admission_no_label')}
                </div>
                <div dir="ltr" className="font-mono font-bold text-[#14284B] text-start">
                  {selectedChild.admissionNo}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7385]">
                  {stringResource('child_class_section_label')}
                </div>
                <div className="font-semibold text-[#1B2233]">
                  {classSectionText}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#6B7385]">
                  {stringResource('child_campus_label')}
                </div>
                <div className="font-semibold text-[#1B2233]">{campusText}</div>
              </div>
            </div>

            {/* Voucher Print Body */}
            {printDoc.kind === 'voucher' &&
              (() => {
                const v = printDoc.voucher;
                const totals = getVoucherTotals(v);
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-xs bg-[#F6F8FC] p-2.5 rounded-xl border border-[#E4E8F0]">
                      <div>
                        <div className="text-[10px] text-[#6B7385]">
                          {stringResource('fee_billing_month_label')}
                        </div>
                        <div className="font-bold text-[#14284B]">
                          {formatYearMonthLabel(v.billingMonth, stringResource)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#6B7385]">
                          {stringResource('fee_issue_date_label')}
                        </div>
                        <div dir="ltr" className="font-mono font-semibold text-start">
                          {formatSchoolDate(v.issueDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#6B7385]">
                          {stringResource('fee_due_date_label')}
                        </div>
                        <div dir="ltr" className="font-mono font-semibold text-start">
                          {formatSchoolDate(v.dueDate)}
                        </div>
                      </div>
                    </div>

                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4E8F0] text-[#6B7385]">
                          <th className="py-1.5 text-start font-semibold">
                            {stringResource('fee_item_head_col')}
                          </th>
                          <th className="py-1.5 text-end font-semibold">
                            {stringResource('fee_item_amount_col')}
                          </th>
                          <th className="py-1.5 text-end font-semibold">
                            {stringResource('fee_item_waived_col')}
                          </th>
                          <th className="py-1.5 text-end font-semibold">
                            {stringResource('fee_item_net_col')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E4E8F0]">
                        {v.items.map((it, idx) => (
                          <tr key={`${it.feeHeadId}_${idx}`}>
                            <td className="py-2 font-medium text-[#1B2233]">
                              {getFeeHeadDisplayName(
                                it.feeHeadId,
                                it.description
                              )}
                            </td>
                            <td
                              dir="ltr"
                              className="py-2 text-end font-mono tabular-nums"
                            >
                              {formatRupees(it.amount)}
                            </td>
                            <td
                              dir="ltr"
                              className="py-2 text-end font-mono tabular-nums text-[#6B7385]"
                            >
                              {formatRupees(it.waivedAmount)}
                            </td>
                            <td
                              dir="ltr"
                              className="py-2 text-end font-mono font-bold tabular-nums text-[#14284B]"
                            >
                              {formatRupees(
                                Math.max(0, it.amount - it.waivedAmount)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="pt-2 border-t-2 border-[#14284B] space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#6B7385]">
                          {stringResource('fee_total_label')}
                        </span>
                        <span dir="ltr" className="font-mono font-bold">
                          {formatRupees(totals.totalNet)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7385]">
                          {stringResource('fee_amount_paid_label')}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-[#2E9E5B]"
                        >
                          {formatRupees(totals.totalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-1 border-t border-[#E4E8F0]">
                        <span className="font-heading font-bold text-[#14284B]">
                          {stringResource('fee_balance_label')}
                        </span>
                        <span
                          dir="ltr"
                          className="font-heading font-bold text-[#14284B]"
                        >
                          {formatRupees(totals.balance)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Receipt Print Body */}
            {printDoc.kind === 'receipt' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7385]">
                      {stringResource('fee_receipt_no_label')}
                    </span>
                    <span dir="ltr" className="font-mono font-bold text-[#14284B]">
                      {printDoc.payment.receiptNo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7385]">
                      {stringResource('fee_payment_date_label')}
                    </span>
                    <span dir="ltr" className="font-mono font-semibold">
                      {formatSchoolDate(printDoc.payment.paidOn)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B7385]">
                      {stringResource('fee_payment_method_label')}
                    </span>
                    <span className="font-semibold text-[#14284B]">
                      {formatPaymentMethodLabel(
                        printDoc.payment.method,
                        stringResource
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E4E8F0] text-sm">
                    <span className="font-heading font-bold text-[#14284B]">
                      {stringResource('fee_payment_amount_label')}
                    </span>
                    <span
                      dir="ltr"
                      className="font-heading font-bold text-[#2E9E5B]"
                    >
                      {formatRupees(printDoc.payment.amount)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-[#E4E8F0] text-center text-[10px] text-[#6B7385]">
              {stringResource('print_computer_generated_note')}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
