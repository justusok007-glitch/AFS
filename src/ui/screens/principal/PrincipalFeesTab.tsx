import React, { useState } from 'react';
import { TabRow } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import { AccountantDefaultersTab } from '../accountant/AccountantDefaultersTab';
import { AccountantReportsTab } from '../accountant/AccountantReportsTab';
import { AccountantLookups } from '../accountant/AccountantShared';

type Sub = 'reports' | 'defaulters';

/** Read-only fee reports for the principal: same engine as the accountant, no payment actions. */
export const PrincipalFeesTab: React.FC<{ lookups: AccountantLookups }> = ({ lookups }) => {
  const { stringResource: t } = useStringResource();
  const [sub, setSub] = useState<Sub>('reports');
  return (
    <div className="space-y-3">
      <TabRow
        tabs={[
          { id: 'reports' as Sub, label: t('pr_fees_reports') },
          { id: 'defaulters' as Sub, label: t('pr_fees_defaulters') },
        ]}
        selected={sub}
        onSelect={setSub}
      />
      {sub === 'reports' ? (
        <AccountantReportsTab lookups={lookups} />
      ) : (
        <AccountantDefaultersTab lookups={lookups} />
      )}
    </div>
  );
};
