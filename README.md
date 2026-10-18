# Al Furqan School Okara — Web Application

A phone-first React + TypeScript + Vite web application for **Al Furqan School Okara** (Boys & Girls Campuses, Academic Year 2026-27).

## Architecture

- **Domain Layer (`src/domain/`)**: Plain TypeScript domain models, regional formatters (`Rs 2,500`, `17 Oct 2026`, `Asia/Karachi`, Western digits `0-9`), and repository interfaces (`AuthRepository`, `StudentRepository`, `AttendanceRepository`, `FeeRepository`, `ExamRepository`, `MessageRepository`, `NoticeRepository`, `DashboardRepository`, `SettingsRepository`).
- **Data Layer (`src/data/`)**: Local `Fake*Repository` implementations persisted in `localStorage` and seeded automatically on first launch with realistic school structure, staff, teachers, parents, students, 30-day attendance history, and fee vouchers/payments.
- **Service / DI Layer (`src/di/AppModule.ts` & `src/services/index.ts`)**: Single dependency binding file. UI components call only these repository interfaces so switching to Supabase later requires changing only this file.
- **UI Layer (`src/ui/`)**: Bright light-only theme (`#14284B` Navy, `#F28C28` Orange, `#F6F8FC` background), bilingual English (`Poppins` + `Inter`) and Urdu (`Noto Nastaliq Urdu` with RTL layout and tall line height), animated splash screen, login screen with collapsible demo accounts, role-specific 5-tab navigation, parent child switcher, and settings screen.
