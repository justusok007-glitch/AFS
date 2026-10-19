import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Inbox,
  Info,
  X,
} from 'lucide-react';
import { useStringResource } from '../theme/LocaleContext';

/**
 * 1. PrimaryButton
 * Secondary/Accent Orange (#F28C28) for primary action buttons, or Navy (#14284B) variant.
 */
export interface PrimaryButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'orange' | 'navy' | 'outline';
  icon?: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  text,
  onClick,
  disabled = false,
  loading = false,
  variant = 'orange',
  icon,
  fullWidth = true,
  type = 'button',
}) => {
  const baseStyles =
    'min-h-[48px] px-5 py-2.5 rounded-2xl font-semibold text-sm transition-transform active:scale-[0.98] flex items-center justify-center gap-2.5 select-none whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-55 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14284B]';

  const variantStyles = {
    orange: 'bg-[#F28C28] text-white shadow-sm hover:bg-[#e07d1c]',
    navy: 'bg-[#14284B] text-white shadow-sm hover:bg-[#1c3561]',
    outline:
      'bg-white text-[#14284B] border border-[#E4E8F0] hover:bg-[#F6F8FC]',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <span className="w-full h-5 rounded-lg shimmer-surface flex items-center justify-center text-xs font-medium text-[#14284B]">
          {text}
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{text}</span>
        </>
      )}
    </button>
  );
};

/**
 * 2. SchoolCard
 * Rounded 16px (`rounded-2xl`), pure white surface (#FFFFFF), soft elevation, generous spacing.
 */
