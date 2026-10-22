import { onOpenTabRequest, syncPushRegistration, takePendingTab } from '../../data/supabase/push';
import { useBackHandler } from '../navigation/backStack';
import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Receipt,
  Settings,
  Sliders,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { AppModule } from '../../di/AppModule';
import {
  Campus,
  SchoolClass,
  Section,
  Student,
  UserRole,
  UserSession,
} from '../../domain/models/models';
import { StringKey } from '../../res/strings';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolDialog,
  ShimmerPlaceholder,
  StatusChip,
  TabItem,
  TabRow,
} from '../components/SchoolComposables';
import { SchoolLogo } from '../components/SchoolLogo';
import { PrincipalAvatar } from '../components/PrincipalAvatar';
import { RoleAvatar } from '../components/RoleAvatar';
import { StudentAvatar } from '../components/StudentAvatar';
import { useStringResource } from '../theme/LocaleContext';
import { AccountantRoot } from './accountant/AccountantRoot';
import { AdminRoot } from './admin/AdminRoot';
import { PrincipalRoot } from './principal/PrincipalRoot';
import { ParentAttendanceTab } from './parent/ParentAttendanceTab';
import { ParentFeesTab } from './parent/ParentFeesTab';
import { ParentResultsTab } from './parent/ParentResultsTab';
import { ParentHomeTab } from './parent/ParentHomeTab';
import { CoordinatorDashboard } from './teacher/CoordinatorDashboard';
import { formatClassSectionTitle } from './teacher/TeacherHelpers';
import { TeacherAttendanceTab } from './teacher/TeacherAttendanceTab';
import { TeacherMarksTab } from './teacher/TeacherMarksTab';
import { MessagesTab } from './comms/MessagesTab';
import { DiaryTab } from './diary/DiaryTab';
import { NotificationsSheet, useUnreadMessages, useUnreadNotifications } from './comms/CommsShared';
import { startHeartbeat } from '../../data/supabase/activity';
import { forceRefresh, refreshIfIdle, subscribeDataRefreshed } from '../../data/supabase/sync';
import { CLOUD_ENABLED } from '../../data/supabase/mode';
import { TeacherHomeTab } from './teacher/TeacherHomeTab';
import { TeacherMoreTab } from './teacher/TeacherMoreTab';

export interface RoleTabSpec {
  id: string;
  labelKey: StringKey;
  /** Plain label that replaces labelKey (e.g. a section name). */
  label?: string;
  icon: React.ReactNode;
}

export function getRoleTabs(role: UserRole, sectionTabs: { id: string; label: string }[] = []): RoleTabSpec[] {
  switch (role) {
    case UserRole.PARENT:
      return [
        {
          id: 'home',
          labelKey: 'tab_home',
          icon: <Home className="w-5 h-5" />,
        },
        {
          id: 'attendance',
          labelKey: 'tab_attendance',
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          id: 'fees',
          labelKey: 'tab_fees',
          icon: <Wallet className="w-5 h-5" />,
        },
        {
          id: 'results',
          labelKey: 'tab_results',
          icon: <Award className="w-5 h-5" />,
        },
        {
          id: 'diary',
          labelKey: 'tab_diary',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          id: 'messages',
          labelKey: 'tab_messages',
          icon: <MessageSquare className="w-5 h-5" />,
        },
      ];
    case UserRole.TEACHER:
      return [
        {
          id: 'home',
          labelKey: 'tab_home',
          icon: <Home className="w-5 h-5" />,
        },
        {
          id: 'attendance',
          labelKey: 'tab_attendance',
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          id: 'marks',
          labelKey: 'tab_marks',
          icon: <ClipboardCheck className="w-5 h-5" />,
        },
        {
          id: 'diary',
          labelKey: 'tab_diary',
          icon: <BookOpen className="w-5 h-5" />,
        },
        {
          id: 'messages',
          labelKey: 'tab_messages',
          icon: <MessageSquare className="w-5 h-5" />,
        },
        {
          id: 'more',
          labelKey: 'tab_more',
          icon: <MoreHorizontal className="w-5 h-5" />,
        },
      ];
    case UserRole.ATTENDANCE_COORDINATOR:
      return [
        {
          id: 'dashboard',
          labelKey: 'tab_dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        ...sectionTabs.map((s) => ({
          id: `sec:${s.id}`,
          labelKey: 'tab_mark_attendance' as StringKey,
          label: s.label,
          icon: <CalendarCheck className="w-5 h-5" />,
        })),
        {
          id: 'more',
          labelKey: 'tab_more',
          icon: <MoreHorizontal className="w-5 h-5" />,
        },
      ];
    case UserRole.PRINCIPAL:
    case UserRole.VICE_PRINCIPAL:
      return [
        {
          id: 'dashboard',
          labelKey: 'tab_dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          id: 'attendance',
          labelKey: 'tab_attendance',
          icon: <CalendarCheck className="w-5 h-5" />,
        },
        {
          id: 'fees',
          labelKey: 'tab_fees',
          icon: <Wallet className="w-5 h-5" />,
        },
        {
          id: 'results',
          labelKey: 'tab_results',
          icon: <Award className="w-5 h-5" />,
        },
        {
          id: 'more',
          labelKey: 'tab_more',
          icon: <MoreHorizontal className="w-5 h-5" />,
        },
      ];
    case UserRole.ACCOUNTANT:
      return [
        {
          id: 'dashboard',
          labelKey: 'tab_dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          id: 'collect',
          labelKey: 'tab_collect',
          icon: <Wallet className="w-5 h-5" />,
        },
        {
          id: 'vouchers',
          labelKey: 'tab_vouchers',
          icon: <Receipt className="w-5 h-5" />,
        },
        {
          id: 'reports',
          labelKey: 'tab_reports',
          icon: <BarChart3 className="w-5 h-5" />,
        },
        {
          id: 'more',
          labelKey: 'tab_more',
          icon: <MoreHorizontal className="w-5 h-5" />,
        },
      ];
    case UserRole.ADMIN:
      return [
        {
          id: 'dashboard',
          labelKey: 'tab_dashboard',
          icon: <LayoutDashboard className="w-5 h-5" />,
        },
        {
          id: 'setup',
          labelKey: 'tab_setup',
          icon: <Sliders className="w-5 h-5" />,
        },
        {
          id: 'users',
          labelKey: 'tab_users',
          icon: <Users className="w-5 h-5" />,
        },
        {
          id: 'students',
          labelKey: 'tab_students',
          icon: <GraduationCap className="w-5 h-5" />,
        },
        {
          id: 'more',
          labelKey: 'tab_more',
          icon: <MoreHorizontal className="w-5 h-5" />,
        },
      ];
  }
}

