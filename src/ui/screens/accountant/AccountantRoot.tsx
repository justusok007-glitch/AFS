import React from 'react';
import { Profile } from '../../../domain/models/models';
import { useAccountantLookups } from './AccountantShared';
import { AccountantCollectTab } from './AccountantCollectTab';
import { AccountantVouchersTab } from './AccountantVouchersTab';

export interface AccountantRootProps {
  accountant: Profile;
  tabId: string;
}

/** Owns the shared lookups so every accountant tab loads them once. */
export const AccountantRoot: React.FC<AccountantRootProps> = ({
  accountant,
  tabId,
}) => {
  const lookups = useAccountantLookups();
  if (tabId === 'collect') {
    return <AccountantCollectTab accountant={accountant} lookups={lookups} />;
  }
  if (tabId === 'vouchers') {
    return <AccountantVouchersTab accountant={accountant} lookups={lookups} />;
  }
  return null;
};
