import React from 'react';
import { Copy, Printer } from 'lucide-react';
import { Profile } from '../../../domain/models/models';
import { PrimaryButton } from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';

export interface CredentialSlip {
  profile: Profile;
  password: string;
}

/** Shows a freshly generated Login ID and password once, with copy and print. */
export const CredentialDialog: React.FC<{
  credential: CredentialSlip;
  onPrint: () => void;
  onDone: () => void;
}> = ({ credential, onPrint, onDone }) => {
  const { stringResource: t, language } = useStringResource();
  const name =
    language === 'ur' && credential.profile.fullNameUr
      ? credential.profile.fullNameUr
      : credential.profile.fullName;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14284B]/45">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E4E8F0] p-5 shadow-xl space-y-3">
        <h3 className="font-heading text-base font-bold text-[#14284B]">{t('ad_cred_title')}</h3>
        <p className="text-xs text-[#D64545] font-semibold">{t('ad_cred_once')}</p>
        <div className="rounded-xl bg-[#F6F8FC] p-3 space-y-2 text-sm">
          <div>{name}</div>
          <div className="flex justify-between"><span className="text-[#6B7385]">{t('ad_cred_login_id')}</span><b dir="ltr" className="font-mono">{credential.profile.loginId}</b></div>
          <div className="flex justify-between"><span className="text-[#6B7385]">{t('ad_cred_password')}</span><b dir="ltr" className="font-mono">{credential.password}</b></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <PrimaryButton
            text={t('ad_cred_copy')}
            variant="outline"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => {
              try {
                void navigator.clipboard.writeText(`${credential.profile.loginId} / ${credential.password}`);
              } catch {
                /* clipboard unavailable */
              }
            }}
          />
          <PrimaryButton text={t('ad_cred_print')} variant="navy" icon={<Printer className="w-4 h-4 text-[#F28C28]" />} onClick={onPrint} />
        </div>
        <PrimaryButton text={t('ad_cred_done')} variant="orange" onClick={onDone} />
      </div>
    </div>
  );
};
