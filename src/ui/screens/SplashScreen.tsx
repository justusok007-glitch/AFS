import React, { useEffect } from 'react';
import { SchoolLogo } from '../components/SchoolLogo';
import { useStringResource } from '../theme/LocaleContext';

export interface SplashScreenProps {
  onFinished: () => void;
}

/**
 * Animated Splash Screen (~2 seconds, smooth):
 * - White background (#FFFFFF)
 * - Exact PNG logo (/school-logo.png) scales in with gentle overshoot and fade
 * - An orange (#F28C28) arc sweeps once around the logo
 * - School name fades up in English ("Al Furqan School Okara") and Urdu ("الفرقان اسکول اوکاڑہ" in bundled Noto Nastaliq Urdu with taller line height)
 * - Skips the animation immediately if reduced motion is enabled
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const { stringResource } = useStringResource();

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onFinished();
      return;
    }

    const timer = window.setTimeout(() => {
      onFinished();
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [onFinished]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[812px] h-full w-full bg-white px-6 select-none"
      dir="ltr"
    >
      {/* Logo + Sweeping Orange Arc Container */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Sweeping Orange Arc */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 180 180"
          fill="none"
        >
          {/* Subtle Track Ring */}
          <circle
            cx="90"
            cy="90"
            r="80"
            stroke="#E4E8F0"
            strokeWidth="3.5"
            opacity="0.55"
          />
          {/* Animated Orange Arc Sweep */}
          <circle
            cx="90"
            cy="90"
            r="80"
            stroke="#F28C28"
            strokeWidth="4.5"
            strokeLinecap="round"
            className="animate-splash-arc"
          />
        </svg>

        {/* Exact PNG School Logo with Gentle Overshoot & Fade */}
        <div className="animate-splash-logo flex items-center justify-center">
          <SchoolLogo size={118} />
        </div>
      </div>

      {/* School Name Fading Up in English & Bundled Noto Nastaliq Urdu */}
      <div className="mt-7 text-center space-y-2 animate-splash-text">
        <h1 className="font-heading text-xl font-bold text-[#14284B] tracking-tight">
          {stringResource('app_name_en_fixed')}
        </h1>
        <p
          dir="rtl"
          className="font-urdu text-xl font-bold text-[#14284B] py-1.5 leading-[2.45]"
        >
          {stringResource('app_name_ur_fixed')}
        </p>
        <p className="text-xs font-medium text-[#6B7385] pt-0.5">
          {stringResource('school_subtitle')}
        </p>
      </div>
    </div>
  );
};
