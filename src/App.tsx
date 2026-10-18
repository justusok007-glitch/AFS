import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { AppModule } from './di/AppModule';
import {
  getDemoDateOverride,
  setDemoDateOverride,
  subscribeToClock,
} from './domain/clock';
import { formatSchoolDate } from './domain/formatters/SchoolFormatters';
import { Campus, UserSession } from './domain/models/models';
import { LanguageCode } from './res/strings';
import { PrimaryButton } from './ui/components/SchoolComposables';
import { SchoolLogo } from './ui/components/SchoolLogo';
import { DeveloperCheckScreen } from './ui/screens/DeveloperCheckScreen';
import {
  HiddenDevDestination,
  LoginScreen,
} from './ui/screens/LoginScreen';
import { RoleHomeScreen } from './ui/screens/RoleHomeScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { SplashScreen } from './ui/screens/SplashScreen';
import { LocaleProvider, useStringResource } from './ui/theme/LocaleContext';

const MainShell: React.FC<{
  session: UserSession | null;
  selectedCampus: Campus;
  bootstrapping: boolean;
  splashDone: boolean;
  onSplashFinished: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onCampusChange: (campus: Campus) => void;
  onLogout: () => Promise<void>;
}> = ({
  session,
  selectedCampus,
  bootstrapping,
  splashDone,
  onSplashFinished,
  onLoginSuccess,
  onCampusChange,
  onLogout,
}) => {
  const { stringResource } = useStringResource();

  // Demo Date Override state for the visible orange banner
  const [demoDateOverride, setDemoDateOverrideState] = useState<string | null>(
    () => getDemoDateOverride()
  );

  useEffect(() => {
    return subscribeToClock(() => {
      setDemoDateOverrideState(getDemoDateOverride());
    });
  }, []);

  // Role bottom navigation tab index (0..4)
  const [roleTabIndex, setRoleTabIndex] = useState<number>(0);

  // Settings screen pushed on top of Role Home
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  // Hidden developer destination reachable ONLY via 5-tap logo on Login screen
  const [devDestination, setDevDestination] =
    useState<HiddenDevDestination | null>(null);

  // Exited state when Back is pressed from a role's first tab
  const [exitedToLauncher, setExitedToLauncher] = useState<boolean>(false);

  const handleBackNavigation = useCallback(() => {
    if (exitedToLauncher) {
      return;
    }
    if (devDestination) {
      setDevDestination(null);
      return;
    }
    if (settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    if (session) {
      if (roleTabIndex > 0) {
        setRoleTabIndex(0);
        return;
      }
      // From a role's first tab, Back exits the app
      setExitedToLauncher(true);
      return;
    }
    // From Login screen, Back also exits the app
    setExitedToLauncher(true);
  }, [devDestination, exitedToLauncher, roleTabIndex, session, settingsOpen]);

  // Wire browser back navigation (popstate)
  useEffect(() => {
    window.history.pushState({ afsNav: true }, '');
    const onPopState = () => {
      handleBackNavigation();
      window.history.pushState({ afsNav: true }, '');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [handleBackNavigation]);

  const handleReopenFromLauncher = () => {
    setExitedToLauncher(false);
  };

  const renderScreenContent = () => {
    // 1. Splash screen (~2 seconds smooth animation; waits for bootstrap if needed)
    if (!splashDone || bootstrapping) {
      return <SplashScreen onFinished={onSplashFinished} />;
    }

    // 2. Exited State (when Back is pressed from Role's first tab)
    if (exitedToLauncher) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[750px] h-full px-6 text-center bg-[#F6F8FC] space-y-5">
          <button
            type="button"
            onClick={handleReopenFromLauncher}
            className="rounded-[26px] border border-[#E4E8F0] shadow-lg overflow-hidden hover:scale-105 active:scale-95 transition-transform cursor-pointer bg-white"
            aria-label={stringResource('app_name')}
          >
            <SchoolLogo size={96} adaptiveLauncher />
          </button>
          <div className="space-y-1.5 max-w-xs">
            <h2 className="font-heading text-base font-bold text-[#14284B]">
              {stringResource('app_exited_title')}
            </h2>
            <p className="text-xs text-[#6B7385] leading-relaxed">
              {stringResource('app_exited_subtitle')}
            </p>
          </div>
          <div className="w-full max-w-[240px]">
            <PrimaryButton
              text={stringResource('app_reopen_button')}
              onClick={handleReopenFromLauncher}
              variant="orange"
            />
          </div>
        </div>
      );
    }

    // 3. Hidden Developer Menu Destination (reachable ONLY via 5-tap logo on Login)
    if (devDestination === 'dev_check') {
      return <DeveloperCheckScreen onBack={() => setDevDestination(null)} />;
    }

    // 4. Unauthenticated -> Login Screen
    if (!session) {
      return (
        <LoginScreen
          onLoginSuccess={(newSession) => {
            setRoleTabIndex(0);
            setSettingsOpen(false);
            onLoginSuccess(newSession);
          }}
          onOpenDevDestination={(dest) => setDevDestination(dest)}
        />
      );
    }

    // 5. Settings Screen (reachable from Top Bar or More tab)
    if (settingsOpen) {
      return (
        <SettingsScreen
          session={session}
          onBack={() => setSettingsOpen(false)}
          onLogout={async () => {
            setSettingsOpen(false);
            setRoleTabIndex(0);
            await onLogout();
          }}
        />
      );
    }

    // 6. Role Scaffold with Curved Navy Top Bar + 5-Tab Bottom Navigation Bar
    return (
      <RoleHomeScreen
        session={session}
        activeTabIndex={roleTabIndex}
        onTabChange={(idx) => setRoleTabIndex(idx)}
        selectedCampus={selectedCampus}
        onCampusChange={onCampusChange}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={async () => {
          setSettingsOpen(false);
          setRoleTabIndex(0);
          await onLogout();
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-[#1B2233] flex justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-[#F6F8FC] sm:my-4 sm:min-h-[844px] sm:max-h-[900px] sm:rounded-[32px] sm:border sm:border-[#E4E8F0] sm:shadow-lg flex flex-col overflow-hidden relative print-shell-frame">
        {/* Visible orange "Demo date active" strip when a demo date override is on */}
        {demoDateOverride && (
          <div className="bg-[#F28C28] text-white px-3.5 py-2 flex items-center justify-between gap-2 text-xs font-semibold shrink-0 no-print shadow-xs z-40">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {stringResource('demo_date_active_strip')}:
              </span>
              <span
                dir="ltr"
                className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded-md shrink-0"
              >
                {formatSchoolDate(demoDateOverride)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDemoDateOverride(null)}
              aria-label={stringResource('demo_date_use_real_btn')}
              className="px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              <span>{stringResource('demo_date_use_real_btn')}</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {renderScreenContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [selectedCampus, setSelectedCampus] = useState<Campus>(Campus.BOTH);
  const [session, setSession] = useState<UserSession | null>(null);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [splashDone, setSplashDone] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function bootstrapFromRepositories() {
      try {
        const [savedSettings, savedSession] = await Promise.all([
          AppModule.settingsRepository.getSettings(),
          AppModule.authRepository.getCurrentSession(),
        ]);
        if (!mounted) return;
        setLanguageState(savedSettings.language);
        // Default to Both Campuses for users whose campus scope is all campuses
        if (savedSession && savedSession.profile.campusId === null) {
          setSelectedCampus(Campus.BOTH);
        } else {
          setSelectedCampus(savedSettings.selectedCampus);
        }
        setSession(savedSession);
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    }
    bootstrapFromRepositories();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLanguageChange = async (newLang: LanguageCode) => {
    setLanguageState(newLang);
    await AppModule.settingsRepository.setLanguage(newLang);
  };

  const handleCampusChange = async (newCampus: Campus) => {
    setSelectedCampus(newCampus);
    await AppModule.settingsRepository.setCampus(newCampus);
  };

  const handleLoginSuccess = async (newSession: UserSession) => {
    if (newSession.profile.campusId === null) {
      setSelectedCampus(Campus.BOTH);
      await AppModule.settingsRepository.setCampus(Campus.BOTH);
    } else if (newSession.profile.campusId === 'campus_b') {
      setSelectedCampus(Campus.BOYS);
    } else if (newSession.profile.campusId === 'campus_g') {
      setSelectedCampus(Campus.GIRLS);
    }
    setSession(newSession);
  };

  const handleLogout = async () => {
    await AppModule.authRepository.logout();
    setSession(null);
  };

  const handleSplashFinished = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <LocaleProvider
      language={language}
      onLanguageChange={handleLanguageChange}
    >
      <MainShell
        session={session}
        selectedCampus={selectedCampus}
        bootstrapping={bootstrapping}
        splashDone={splashDone}
        onSplashFinished={handleSplashFinished}
        onLoginSuccess={handleLoginSuccess}
        onCampusChange={handleCampusChange}
        onLogout={handleLogout}
      />
    </LocaleProvider>
  );
}
