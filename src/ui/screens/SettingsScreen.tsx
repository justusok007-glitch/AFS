import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Info,
  KeyRound,
  LogOut,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { AppModule } from '../../di/AppModule';
import { UserSession } from '../../domain/models/models';
import { StringKey } from '../../res/strings';
import {
  CurvedNavyTopBar,
  LanguageToggleSegment,
  PrimaryButton,
  SchoolCard,
  SchoolDialog,
  SchoolTextField,
  StatusChip,
} from '../components/SchoolComposables';
import { useStringResource } from '../theme/LocaleContext';

export interface SettingsScreenProps {
  session: UserSession;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  session,
  onBack,
  onLogout,
}) => {
  const { stringResource, language, isRtl } = useStringResource();

  // Change password form state
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [passwordErrorKey, setPasswordErrorKey] = useState<StringKey | null>(
    null
  );
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState<boolean>(false);

  const handlePasswordChange = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordErrorKey(null);
    setPasswordSuccess(false);

    if (!oldPassword.trim()) {
      setPasswordErrorKey('settings_password_wrong_old');
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordErrorKey('settings_password_short');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorKey('settings_password_mismatch');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await AppModule.authRepository.changePassword(
        session.profile.id,
        oldPassword,
        newPassword
      );
      if (!res.ok) {
        if (res.error.kind === 'InvalidCredentials') {
          setPasswordErrorKey('settings_password_wrong_old');
        } else {
          setPasswordErrorKey('settings_password_short');
        }
        return;
      }
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 4000);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-8 bg-[#F6F8FC] parent-skin ps-doodle">
      <CurvedNavyTopBar
        skinned
        title={stringResource('settings_title')}
        subtitle={stringResource('settings_subtitle')}
        rightSlot={
          <button
            type="button"
            onClick={onBack}
            className="min-h-[38px] px-3 rounded-xl bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-white/25 transition-colors cursor-pointer"
          >
            {isRtl ? (
              <ArrowRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5" />
            )}
            <span>{stringResource('back_button_label')}</span>
          </button>
        }
      />

      <div className="px-4 pt-4 space-y-4">
        {/* Active Account Summary */}
        <SchoolCard className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-heading text-sm font-bold text-[#14284B] truncate">
                {language === 'ur'
                  ? session.profile.fullNameUr
                  : session.profile.fullName}
              </div>
              <div className="text-xs text-[#6B7385] flex items-center gap-1.5 mt-0.5">
                <span dir="ltr" className="font-mono font-semibold text-[#F28C28]">
                  {session.loginId}
                </span>
                <span>·</span>
                <span>{stringResource(`role_${session.role}` as StringKey)}</span>
              </div>
            </div>
            <StatusChip
              label={stringResource('status_present')}
              tone="success"
            />
          </div>
        </SchoolCard>

        {/* 1. Language Switch (EN | اردو) */}
        <SchoolCard className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <Globe className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('settings_language_section')}</span>
            </div>
            <span
              dir="ltr"
              className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F6F8FC] border border-[#E4E8F0] text-[#14284B]"
            >
              {isRtl ? 'RTL (اردو)' : 'LTR (EN)'}
            </span>
          </div>
          <LanguageToggleSegment variant="onSurface" />
        </SchoolCard>

        {/* 2. Change Password (Working through AuthRepository) */}
        <SchoolCard className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <KeyRound className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('settings_change_password_section')}</span>
            </div>
            <span dir="ltr" className="text-[11px] font-mono text-[#6B7385]">
              AuthRepository
            </span>
          </div>

          {passwordSuccess && (
            <StatusChip
              label={stringResource('settings_password_success')}
              tone="success"
            />
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <SchoolTextField
              label={stringResource('settings_old_password_label')}
              value={oldPassword}
              onValueChange={(val) => {
                setOldPassword(val);
                if (passwordErrorKey) setPasswordErrorKey(null);
              }}
              type="password"
              placeholder={stringResource('settings_old_password_placeholder')}
              forceLtrValue
              errorText={
                passwordErrorKey === 'settings_password_wrong_old'
                  ? stringResource('settings_password_wrong_old')
                  : null
              }
            />

            <SchoolTextField
              label={stringResource('settings_new_password_label')}
              value={newPassword}
              onValueChange={(val) => {
                setNewPassword(val);
                if (passwordErrorKey) setPasswordErrorKey(null);
              }}
              type="password"
              placeholder={stringResource('settings_new_password_placeholder')}
              forceLtrValue
              errorText={
                passwordErrorKey === 'settings_password_short'
                  ? stringResource('settings_password_short')
                  : null
              }
            />

            <SchoolTextField
              label={stringResource('settings_confirm_password_label')}
              value={confirmPassword}
              onValueChange={(val) => {
                setConfirmPassword(val);
                if (passwordErrorKey) setPasswordErrorKey(null);
              }}
              type="password"
              placeholder={stringResource(
                'settings_confirm_password_placeholder'
              )}
              forceLtrValue
              errorText={
                passwordErrorKey === 'settings_password_mismatch'
                  ? stringResource('settings_password_mismatch')
                  : null
              }
            />

            <PrimaryButton
              type="submit"
              text={stringResource('settings_change_password_btn')}
              onClick={() => handlePasswordChange()}
              loading={passwordSaving}
              variant="orange"
            />
          </form>
        </SchoolCard>

        {/* 3. App Version & Light Theme Info */}
        <SchoolCard className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-heading text-xs font-bold text-[#14284B]">
              <Info className="w-4 h-4 text-[#F28C28]" />
              <span>{stringResource('settings_app_version_label')}</span>
            </div>
            <span
              dir="ltr"
              className="text-xs font-mono font-bold text-[#14284B]"
            >
              {stringResource('settings_app_version_value')}
            </span>
          </div>

          <div className="pt-2 border-t border-[#E4E8F0] flex items-center justify-between gap-2 text-xs text-[#6B7385]">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#F28C28]" />
              <span>{stringResource('settings_theme_locked_title')}</span>
            </span>
            <ShieldCheck className="w-4 h-4 text-[#2E9E5B]" />
          </div>
        </SchoolCard>

        {/* 4. Sign Out */}
        <SchoolCard className="space-y-3">
          <PrimaryButton
            text={stringResource('logout_button')}
            onClick={() => setLogoutConfirmOpen(true)}
            variant="navy"
            icon={<LogOut className="w-4 h-4 text-[#F28C28]" />}
          />
        </SchoolCard>
      </div>

      <SchoolDialog
        open={logoutConfirmOpen}
        title={stringResource('logout_confirm_title')}
        message={stringResource('logout_confirm_body')}
        confirmText={stringResource('logout_button')}
        cancelText={stringResource('dialog_cancel')}
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          onLogout();
        }}
        onDismiss={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
};
