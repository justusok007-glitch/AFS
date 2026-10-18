export type LanguageCode = 'en' | 'ur';

export type StringKey =
  | 'app_name'
  | 'app_name_en_fixed'
  | 'app_name_ur_fixed'
  | 'school_subtitle'
  | 'campuses_badge'
  | 'campus_boys'
  | 'campus_girls'
  | 'campus_both'
  | 'campus_all'
  | 'lang_en'
  | 'lang_ur'
  | 'lang_toggle_label'
  | 'login_title'
  | 'login_subtitle'
  | 'login_id_label'
  | 'login_id_placeholder'
  | 'login_password_label'
  | 'login_password_placeholder'
  | 'login_button'
  | 'login_quick_role_heading'
  | 'login_quick_role_hint'
  | 'login_error_empty'
  | 'login_error_invalid'
  | 'login_error_inactive'
  | 'demo_accounts_title'
  | 'demo_accounts_badge'
  | 'demo_password_note'
  | 'demo_group_staff'
  | 'demo_group_teachers'
  | 'demo_group_parents'
  | 'dev_menu_title'
  | 'dev_menu_subtitle'
  | 'dev_menu_check_screen'
  | 'dev_reset_dialog_title'
  | 'dev_reset_dialog_body'
  | 'dev_reset_confirm'
  | 'dev_reset_toast'
  | 'role_parent'
  | 'role_teacher'
  | 'role_principal'
  | 'role_accountant'
  | 'role_admin'
  | 'role_parent_desc'
  | 'role_teacher_desc'
  | 'role_principal_desc'
  | 'role_accountant_desc'
  | 'role_admin_desc'
  | 'nav_home'
  | 'nav_settings'
  | 'tab_home'
  | 'tab_dashboard'
  | 'tab_attendance'
  | 'tab_fees'
  | 'tab_results'
  | 'tab_messages'
  | 'tab_marks'
  | 'tab_collect'
  | 'tab_vouchers'
  | 'tab_reports'
  | 'tab_defaulters'
  | 'tab_setup'
  | 'tab_users'
  | 'tab_students'
  | 'tab_more'
  | 'coming_soon_title'
  | 'coming_soon_subtitle'
  | 'child_switcher_title'
  | 'child_switcher_subtitle'
  | 'child_roll_prefix'
  | 'child_tap_to_switch'
  | 'notifications_label'
  | 'notifications_unread_zero'
  | 'logout_button'
  | 'logout_confirm_title'
  | 'logout_confirm_body'
  | 'dialog_cancel'
  | 'dialog_confirm'
  | 'back_button_label'
  | 'app_exited_title'
  | 'app_exited_subtitle'
  | 'app_reopen_button'
  | 'placeholder_home_badge'
  | 'placeholder_parent_title'
  | 'placeholder_parent_subtitle'
  | 'placeholder_teacher_title'
  | 'placeholder_teacher_subtitle'
  | 'placeholder_principal_title'
  | 'placeholder_principal_subtitle'
  | 'placeholder_accountant_title'
  | 'placeholder_accountant_subtitle'
  | 'placeholder_admin_title'
  | 'placeholder_admin_subtitle'
  | 'home_user_name_label'
  | 'home_role_label'
  | 'home_campus_label'
  | 'home_login_id_label'
  | 'home_children_section'
  | 'home_teacher_sections_label'
  | 'home_db_seeded_summary'
  | 'stat_enrolled_students'
  | 'stat_campus_cap'
  | 'stat_sample_fee'
  | 'stat_current_date'
  | 'status_paid'
  | 'status_pending'
  | 'status_overdue'
  | 'status_present'
  | 'status_info'
  | 'empty_notices_title'
  | 'empty_notices_body'
  | 'empty_students_title'
  | 'empty_students_body'
  | 'empty_action_reload'
  | 'sim_loading_button'
  | 'open_dialog_button'
  | 'sample_dialog_title'
  | 'sample_dialog_body'
  | 'settings_title'
  | 'settings_subtitle'
  | 'settings_language_section'
  | 'settings_campus_section'
  | 'settings_theme_section'
  | 'settings_theme_locked_title'
  | 'settings_theme_locked_body'
  | 'settings_format_section'
  | 'settings_currency_label'
  | 'settings_date_label'
  | 'settings_timezone_label'
  | 'settings_timezone_value'
  | 'settings_digits_label'
  | 'settings_digits_value'
  | 'settings_session_section'
  | 'settings_switch_role_label'
  | 'settings_reset_storage'
  | 'settings_reset_done'
  | 'settings_change_password_section'
  | 'settings_old_password_label'
  | 'settings_old_password_placeholder'
  | 'settings_new_password_label'
  | 'settings_new_password_placeholder'
  | 'settings_confirm_password_label'
  | 'settings_confirm_password_placeholder'
  | 'settings_change_password_btn'
  | 'settings_password_success'
  | 'settings_password_mismatch'
  | 'settings_password_short'
  | 'settings_password_wrong_old'
  | 'settings_app_version_label'
  | 'settings_app_version_value'
  | 'settings_open_from_more'
  | 'repo_auth'
  | 'repo_student'
  | 'repo_attendance'
  | 'repo_fee'
  | 'repo_exam'
  | 'repo_message'
  | 'repo_notice'
  | 'repo_dashboard'
  | 'repo_settings'
  | 'repo_status_ready'
  | 'repo_empty_result'
  // Parent Screens & Shared Controls
  | 'pull_to_refresh'
  | 'refreshing_label'
  | 'error_loading_title'
  | 'error_loading_subtitle'
  | 'retry_button'
  | 'no_child_linked_title'
  | 'no_child_linked_subtitle'
  | 'parent_greeting_prefix'
  | 'parent_welcome_subtitle'
  | 'child_profile_card_title'
  | 'child_admission_no_label'
  | 'child_roll_no_label'
  | 'child_class_section_label'
  | 'child_campus_label'
  | 'home_today_attendance_title'
  | 'home_month_attendance_title'
  | 'att_status_present'
  | 'att_status_absent'
  | 'att_status_leave'
  | 'att_status_late'
  | 'att_status_not_marked'
  | 'att_status_sunday_holiday'
  | 'att_status_unmarked_day'
  | 'home_fee_status_title'
  | 'home_fee_pending_label'
  | 'home_fee_oldest_due_label'
  | 'home_fee_view_button'
  | 'home_fee_all_paid_title'
  | 'home_fee_all_paid_subtitle'
  | 'home_latest_result_title'
  | 'home_latest_result_subtitle'
  | 'home_latest_notices_title'
  | 'home_latest_notices_subtitle'
  // Parent Attendance Tab
  | 'att_mode_daily'
  | 'att_mode_monthly'
  | 'att_mode_all_time'
  | 'att_prev_month'
  | 'att_next_month'
  | 'att_legend_title'
  | 'att_month_summary_title'
  | 'att_month_percentage_label'
  | 'att_day_detail_title'
  | 'att_day_date_label'
  | 'att_day_status_label'
  | 'att_day_remark_label'
  | 'att_day_no_remark'
  | 'att_chart_title'
  | 'att_monthly_list_title'
  | 'att_marked_days_label'
  | 'att_all_time_ring_title'
  | 'att_calculation_note'
  | 'att_empty_month_title'
  | 'att_empty_month_subtitle'
  | 'weekday_sun'
  | 'weekday_mon'
  | 'weekday_tue'
  | 'weekday_wed'
  | 'weekday_thu'
  | 'weekday_fri'
  | 'weekday_sat'
  | 'month_01'
  | 'month_02'
  | 'month_03'
  | 'month_04'
  | 'month_05'
  | 'month_06'
  | 'month_07'
  | 'month_08'
  | 'month_09'
  | 'month_10'
  | 'month_11'
  | 'month_12'
  | 'month_short_01'
  | 'month_short_02'
  | 'month_short_03'
  | 'month_short_04'
  | 'month_short_05'
  | 'month_short_06'
  | 'month_short_07'
  | 'month_short_08'
  | 'month_short_09'
  | 'month_short_10'
  | 'month_short_11'
  | 'month_short_12'
  // Parent Fees Tab
  | 'fee_card_monthly'
  | 'fee_card_paid'
  | 'fee_card_pending'
  | 'fee_card_arrears'
  | 'fee_card_annual'
  | 'fee_card_admission'
  | 'voucher_status_paid'
  | 'voucher_status_partial'
  | 'voucher_status_unpaid'
  | 'fee_vouchers_section_title'
  | 'fee_vouchers_empty_title'
  | 'fee_vouchers_empty_subtitle'
  | 'fee_voucher_no_label'
  | 'fee_billing_month_label'
  | 'fee_issue_date_label'
  | 'fee_due_date_label'
  | 'fee_voucher_detail_title'
  | 'fee_items_heading'
  | 'fee_item_head_col'
  | 'fee_item_amount_col'
  | 'fee_item_waived_col'
  | 'fee_item_net_col'
  | 'fee_total_label'
  | 'fee_amount_paid_label'
  | 'fee_balance_label'
  | 'fee_voucher_payments_heading'
  | 'fee_voucher_no_payments'
  | 'fee_payment_history_title'
  | 'fee_payment_history_empty_title'
  | 'fee_payment_history_empty_subtitle'
  | 'fee_receipt_no_label'
  | 'fee_payment_date_label'
  | 'fee_payment_method_label'
  | 'fee_payment_amount_label'
  | 'method_CASH'
  | 'method_BANK'
  | 'method_JAZZCASH'
  | 'method_EASYPAISA'
  | 'print_save_pdf_button'
  | 'print_receipt_button'
  | 'print_trigger_now'
  | 'print_close_preview'
  | 'print_voucher_document_title'
  | 'print_receipt_document_title'
  | 'print_school_address'
  | 'print_computer_generated_note'
  // Teacher Screens & Developer Menu Attendance Controls
  | 'teacher_welcome_subtitle'
  | 'teacher_today_date_label'
  | 'teacher_today_attendance_title'
  | 'teacher_summary_done_label'
  | 'teacher_summary_pending_label'
  | 'teacher_badge_pending'
  | 'teacher_badge_submitted_at'
  | 'teacher_students_count_suffix'
  | 'teacher_tap_to_open_section'
  | 'teacher_marks_entry_title'
  | 'teacher_marks_entry_subtitle'
  | 'teacher_unread_messages_title'
  | 'teacher_unread_messages_subtitle'
  | 'teacher_no_sections_title'
  | 'teacher_no_sections_subtitle'
  | 'teacher_att_section_picker_label'
  | 'teacher_att_date_label'
  | 'teacher_att_today_badge'
  | 'teacher_att_prev_day'
  | 'teacher_att_next_day'
  | 'teacher_att_view_only_badge'
  | 'teacher_att_only_admin_can_change'
  | 'teacher_att_lock_time_note'
  | 'teacher_att_mark_all_present'
  | 'teacher_att_cycle_hint'
  | 'teacher_att_submit_btn'
  | 'teacher_att_update_btn'
  | 'teacher_att_submitting_btn'
  | 'teacher_att_submit_success'
  | 'teacher_att_update_success'
  | 'teacher_att_no_records_past_day'
  | 'teacher_att_remark_sheet_title'
  | 'teacher_att_remark_sheet_subtitle'
  | 'teacher_att_select_status_label'
  | 'teacher_att_remark_input_label'
  | 'teacher_att_remark_input_placeholder'
  | 'teacher_att_remark_save_btn'
  | 'teacher_att_remark_clear_btn'
  | 'teacher_att_edit_note_tooltip'
  | 'unsaved_changes_title'
  | 'unsaved_changes_body'
  | 'unsaved_discard_btn'
  | 'unsaved_stay_btn'
  | 'domain_err_section_not_assigned'
  | 'domain_err_date_locked'
  | 'domain_err_past_cutoff'
  | 'domain_err_unauthorized'
  | 'domain_err_validation'
  | 'domain_err_generic'
  | 'teacher_more_my_classes_title'
  | 'teacher_more_my_classes_subtitle'
  | 'teacher_more_search_placeholder'
  | 'teacher_more_call_guardian'
  | 'teacher_more_no_search_results_title'
  | 'teacher_more_no_search_results_subtitle'
  | 'teacher_more_account_section'
  | 'dev_pending_today_title'
  | 'dev_pending_today_all_done'
  | 'dev_clear_section_title'
  | 'dev_clear_section_select_label'
  | 'dev_clear_section_btn'
  | 'dev_clear_section_toast'
  | 'teacher_att_holiday_off_notice'
  | 'demo_date_active_strip'
  | 'demo_date_picker_title'
  | 'demo_date_picker_subtitle'
  | 'demo_date_use_real_btn'
  | 'demo_date_using_real_badge';

