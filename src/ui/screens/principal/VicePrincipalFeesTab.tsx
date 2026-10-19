import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import { Student } from '../../../domain/models/models';
import { SchoolCard, SchoolTextField } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantLookups, StudentNameBlock, studentClassLabel } from '../accountant/AccountantShared';
import { ParentFeesTab } from '../parent/ParentFeesTab';

/** Vice Principal: individual student fee status only (no school-wide collection figures). */
export const VicePrincipalFeesTab: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t, language, isRtl } = useStringResource();
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await AppModule.studentRepository.search({ query: q, status: null });
      if (!cancelled) setResults(r.ok ? r.data.slice(0, 20) : []);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  if (selected) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm font-semibold text-[#14284B] min-h-[40px] cursor-pointer">
          <BackIcon className="w-4 h-4" />
          <span>{t('back_button_label')}</span>
        </button>
        <SchoolCard>
          <StudentNameBlock student={selected} classLabel={studentClassLabel(selected, lookups, language)} />
        </SchoolCard>
        <ParentFeesTab selectedChild={selected} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SchoolCard className="space-y-2.5">
        <SchoolTextField label={t('acc_search_placeholder')} value={query} onValueChange={setQuery} leadingIcon={<Search className="w-4 h-4" />} />
        <p className="text-[11px] text-[#6B7385]">{t('vp_fees_hint')}</p>
        {query.trim().length >= 2 && results.length === 0 && <p className="text-xs text-[#6B7385]">{t('acc_no_results_title')}</p>}
        {results.map((s) => (
          <button key={s.id} type="button" onClick={() => setSelected(s)} className="w-full text-start border-t border-[#E4E8F0] pt-2 cursor-pointer">
            <StudentNameBlock student={s} classLabel={studentClassLabel(s, lookups, language)} />
          </button>
        ))}
      </SchoolCard>
    </div>
  );
};
