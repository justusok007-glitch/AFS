import React, { createContext, useContext } from 'react';
import { LanguageCode, StringKey, stringsEn, stringsUr } from '../../res/strings';

export interface LocaleContextValue {
  language: LanguageCode;
  isRtl: boolean;
  setLanguage: (lang: LanguageCode) => void;
  stringResource: (key: StringKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const AlFurqanThemeColors = {
  navy: '#14284B',
  orange: '#F28C28',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  text: '#1B2233',
  mutedText: '#6B7385',
  divider: '#E4E8F0',
  success: '#2E9E5B',
  warning: '#F2B705',
  error: '#D64545',
  info: '#2F80ED',
} as const;

export const LocaleProvider: React.FC<{
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  children: React.ReactNode;
}> = ({ language, onLanguageChange, children }) => {
  const isRtl = language === 'ur';

  const stringResource = (key: StringKey): string => {
    const table = language === 'ur' ? stringsUr : stringsEn;
    return table[key] ?? stringsEn[key];
  };

  return (
    <LocaleContext.Provider
      value={{
        language,
        isRtl,
        setLanguage: onLanguageChange,
        stringResource,
      }}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        lang={language}
        className="min-h-full bg-[#F6F8FC] text-[#1B2233]"
      >
        {children}
      </div>
    </LocaleContext.Provider>
  );
};

export function useStringResource() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useStringResource must be used inside LocaleProvider');
  }
  return ctx;
}