export interface SchoolCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SchoolCard: React.FC<SchoolCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const interactiveStyles = onClick
    ? 'cursor-pointer transition-transform active:scale-[0.99] hover:border-[#14284B]/25'
    : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`school-card bg-white rounded-2xl p-4 border border-[#E4E8F0] shadow-[0_2px_10px_rgba(20,40,75,0.04)] ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * 3. StatusChip
 * Semantic status indicator with explicit icon + text label (never color alone).
 */
export type StatusTone = 'success' | 'warning' | 'error' | 'info';

export interface StatusChipProps {
  label: string;
  tone: StatusTone;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone }) => {
  const config = {
    success: {
      text: 'text-[#2E9E5B]',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#2E9E5B]" />,
    },
    warning: {
      text: 'text-[#B88600]',
      icon: <Clock className="w-3.5 h-3.5 shrink-0 text-[#F2B705]" />,
    },
    error: {
      text: 'text-[#D64545]',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#D64545]" />,
    },
    info: {
      text: 'text-[#2F80ED]',
      icon: <Info className="w-3.5 h-3.5 shrink-0 text-[#2F80ED]" />,
    },
  }[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.text} whitespace-nowrap shrink-0`}
    >
      {config.icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * 4. SchoolTextField
 * Labeled input with RTL awareness, 16px corner radius, and semantic error state (#D64545).
 */
export interface SchoolTextFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  errorText?: string | null;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  forceLtrValue?: boolean;
  /** Urdu input: right-to-left, Nastaliq font and generous line height so the script is not clipped. */
  urdu?: boolean;
}

export const SchoolTextField: React.FC<SchoolTextFieldProps> = ({
  label,
  value,
  onValueChange,
  placeholder,
  type = 'text',
  errorText,
  leadingIcon,
  trailingIcon,
  forceLtrValue = false,
  urdu = false,
}) => {
  return (
    <div className="w-full space-y-1.5">
      <label className="block text-xs font-semibold text-[#1B2233]">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 min-h-[48px] px-3.5 rounded-2xl bg-[#F6F8FC] border transition-colors focus-within:bg-white ${
          errorText
            ? 'border-[#D64545] focus-within:border-[#D64545]'
            : 'border-[#E4E8F0] focus-within:border-[#14284B]'
        }`}
      >
        {leadingIcon && (
          <span className="text-[#6B7385] shrink-0">{leadingIcon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          dir={urdu ? 'rtl' : forceLtrValue ? 'ltr' : undefined}
          {...(forceLtrValue
            ? { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false, autoComplete: type === 'password' ? 'new-password' : 'off' }
            : {})}
          className={`w-full bg-transparent text-[#1B2233] placeholder:text-[#6B7385]/70 focus:outline-none ${urdu ? 'font-urdu text-base leading-[2.4] py-1.5' : 'text-sm'}`}
        />
        {trailingIcon && (
          <span className="text-[#6B7385] shrink-0">{trailingIcon}</span>
        )}
      </div>
      {errorText && (
        <p className="text-xs font-medium text-[#D64545] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorText}</span>
        </p>
      )}
    </div>
  );
};

/**
 * 5. SchoolDialog
 * Modal dialog with rounded 16px white surface, Navy header accent, and PrimaryButton actions.
 */
export interface SchoolDialogProps {
  open: boolean;
  title: string;
  body?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}

export const SchoolDialog: React.FC<SchoolDialogProps> = ({
  open,
  title,
  body,
  message,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  onConfirm,
  onDismiss,
}) => {
  if (!open) return null;

  const contentBody = message ?? body ?? '';
  const confirmBtnText = confirmText ?? confirmLabel ?? 'OK';
  const cancelBtnText = cancelText ?? cancelLabel ?? 'Cancel';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14284B]/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E4E8F0] p-5 shadow-xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-bold text-[#14284B]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[36px] min-w-[36px] -m-1 rounded-xl flex items-center justify-center text-[#6B7385] hover:bg-[#F6F8FC] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-[#6B7385] leading-relaxed">{contentBody}</p>
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <PrimaryButton
            text={cancelBtnText}
            variant="outline"
            onClick={onDismiss}
          />
          <PrimaryButton
            text={confirmBtnText}
            variant="orange"
            onClick={onConfirm}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 6. TabRow
 * Segmented interactive control with active Navy/White contrast and 44px touch height.
 */
export interface TabItem<T extends string> {
  id?: T;
  value?: T;
  label: string;
}

export interface TabRowProps<T extends string> {
  tabs: TabItem<T>[];
  selectedTab?: T;
  selected?: T;
  onSelectTab?: (tab: T) => void;
  onSelect?: (tab: T) => void;
}

export function TabRow<T extends string>({
  tabs,
  selectedTab,
  selected,
  onSelectTab,
  onSelect,
}: TabRowProps<T>) {
  const activeValue = selected ?? selectedTab;
  const handleSelect = onSelect ?? onSelectTab;

  return (
    <div
      role="tablist"
      className="grid gap-1 p-1 rounded-2xl bg-[#E4E8F0]/70"
      style={{
        gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
      }}
    >
      {tabs.map((tab) => {
        const keyVal = (tab.value ?? tab.id) as T;
        const active = keyVal === activeValue;
        return (
          <button
            key={keyVal}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => handleSelect && handleSelect(keyVal)}
            className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
              active
                ? 'bg-[#14284B] text-white shadow-xs'
                : 'text-[#6B7385] hover:text-[#1B2233]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 7. ShimmerPlaceholder
 * Animated shimmer blocks used during the 200-400ms FakeRepository delay (never bare spinners).
 */
export interface ShimmerPlaceholderProps {
  lines?: number;
  showHeader?: boolean;
}

export const ShimmerPlaceholder: React.FC<ShimmerPlaceholderProps> = ({
  lines = 3,
  showHeader = true,
}) => {
  return (
    <div
      aria-busy="true"
      className="bg-white rounded-2xl p-4 border border-[#E4E8F0] space-y-3"
    >
      {showHeader && (
        <div className="flex items-center justify-between gap-4">
          <div className="h-4 w-2/5 rounded-lg shimmer-surface" />
          <div className="h-4 w-16 rounded-lg shimmer-surface" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3.5 rounded-lg shimmer-surface ${
              idx === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 8. EmptyState
 * Friendly empty state card with icon, title, subtitle/description, and optional reload action.
 */
export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  subtitle,
  description,
  actionLabel,
  onAction,
  icon,
}) => {
  const subText = description ?? subtitle ?? '';
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E4E8F0] text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-[#F6F8FC] border border-[#E4E8F0] mx-auto flex items-center justify-center text-[#14284B]">
        {icon ?? <Inbox className="w-6 h-6 text-[#F28C28]" />}
      </div>
      <div className="space-y-1 max-w-xs mx-auto">
        <h4 className="font-heading text-sm font-bold text-[#1B2233]">
          {title}
        </h4>
        <p className="text-xs text-[#6B7385] leading-relaxed">{subText}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1 max-w-xs mx-auto">
          <PrimaryButton
            text={actionLabel}
            onClick={onAction}
            variant="outline"
          />
        </div>
      )}
    </div>
  );
};

/**
 * 9. StatCard
 * Displays formatted KPI values (e.g. "Rs 2,500", "17 Oct 2026", "950") using Western digits.
 */
export interface StatCardProps {
  label: string;
  value: string;
  meta?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  meta,
  icon,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E4E8F0] shadow-[0_2px_10px_rgba(20,40,75,0.04)] flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#6B7385] truncate">
          {label}
        </span>
        {icon && <span className="text-[#14284B] shrink-0">{icon}</span>}
      </div>
      <div
        dir="ltr"
        className="font-heading text-lg font-bold text-[#14284B] tabular-nums tracking-tight text-start"
      >
        {value}
      </div>
      {meta && (
        <div className="text-[11px] text-[#6B7385] truncate">{meta}</div>
      )}
    </div>
  );
};

/**
 * LanguageToggleSegment (EN | اردو)
 * Switchable inside the app from the Login screen and Settings.
 */
export const LanguageToggleSegment: React.FC<{
  variant?: 'onNavy' | 'onSurface';
}> = ({ variant = 'onNavy' }) => {
  const { language, setLanguage, stringResource } = useStringResource();

  const containerClass =
    variant === 'onNavy'
      ? 'bg-white/12 border border-white/20 text-white'
      : 'bg-[#F6F8FC] border border-[#E4E8F0] text-[#1B2233]';

  return (
    <div
      dir="ltr"
      role="group"
      aria-label={stringResource('lang_toggle_label')}
      className={`inline-flex items-center p-1 rounded-xl ${containerClass}`}
    >
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
          language === 'en'
            ? 'bg-[#F28C28] text-white shadow-xs'
            : variant === 'onNavy'
            ? 'text-white/80 hover:text-white'
            : 'text-[#6B7385] hover:text-[#1B2233]'
        }`}
      >
        {stringResource('lang_en')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ur')}
        dir="rtl"
        className={`font-urdu min-h-[34px] px-3 py-0.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
          language === 'ur'
            ? 'bg-[#F28C28] text-white shadow-xs'
            : variant === 'onNavy'
            ? 'text-white/80 hover:text-white'
            : 'text-[#6B7385] hover:text-[#1B2233]'
        }`}
      >
        {stringResource('lang_ur')}
      </button>
    </div>
  );
};

/**
 * CurvedNavyTopBar
 * Navy #14284B top bar with a curved bottom edge (`rounded-b-[28px]`), title, subtitle, and language toggle.
 */
export interface CurvedNavyTopBarProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  bottomSlot?: React.ReactNode;
  /** Sky-blue skin: gradient, building outline and wave edge (needs a `.parent-skin` ancestor). */
  skinned?: boolean;
}

/** Decorative building outline and wave used by the skinned headers. */
export const SkinHeaderDecor: React.FC = () => (
  <>
    <svg className="ps-deco ps-building" viewBox="0 0 220 170" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
      <rect x="30" y="70" width="160" height="100" />
      <rect x="85" y="40" width="50" height="130" />
      <path d="M85 40l25-22 25 22M110 18V2h16v9h-16" />
      <circle cx="110" cy="62" r="9" />
      <path d="M45 88h22v18H45zM45 120h22v18H45zM153 88h22v18h-22zM153 120h22v18h-22zM96 92h28M96 110h28M96 128h28M100 170v-26h20v26" />
    </svg>
    <svg className="ps-deco ps-wave" viewBox="0 0 430 48" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 26C70 50 150 6 240 22c60 11 110 12 190-8V48H0Z" fill="#EAF5FD" />
    </svg>
  </>
);

export const CurvedNavyTopBar: React.FC<CurvedNavyTopBarProps> = ({
  title,
  subtitle,
  rightSlot,
  bottomSlot,
  skinned,
}) => {
  const { isRtl } = useStringResource();
  return (
    <header className={`bg-[#14284B] text-white rounded-b-[28px] px-5 pt-4 pb-5 shadow-md space-y-3 ${skinned ? 'ps-header ps-principal ps-compact' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 py-0.5">
          <h1
            className={`font-heading text-base font-bold text-white ${
              isRtl ? 'font-urdu leading-[2.45] py-0.5' : 'leading-snug'
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-xs text-white/75 mt-0.5 ${
                isRtl ? 'font-urdu leading-[2.35] py-0.5' : 'leading-normal'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {rightSlot ?? <LanguageToggleSegment variant="onNavy" />}
        </div>
      </div>
      {bottomSlot && <div>{bottomSlot}</div>}
      {skinned && <SkinHeaderDecor />}
    </header>
  );
};
