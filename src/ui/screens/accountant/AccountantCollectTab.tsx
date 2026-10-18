import React, { useEffect, useState } from 'react';
import { AlertCircle, Search, Wallet } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { formatRupees } from '../../../domain/formatters/SchoolFormatters';
import { Profile, Student } from '../../../domain/models/models';
import {
  EmptyState,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
  StatusChip,
  TabRow,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  AccountantLookups,
  StudentNameBlock,
  studentClassLabel,
} from './AccountantShared';
import { StudentFeeAccount } from './StudentFeeAccount';

const MAX_RESULTS = 30;

export interface AccountantCollectTabProps {
  accountant: Profile;
  lookups: AccountantLookups;
  /** Student to open directly (used by Defaulters -> Receive payment). */
  initialStudentId?: string | null;
  onInitialConsumed?: () => void;
}

export const AccountantCollectTab: React.FC<AccountantCollectTabProps> = ({
  accountant,
  lookups,
  initialStudentId,
  onInitialConsumed,
}) => {
  const { stringResource: t, language } = useStringResource();
  const [query, setQuery] = useState('');
  const [campusId, setCampusId] = useState<string>('ALL');
  const [classId, setClassId] = useState<string>('ALL');
  const [results, setResults] = useState<Student[]>([]);
  const [pendingByStudent, setPendingByStudent] = useState<Record<string, number>>({});
  const [totalMatches, setTotalMatches] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStudentId ?? null
  );
  const [openForm, setOpenForm] = useState(!!initialStudentId);

  useEffect(() => {
    if (initialStudentId) {
      setSelectedId(initialStudentId);
      setOpenForm(true);
      onInitialConsumed?.();
    }
  }, [initialStudentId, onInitialConsumed]);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= 2 || (classId !== 'ALL');

  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setSearchFailed(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchFailed(false);
      const res = await AppModule.studentRepository.search({
        query: trimmed,
        campusId: campusId === 'ALL' ? null : campusId,
        classId: classId === 'ALL' ? null : classId,
        status: null,
      });
      if (cancelled) return;
      if (!res.ok) {
        setSearchFailed(true);
        setSearching(false);
        return;
      }
      const active = res.data.filter((s) => String(s.status) !== 'LEFT');
      const top = active.slice(0, MAX_RESULTS);
      // pending tags from vouchers (repository owns the maths)
      const vo = await AppModule.feeRepository.getAllVouchers();
      if (cancelled) return;
      const pend: Record<string, number> = {};
      if (vo.ok) {
        for (const v of vo.data) {
          const bal = v.items.reduce(
            (s, it) => s + Math.max(0, it.amount - it.waivedAmount - (it.paidAmount ?? 0)),
            0
          );
          if (bal > 0) pend[v.studentId] = (pend[v.studentId] ?? 0) + bal;
        }
      }
      setPendingByStudent(pend);
      setResults(top);
      setTotalMatches(active.length);
      setSearching(false);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, campusId, classId, canSearch, retryTick]);

  if (selectedId) {
    return (
      <StudentFeeAccount
        studentId={selectedId}
        accountant={accountant}
        lookups={lookups}
        startWithPaymentForm={openForm}
        onBack={() => {
          setSelectedId(null);
          setOpenForm(false);
          setRetryTick((n) => n + 1); // refresh pending tags
        }}
      />
    );
  }

  const campusTabs = [
    { id: 'ALL', label: t('campus_both') },
    ...lookups.campuses.map((c) => ({
      id: c.id,
      label: language === 'ur' ? c.nameUr : c.nameEn,
    })),
  ];
  const classOptions = lookups.classes.filter(
    (c) => campusId === 'ALL' || c.campusId === campusId
  );

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-3">
        <SchoolTextField
          label={t('acc_search_placeholder')}
          value={query}
          onValueChange={setQuery}
          leadingIcon={<Search className="w-4 h-4" />}
        />
        <TabRow
          tabs={campusTabs}
          selected={campusId}
          onSelect={(v) => {
            setCampusId(v);
            setClassId('ALL');
          }}
        />
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="w-full min-h-[44px] px-3 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] text-sm text-[#14284B]"
          aria-label={t('acc_class_col')}
        >
          <option value="ALL">{t('acc_all_classes')}</option>
          {classOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {language === 'ur' ? c.nameUr : c.nameEn}
            </option>
          ))}
        </select>
      </SchoolCard>

      {lookups.loading ? (
        <ShimmerPlaceholder lines={3} showHeader />
      ) : lookups.failed || searchFailed ? (
        <EmptyState
          title={t('error_loading_title')}
          description={t('error_loading_subtitle')}
          actionLabel={t('retry_button')}
          onAction={() => {
            lookups.reload();
            setRetryTick((n) => n + 1);
          }}
          icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
        />
      ) : !canSearch ? (
        <EmptyState
          title={t('acc_search_hint_title')}
          description={t('acc_search_hint_body')}
          icon={<Wallet className="w-6 h-6 text-[#F28C28]" />}
        />
      ) : searching ? (
        <div className="space-y-2">
          <ShimmerPlaceholder lines={2} />
          <ShimmerPlaceholder lines={2} />
          <ShimmerPlaceholder lines={2} />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title={t('acc_no_results_title')}
          description={t('acc_no_results_body')}
          icon={<Search className="w-6 h-6 text-[#F28C28]" />}
        />
      ) : (
        <div className="space-y-2">
          {results.map((s) => {
            const pending = pendingByStudent[s.id] ?? 0;
            return (
              <SchoolCard
                key={s.id}
                className="p-3 flex items-center justify-between gap-3"
                onClick={() => {
                  setOpenForm(false);
                  setSelectedId(s.id);
                }}
              >
                <StudentNameBlock
                  student={s}
                  classLabel={studentClassLabel(s, lookups, language)}
                />
                {pending > 0 ? (
                  <StatusChip
                    label={`${formatRupees(pending)} ${t('acc_pending_word')}`}
                    tone="error"
                  />
                ) : (
                  <StatusChip label={t('acc_no_dues_tag')} tone="success" />
                )}
              </SchoolCard>
            );
          })}
          {totalMatches > MAX_RESULTS && (
            <p className="text-[11px] text-center text-[#6B7385]">
              {t('acc_more_results_note')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
