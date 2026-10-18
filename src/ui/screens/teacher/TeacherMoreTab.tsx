import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  GraduationCap,
  LogOut,
  Phone,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { AppModule } from '../../../di/AppModule';
import {
  Profile,
  SchoolClass,
  Section,
  Student,
} from '../../../domain/models/models';
import {
  EmptyState,
  PrimaryButton,
  SchoolCard,
  SchoolTextField,
  ShimmerPlaceholder,
} from '../../components/SchoolComposables';
import { useStringResource } from '../../theme/LocaleContext';
import {
  formatClassSectionTitle,
  formatDomainErrorMessage,
  formatSectionCampusLabel,
  getStudentInitials,
} from './TeacherHelpers';

export interface TeacherMoreTabProps {
  teacherProfile: Profile;
  classesMap: Record<string, SchoolClass>;
  onOpenSettings: () => void;
  onLogout: () => void;
}

interface SectionRosterGroup {
  section: Section;
  students: Student[];
}

export const TeacherMoreTab: React.FC<TeacherMoreTabProps> = ({
  teacherProfile,
  classesMap,
  onOpenSettings,
  onLogout,
}) => {
  const { stringResource, language } = useStringResource();

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sectionGroups, setSectionGroups] = useState<SectionRosterGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadMyClasses = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [assignmentsRes, allSectionsRes] = await Promise.all([
        AppModule.settingsRepository.getTeacherAssignments(teacherProfile.id),
        AppModule.settingsRepository.getSections(null),
      ]);

      if (!assignmentsRes.ok) {
        setErrorMessage(
          formatDomainErrorMessage(assignmentsRes.error, stringResource)
        );
        return;
      }
      if (!allSectionsRes.ok) {
        setErrorMessage(
          formatDomainErrorMessage(allSectionsRes.error, stringResource)
        );
        return;
      }

      // Collect unique assigned sectionIds (class teacher + subject assignments)
      const assignedSecIds = new Set(
        assignmentsRes.data.map((ta) => ta.sectionId)
      );
      const assignedSections = allSectionsRes.data.filter((s) =>
        assignedSecIds.has(s.id)
      );

      const groups: SectionRosterGroup[] = await Promise.all(
        assignedSections.map(async (section) => {
          const stuRes =
            await AppModule.attendanceRepository.studentsOfSection(section.id);
          return {
            section,
            students: stuRes.ok ? stuRes.data : [],
          };
        })
      );

      setSectionGroups(groups);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : stringResource('domain_err_generic')
      );
    } finally {
      setLoading(false);
    }
  }, [teacherProfile.id, stringResource]);

  useEffect(() => {
    loadMyClasses();
  }, [loadMyClasses]);

  if (loading) {
    return (
      <div className="space-y-3.5">
        <ShimmerPlaceholder lines={2} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
        <ShimmerPlaceholder lines={4} showHeader />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title={stringResource('error_loading_title')}
        subtitle={errorMessage}
        actionLabel={stringResource('retry_button')}
        onAction={loadMyClasses}
        icon={<AlertCircle className="w-6 h-6 text-[#D64545]" />}
      />
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGroups = sectionGroups
    .map((group) => {
      if (!normalizedQuery) return group;
      const matchingStudents = group.students.filter((stu) => {
        const rollMatch =
          String(stu.rollNo) === normalizedQuery ||
          `#${stu.rollNo}` === normalizedQuery ||
          String(stu.rollNo).includes(normalizedQuery);
        const nameEnMatch = stu.name.toLowerCase().includes(normalizedQuery);
        const nameUrMatch = stu.nameUr.includes(searchQuery.trim());
        const admMatch = stu.admissionNo
          .toLowerCase()
          .includes(normalizedQuery);
        return rollMatch || nameEnMatch || nameUrMatch || admMatch;
      });
      return {
        ...group,
        students: matchingStudents,
      };
    })
    .filter((group) => !normalizedQuery || group.students.length > 0);

  return (
    <div className="space-y-4 pb-4">
      {/* 1. "My classes" Header + Search Box */}
      <SchoolCard className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="font-heading text-sm font-bold text-[#14284B] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#F28C28]" />
            <span>{stringResource('teacher_more_my_classes_title')}</span>
          </h3>
          <p className="text-xs text-[#6B7385]">
            {stringResource('teacher_more_my_classes_subtitle')}
          </p>
        </div>

        <SchoolTextField
          label={stringResource('teacher_more_my_classes_title')}
          value={searchQuery}
          onValueChange={setSearchQuery}
          placeholder={stringResource('teacher_more_search_placeholder')}
          leadingIcon={<Search className="w-4 h-4" />}
        />
      </SchoolCard>

      {/* 2. Assigned Sections & Student Rosters */}
      {sectionGroups.length === 0 ? (
        <EmptyState
          title={stringResource('teacher_no_sections_title')}
          subtitle={stringResource('teacher_no_sections_subtitle')}
        />
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          title={stringResource('teacher_more_no_search_results_title')}
          subtitle={stringResource('teacher_more_no_search_results_subtitle')}
        />
      ) : (
        <div className="space-y-3.5">
          {filteredGroups.map(({ section, students }) => {
            const title = formatClassSectionTitle(
              section,
              classesMap,
              language
            );
            const campusLabel = formatSectionCampusLabel(
              section,
              classesMap,
              stringResource
            );

            return (
              <SchoolCard key={section.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E4E8F0]">
                  <div>
                    <h4 className="font-heading text-sm font-bold text-[#14284B]">
                      {title}
                    </h4>
                    <div className="text-xs text-[#6B7385] flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#F28C28]" />
                        <span>{campusLabel}</span>
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-[#14284B]/8 text-[#14284B] text-xs font-bold inline-flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#F28C28]" />
                    <span dir="ltr" className="font-mono">
                      {students.length}
                    </span>
                    <span>{stringResource('teacher_students_count_suffix')}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {students.map((stu) => (
                    <div
                      key={stu.id}
                      className="p-3 rounded-xl bg-[#F6F8FC] border border-[#E4E8F0] flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          dir="ltr"
                          className="min-w-[30px] h-7 px-1.5 rounded-lg bg-white border border-[#E4E8F0] font-mono text-xs font-bold text-[#14284B] flex items-center justify-center tabular-nums shrink-0"
                        >
                          #{stu.rollNo}
                        </span>
                        <div
                          dir="ltr"
                          className="w-8 h-8 rounded-xl bg-[#14284B] text-white font-heading text-[11px] font-bold flex items-center justify-center shrink-0"
                        >
                          {getStudentInitials(stu)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`font-heading text-xs font-bold text-[#1B2233] line-clamp-2 break-words ${
                              language === 'ur'
                                ? 'font-urdu leading-[2.1] py-0.5'
                                : 'leading-snug'
                            }`}
                          >
                            {language === 'ur' ? stu.nameUr : stu.name}
                          </div>
                          <div
                            dir="ltr"
                            className="text-[11px] font-mono text-[#6B7385] text-start whitespace-nowrap leading-tight mt-0.5"
                          >
                            {stu.admissionNo}
                          </div>
                        </div>
                      </div>

                      {/* Tappable Guardian Phone Call Link */}
                      <a
                        href={`tel:${stu.guardianPhone.replace(/[^0-9+]/g, '')}`}
                        dir="ltr"
                        title={stringResource('teacher_more_call_guardian')}
                        className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white border border-[#E4E8F0] hover:border-[#2E9E5B] hover:bg-[#2E9E5B]/8 text-[#14284B] text-xs font-mono font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#2E9E5B] shrink-0" />
                        <span>{stu.guardianPhone}</span>
                      </a>
                    </div>
                  ))}
                </div>
              </SchoolCard>
            );
          })}
        </div>
      )}

      {/* 3. Settings Entry & Sign Out */}
      <SchoolCard className="space-y-2.5">
        <div className="font-heading text-xs font-bold text-[#14284B]">
          {stringResource('teacher_more_account_section')}
        </div>
        <PrimaryButton
          text={stringResource('settings_open_from_more')}
          onClick={onOpenSettings}
          variant="navy"
          icon={<Settings className="w-4 h-4 text-[#F28C28]" />}
        />
        <PrimaryButton
          text={stringResource('logout_button')}
          onClick={onLogout}
          variant="outline"
          icon={<LogOut className="w-4 h-4 text-[#14284B]" />}
        />
      </SchoolCard>
    </div>
  );
};