export const stringsEn: Record<StringKey, string> = {
  app_name: 'Al Furqan School Okara',
  app_name_en_fixed: 'Al Furqan School Okara',
  app_name_ur_fixed: 'الفرقان اسکول اوکاڑہ',
  school_subtitle: 'Boys & Girls Campuses · Okara',
  campuses_badge: 'Academic Year 2026-27 · Boys & Girls Campuses',
  campus_boys: 'Boys Campus',
  campus_girls: 'Girls Campus',
  campus_both: 'Both Campuses',
  campus_all: 'All Campuses (Boys & Girls)',
  lang_en: 'EN',
  lang_ur: 'اردو',
  lang_toggle_label: 'App Language',
  login_title: 'Assalam-o-Alaikum',
  login_subtitle: 'Sign in with your School Login ID and password',
  login_id_label: 'Login ID',
  login_id_placeholder: 'e.g. PR01, AD01, AC01, T0001, P00001',
  login_password_label: 'Password',
  login_password_placeholder: 'Enter your password',
  login_button: 'Sign In to Portal',
  login_quick_role_heading: 'Demo Accounts (Demo Only)',
  login_quick_role_hint: 'Tap any demo account below to fill Login ID and password (demo1234).',
  login_error_empty: 'Please enter both your Login ID and password.',
  login_error_invalid: 'Incorrect Login ID or password. Please check your credentials and try again.',
  login_error_inactive: 'This account is inactive. Please contact the school administration office.',
  demo_accounts_title: 'Demo Accounts (Demo Only)',
  demo_accounts_badge: 'Password: demo1234',
  demo_password_note: 'Tap any row to autofill credentials (password: demo1234)',
  demo_group_staff: 'Administration & Accounts (AD01, PR01, AC01)',
  demo_group_teachers: 'Teachers (T0001 – T0008 · Boys & Girls Campuses)',
  demo_group_parents: 'Parents (P00001 – P00030 · P00001 has 2 kids in B & G)',
  dev_menu_title: 'Developer Menu (5-Tap Logo)',
  dev_menu_subtitle: 'Internal verification & reset tools (reachable only via 5-tap logo on Login)',
  dev_menu_check_screen: 'Developer Check Screen (Attendance & Fees)',
  dev_reset_dialog_title: 'Reset Demo Data?',
  dev_reset_dialog_body: 'Developer Action: Access internal verification checks or reset local storage to the initial seeded demo dataset.',
  dev_reset_confirm: 'Reset Demo Data',
  dev_reset_toast: 'Demo database has been reset to initial seed state.',
  role_parent: 'Parent',
  role_teacher: 'Teacher',
  role_principal: 'Principal',
  role_accountant: 'Accountant',
  role_admin: 'Admin',
  role_parent_desc: 'Child attendance, fee vouchers & notices',
  role_teacher_desc: 'Class roll call, exam marks & parent messages',
  role_principal_desc: 'Boys & Girls campus overview & approvals',
  role_accountant_desc: 'Fee collection, challans & ledger in Rs',
  role_admin_desc: 'Admissions, user IDs & system configuration',
  nav_home: 'Home',
  nav_settings: 'Settings',
  tab_home: 'Home',
  tab_dashboard: 'Dashboard',
  tab_attendance: 'Attendance',
  tab_fees: 'Fees',
  tab_results: 'Results',
  tab_messages: 'Messages',
  tab_marks: 'Marks',
  tab_collect: 'Collect',
  tab_vouchers: 'Vouchers',
  tab_reports: 'Reports',
  tab_defaulters: 'Defaulters',
  tab_setup: 'Setup',
  tab_users: 'Users',
  tab_students: 'Students',
  tab_more: 'More',
  coming_soon_title: 'Coming soon',
  coming_soon_subtitle: 'This screen is wired to the repository layer and will be built in the next step.',
  child_switcher_title: 'Select Child',
  child_switcher_subtitle: 'Switch active child profile across all Parent tabs',
  child_roll_prefix: 'Roll #',
  child_tap_to_switch: 'Switch',
  notifications_label: 'Notifications',
  notifications_unread_zero: 'No unread notifications (0)',
  logout_button: 'Sign Out',
  logout_confirm_title: 'Sign Out of Al Furqan Portal?',
  logout_confirm_body: 'Your local session in AuthRepository will be cleared. You can sign back in with any demo Login ID.',
  dialog_cancel: 'Cancel',
  dialog_confirm: 'Confirm',
  back_button_label: 'Back',
  app_exited_title: 'Al Furqan School Okara',
  app_exited_subtitle: 'You exited from the home tab. Tap the school icon below to reopen the portal.',
  app_reopen_button: 'Open Al Furqan School Okara',
  placeholder_home_badge: 'Role Home Screen',
  placeholder_parent_title: 'Parent Home',
  placeholder_parent_subtitle: 'Signed in via AuthRepository. Linked children from StudentRepository are shown in the top bar.',
  placeholder_teacher_title: 'Teacher Home',
  placeholder_teacher_subtitle: 'Signed in via AuthRepository. Assigned sections from SettingsRepository are ready.',
  placeholder_principal_title: 'Principal Home',
  placeholder_principal_subtitle: 'Signed in via AuthRepository with access across both Boys & Girls campuses.',
  placeholder_accountant_title: 'Accountant Home',
  placeholder_accountant_subtitle: 'Signed in via AuthRepository with access to both Boys & Girls campuses.',
  placeholder_admin_title: 'Admin Home',
  placeholder_admin_subtitle: 'Signed in via AuthRepository. Local database seeded with 24 classes, 28 sections, and 60 students.',
  home_user_name_label: 'Full Name',
  home_role_label: 'Role',
  home_campus_label: 'Campus Scope',
  home_login_id_label: 'Login ID',
  home_children_section: 'Linked Children (StudentRepository.childrenOfParent)',
  home_teacher_sections_label: 'Assigned Sections (SettingsRepository.getTeacherAssignments)',
  home_db_seeded_summary: 'Local Database Seeded (Academic Year 2026-27)',
  stat_enrolled_students: 'Active Students',
  stat_campus_cap: 'Campuses (B & G)',
  stat_sample_fee: 'Monthly Tuition Format',
  stat_current_date: 'Karachi Date Format',
  status_paid: 'Paid · Rs 2,500',
  status_pending: 'Pending',
  status_overdue: 'Overdue · Action Needed',
  status_present: 'Active Account',
  status_info: 'Boys & Girls Campuses',
  empty_notices_title: 'No Notices Published Yet',
  empty_notices_body: 'AuthRepository, StudentRepository, AttendanceRepository, FeeRepository, and SettingsRepository are backed by the local demo database.',
  empty_students_title: 'No Records in Current View',
  empty_students_body: 'Repository interfaces are wired and ready. Switch to Supabase later by changing only AppModule.',
  empty_action_reload: 'Reload from Local DB (200–400ms)',
  sim_loading_button: 'Reload Profile & DB',
  open_dialog_button: 'Preview Dialog',
  sample_dialog_title: 'SchoolDialog Component',
  sample_dialog_body: 'This reusable dialog enforces the light-only #FFFFFF surface, 16px corner radius, and RTL-aware typography.',
  settings_title: 'Settings',
  settings_subtitle: 'Language switch (EN | اردو), change password, app version, and sign out',
  settings_language_section: 'Language & Layout Direction',
  settings_campus_section: 'Default Campus Scope',
  settings_theme_section: 'Theme Enforcement',
  settings_theme_locked_title: 'Bright Light Theme Locked',
  settings_theme_locked_body: 'Dark mode is disabled across the entire app even when the system dark theme is active.',
  settings_format_section: 'Regional Formatting (Pakistan)',
  settings_currency_label: 'Currency Format',
  settings_date_label: 'Date Format',
  settings_timezone_label: 'Timezone',
  settings_timezone_value: 'Asia/Karachi (PKT, UTC+5)',
  settings_digits_label: 'Numerals',
  settings_digits_value: 'Western Digits (0–9) in English & Urdu',
  settings_session_section: 'Account & Session',
  settings_switch_role_label: 'Quick Switch Role Destination',
  settings_reset_storage: 'Reset Demo Data',
  settings_reset_done: 'Demo data re-seeded in 260ms',
  settings_change_password_section: 'Change Password',
  settings_old_password_label: 'Current Password',
  settings_old_password_placeholder: 'Enter current password',
  settings_new_password_label: 'New Password',
  settings_new_password_placeholder: 'At least 4 characters',
  settings_confirm_password_label: 'Confirm New Password',
  settings_confirm_password_placeholder: 'Re-enter new password',
  settings_change_password_btn: 'Update Password',
  settings_password_success: 'Password changed successfully. Use your new password next time you sign in.',
  settings_password_mismatch: 'New password and confirmation do not match.',
  settings_password_short: 'New password must be at least 4 characters long.',
  settings_password_wrong_old: 'Current password is incorrect.',
  settings_app_version_label: 'App Version',
  settings_app_version_value: 'v1.0.0 (Build 2026.10)',
  settings_open_from_more: 'Open Settings',
  repo_auth: 'AuthRepository',
  repo_student: 'StudentRepository',
  repo_attendance: 'AttendanceRepository',
  repo_fee: 'FeeRepository',
  repo_exam: 'ExamRepository',
  repo_message: 'MessageRepository',
  repo_notice: 'NoticeRepository',
  repo_dashboard: 'DashboardRepository',
  repo_settings: 'SettingsRepository',
  repo_status_ready: 'Bound in AppModule',
  repo_empty_result: '0 items',
  // Parent Screens & Shared Controls
  pull_to_refresh: 'Refresh',
  refreshing_label: 'Refreshing...',
  error_loading_title: 'Unable to Load Data',
  error_loading_subtitle: 'Something went wrong while fetching records. Tap Retry to try again.',
  retry_button: 'Retry',
  no_child_linked_title: 'No Student Linked',
  no_child_linked_subtitle: 'Please contact the school administration office to link your child profile.',
  parent_greeting_prefix: 'Assalam-o-Alaikum,',
  parent_welcome_subtitle: 'Parent Portal · Academic Year 2026-27',
  child_profile_card_title: 'Student Profile',
  child_admission_no_label: 'Admission No',
  child_roll_no_label: 'Roll No',
  child_class_section_label: 'Class & Section',
  child_campus_label: 'Campus',
  home_today_attendance_title: 'Today’s Attendance',
  home_month_attendance_title: 'This Month’s Attendance',
  att_status_present: 'Present',
  att_status_absent: 'Absent',
  att_status_leave: 'Leave',
  att_status_late: 'Late',
  att_status_not_marked: 'Not marked yet',
  att_status_sunday_holiday: 'Sunday / Holiday',
  att_status_unmarked_day: 'No record',
  home_fee_status_title: 'Fee Status',
  home_fee_pending_label: 'Pending Amount',
  home_fee_oldest_due_label: 'Oldest Unpaid Due Date',
  home_fee_view_button: 'View fees',
  home_fee_all_paid_title: 'All paid',
  home_fee_all_paid_subtitle: 'No pending fee balance for this student.',
  home_latest_result_title: 'Latest result',
  home_latest_result_subtitle: 'Exam results and subject report cards will appear here once published.',
  home_latest_notices_title: 'Latest notices',
  home_latest_notices_subtitle: 'School circulars, announcements, and holiday alerts will appear here.',
  // Parent Attendance Tab
  att_mode_daily: 'Daily',
  att_mode_monthly: 'Monthly',
  att_mode_all_time: 'All time',
  att_prev_month: 'Previous Month',
  att_next_month: 'Next Month',
  att_legend_title: 'Legend',
  att_month_summary_title: 'Month Summary',
  att_month_percentage_label: 'Month Percentage',
  att_day_detail_title: 'Day Attendance Detail',
  att_day_date_label: 'Date',
  att_day_status_label: 'Status',
  att_day_remark_label: 'Remark',
  att_day_no_remark: 'No remark recorded',
  att_chart_title: 'Monthly Attendance Percentage',
  att_monthly_list_title: 'Monthly Breakdown',
  att_marked_days_label: 'Marked Days',
  att_all_time_ring_title: 'Overall Attendance',
  att_calculation_note: 'Attendance is calculated excluding leave days, Sundays and holidays.',
  att_empty_month_title: 'No Attendance Records',
  att_empty_month_subtitle: 'No attendance was marked during this month.',
  weekday_sun: 'Sun',
  weekday_mon: 'Mon',
  weekday_tue: 'Tue',
  weekday_wed: 'Wed',
  weekday_thu: 'Thu',
  weekday_fri: 'Fri',
  weekday_sat: 'Sat',
  month_01: 'January',
  month_02: 'February',
  month_03: 'March',
  month_04: 'April',
  month_05: 'May',
  month_06: 'June',
  month_07: 'July',
  month_08: 'August',
  month_09: 'September',
  month_10: 'October',
  month_11: 'November',
  month_12: 'December',
  month_short_01: 'Jan',
  month_short_02: 'Feb',
  month_short_03: 'Mar',
  month_short_04: 'Apr',
  month_short_05: 'May',
  month_short_06: 'Jun',
  month_short_07: 'Jul',
  month_short_08: 'Aug',
  month_short_09: 'Sep',
  month_short_10: 'Oct',
  month_short_11: 'Nov',
  month_short_12: 'Dec',
  // Parent Fees Tab
  fee_card_monthly: 'Monthly Fee',
  fee_card_paid: 'Paid This Month',
  fee_card_pending: 'Pending',
  fee_card_arrears: 'Previous Arrears',
  fee_card_annual: 'Annual Charges',
  fee_card_admission: 'Admission Fee',
  voucher_status_paid: 'Paid',
  voucher_status_partial: 'Partial',
  voucher_status_unpaid: 'Unpaid',
  fee_vouchers_section_title: 'Vouchers',
  fee_vouchers_empty_title: 'No Vouchers Found',
  fee_vouchers_empty_subtitle: 'No fee vouchers have been issued for this student yet.',
  fee_voucher_no_label: 'Voucher No',
  fee_billing_month_label: 'Billing Month',
  fee_issue_date_label: 'Issue Date',
  fee_due_date_label: 'Due Date',
  fee_voucher_detail_title: 'Voucher Details',
  fee_items_heading: 'Itemized Fee Breakdown',
  fee_item_head_col: 'Fee Head',
  fee_item_amount_col: 'Amount',
  fee_item_waived_col: 'Waived',
  fee_item_net_col: 'Net',
  fee_total_label: 'Total',
  fee_amount_paid_label: 'Amount Paid',
  fee_balance_label: 'Balance',
  fee_voucher_payments_heading: 'Payments Received Against Voucher',
  fee_voucher_no_payments: 'No payments received against this voucher yet.',
  fee_payment_history_title: 'Payment history',
  fee_payment_history_empty_title: 'No Receipts Found',
  fee_payment_history_empty_subtitle: 'Valid payment receipts will appear here once recorded.',
  fee_receipt_no_label: 'Receipt No',
  fee_payment_date_label: 'Date',
  fee_payment_method_label: 'Method',
  fee_payment_amount_label: 'Amount',
  method_CASH: 'Cash',
  method_BANK: 'Bank',
  method_JAZZCASH: 'JazzCash',
  method_EASYPAISA: 'Easypaisa',
  print_save_pdf_button: 'Print / Save PDF',
  print_receipt_button: 'Print receipt',
  print_trigger_now: 'Print / Save PDF',
  print_close_preview: 'Close',
  print_voucher_document_title: 'Fee Voucher / Challan',
  print_receipt_document_title: 'Official Fee Payment Receipt',
  print_school_address: 'M.A. Jinnah Road, Okara · Tel: 044-2701122',
  print_computer_generated_note: 'Computer generated document — Al Furqan School Okara',
  // Teacher Screens & Developer Menu Attendance Controls
  teacher_welcome_subtitle: 'Teacher Portal · Academic Year 2026-27',
  teacher_today_date_label: 'Today’s Date',
  teacher_today_attendance_title: 'Today’s attendance',
  teacher_summary_done_label: 'Sections Done',
  teacher_summary_pending_label: 'Sections Pending',
  teacher_badge_pending: 'Pending',
  teacher_badge_submitted_at: 'Submitted at',
  teacher_students_count_suffix: 'students',
  teacher_tap_to_open_section: 'Tap to mark or review attendance',
  teacher_marks_entry_title: 'Marks entry',
  teacher_marks_entry_subtitle: 'Subject exam marks and grading sheets will be available here soon.',
  teacher_unread_messages_title: 'Unread messages',
  teacher_unread_messages_subtitle: 'Parent-teacher conversations and announcements will appear here soon.',
  teacher_no_sections_title: 'No Attendance Section Assigned',
  teacher_no_sections_subtitle: 'No class section is currently assigned to your account for marking daily attendance.',
  teacher_att_section_picker_label: 'Assigned Section',
  teacher_att_date_label: 'Attendance Date',
  teacher_att_today_badge: 'Today',
  teacher_att_prev_day: 'Previous day',
  teacher_att_next_day: 'Next day',
  teacher_att_view_only_badge: 'View only',
  teacher_att_only_admin_can_change: 'Only the admin can change this attendance',
  teacher_att_lock_time_note: 'Cutoff time',
  teacher_att_mark_all_present: 'Mark all present',
  teacher_att_cycle_hint: 'Tap status chip to cycle Present → Absent → Leave → Late. Long-press or tap note icon to add a remark.',
  teacher_att_submit_btn: 'Submit attendance',
  teacher_att_update_btn: 'Update attendance',
  teacher_att_submitting_btn: 'Saving...',
  teacher_att_submit_success: 'Attendance submitted successfully.',
  teacher_att_update_success: 'Attendance updated successfully.',
  teacher_att_no_records_past_day: 'No attendance was recorded for this section on this date.',
  teacher_att_remark_sheet_title: 'Student Attendance & Remark',
  teacher_att_remark_sheet_subtitle: 'Choose status explicitly and add an optional remark',
  teacher_att_select_status_label: 'Attendance Status',
  teacher_att_remark_input_label: 'Optional Remark',
  teacher_att_remark_input_placeholder: 'e.g. Sick leave, informed by guardian, van delayed...',
  teacher_att_remark_save_btn: 'Apply',
  teacher_att_remark_clear_btn: 'Clear remark',
  teacher_att_edit_note_tooltip: 'Status & Remark',
  unsaved_changes_title: 'Discard unsaved changes?',
  unsaved_changes_body: 'You have unsaved attendance changes for this section. Do you want to discard them and leave?',
  unsaved_discard_btn: 'Discard changes',
  unsaved_stay_btn: 'Stay here',
  domain_err_section_not_assigned: 'You are not assigned to mark attendance for this section.',
  domain_err_date_locked: 'Teachers can only submit or edit attendance for today. Only the admin can change past attendance.',
  domain_err_past_cutoff: 'Attendance submission is locked after the daily cutoff time. Only the admin can change this attendance.',
  domain_err_unauthorized: 'Your account role is not authorized to perform this action.',
  domain_err_validation: 'Please check the entered details and try again.',
  domain_err_generic: 'Could not complete the request. Please try again.',
  teacher_more_my_classes_title: 'My classes',
  teacher_more_my_classes_subtitle: 'Assigned sections, student rosters, and guardian phone links',
  teacher_more_search_placeholder: 'Search by student name or roll number...',
  teacher_more_call_guardian: 'Call Guardian',
  teacher_more_no_search_results_title: 'No Matching Students',
  teacher_more_no_search_results_subtitle: 'No students matched your search by name or roll number.',
  teacher_more_account_section: 'Account & Preferences',
  dev_pending_today_title: 'Teachers with Pending Sections Today',
  dev_pending_today_all_done: 'All sections have been submitted for today!',
  dev_clear_section_title: 'Clear today’s attendance for a section',
  dev_clear_section_select_label: 'Select section',
  dev_clear_section_btn: 'Clear Today’s Attendance',
  dev_clear_section_toast: 'Cleared today’s attendance for the selected section (now Pending).',
  teacher_att_holiday_off_notice: 'Holiday / weekly off - no attendance today',
  demo_date_active_strip: 'Demo date active',
  demo_date_picker_title: 'Demo date',
  demo_date_picker_subtitle: 'Default is the real date (Asia/Karachi). Real time of day is kept.',
  demo_date_use_real_btn: 'Use real date',
  demo_date_using_real_badge: 'Real date',
};

