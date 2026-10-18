import {
  FakeAttendanceRepository,
  FakeAuthRepository,
  FakeDashboardRepository,
  FakeExamRepository,
  FakeFeeRepository,
  FakeMessageRepository,
  FakeNoticeRepository,
  FakeSettingsRepository,
  FakeStudentRepository,
} from '../data/repository/FakeRepositories';
import {
  AttendanceRepository,
  AuthRepository,
  DashboardRepository,
  ExamRepository,
  FeeRepository,
  MessageRepository,
  NoticeRepository,
  SettingsRepository,
  StudentRepository,
} from '../domain/repository/repositories';

/**
 * Single Dependency Injection Module.
 *
 * UI components never instantiate repositories or access localStorage directly.
 * Switching from the local Fake implementations to a Supabase implementation
 * requires changing ONLY the bindings in this file.
 */
export interface AppRepositoryGraph {
  readonly authRepository: AuthRepository;
  readonly studentRepository: StudentRepository;
  readonly attendanceRepository: AttendanceRepository;
  readonly feeRepository: FeeRepository;
  readonly examRepository: ExamRepository;
  readonly messageRepository: MessageRepository;
  readonly noticeRepository: NoticeRepository;
  readonly dashboardRepository: DashboardRepository;
  readonly settingsRepository: SettingsRepository;
}

export const AppModule: AppRepositoryGraph = {
  authRepository: new FakeAuthRepository(),
  studentRepository: new FakeStudentRepository(),
  attendanceRepository: new FakeAttendanceRepository(),
  feeRepository: new FakeFeeRepository(),
  examRepository: new FakeExamRepository(),
  messageRepository: new FakeMessageRepository(),
  noticeRepository: new FakeNoticeRepository(),
  dashboardRepository: new FakeDashboardRepository(),
  settingsRepository: new FakeSettingsRepository(),
};