export interface RoleHomeScreenProps {
  session: UserSession;
  activeTabIndex: number;
  onTabChange: (index: number) => void;
  selectedCampus: Campus;
  onCampusChange: (campus: Campus) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const RoleHomeScreen: React.FC<RoleHomeScreenProps> = ({
  session,
  activeTabIndex,
  onTabChange: onTabChangeRaw,
  selectedCampus,
  onCampusChange,
  onOpenSettings,
  onLogout,
}) => {
  const { stringResource, language } = useStringResource();
  const [coordSections, setCoordSections] = useState<Section[]>([]);
  const [coordClasses, setCoordClasses] = useState<Record<string, SchoolClass>>({});
  const roleTabs = getRoleTabs(
    session.role,
    coordSections.map((s) => ({
      id: s.id,
      label: formatClassSectionTitle(s, coordClasses, language).replace(/^class\s*/i, ''),
    }))
  );
  const currentTab = roleTabs[activeTabIndex] ?? roleTabs[0];

  // tab history, so the phone's Back button returns to the tab you came from
  const tabStack = React.useRef<number[]>([]);
  const onTabChange = (idx: number) => {
    if (idx === 0) tabStack.current = [];
    else if (idx !== activeTabIndex) {
      tabStack.current.push(activeTabIndex);
      if (tabStack.current.length > 20) tabStack.current.shift();
    }
    onTabChangeRaw(idx);
  };
  const isMarkTab = currentTab.id === 'attendance' || currentTab.id.startsWith('sec:');

  const [loading, setLoading] = useState<boolean>(true);
  const [childrenList, setChildrenList] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildIdState] = useState<string | null>(
    null
  );
  const [childSheetOpen, setChildSheetOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const { count: unreadCount, refresh: refreshUnread } = useUnreadNotifications(session.profile.id);
  const { count: unreadMessages, refresh: refreshMessages } = useUnreadMessages(
    session.profile.id,
    session.role === UserRole.PARENT || session.role === UserRole.TEACHER,
    // Parents see the count for the selected child only.
    session.role === UserRole.PARENT ? selectedChildId ?? childrenList[0]?.id ?? '__none__' : undefined
  );
  useEffect(() => {
    refreshMessages();
  }, [activeTabIndex, refreshMessages]);

  // lets the admin see who is using the app (one tiny request about every 5 minutes while the app is open)
  useEffect(() => startHeartbeat(), []);
  useEffect(() => {
    void syncPushRegistration();
  }, []);

  // a tapped notification opens the matching tab (diary, fees, results, attendance)
  const roleTabsRef = React.useRef(roleTabs);
  roleTabsRef.current = roleTabs;
  const onTabChangeRef = React.useRef(onTabChange);
  onTabChangeRef.current = onTabChange;
  useEffect(() => {
    const open = (tab: string) => {
      const idx = roleTabsRef.current.findIndex((x) => x.id === tab);
      if (idx >= 0) onTabChangeRef.current(idx);
    };
    const first = takePendingTab();
    if (first) open(first);
    return onOpenTabRequest(open);
  }, []);


  const [classesMap, setClassesMap] = useState<Record<string, SchoolClass>>({});
  const [sectionsMap, setSectionsMap] = useState<Record<string, Section>>({});

  // Teacher selected section & unsaved attendance changes guard
  const [teacherSelectedSectionId, setTeacherSelectedSectionId] = useState<
    string | null
  >(null);
  const [teacherAttendanceDirty, setTeacherAttendanceDirty] =
    useState<boolean>(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<
    | { type: 'tab'; index: number }
    | { type: 'settings' }
    | { type: 'logout' }
    | null
  >(null);

  useBackHandler(
    activeTabIndex !== 0,
    () => {
      let target = tabStack.current.pop();
      if (target === undefined || target === activeTabIndex) target = 0;
      if (
        (session.role === UserRole.TEACHER || session.role === UserRole.ATTENDANCE_COORDINATOR) &&
        isMarkTab &&
        teacherAttendanceDirty
      ) {
        setPendingLeaveAction({ type: 'tab', index: target });
        return;
      }
      onTabChangeRaw(target);
    },
    0
  );

  // ---- refresh: pull down on any tab, plus a quiet refresh when the app comes back or every few minutes
  const [refreshTick, setRefreshTick] = useState(0);
  const pullStart = React.useRef<number | null>(null);
  const pullRef = React.useRef(0);
  const indRef = React.useRef<HTMLDivElement>(null);
  const busyRef = React.useRef(false);
  // the pull bar is moved directly in the DOM, so dragging never re-renders the whole screen
  const showInd = (offset: number, text: string, visible: boolean) => {
    const el = indRef.current;
    const box = el?.parentElement;
    if (!el || !box) return;
    el.style.top = `${box.getBoundingClientRect().top + offset}px`;
    el.style.opacity = visible ? '1' : '0';
    const sp = el.firstElementChild as HTMLElement | null;
    if (sp && sp.textContent !== text) sp.textContent = text;
  };
  const dirtyRef = React.useRef(false);
  dirtyRef.current = teacherAttendanceDirty;
  const tabIdRef = React.useRef('');
  tabIdRef.current = currentTab.id;
  const roleRef = React.useRef(session.role);
  roleRef.current = session.role;

  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    return subscribeDataRefreshed((src) => {
      refreshUnread();
      refreshMessages();
      if (src === 'manual') {
        setRefreshTick((n) => n + 1);
        return;
      }
      // quiet refresh: reload the screen only where nobody can be in the middle of typing
      const el = document.activeElement as HTMLElement | null;
      const typing = !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      const safeTab =
        roleRef.current === UserRole.PARENT
          ? tabIdRef.current !== 'messages'
          : tabIdRef.current === 'home' || tabIdRef.current === 'dashboard';
      if (safeTab && !typing && !dirtyRef.current) setRefreshTick((n) => n + 1);
    });
  }, [refreshUnread, refreshMessages]);

