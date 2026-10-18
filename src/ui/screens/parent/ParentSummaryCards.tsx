import React, { useEffect, useState } from 'react';
import { Award, CalendarCheck, CheckCircle2, Wallet } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { today } from '../../../domain/clock';
import { formatRupees, formatSchoolDate } from '../../../domain/formatters/SchoolFormatters';
import {
  ExamStatus,
  FeeVoucher,
  ParentAttendanceSummary,
  Profile,
  Student,
  StudentFeeSummary,
  StudentResultCard,
  VoucherStatus,
} from '../../../domain/models/models';
import { SchoolCard, ShimmerPlaceholder, StatusChip } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { examName } from '../exams/ExamShared';
import { AttendanceProgressRing, AttendanceStatusBadge, formatYearMonthLabel } from './ParentHelpers';

/** This month's attendance (ring + counts) plus today's status. Shown at the top of the Attendance tab. */
export const MonthAttendanceSummaryCard: React.FC<{ child: Student }> = ({ child }) => {
  const { stringResource: t } = useStringResource();
  const [sum, setSum] = useState<ParentAttendanceSummary | null>(null);
  const todayDate = today();
  const month = todayDate.slice(0, 7);
  useEffect(() => {
    let off = false;
    void (async () => {
      const r = await AppModule.attendanceRepository.getParentSummary(child.id, month);
      if (!off) setSum(r.ok ? r.data : null);
    })();
    return () => {
      off = true;
    };
  }, [child.id, month]);

  if (!sum) return <ShimmerPlaceholder lines={3} showHeader />;
  const rec = sum.dailyRecords.find((r) => r.date === todayDate) ?? null;
  const m = sum.monthlyPercentages.find((x) => x.month === month) ?? null;
  const chip = (cls: string, label: string, n: number) => (
    <div className={`px-2.5 py-1.5 rounded-xl font-semibold flex items-center justify-between ${cls}`}>
      <span>{label}</span>
      <span dir="ltr" className="font-mono font-bold">{n}</span>
    </div>
  );
  return (
    <SchoolCard className="space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E4E8F0]">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-1.5 font-heading text-xs font-bold text-[#14284B]">
            <CalendarCheck className="w-4 h-4 text-[#F28C28] shrink-0" />
            <span>{t('home_today_attendance_title')}</span>
          </div>
          <div dir="ltr" className="text-[11px] font-mono text-[#6B7385]">{formatSchoolDate(todayDate)}</div>
        </div>
        <AttendanceStatusBadge status={rec?.status ?? null} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2.5 flex-1 min-w-0">
          <div>
            <div className="font-heading text-xs font-bold text-[#14284B]">{t('home_month_attendance_title')}</div>
            <div className="text-[11px] text-[#6B7385]">{formatYearMonthLabel(month, t)}</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {chip('bg-[#2E9E5B]/10 text-[#2E9E5B]', t('att_status_present'), m?.presentDays ?? 0)}
            {chip('bg-[#D64545]/10 text-[#D64545]', t('att_status_absent'), m?.absentDays ?? 0)}
            {chip('bg-[#2F80ED]/10 text-[#2F80ED]', t('att_status_leave'), m?.leaveDays ?? 0)}
            {chip('bg-[#F2B705]/15 text-[#9E7400]', t('att_status_late'), m?.lateDays ?? 0)}
          </div>
        </div>
        <AttendanceProgressRing percentage={m?.percentage ?? 0} size={104} strokeWidth={9} subtitle={formatYearMonthLabel(month, t, true)} />
      </div>
    </SchoolCard>
  );
};

/** Pending fee balance and oldest due date. Shown at the top of the Fees tab. */
export const FeeStatusSummaryCard: React.FC<{ child: Student }> = ({ child }) => {
  const { stringResource: t } = useStringResource();
  const [fee, setFee] = useState<StudentFeeSummary | null>(null);
  const [vouchers, setVouchers] = useState<FeeVoucher[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let off = false;
    void (async () => {
      const [f, v] = await Promise.all([
        AppModule.feeRepository.feeSummaryForStudent(child.id),
        AppModule.feeRepository.getVouchersForStudent(child.id),
      ]);
      if (off) return;
      setFee(f.ok ? f.data : null);
      setVouchers(v.ok ? v.data : []);
      setLoaded(true);
    })();
    return () => {
      off = true;
    };
  }, [child.id]);

  if (!loaded) return <ShimmerPlaceholder lines={2} showHeader />;
  const pending = fee?.pending ?? 0;
  const oldest = vouchers.filter((v) => v.status !== VoucherStatus.PAID).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return (
    <SchoolCard className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
          <Wallet className="w-4 h-4 text-[#F28C28]" />
          <span>{t('home_fee_status_title')}</span>
        </div>
        {pending > 0 ? (
          <StatusChip label={t('voucher_status_unpaid')} tone="warning" />
        ) : (
          <StatusChip label={t('home_fee_all_paid_title')} tone="success" />
        )}
      </div>
      {pending > 0 ? (
        <div className="p-3.5 rounded-2xl bg-[#F28C28]/8 border border-[#F28C28]/25 flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#6B7385]">{t('home_fee_pending_label')}</div>
            <div dir="ltr" className="font-heading text-2xl font-bold text-[#F28C28] tabular-nums text-start">{formatRupees(pending)}</div>
          </div>
          {oldest && (
            <div className="text-end space-y-0.5">
              <div className="text-[11px] font-medium text-[#6B7385]">{t('home_fee_oldest_due_label')}</div>
              <div dir="ltr" className="text-xs font-mono font-bold text-[#14284B]">{formatSchoolDate(oldest.dueDate)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[#2E9E5B]/10 border border-[#2E9E5B]/25 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E9E5B] text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-heading text-sm font-bold text-[#2E9E5B]">{t('home_fee_all_paid_title')}</div>
            <p className="text-xs text-[#6B7385]">{t('home_fee_all_paid_subtitle')}</p>
          </div>
        </div>
      )}
    </SchoolCard>
  );
};

/** Most recent published result. Shown at the top of the Results tab. */
export const LatestResultSummaryCard: React.FC<{ parent: Profile; child: Student }> = ({ parent, child }) => {
  const { stringResource: t, language } = useStringResource();
  const [card, setCard] = useState<StudentResultCard | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let off = false;
    void (async () => {
      const ex = await AppModule.examRepository.getExams(child.campusId);
      let found: StudentResultCard | null = null;
      if (ex.ok) {
        for (const e of ex.data.filter((x) => x.status === ExamStatus.PUBLISHED)) {
          const r = await AppModule.examRepository.getStudentResultCard(e.id, child.id, parent);
          if (r.ok) {
            found = r.data;
            break;
          }
        }
      }
      if (off) return;
      setCard(found);
      setLoaded(true);
    })();
    return () => {
      off = true;
    };
  }, [child.id, child.campusId, parent]);

  if (!loaded) return <ShimmerPlaceholder lines={2} showHeader />;
  if (!card) return null;
  return (
    <SchoolCard className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B] min-w-0">
          <Award className="w-4 h-4 text-[#F28C28] shrink-0" />
          <span className="truncate">{t('home_latest_result_title')} · {examName(card.exam, language)}</span>
        </div>
        <StatusChip label={card.passed ? t('rs_pass') : t('rs_fail')} tone={card.passed ? 'success' : 'error'} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#F28C28]">{card.percentage}%</div><div className="text-[10px] text-[#6B7385]">{t('rs_percentage')}</div></div>
        <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#14284B]">{card.grade}</div><div className="text-[10px] text-[#6B7385]">{t('rs_grade')}</div></div>
        <div className="rounded-xl bg-[#F6F8FC] py-2"><div dir="ltr" className="font-heading text-lg font-bold text-[#14284B]">{card.rankInSection !== null ? `${card.rankInSection}/${card.sectionSize}` : `${card.totalObtainedMarks}/${card.totalMaxMarks}`}</div><div className="text-[10px] text-[#6B7385]">{card.rankInSection !== null ? t('rs_position') : t('rs_grand_total')}</div></div>
      </div>
    </SchoolCard>
  );
};
