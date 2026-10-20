import React, { useState } from 'react';
import { PrincipalFeesSummary } from './PrincipalSummaries';
import { TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantDefaultersTab } from '../accountant/AccountantDefaultersTab';
import { AccountantReportsTab } from '../accountant/AccountantReportsTab';
import { AccountantLookups } from '../accountant/AccountantShared';
import { FeeBreakdownCard } from '../accountant/FeeBreakdownCard';

type Sub = 'reports' | 'defaulters';

/** Read-only fee reports for the principal: same engine as the accountant, no payment actions. */
export const PrincipalFeesTab: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t } = useStringResource();
  const [sub, setSub] = useState<Sub>('reports');
  return (
    <div className="space-y-3">
      <FeeBreakdownCard lookups={lookups} />
      <PrincipalFeesSummary lookups={lookups} />
      <TabRow
        tabs={[
          { id: 'reports' as Sub, label: t('pr_fees_reports') },
          { id: 'defaulters' as Sub, label: t('pr_fees_defaulters') },
        ]}
        selected={sub}
        onSelect={setSub}
      />
      {sub === 'reports' ? (
        <AccountantReportsTab lookups={lookups} allowExport={false} />
      ) : (
        <AccountantDefaultersTab lookups={lookups} allowExport={false} />
      )}
    </div>
  );
};