export const stringsUr: Record<StringKey, string> = {
  app_name: 'الفرقان اسکول اوکاڑہ',
  app_name_en_fixed: 'Al Furqan School Okara',
  app_name_ur_fixed: 'الفرقان اسکول اوکاڑہ',
  school_subtitle: 'بوائز اور گرلز کیمپس · اوکاڑہ',
  campuses_badge: 'تعلیمی سال 2026-27 · بوائز اور گرلز کیمپس',
  campus_boys: 'بوائز کیمپس',
  campus_girls: 'گرلز کیمپس',
  campus_both: 'دونوں کیمپس',
  campus_all: 'تمام کیمپس (بوائز اور گرلز)',
  lang_en: 'EN',
  lang_ur: 'اردو',
  lang_toggle_label: 'ایپ کی زبان',
  login_title: 'السلام علیکم',
  login_subtitle: 'اپنے اسکول لاگ ان آئی ڈی اور پاس ورڈ سے داخل ہوں',
  login_id_label: 'لاگ ان آئی ڈی',
  login_id_placeholder: 'مثال: PR01, AD01, AC01, T0001, P00001',
  login_password_label: 'پاس ورڈ',
  login_password_placeholder: 'اپنا پاس ورڈ درج کریں',
  login_button: 'پورٹل میں داخل ہوں',
  login_quick_role_heading: 'ڈیمو اکاؤنٹس (صرف ڈیمو کے لیے)',
  login_quick_role_hint: 'لاگ ان آئی ڈی اور پاس ورڈ (demo1234) بھرنے کے لیے کسی بھی اکاؤنٹ پر ٹیپ کریں۔',
  login_error_empty: 'براہ کرم لاگ ان آئی ڈی اور پاس ورڈ دونوں درج کریں۔',
  login_error_invalid: 'غلط لاگ ان آئی ڈی یا پاس ورڈ۔ براہ کرم معلومات چیک کر کے دوبارہ کوشش کریں۔',
  login_error_inactive: 'یہ اکاؤنٹ فی الحال غیر فعال ہے۔ براہ کرم اسکول انتظامیہ سے رابطہ کریں۔',
  demo_accounts_title: 'ڈیمو اکاؤنٹس (صرف ڈیمو کے لیے)',
  demo_accounts_badge: 'پاس ورڈ: demo1234',
  demo_password_note: 'آئی ڈی اور پاس ورڈ (demo1234) بھرنے کے لیے کسی بھی اکاؤنٹ پر کلک کریں',
  demo_group_staff: 'انتظامیہ اور اکاؤنٹس (AD01, PR01, AC01)',
  demo_group_teachers: 'اساتذہ (T0001 تا T0008 · بوائز اور گرلز کیمپس)',
  demo_group_parents: 'والدین (P00001 تا P00030 · P00001 کے 2 بچے دونوں کیمپس میں)',
  dev_menu_title: 'ڈیولپر مینو (5 بار لوگو ٹیپ)',
  dev_menu_subtitle: 'اندرونی چیک اسکرینز اور ڈیمو ڈیٹا ری سیٹ (صرف لاگ ان لوگو 5 بار ٹیپ کرنے پر دستیاب)',
  dev_menu_check_screen: 'ڈیولپر چیک اسکرین (حاضری اور فیس)',
  dev_reset_dialog_title: 'ڈیمو ڈیٹا ری سیٹ کریں؟',
  dev_reset_dialog_body: 'ڈیولپر ایکشن: اندرونی چیک اسکرینز کھولیں یا مقامی ڈیٹا بیس کو ابتدائی ڈیمو ڈیٹا پر ری سیٹ کریں۔',
  dev_reset_confirm: 'ڈیمو ڈیٹا ری سیٹ کریں',
  dev_reset_toast: 'ڈیمو ڈیٹا بیس ابتدائی حالت میں ری سیٹ کر دیا گیا ہے۔',
  role_parent: 'والدین',
  role_teacher: 'استاد',
  role_principal: 'پرنسپل',
  role_accountant: 'اکاؤنٹنٹ',
  role_admin: 'ایڈمن',
  role_parent_desc: 'بچے کی حاضری، فیس واؤچر اور نوٹس بلیٹن',
  role_teacher_desc: 'کلاس حاضری، امتحانی نمبر اور والدین کے پیغامات',
  role_principal_desc: 'بوائز اور گرلز کیمپس کی نگرانی اور منظوری',
  role_accountant_desc: 'فیس وصولی، چالان اور کھاتہ (Rs)',
  role_admin_desc: 'داخلے، لاگ ان آئی ڈیز اور سسٹم سیٹنگز',
  nav_home: 'ہوم',
  nav_settings: 'ترتیبات',
  tab_home: 'ہوم',
  tab_dashboard: 'ڈیش بورڈ',
  tab_attendance: 'حاضری',
  tab_fees: 'فیس',
  tab_results: 'نتائج',
  tab_messages: 'پیغامات',
  tab_marks: 'نمبر',
  tab_collect: 'وصولی',
  tab_vouchers: 'واؤچرز',
  tab_reports: 'رپورٹس',
  tab_defaulters: 'نادہندگان',
  tab_setup: 'ترتیب',
  tab_users: 'صارفین',
  tab_students: 'طلباء',
  tab_more: 'مزید',
  coming_soon_title: 'جلد آ رہا ہے',
  coming_soon_subtitle: 'یہ اسکرین ریپوزٹری لیئر سے منسلک ہے اور اگلے مرحلے میں مکمل کی جائے گی۔',
  child_switcher_title: 'بچہ منتخب کریں',
  child_switcher_subtitle: 'تمام ٹیبز کے لیے منتخب بچے کی پروفائل تبدیل کریں',
  child_roll_prefix: 'رول نمبر',
  child_tap_to_switch: 'تبدیل کریں',
  notifications_label: 'اطلاعات',
  notifications_unread_zero: 'کوئی نئی اطلاع نہیں (0)',
  logout_button: 'سائن آؤٹ',
  logout_confirm_title: 'الفرقان پورٹل سے لاگ آؤٹ کریں؟',
  logout_confirm_body: 'آپ کا موجودہ سیشن ختم کر دیا جائے گا۔ آپ کسی بھی ڈیمو لاگ ان آئی ڈی سے دوبارہ داخل ہو سکتے ہیں۔',
  dialog_cancel: 'منسوخ کریں',
  dialog_confirm: 'تصدیق کریں',
  back_button_label: 'واپس',
  app_exited_title: 'الفرقان اسکول اوکاڑہ',
  app_exited_subtitle: 'آپ نے ہوم ٹیب سے بیک بٹن دبایا۔ پورٹل دوبارہ کھولنے کے لیے نیچے الفرقان آئیکن پر ٹیپ کریں۔',
  app_reopen_button: 'الفرقان اسکول اوکاڑہ کھولیں',
  placeholder_home_badge: 'رول ہوم اسکرین',
  placeholder_parent_title: 'والدین ہوم اسکرین',
  placeholder_parent_subtitle: 'AuthRepository کے ذریعے لاگ ان۔ منسلک بچہ اوپر ٹاپ بار میں دکھایا گیا ہے۔',
  placeholder_teacher_title: 'استاد ہوم اسکرین',
  placeholder_teacher_subtitle: 'AuthRepository کے ذریعے لاگ ان۔ تفویض کردہ سیکشنز تیار ہیں۔',
  placeholder_principal_title: 'پرنسپل ہوم اسکرین',
  placeholder_principal_subtitle: 'بوائز اور گرلز دونوں کیمپس تک رسائی کے ساتھ لاگ ان۔',
  placeholder_accountant_title: 'اکاؤنٹنٹ ہوم اسکرین',
  placeholder_accountant_subtitle: 'بوائز اور گرلز دونوں کیمپس کے فیس کھاتوں کے لیے لاگ ان۔',
  placeholder_admin_title: 'ایڈمن ہوم اسکرین',
  placeholder_admin_subtitle: 'مقامی ڈیٹا بیس میں 24 کلاسز، 28 سیکشنز اور 60 طلباء کا ڈیٹا موجود ہے۔',
  home_user_name_label: 'مکمل نام',
  home_role_label: 'عہدہ / رول',
  home_campus_label: 'کیمپس',
  home_login_id_label: 'لاگ ان آئی ڈی',
  home_children_section: 'منسلک بچے (StudentRepository.childrenOfParent)',
  home_teacher_sections_label: 'تفویض کردہ سیکشنز (SettingsRepository.getTeacherAssignments)',
  home_db_seeded_summary: 'مقامی ڈیمو ڈیٹا بیس فعال ہے (تعلیمی سال 2026-27)',
  stat_enrolled_students: 'فعال طلباء',
  stat_campus_cap: 'کیمپس (B & G)',
  stat_sample_fee: 'ماہانہ فیس فارمیٹ',
  stat_current_date: 'کراچی تاریخ فارمیٹ',
  status_paid: 'ادا شدہ · Rs 2,500',
  status_pending: 'واجب الادا',
  status_overdue: 'تاخیر شدہ · فوری توجہ',
  status_present: 'فعال اکاؤنٹ',
  status_info: 'بوائز اور گرلز کیمپس',
  empty_notices_title: 'ابھی کوئی نوٹس جاری نہیں ہوا',
  empty_notices_body: 'AuthRepository، StudentRepository، AttendanceRepository، FeeRepository اور SettingsRepository مکمل طور پر مقامی ڈیٹا بیس سے منسلک ہیں۔',
  empty_students_title: 'اس وقت کوئی ریکارڈ نہیں',
  empty_students_body: 'تمام ریپوزٹری انٹرفیس تیار ہیں۔ بعد میں صرف AppModule بدل کر Supabase سے منسلک کیا جا سکتا ہے۔',
  empty_action_reload: 'مقامی ڈیٹا بیس سے دوبارہ لوڈ کریں (200–400ms)',
  sim_loading_button: 'ڈیٹا دوبارہ لوڈ کریں',
  open_dialog_button: 'ڈائیلاگ باکس دیکھیں',
  sample_dialog_title: 'اسکول ڈائیلاگ نمونہ',
  sample_dialog_body: 'یہ ڈائیلاگ روشن تھیم (#FFFFFF)، گول کونوں اور اردو نستعلیق فونٹ کے اصولوں کے مطابق بنایا گیا ہے۔',
  settings_title: 'ترتیبات',
  settings_subtitle: 'زبان کی تبدیلی (EN | اردو)، پاس ورڈ تبدیل کریں، ایپ ورژن اور سائن آؤٹ',
  settings_language_section: 'زبان اور لے آؤٹ کی سمت',
  settings_campus_section: 'ڈیفالٹ کیمپس انتخاب',
  settings_theme_section: 'تھیم کی پابندی',
  settings_theme_locked_title: 'روشن (Light) تھیم لاک ہے',
  settings_theme_locked_body: 'فون ڈارک موڈ میں ہونے کے باوجود ایپ ہمیشہ روشن اور صاف لائٹ تھیم میں رہے گی۔',
  settings_format_section: 'علاقائی فارمیٹنگ (پاکستان)',
  settings_currency_label: 'رقم کا فارمیٹ',
  settings_date_label: 'تاریخ کا فارمیٹ',
  settings_timezone_label: 'ٹائم زون',
  settings_timezone_value: 'Asia/Karachi (PKT, UTC+5)',
  settings_digits_label: 'ہندسے',
  settings_digits_value: 'انگریزی اور اردو دونوں میں مغربی ہندسے (0–9)',
  settings_session_section: 'اکاؤنٹ اور سیشن',
  settings_switch_role_label: 'رول تبدیل کر کے ہوم اسکرین دیکھیں',
  settings_reset_storage: 'ڈیمو ڈیٹا ری سیٹ کریں',
  settings_reset_done: 'ڈیمو ڈیٹا 260ms میں ری سیٹ ہو گیا',
  settings_change_password_section: 'پاس ورڈ تبدیل کریں',
  settings_old_password_label: 'موجودہ پاس ورڈ',
  settings_old_password_placeholder: 'موجودہ پاس ورڈ درج کریں',
  settings_new_password_label: 'نیا پاس ورڈ',
  settings_new_password_placeholder: 'کم از کم 4 حروف',
  settings_confirm_password_label: 'نئے پاس ورڈ کی تصدیق',
  settings_confirm_password_placeholder: 'نیا پاس ورڈ دوبارہ درج کریں',
  settings_change_password_btn: 'پاس ورڈ اپ ڈیٹ کریں',
  settings_password_success: 'پاس ورڈ کامیابی سے تبدیل ہو گیا ہے۔ اگلی بار نئے پاس ورڈ سے لاگ ان کریں۔',
  settings_password_mismatch: 'نیا پاس ورڈ اور تصدیقی پاس ورڈ یکساں نہیں ہیں۔',
  settings_password_short: 'نیا پاس ورڈ کم از کم 4 حروف کا ہونا چاہیے۔',
  settings_password_wrong_old: 'موجودہ پاس ورڈ غلط ہے۔',
  settings_app_version_label: 'ایپ ورژن',
  settings_app_version_value: 'v1.0.0 (Build 2026.10)',
  settings_open_from_more: 'ترتیبات کھولیں',
  repo_auth: 'AuthRepository',
  repo_student: 'StudentRepository',
  repo_attendance: 'AttendanceRepository',
  repo_fee: 'FeeRepository',
  repo_exam: 'ExamRepository',
  repo_message: 'MessageRepository',
  repo_notice: 'NoticeRepository',
  repo_dashboard: 'DashboardRepository',
  repo_settings: 'SettingsRepository',
  repo_status_ready: 'AppModule میں منسلک',
  repo_empty_result: '0 ریکارڈز',
  // Parent Screens & Shared Controls
  pull_to_refresh: 'تازہ کریں',
  refreshing_label: 'لوڈ ہو رہا ہے...',
  error_loading_title: 'ڈیٹا لوڈ نہیں ہو سکا',
  error_loading_subtitle: 'ریکارڈ لوڈ کرتے وقت مسئلہ پیش آیا۔ براہ کرم دوبارہ کوشش کریں۔',
  retry_button: 'دوبارہ کوشش کریں',
  no_child_linked_title: 'کوئی طالب علم منسلک نہیں',
  no_child_linked_subtitle: 'اپنے بچے کی پروفائل منسلک کرنے کے لیے اسکول آفس سے رابطہ کریں۔',
  parent_greeting_prefix: 'السلام علیکم،',
  parent_welcome_subtitle: 'والدین پورٹل · تعلیمی سال 2026-27',
  child_profile_card_title: 'طالب علم کی پروفائل',
  child_admission_no_label: 'داخلہ نمبر',
  child_roll_no_label: 'رول نمبر',
  child_class_section_label: 'جماعت اور سیکشن',
  child_campus_label: 'کیمپس',
  home_today_attendance_title: 'آج کی حاضری',
  home_month_attendance_title: 'اس ماہ کی حاضری',
  att_status_present: 'حاضر',
  att_status_absent: 'غیر حاضر',
  att_status_leave: 'رخصت',
  att_status_late: 'تاخیر',
  att_status_not_marked: 'ابھی درج نہیں ہوئی',
  att_status_sunday_holiday: 'اتوار / تعطیل',
  att_status_unmarked_day: 'کوئی ریکارڈ نہیں',
  home_fee_status_title: 'فیس کی صورتحال',
  home_fee_pending_label: 'واجب الادا رقم',
  home_fee_oldest_due_label: 'قدیم ترین غیر ادا شدہ واؤچر کی آخری تاریخ',
  home_fee_view_button: 'فیس دیکھیں',
  home_fee_all_paid_title: 'تمام فیس ادا شدہ',
  home_fee_all_paid_subtitle: 'اس طالب علم کے ذمے کوئی بقایا واجب الادا نہیں ہے۔',
  home_latest_result_title: 'تازہ ترین نتیجہ',
  home_latest_result_subtitle: 'امتحانی نتائج اور رپورٹ کارڈز جاری ہونے پر یہاں نظر آئیں گے۔',
  home_latest_notices_title: 'تازہ ترین نوٹس',
  home_latest_notices_subtitle: 'اسکول کے اعلانات، سرکلرز اور تعطیلات کی اطلاعات یہاں نظر آئیں گی۔',
  // Parent Attendance Tab
  att_mode_daily: 'روزانہ',
  att_mode_monthly: 'ماہانہ',
  att_mode_all_time: 'مجموعی',
  att_prev_month: 'پچھلا مہینہ',
  att_next_month: 'اگلا مہینہ',
  att_legend_title: 'علامات کی تفصیل',
  att_month_summary_title: 'ماہانہ خلاصہ',
  att_month_percentage_label: 'ماہانہ فیصد',
  att_day_detail_title: 'روزانہ حاضری کی تفصیل',
  att_day_date_label: 'تاریخ',
  att_day_status_label: 'حالت',
  att_day_remark_label: 'کیفیت / نوٹ',
  att_day_no_remark: 'کوئی نوٹ درج نہیں',
  att_chart_title: 'ماہانہ حاضری کا فیصد گراف',
  att_monthly_list_title: 'ماہانہ تفصیل',
  att_marked_days_label: 'شمار کردہ ایام',
  att_all_time_ring_title: 'مجموعی حاضری کا فیصد',
  att_calculation_note: 'حاضری کا فیصد رخصت کے ایام، اتوار اور سرکاری تعطیلات کو نکال کر شمار کیا جاتا ہے۔',
  att_empty_month_title: 'کوئی حاضری درج نہیں',
  att_empty_month_subtitle: 'اس مہینے کے لیے حاضری کا کوئی ریکارڈ موجود نہیں۔',
  weekday_sun: 'اتوار',
  weekday_mon: 'پیر',
  weekday_tue: 'منگل',
  weekday_wed: 'بدھ',
  weekday_thu: 'جمعرات',
  weekday_fri: 'جمعہ',
  weekday_sat: 'ہفتہ',
  month_01: 'جنوری',
  month_02: 'فروری',
  month_03: 'مارچ',
  month_04: 'اپریل',
  month_05: 'مئی',
  month_06: 'جون',
  month_07: 'جولائی',
  month_08: 'اگست',
  month_09: 'ستمبر',
  month_10: 'اکتوبر',
  month_11: 'نومبر',
  month_12: 'دسمبر',
  month_short_01: 'جنوری',
  month_short_02: 'فروری',
  month_short_03: 'مارچ',
  month_short_04: 'اپریل',
  month_short_05: 'مئی',
  month_short_06: 'جون',
  month_short_07: 'جولائی',
  month_short_08: 'اگست',
  month_short_09: 'ستمبر',
  month_short_10: 'اکتوبر',
  month_short_11: 'نومبر',
  month_short_12: 'دسمبر',
  // Parent Fees Tab
  fee_card_monthly: 'ماہانہ فیس',
  fee_card_paid: 'اس ماہ ادا شدہ',
  fee_card_pending: 'واجب الادا',
  fee_card_arrears: 'سابقہ بقایاجات',
  fee_card_annual: 'سالانہ چارجز',
  fee_card_admission: 'داخلہ فیس',
  voucher_status_paid: 'ادا شدہ',
  voucher_status_partial: 'جزوی ادا شدہ',
  voucher_status_unpaid: 'غیر ادا شدہ',
  fee_vouchers_section_title: 'فیس واؤچرز',
  fee_vouchers_empty_title: 'کوئی واؤچر موجود نہیں',
  fee_vouchers_empty_subtitle: 'اس طالب علم کے لیے ابھی کوئی فیس واؤچر جاری نہیں ہوا۔',
  fee_voucher_no_label: 'واؤچر نمبر',
  fee_billing_month_label: 'فیس کا مہینہ',
  fee_issue_date_label: 'تاریخِ اجراء',
  fee_due_date_label: 'آخری تاریخ',
  fee_voucher_detail_title: 'واؤچر کی تفصیل',
  fee_items_heading: 'فیس کی مدات کی تفصیل',
  fee_item_head_col: 'فیس کی مد',
  fee_item_amount_col: 'رقم',
  fee_item_waived_col: 'رعایت',
  fee_item_net_col: 'قابلِ ادا',
  fee_total_label: 'کل رقم',
  fee_amount_paid_label: 'وصول شدہ رقم',
  fee_balance_label: 'بقایا رقم',
  fee_voucher_payments_heading: 'اس واؤچر کے خلاف موصولہ ادائیگیاں',
  fee_voucher_no_payments: 'اس واؤچر کے خلاف ابھی کوئی ادائیگی موصول نہیں ہوئی۔',
  fee_payment_history_title: 'ادائیگیوں کی تاریخ',
  fee_payment_history_empty_title: 'کوئی رسید موجود نہیں',
  fee_payment_history_empty_subtitle: 'فیس جمع ہونے پر رسیدیں یہاں نظر آئیں گی۔',
  fee_receipt_no_label: 'رسید نمبر',
  fee_payment_date_label: 'تاریخ',
  fee_payment_method_label: 'طریقہ کار',
  fee_payment_amount_label: 'رقم',
  method_CASH: 'نقد',
  method_BANK: 'بینک ڈپازٹ',
  method_JAZZCASH: 'جاز کیش',
  method_EASYPAISA: 'ایزی پیسہ',
  print_save_pdf_button: 'پرنٹ / پی ڈی ایف محفوظ کریں',
  print_receipt_button: 'رسید پرنٹ کریں',
  print_trigger_now: 'پرنٹ / پی ڈی ایف محفوظ کریں',
  print_close_preview: 'بند کریں',
  print_voucher_document_title: 'فیس واؤچر / چالان',
  print_receipt_document_title: 'فیس ادائیگی کی سرکاری رسید',
  print_school_address: 'ایم اے جناح روڈ، اوکاڑہ · فون: 2701122-044',
  print_computer_generated_note: 'کمپیوٹر سے تیار کردہ دستاویز — الفرقان اسکول اوکاڑہ',
  // Teacher Screens & Developer Menu Attendance Controls
  teacher_welcome_subtitle: 'استاد پورٹل · تعلیمی سال 2026-27',
  teacher_today_date_label: 'آج کی تاریخ',
  teacher_today_attendance_title: 'آج کی حاضری',
  teacher_summary_done_label: 'مکمل شدہ سیکشنز',
  teacher_summary_pending_label: 'بقایا سیکشنز',
  teacher_badge_pending: 'بقایا',
  teacher_badge_submitted_at: 'جمع شدہ بوقت',
  teacher_students_count_suffix: 'طلباء',
  teacher_tap_to_open_section: 'حاضری لگانے یا دیکھنے کے لیے ٹیپ کریں',
  teacher_marks_entry_title: 'نمبروں کا اندراج',
  teacher_marks_entry_subtitle: 'مضامین کے امتحانی نمبر اور گریڈ شیٹس جلد یہاں دستیاب ہوں گی۔',
  teacher_unread_messages_title: 'ان پڑھے پیغامات',
  teacher_unread_messages_subtitle: 'والدین اور اساتذہ کے پیغامات جلد یہاں دستیاب ہوں گے۔',
  teacher_no_sections_title: 'حاضری کا کوئی سیکشن تفویض نہیں',
  teacher_no_sections_subtitle: 'روزانہ حاضری لگانے کے لیے اس وقت آپ کے اکاؤنٹ کو کوئی سیکشن تفویض نہیں کیا گیا۔',
  teacher_att_section_picker_label: 'تفویض کردہ سیکشن',
  teacher_att_date_label: 'حاضری کی تاریخ',
  teacher_att_today_badge: 'آج',
  teacher_att_prev_day: 'پچھلا دن',
  teacher_att_next_day: 'اگلا دن',
  teacher_att_view_only_badge: 'صرف مشاہدہ',
  teacher_att_only_admin_can_change: 'صرف ایڈمن اس حاضری میں تبدیلی کر سکتا ہے',
  teacher_att_lock_time_note: 'مقررہ وقت',
  teacher_att_mark_all_present: 'سب کو حاضر کریں',
  teacher_att_cycle_hint: 'حاضری بدلنے کے لیے اسٹیٹس چپ پر ٹیپ کریں (حاضر ← غیر حاضر ← رخصت ← تاخیر)۔ نوٹ لکھنے کے لیے دبا کر رکھیں یا نوٹ آئیکن دبائیں۔',
  teacher_att_submit_btn: 'حاضری جمع کریں',
  teacher_att_update_btn: 'حاضری اپ ڈیٹ کریں',
  teacher_att_submitting_btn: 'محفوظ ہو رہا ہے...',
  teacher_att_submit_success: 'حاضری کامیابی سے جمع کر دی گئی ہے۔',
  teacher_att_update_success: 'حاضری کامیابی سے اپ ڈیٹ کر دی گئی ہے۔',
  teacher_att_no_records_past_day: 'اس تاریخ کو اس سیکشن کی کوئی حاضری درج نہیں کی گئی۔',
  teacher_att_remark_sheet_title: 'طالب علم کی حاضری اور نوٹ',
  teacher_att_remark_sheet_subtitle: 'حاضری کی حالت منتخب کریں اور اختیاری نوٹ درج کریں',
  teacher_att_select_status_label: 'حاضری کی حالت',
  teacher_att_remark_input_label: 'اختیاری کیفیت / نوٹ',
  teacher_att_remark_input_placeholder: 'مثال: بیماری کی رخصت، والدین کی اطلاع، وین میں تاخیر...',
  teacher_att_remark_save_btn: 'محفوظ کریں',
  teacher_att_remark_clear_btn: 'نوٹ صاف کریں',
  teacher_att_edit_note_tooltip: 'حالت اور نوٹ',
  unsaved_changes_title: 'غیر محفوظ تبدیلیاں ختم کریں؟',
  unsaved_changes_body: 'آپ نے اس سیکشن کی حاضری میں تبدیلیاں کی ہیں جو ابھی محفوظ نہیں ہوئیں۔ کیا آپ انہیں ختم کر کے واپس جانا چاہتے ہیں؟',
  unsaved_discard_btn: 'تبدیلیاں ختم کریں',
  unsaved_stay_btn: 'یہیں رہیں',
  domain_err_section_not_assigned: 'آپ کو اس سیکشن کی حاضری لگانے کا اختیار تفویض نہیں کیا گیا۔',
  domain_err_date_locked: 'اساتذہ صرف آج کی حاضری جمع یا تبدیل کر سکتے ہیں۔ پچھلے دنوں کی حاضری صرف ایڈمن تبدیل کر سکتا ہے۔',
  domain_err_past_cutoff: 'مقررہ وقت گزرنے کے بعد حاضری بند ہو چکی ہے۔ اب صرف ایڈمن اس حاضری میں تبدیلی کر سکتا ہے۔',
  domain_err_unauthorized: 'آپ کے اکاؤنٹ کو یہ عمل کرنے کی اجازت نہیں ہے۔',
  domain_err_validation: 'براہ کرم درج کردہ معلومات چیک کر کے دوبارہ کوشش کریں۔',
  domain_err_generic: 'درخواست مکمل نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔',
  teacher_more_my_classes_title: 'میری کلاسز',
  teacher_more_my_classes_subtitle: 'تفویض کردہ سیکشنز، طلباء کی فہرست اور سرپرست کے فون نمبر',
  teacher_more_search_placeholder: 'طالب علم کے نام یا رول نمبر سے تلاش کریں...',
  teacher_more_call_guardian: 'سرپرست کو کال کریں',
  teacher_more_no_search_results_title: 'کوئی طالب علم نہیں ملا',
  teacher_more_no_search_results_subtitle: 'تلاش کردہ نام یا رول نمبر کے مطابق کوئی طالب علم نہیں ملا۔',
  teacher_more_account_section: 'اکاؤنٹ اور ترتیبات',
  dev_pending_today_title: 'آج بقایا حاضری والے اساتذہ اور سیکشنز',
  dev_pending_today_all_done: 'آج تمام سیکشنز کی حاضری جمع ہو چکی ہے!',
  dev_clear_section_title: 'کسی سیکشن کی آج کی حاضری صاف کریں (Pending ٹیسٹ)',
  dev_clear_section_select_label: 'سیکشن منتخب کریں',
  dev_clear_section_btn: 'آج کی حاضری صاف کریں',
  dev_clear_section_toast: 'منتخب سیکشن کی آج کی حاضری صاف کر دی گئی ہے (اب بقایا / Pending ہے)۔',
  teacher_att_holiday_off_notice: 'تعطیل / ہفتہ وار چھٹی - آج کوئی حاضری نہیں',
  demo_date_active_strip: 'ڈیمو تاریخ فعال ہے',
  demo_date_picker_title: 'ڈیمو تاریخ',
  demo_date_picker_subtitle: 'ڈیفالٹ حقیقی تاریخ (Asia/Karachi) ہے۔ دن کا حقیقی وقت برقرار رہتا ہے۔',
  demo_date_use_real_btn: 'حقیقی تاریخ استعمال کریں',
  demo_date_using_real_badge: 'حقیقی تاریخ',
};