  useEffect(() => {
    if (!CLOUD_ENABLED) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshIfIdle(240000);
    }, 300000);
    return () => window.clearInterval(id);
  }, []);

  const doManualRefresh = async () => {
    if (busyRef.current) return;
    if (dirtyRef.current && !window.confirm(stringResource('rf_attendance_warn'))) return;
    busyRef.current = true;
    showInd(10, stringResource('rf_refreshing'), true);
    const r = await forceRefresh();
    showInd(10, r === 'ok' ? stringResource('rf_done') : r === 'unsaved' ? stringResource('rf_unsaved') : stringResource('rf_failed'), true);
    window.setTimeout(() => {
      showInd(10, '', false);
      busyRef.current = false;
    }, 1400);
  };
  const PULL_TRIGGER = 70;
  const onPullStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const box = e.currentTarget;
    const target = e.target as HTMLElement;
    if (box.scrollTop > 0 || busyRef.current || target.closest('[data-no-pull]')) {
      pullStart.current = null;
      return;
    }
    pullStart.current = e.touches[0].clientY;
  };
  const onPullMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (pullStart.current === null) return;
    const dy = e.touches[0].clientY - pullStart.current;
    if (dy <= 0 || e.currentTarget.scrollTop > 0) {
      if (pullRef.current !== 0) showInd(0, '', false);
      pullRef.current = 0;
      return;
    }
    pullRef.current = Math.min(110, dy * 0.5);
    if (pullRef.current > 8) {
      showInd(pullRef.current - 24, pullRef.current >= PULL_TRIGGER ? stringResource('rf_release') : stringResource('rf_pull'), true);
    }
  };
  const onPullEnd = () => {
    const reached = pullRef.current >= PULL_TRIGGER;
    pullStart.current = null;
    pullRef.current = 0;
    if (reached) void doManualRefresh();
    else showInd(0, '', false);
  };

  const loadRoleContext = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sectionsRes, notifsRes] = await Promise.all([
        AppModule.settingsRepository.getClasses(null),
        AppModule.settingsRepository.getSections(null),
        AppModule.noticeRepository.getNotificationsForUser(session.profile.id),
      ]);

      const cMap: Record<string, SchoolClass> = {};
      if (classesRes.ok) {
        classesRes.data.forEach((c) => {
          cMap[c.id] = c;
        });
      }
      setClassesMap(cMap);

      const sMap: Record<string, Section> = {};
      if (sectionsRes.ok) {
        sectionsRes.data.forEach((s) => {
          sMap[s.id] = s;
        });
      }
      setSectionsMap(sMap);

      if (session.role === UserRole.ATTENDANCE_COORDINATOR) {
        const mine = await AppModule.attendanceRepository.sectionsForTeacher(session.profile.id);
        setCoordClasses(cMap);
        setCoordSections(mine.ok ? mine.data : []);
      }

      refreshUnread();

      if (session.role === UserRole.PARENT) {
        const [kidsRes, savedChildId] = await Promise.all([
          AppModule.studentRepository.childrenOfParent(session.profile.id),
          AppModule.settingsRepository.getSelectedChildId(session.profile.id),
        ]);
        const kids = kidsRes.ok ? kidsRes.data : [];
        setChildrenList(kids);

        if (kids.length > 0) {
          const validSaved = kids.find((k) => k.id === savedChildId);
          const chosenId = validSaved ? validSaved.id : kids[0].id;
          setSelectedChildIdState(chosenId);
          if (!validSaved) {
            await AppModule.settingsRepository.setSelectedChildId(
              session.profile.id,
              chosenId
            );
          }
        } else {
          setSelectedChildIdState(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session.profile.id, session.role]);

  useEffect(() => {
    loadRoleContext();
  }, [loadRoleContext]);

  const handleSelectChild = async (childId: string) => {
    setSelectedChildIdState(childId);
    setChildSheetOpen(false);
    await AppModule.settingsRepository.setSelectedChildId(
      session.profile.id,
      childId
    );
  };

  const handleGuardedTabChange = (nextTabIndex: number) => {
    if (nextTabIndex === activeTabIndex) return;
    if (
      (session.role === UserRole.TEACHER || session.role === UserRole.ATTENDANCE_COORDINATOR) &&
      isMarkTab &&
      teacherAttendanceDirty
    ) {
      setPendingLeaveAction({ type: 'tab', index: nextTabIndex });
      return;
    }
    onTabChange(nextTabIndex);
  };

  const handleGuardedOpenSettings = () => {
    if (
      (session.role === UserRole.TEACHER || session.role === UserRole.ATTENDANCE_COORDINATOR) &&
      isMarkTab &&
      teacherAttendanceDirty
    ) {
      setPendingLeaveAction({ type: 'settings' });
      return;
    }
    onOpenSettings();
  };

  const handleGuardedLogout = () => {
    if (
      (session.role === UserRole.TEACHER || session.role === UserRole.ATTENDANCE_COORDINATOR) &&
      isMarkTab &&
      teacherAttendanceDirty
    ) {
      setPendingLeaveAction({ type: 'logout' });
      return;
    }
    onLogout();
  };

  const confirmLeaveWithUnsavedChanges = () => {
    if (!pendingLeaveAction) return;
    const action = pendingLeaveAction;
    setPendingLeaveAction(null);
    setTeacherAttendanceDirty(false);
    if (action.type === 'tab') {
      onTabChange(action.index);
    } else if (action.type === 'settings') {
      onOpenSettings();
    } else if (action.type === 'logout') {
      onLogout();
    }
  };

  const selectedChild =
    childrenList.find((c) => c.id === selectedChildId) ??
    childrenList[0] ??
    null;

  const formatChildClassAndSection = (stu: Student): string => {
    const sec = sectionsMap[stu.sectionId];
    const cls = sec ? classesMap[sec.classId] : undefined;
    const className = cls
      ? language === 'ur'
        ? cls.nameUr
        : cls.nameEn
      : stu.sectionId;
    const sectionName = sec ? `-${sec.name}` : '';
    const campusLabel =
      stu.campusId === 'campus_b'
        ? stringResource('campus_boys')
        : stringResource('campus_girls');
    return `${className}${sectionName} · ${campusLabel}`;
  };

  const getChildInitials = (stu: Student): string => {
    const parts = stu.name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return stu.name.slice(0, 2).toUpperCase();
  };

  const campusTabs: TabItem<Campus>[] = [
    { value: Campus.BOTH, label: stringResource('campus_both') },
    { value: Campus.BOYS, label: stringResource('campus_boys') },
    { value: Campus.GIRLS, label: stringResource('campus_girls') },
  ];

  const showCampusChips =
    (session.role === UserRole.ADMIN || session.role === UserRole.PRINCIPAL || session.role === UserRole.VICE_PRINCIPAL) &&
    activeTabIndex === 0;

  const renderParentTabBody = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <ShimmerPlaceholder lines={3} showHeader />
          <ShimmerPlaceholder lines={3} showHeader />
        </div>
      );
    }

    if (!selectedChild) {
      return (
        <EmptyState
          title={stringResource('no_child_linked_title')}
          subtitle={stringResource('no_child_linked_subtitle')}
          actionLabel={stringResource('retry_button')}
          onAction={loadRoleContext}
        />
      );
    }

    const childSec = sectionsMap[selectedChild.sectionId];
    const childCls = childSec ? classesMap[childSec.classId] : undefined;

    if (currentTab.id === 'home') {
      return (
        <ParentHomeTab
          key={`home_${selectedChild.id}`}
          parentProfile={session.profile}
          childrenList={childrenList}
          selectedChild={selectedChild}
          onSelectChild={(id) => void handleSelectChild(id)}
          onOpenTab={handleGuardedTabChange}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenSettings={handleGuardedOpenSettings}
          unreadNotifications={unreadCount}
          unreadMessages={unreadMessages}
        />
      );
    }

    if (currentTab.id === 'attendance') {
      return (
        <ParentAttendanceTab
          key={`att_${selectedChild.id}`}
          selectedChild={selectedChild}
        />
      );
    }

    if (currentTab.id === 'fees') {
      return (
        <ParentFeesTab
          key={`fees_${selectedChild.id}`}
          selectedChild={selectedChild}
          schoolClass={childCls}
          section={childSec}
        />
      );
    }

    if (currentTab.id === 'results') {
      return (
        <ParentResultsTab
          key={`res_${selectedChild.id}`}
          parent={session.profile}
          child={selectedChild}
        />
      );
    }

    if (currentTab.id === 'diary') {
      return <DiaryTab key={`diary_${selectedChild.id}`} user={session.profile} parentSectionIds={[selectedChild.sectionId]} />;
    }

    if (currentTab.id === 'messages') {
      return <MessagesTab key={`msg_${selectedChild.id}`} user={session.profile} child={selectedChild} />;
    }

    // Fallback
    return (
      <>
        <SchoolCard className="flex items-center justify-between gap-3 py-3.5 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F28C28]/12 text-[#F28C28] flex items-center justify-center shrink-0">
              {currentTab.icon}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-base font-bold text-[#14284B] truncate">
                {stringResource(currentTab.labelKey)}
              </h2>
              <p className="text-xs text-[#6B7385] truncate">
                {language === 'ur' ? selectedChild.nameUr : selectedChild.name}{' '}
                ({selectedChild.admissionNo})
              </p>
            </div>
          </div>
          <StatusChip label={stringResource('coming_soon_title')} tone="info" />
        </SchoolCard>

        <EmptyState
          title={stringResource('coming_soon_title')}
          description={stringResource('coming_soon_subtitle')}
          icon={<Clock className="w-6 h-6 text-[#F28C28]" />}
        />
      </>
    );
  };

  const renderCoordinatorTabBody = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <ShimmerPlaceholder lines={3} showHeader />
        </div>
      );
    }
    if (currentTab.id === 'dashboard') {
      return (
        <CoordinatorDashboard
          coordinator={session.profile}
          sections={coordSections}
          classesMap={coordClasses}
          onOpenSection={(secId) => {
            const idx = roleTabs.findIndex((x) => x.id === `sec:${secId}`);
            if (idx >= 0) onTabChange(idx);
          }}
        />
      );
    }
    if (currentTab.id.startsWith('sec:')) {
      const secId = currentTab.id.slice(4);
      return (
        <TeacherAttendanceTab
          key={secId}
          lockedSection
          teacherProfile={session.profile}
          classesMap={classesMap}
          selectedSectionId={secId}
          onSelectSectionId={() => {}}
          onDirtyChange={setTeacherAttendanceDirty}
        />
      );
    }
    return (
      <TeacherMoreTab
        teacherProfile={session.profile}
        classesMap={classesMap}
        onOpenSettings={handleGuardedOpenSettings}
        onLogout={handleGuardedLogout}
      />
    );
  };

  const renderTeacherTabBody = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <ShimmerPlaceholder lines={3} showHeader />
          <ShimmerPlaceholder lines={3} showHeader />
        </div>
      );
    }

    if (currentTab.id === 'home') {
      return (
        <TeacherHomeTab
          teacherProfile={session.profile}
          classesMap={classesMap}
          onOpenSectionAttendance={(secId) => {
            setTeacherSelectedSectionId(secId);
            onTabChange(1); // Open Attendance tab
          }}
        />
      );
    }

    if (currentTab.id === 'attendance') {
      return (
        <TeacherAttendanceTab
          teacherProfile={session.profile}
          classesMap={classesMap}
          selectedSectionId={teacherSelectedSectionId}
          onSelectSectionId={setTeacherSelectedSectionId}
          onDirtyChange={setTeacherAttendanceDirty}
        />
      );
    }

    if (currentTab.id === 'more') {
      return (
        <TeacherMoreTab
          teacherProfile={session.profile}
          classesMap={classesMap}
          onOpenSettings={handleGuardedOpenSettings}
          onLogout={handleGuardedLogout}
        />
      );
    }

    if (currentTab.id === 'marks') {
      return <TeacherMarksTab teacher={session.profile} />;
    }

    if (currentTab.id === 'diary') {
      return <DiaryTab user={session.profile} />;
    }

    if (currentTab.id === 'messages') {
      return <MessagesTab user={session.profile} />;
    }

    // Fallback
    return (
      <>
        <SchoolCard className="flex items-center justify-between gap-3 py-3.5 px-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F28C28]/12 text-[#F28C28] flex items-center justify-center shrink-0">
              {currentTab.icon}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-base font-bold text-[#14284B] truncate">
                {stringResource(currentTab.labelKey)}
              </h2>
              <p className="text-xs text-[#6B7385] truncate">
                {language === 'ur'
                  ? session.profile.fullNameUr
                  : session.profile.fullName}{' '}
                ({session.loginId})
              </p>
            </div>
          </div>
          <StatusChip label={stringResource('coming_soon_title')} tone="info" />
        </SchoolCard>

        <EmptyState
          title={stringResource('coming_soon_title')}
          description={stringResource('coming_soon_subtitle')}
          icon={<Clock className="w-6 h-6 text-[#F28C28]" />}
        />
      </>
    );
  };

  return (
    <div className={`flex flex-col min-h-full h-full bg-[#F6F8FC] parent-skin`}>
      {/* Curved Navy Top Bar */}
      <header className={`bg-[#14284B] text-white rounded-b-[28px] px-4 pt-4 pb-4 shadow-md shrink-0 no-print ps-header ${session.role === UserRole.PARENT ? '' : 'ps-principal'}`}>
        <div className="flex items-center justify-between gap-2.5">
          {/* Left / Start Slot: Parent Child Switcher OR Role Header */}
          {session.role === UserRole.PARENT && selectedChild ? (
            <button
              type="button"
              onClick={() => {
                if (childrenList.length > 1) {
                  setChildSheetOpen(true);
                }
              }}
              className={`ps-child min-h-[48px] px-3 py-1.5 rounded-2xl bg-white/12 border border-white/20 flex items-center gap-2.5 text-start transition-colors min-w-0 ${
                childrenList.length > 1
                  ? 'hover:bg-white/20 active:scale-[0.99] cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              {/* Child Initial / Photo Avatar */}
              <StudentAvatar gender={selectedChild.gender} size={62} />

              <div className="min-w-0 flex-1 py-0.5">
                <div
                  className={`font-heading text-[18px] font-bold text-white flex items-center gap-1.5 ${
                    language === 'ur'
                      ? 'font-urdu leading-[2.4] py-0.5'
                      : 'leading-snug'
                  }`}
                >
                  <span>
                    {language === 'ur'
                      ? selectedChild.nameUr
                      : selectedChild.name}
                  </span>
                </div>
                <div
                  className={`text-[13px] text-white/85 ${
                    language === 'ur'
                      ? 'font-urdu leading-[2.3] py-0.5'
                      : 'leading-normal'
                  }`}
                >
                  {formatChildClassAndSection(selectedChild)}
                </div>
              </div>

              {childrenList.length > 1 && (
                <div className="ps-gold flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-[#F28C28]/25 text-[#F28C28] text-xs font-bold shrink-0">
                  <span dir="ltr">{childrenList.length}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              {(currentTab.id === 'dashboard' || currentTab.id === 'home') ? (
                <>
                  {session.role === UserRole.PRINCIPAL || session.role === UserRole.VICE_PRINCIPAL ? <PrincipalAvatar size={62} /> : <RoleAvatar role={session.role} size={62} />}
                  <div className="min-w-0 py-0.5">
                    <h1
                      className={`font-heading text-[18px] font-bold text-white ${
                        language === 'ur' ? 'font-urdu leading-[2.4] py-0.5' : 'leading-snug'
                      }`}
                    >
                      {language === 'ur' ? session.profile.fullNameUr : session.profile.fullName}
                    </h1>
                    <p
                      className={`text-[13px] text-white/85 ${
                        language === 'ur' ? 'font-urdu leading-[2.3] py-0.5' : 'leading-normal'
                      }`}
                    >
                      {stringResource(`role_${session.role}` as StringKey)}
                    </p>
                  </div>
                </>
              ) : (
              <div className="min-w-0 py-0.5">
                <h1
                  className={`font-heading text-sm font-bold text-white ${
                    language === 'ur'
                      ? 'font-urdu leading-[2.45] py-0.5'
                      : 'leading-snug'
                  }`}
                >
                  {stringResource(currentTab.labelKey)}
                </h1>
                <p
                  className={`text-[11px] text-white/75 ${
                    language === 'ur'
                      ? 'font-urdu leading-[2.35] py-0.5'
                      : 'leading-normal'
                  }`}
                >
                  {language === 'ur'
                    ? session.profile.fullNameUr
                    : session.profile.fullName}{' '}
                  · {stringResource(`role_${session.role}` as StringKey)}
                </p>
              </div>
              )}
            </div>
          )}

          {/* Right / End Slot: Notification Bell (0 unread) + Settings Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              aria-label={stringResource('notifications_label')}
              className="ps-round relative w-10 h-10 rounded-xl bg-white/12 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span
                  dir="ltr"
                  className="ps-keep absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F28C28] text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleGuardedOpenSettings}
              aria-label={stringResource('settings_title')}
              className="ps-round w-10 h-10 rounded-xl bg-white/12 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        {
          <div className="ps-deco ps-books ps-logo-badge">
            <img src={`${import.meta.env.BASE_URL}school-logo.png`} alt="" draggable={false} />
          </div>
        }
        {session.role !== UserRole.PARENT && (
          <>
            <svg className="ps-deco ps-building" viewBox="0 0 220 170" fill="none" stroke="#fff" strokeWidth="2" aria-hidden="true">
              <rect x="30" y="70" width="160" height="100" />
              <rect x="85" y="40" width="50" height="130" />
              <path d="M85 40l25-22 25 22M110 18V2h16v9h-16" />
              <circle cx="110" cy="62" r="9" />
              <path d="M45 88h22v18H45zM45 120h22v18H45zM153 88h22v18h-22zM153 120h22v18h-22zM96 92h28M96 110h28M96 128h28M100 170v-26h20v26" />
            </svg>
          </>
        )}
        <svg className="ps-deco ps-wave" viewBox="0 0 430 48" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 26C70 50 150 6 240 22c60 11 110 12 190-8V48H0Z" fill="#EAF5FD" />
        </svg>
      </header>

      {/* Main Scrollable Tab Body */}
      <div
        className={`flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4 [&>:nth-child(2)]:!mt-0 ${session.role !== UserRole.PARENT ? 'ps-doodle' : ''}`}
        style={{ overscrollBehaviorY: 'contain' }}
        onTouchStart={onPullStart}
        onTouchMove={onPullMove}
        onTouchEnd={onPullEnd}
        onTouchCancel={onPullEnd}
      >
        <div ref={indRef} className="fixed inset-x-0 z-[70] flex justify-center pointer-events-none" style={{ opacity: 0, transition: 'opacity 150ms' }}>
          <span className="px-3 py-1 rounded-full bg-[#14284B] text-white text-[11px] font-semibold shadow" />
        </div>
        <React.Fragment key={refreshTick}>
        {session.role === UserRole.PARENT ? (
          renderParentTabBody()
        ) : session.role === UserRole.TEACHER ? (
          renderTeacherTabBody()
        ) : session.role === UserRole.ATTENDANCE_COORDINATOR ? (
          renderCoordinatorTabBody()
        ) : session.role === UserRole.ADMIN ? (
          <AdminRoot
            admin={session.profile}
            tabId={currentTab.id}
            onSwitchTab={onTabChange}
            onOpenSettings={handleGuardedOpenSettings}
            onLogout={handleGuardedLogout}
          />
        ) : session.role === UserRole.PRINCIPAL || session.role === UserRole.VICE_PRINCIPAL ? (
          <PrincipalRoot
            vice={session.role === UserRole.VICE_PRINCIPAL}
            principal={session.profile}
            tabId={currentTab.id}
            onSwitchTab={onTabChange}
            onOpenSettings={handleGuardedOpenSettings}
            onLogout={handleGuardedLogout}
          />
        ) : session.role === UserRole.ACCOUNTANT ? (
          <AccountantRoot
            accountant={session.profile}
            tabId={currentTab.id}
            onSwitchTab={onTabChange}
            onOpenSettings={handleGuardedOpenSettings}
            onLogout={handleGuardedLogout}
          />
        ) : (
          <>
            {/* Campus Filter Chips on Admin & Principal Home/Dashboard (Defaults to Both Campuses) */}
            {showCampusChips && (
              <SchoolCard className="p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#14284B]">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#F28C28]" />
                    <span>{stringResource('home_campus_label')}</span>
                  </span>
                  <span
                    dir="ltr"
                    className="text-[11px] font-mono text-[#6B7385]"
                  >
                    {selectedCampus}
                  </span>
                </div>
                <TabRow
                  tabs={campusTabs}
                  selected={selectedCampus}
                  onSelect={onCampusChange}
                />
              </SchoolCard>
            )}

            {/* Current Tab Title Header Card */}
            <SchoolCard className="flex items-center justify-between gap-3 py-3.5 px-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-[#F28C28]/12 text-[#F28C28] flex items-center justify-center shrink-0">
                  {currentTab.icon}
                </div>
                <div className="min-w-0">
                  <h2 className="font-heading text-base font-bold text-[#14284B] truncate">
                    {stringResource(currentTab.labelKey)}
                  </h2>
                  <p className="text-xs text-[#6B7385] truncate">
                    {`${stringResource(
                      `role_${session.role}` as StringKey
                    )} · ${session.loginId}`}
                  </p>
                </div>
              </div>
              <StatusChip
                label={stringResource('coming_soon_title')}
                tone="info"
              />
            </SchoolCard>

            {/* Loading Shimmer or Placeholder "Coming soon" EmptyState */}
            {loading ? (
              <div className="space-y-3">
                <ShimmerPlaceholder lines={3} showHeader />
                <ShimmerPlaceholder lines={3} showHeader />
              </div>
            ) : (
              <EmptyState
                title={stringResource('coming_soon_title')}
                description={stringResource('coming_soon_subtitle')}
                icon={<Clock className="w-6 h-6 text-[#F28C28]" />}
              />
            )}

            {/* If on the "More" tab, also offer direct access to Settings & Sign Out */}
            {currentTab.id === 'more' && (
              <SchoolCard className="space-y-2.5">
                <PrimaryButton
                  text={stringResource('settings_open_from_more')}
                  onClick={handleGuardedOpenSettings}
                  variant="navy"
                  icon={<Settings className="w-4 h-4 text-[#F28C28]" />}
                />
                <PrimaryButton
                  text={stringResource('logout_button')}
                  onClick={handleGuardedLogout}
                  variant="outline"
                  icon={<LogOut className="w-4 h-4 text-[#14284B]" />}
                />
              </SchoolCard>
            )}
          </>
        )}
        </React.Fragment>
      </div>

      {/* Role Bottom Navigation Bar (5 Tabs, Orange #F28C28 Selected State) */}
      <nav
        aria-label="Role Bottom Navigation"
        className={`sticky bottom-0 z-30 bg-white border-t border-[#E4E8F0] px-1.5 py-1 shrink-0 no-print ps-nav`}
      >
        <div className={roleTabs.length > 5 ? 'flex items-center overflow-x-auto' : 'grid grid-cols-5 items-center'}>
          {roleTabs.map((tab, idx) => {
            const isSelected = idx === activeTabIndex;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleGuardedTabChange(idx)}
                className={`${isSelected ? 'ps-tab-active' : ''} ${roleTabs.length > 5 ? 'flex-1 min-w-[64px]' : ''} min-h-[54px] px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#F28C28] font-bold'
                    : 'text-[#6B7385] hover:text-[#14284B] font-medium'
                }`}
              >
                <span
                  className={`relative ${isSelected ? 'text-[#F28C28]' : 'text-[#6B7385]'}`}
                >
                  {tab.icon}
                  {tab.id === 'messages' && unreadMessages > 0 && (
                    <span
                      dir="ltr"
                      className="ps-keep absolute -top-1.5 -end-2.5 min-w-[16px] h-4 px-1 rounded-full bg-[#F28C28] text-white font-mono text-[9px] font-bold flex items-center justify-center"
                    >
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </span>
                  )}
                </span>
                <span className="text-[10px] leading-tight whitespace-nowrap truncate max-w-full">
                  {tab.label ?? stringResource(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Parent Child Switcher Modal Bottom Sheet */}
      {childSheetOpen && session.role === UserRole.PARENT && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#14284B]/45 backdrop-blur-[2px] no-print"
          role="dialog"
          aria-modal="true"
          onClick={() => setChildSheetOpen(false)}
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-[28px] border-t border-[#E4E8F0] p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bottom Sheet Handle */}
            <div className="w-10 h-1.5 rounded-full bg-[#E4E8F0] mx-auto" />

            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-bold text-[#14284B]">
                  {stringResource('child_switcher_title')}
                </h3>
                <p className="text-xs text-[#6B7385]">
                  {stringResource('child_switcher_subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChildSheetOpen(false)}
                className="w-8 h-8 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-center text-[#6B7385] hover:text-[#14284B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {childrenList.map((child) => {
                const isSelected =
                  selectedChild && child.id === selectedChild.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectChild(child.id)}
                    className={`w-full min-h-[60px] p-3 rounded-2xl border text-start flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#14284B]/6 border-[#F28C28] ring-1 ring-[#F28C28]'
                        : 'bg-[#F6F8FC] border-[#E4E8F0] hover:border-[#14284B]/30'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <StudentAvatar gender={child.gender} size={40} />
                      <div className="min-w-0">
                        <div className="font-heading text-sm font-bold text-[#14284B] truncate">
                          {language === 'ur' ? child.nameUr : child.name}
                        </div>
                        <div className="text-xs text-[#6B7385] truncate">
                          {formatChildClassAndSection(child)}
                        </div>
                        <div
                          dir="ltr"
                          className="text-[11px] font-mono text-[#6B7385]"
                        >
                          {child.admissionNo} ·{' '}
                          {stringResource('child_roll_prefix')}
                          {child.rollNo}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-7 h-7 rounded-full bg-[#F28C28] text-white flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <NotificationsSheet
        user={session.profile}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onChanged={refreshUnread}
      />

      {/* Unsaved Teacher Attendance Changes Dialog when leaving tab / settings / logout */}
      <SchoolDialog
        open={pendingLeaveAction !== null}
        title={stringResource('unsaved_changes_title')}
        message={stringResource('unsaved_changes_body')}
        confirmText={stringResource('unsaved_discard_btn')}
        cancelText={stringResource('unsaved_stay_btn')}
        onConfirm={confirmLeaveWithUnsavedChanges}
        onDismiss={() => setPendingLeaveAction(null)}
      />
    </div>
  );
};
