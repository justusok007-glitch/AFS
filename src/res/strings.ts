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
  | 'login_error_network'
  | 'sync_saving'
  | 'sync_failed'
  | 'sync_retry'
  | 'sync_reload'
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
  | 'role_vice_principal'
  | 'role_accountant'
  | 'role_attendance_coordinator'
  | 'tab_mark_attendance'
  | 'ad_unlock_title'
  | 'ad_unlock_hint'
  | 'ad_unlock_section'
  | 'ad_unlock_all'
  | 'ad_unlock_minutes'
  | 'ad_unlock_open_btn'
  | 'ad_unlock_active'
  | 'ad_unlock_none'
  | 'ad_unlock_lock_now'
  | 'ad_unlock_err_minutes'
  | 'teacher_att_unlocked'
  | 'fb_title'
  | 'fb_collected_at'
  | 'fb_at_boys'
  | 'fb_at_girls'
  | 'fb_this_month'
  | 'fb_other'
  | 'fb_charged'
  | 'fb_received'
  | 'fb_pending'
  | 'fb_total_charged'
  | 'fb_collected_month'
  | 'fb_total'
  | 'co_tab_progress'
  | 'co_tab_totals'
  | 'co_no_sections'
  | 'co_assigned'
  | 'co_marked'
  | 'co_remaining'
  | 'co_students'
  | 'co_totals_note'
  | 'co_by_section'
  | 'co_not_marked'
  | 'tab_att_records'
  | 'att_call'
  | 'att_whatsapp'
  | 'att_no_phone'
  | 'ad_coord_classes'
  | 'ad_coord_classes_hint'
  | 'ad_coord_pick_class'
  | 'role_attendance_coordinator_desc'
  | 'role_admin'
  | 'role_parent_desc'
  | 'role_teacher_desc'
  | 'role_principal_desc'
  | 'role_vice_principal_desc'
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
  | 'demo_date_using_real_badge'
  | 'acc_close_btn'
  | 'acc_cancel_btn'
  | 'acc_pick_date'
  | 'acc_father_label'
  | 'acc_class_col'
  | 'acc_student_col'
  | 'acc_receipt_col'
  | 'acc_method_col'
  | 'acc_received_by_label'
  | 'acc_amount_in_words_label'
  | 'acc_signature_label'
  | 'acc_reference_short'
  | 'acc_remarks_short'
  | 'acc_pending_word'
  | 'acc_no_dues_tag'
  | 'acc_void_badge'
  | 'acc_void_note'
  | 'acc_print_receipt_from'
  | 'acc_applied_to_heading'
  | 'acc_cat_ARREARS'
  | 'acc_cat_MONTHLY'
  | 'acc_cat_ANNUAL'
  | 'acc_cat_ADMISSION'
  | 'acc_cat_EXAM'
  | 'acc_cat_LATE'
  | 'acc_cat_OTHER'
  | 'acc_search_placeholder'
  | 'acc_all_classes'
  | 'acc_search_hint_title'
  | 'acc_search_hint_body'
  | 'acc_no_results_title'
  | 'acc_no_results_body'
  | 'acc_more_results_note'
  | 'acc_account_title'
  | 'acc_receive_payment_btn'
  | 'acc_pending_balance_label'
  | 'acc_amount_label'
  | 'acc_pay_full_btn'
  | 'acc_method_label'
  | 'acc_payment_date_label'
  | 'acc_reference_label'
  | 'acc_reference_hint'
  | 'acc_remarks_label'
  | 'acc_save_payment_btn'
  | 'acc_err_amount_required'
  | 'acc_err_amount_exceeds'
  | 'acc_err_reference_required'
  | 'acc_err_date_future'
  | 'acc_err_no_pending'
  | 'acc_err_save_failed'
  | 'acc_success_title'
  | 'acc_new_payment_btn'
  | 'acc_back_to_search_btn'
  | 'acc_gen_title'
  | 'acc_gen_campus_label'
  | 'acc_gen_class_label'
  | 'acc_gen_month_label'
  | 'acc_gen_due_label'
  | 'acc_gen_preview_btn'
  | 'acc_gen_preview_create'
  | 'acc_gen_preview_skipped'
  | 'acc_gen_preview_total'
  | 'acc_gen_confirm_btn'
  | 'acc_gen_safe_note'
  | 'acc_gen_nothing'
  | 'acc_gen_done'
  | 'acc_err_due_invalid'
  | 'acc_voucher_search_placeholder'
  | 'acc_status_all'
  | 'acc_month_all'
  | 'acc_vouchers_found'
  | 'acc_vouchers_none_title'
  | 'acc_print_vouchers_title'
  | 'acc_print_vouchers_btn'
  | 'acc_print_class_required'
  | 'acc_print_none_found'
  | 'acc_print_ready_count'
  | 'acc_daily_title'
  | 'acc_total_collected'
  | 'acc_receipts_count'
  | 'acc_cash_in_hand'
  | 'acc_by_method'
  | 'acc_by_category'
  | 'acc_receipts_of_day'
  | 'acc_print_report_btn'
  | 'acc_no_receipts_title'
  | 'acc_period_title'
  | 'acc_range_today'
  | 'acc_range_week'
  | 'acc_range_month'
  | 'acc_range_custom'
  | 'acc_from_date'
  | 'acc_to_date'
  | 'acc_filter_category'
  | 'acc_filter_method'
  | 'acc_filter_all_categories'
  | 'acc_filter_all_methods'
  | 'acc_group_by_day'
  | 'acc_day_col'
  | 'acc_chart_title'
  | 'acc_export_csv_btn'
  | 'acc_err_range_invalid'
  | 'acc_def_title'
  | 'acc_def_total_due'
  | 'acc_def_students'
  | 'acc_def_min_months'
  | 'acc_def_this_month'
  | 'acc_def_months'
  | 'acc_def_call'
  | 'acc_def_whatsapp'
  | 'acc_def_empty_title'
  | 'acc_def_empty_body'
  | 'acc_wa_message'
  | 'acc_more_structure_title'
  | 'acc_more_structure_note'
  | 'acc_more_heads_heading'
  | 'acc_more_class_fees_heading'
  | 'acc_more_concessions_heading'
  | 'acc_more_no_concessions'
  | 'acc_concession_FIXED_OFF'
  | 'acc_concession_PERCENT_OFF'
  | 'acc_concession_OVERRIDE'
  | 'acc_concession_reason'
  | 'acc_charged_in_month'
  | 'acc_vtab_generate'
  | 'acc_vtab_list'
  | 'acc_vtab_print'
  | 'acc_err_campus_required'
  | 'acc_gen_failed'
  | 'acc_showing_first'
  | 'pr_date_label'
  | 'pr_kpi_students'
  | 'pr_kpi_boys_girls'
  | 'pr_kpi_attendance'
  | 'pr_kpi_present_absent'
  | 'pr_kpi_unmarked'
  | 'pr_kpi_collected_today'
  | 'pr_kpi_collected_month'
  | 'pr_kpi_outstanding'
  | 'pr_kpi_defaulters'
  | 'pr_kpi_tap_hint'
  | 'pr_all_marked'
  | 'pr_unmarked_teachers'
  | 'pr_no_teacher'
  | 'pr_chart_trend30'
  | 'pr_chart_monthly12'
  | 'pr_chart_expected'
  | 'pr_chart_daily'
  | 'rs_exams_of_class'
  | 'rs_all_exams'
  | 'attkpi_total'
  | 'attkpi_present'
  | 'attkpi_absent'
  | 'attkpi_sections'
  | 'adatt_submit_tab'
  | 'adatt_student_tab'
  | 'adatt_no_students'
  | 'adatt_tap_hint'
  | 'adatt_mark_all'
  | 'adatt_next_student'
  | 'attimp_btn'
  | 'attimp_title'
  | 'attimp_hint'
  | 'attimp_err_cols'
  | 'attimp_days'
  | 'attimp_done'
  | 'pr_tap_open'
  | 'pr_chart_category'
  | 'pr_chart_campus_att'
  | 'pr_chart_campus_fee'
  | 'pr_chart_class_att'
  | 'pr_chart_expected_label'
  | 'pr_chart_collected_label'
  | 'pr_chart_no_data'
  | 'pr_recent_activity'
  | 'pr_activity_payment'
  | 'pr_activity_void'
  | 'pr_activity_correction'
  | 'pr_present'
  | 'pr_absent'
  | 'pr_leave'
  | 'pr_late'
  | 'pr_att_filters'
  | 'pr_section_filter'
  | 'pr_all_sections'
  | 'pr_overall_percent'
  | 'pr_days_covered'
  | 'pr_class_table'
  | 'pr_student_list'
  | 'pr_today_absent'
  | 'pr_today_absent_none'
  | 'pr_today_not_marked'
  | 'pr_chronic_title'
  | 'pr_chronic_below'
  | 'pr_chronic_none'
  | 'pr_show_all_students'
  | 'pr_percent_col'
  | 'pr_students_col'
  | 'pr_print_view_btn'
  | 'pr_att_none_title'
  | 'pr_fees_reports'
  | 'pr_fees_defaulters'
  | 'pr_results_soon_title'
  | 'pr_results_soon_body'
  | 'pr_more_compliance'
  | 'pr_more_compliance_hint'
  | 'pr_range_week'
  | 'pr_range_month'
  | 'pr_days_marked'
  | 'pr_more_students'
  | 'pr_profile_title'
  | 'pr_profile_dob'
  | 'pr_profile_admission'
  | 'pr_profile_phone'
  | 'pr_profile_attendance'
  | 'pr_profile_fees'
  | 'pr_notices_soon'
  | 'pr_tab_attendance_hint'
  | 'ad_sys_title'
  | 'ad_sys_users_by_role'
  | 'ad_sys_students_by_campus'
  | 'ad_sys_audit_count'
  | 'ad_users_new_btn'
  | 'ad_users_search'
  | 'ad_users_all_roles'
  | 'ad_users_all_status'
  | 'ad_users_active'
  | 'ad_users_inactive'
  | 'ad_users_none'
  | 'ad_form_title'
  | 'ad_form_role'
  | 'ad_form_name_en'
  | 'ad_form_name_ur'
  | 'ad_form_phone'
  | 'ad_form_campus'
  | 'ad_form_campus_all'
  | 'ad_form_create_btn'
  | 'ad_err_name_en'
  | 'ad_err_name_ur'
  | 'ad_err_phone'
  | 'ad_err_campus'
  | 'ad_err_generic'
  | 'ad_cred_title'
  | 'ad_cred_once'
  | 'ad_cred_login_id'
  | 'ad_cred_password'
  | 'ad_cred_copy'
  | 'ad_cred_copied'
  | 'ad_cred_print'
  | 'ad_cred_done'
  | 'ad_slips_btn'
  | 'ad_slips_empty'
  | 'ad_slips_clear'
  | 'ad_slip_install'
  | 'ad_slip_children'
  | 'ad_detail_reset'
  | 'ad_detail_reset_confirm'
  | 'ad_detail_deactivate'
  | 'ad_detail_reactivate'
  | 'ad_detail_deactivate_confirm'
  | 'ad_detail_confirm'
  | 'ad_detail_self_warning'
  | 'ad_children_title'
  | 'ad_children_none'
  | 'ad_children_unlink'
  | 'ad_children_link_search'
  | 'ad_children_link'
  | 'ad_rel_FATHER'
  | 'ad_rel_MOTHER'
  | 'ad_rel_GUARDIAN'
  | 'ad_assign_title'
  | 'ad_assign_none'
  | 'ad_assign_add'
  | 'ad_assign_section'
  | 'ad_assign_subject'
  | 'ad_assign_no_subject'
  | 'ad_assign_attendance'
  | 'ad_assign_marks'
  | 'ad_assign_delete'
  | 'ad_assign_pick_section'
  | 'ad_audit_title'
  | 'ad_audit_none'
  | 'ad_audit_by'
  | 'ad_soon_setup'
  | 'ad_soon_students'
  | 'st_search'
  | 'st_new_btn'
  | 'st_promote_btn'
  | 'st_status_all'
  | 'st_status_active'
  | 'st_status_left'
  | 'st_none'
  | 'st_section_label'
  | 'st_pick_section'
  | 'st_form_admit_title'
  | 'st_form_edit_title'
  | 'st_name_en'
  | 'st_name_ur'
  | 'st_father'
  | 'st_gender'
  | 'st_gender_MALE'
  | 'st_gender_FEMALE'
  | 'st_dob'
  | 'st_admission_date'
  | 'st_phone'
  | 'st_save_admit'
  | 'st_save_edit'
  | 'st_err_name_en'
  | 'st_err_name_ur'
  | 'st_err_father'
  | 'st_err_phone'
  | 'st_err_dob'
  | 'st_err_section'
  | 'st_err_admission_date'
  | 'st_parent_heading'
  | 'st_parent_none'
  | 'st_parent_create'
  | 'st_parent_link'
  | 'st_parent_search'
  | 'st_parent_pick'
  | 'st_admitted'
  | 'st_admitted_no'
  | 'st_tab_info'
  | 'st_tab_attendance'
  | 'st_tab_fees'
  | 'st_tab_results'
  | 'st_results_soon'
  | 'st_edit_btn'
  | 'st_linked_parents'
  | 'st_no_parents'
  | 'st_roll'
  | 'st_transfer_btn'
  | 'st_transfer_title'
  | 'st_transfer_reason'
  | 'st_transfer_confirm'
  | 'st_err_reason'
  | 'st_left_btn'
  | 'st_left_title'
  | 'st_left_reason'
  | 'st_left_date'
  | 'st_left_confirm'
  | 'st_left_note'
  | 'st_promo_title'
  | 'st_promo_from'
  | 'st_promo_to'
  | 'st_promo_students'
  | 'st_promo_preview'
  | 'st_promo_confirm'
  | 'st_promo_summary'
  | 'st_promo_done'
  | 'st_promo_none'
  | 'st_promo_same'
  | 'st_promo_campus'
  | 'st_csv_btn'
  | 'st_csv_title'
  | 'st_csv_hint'
  | 'st_csv_pick'
  | 'st_csv_valid'
  | 'st_csv_invalid'
  | 'st_csv_row'
  | 'st_csv_create'
  | 'st_csv_done'
  | 'st_csv_none'
  | 'st_father_ur'
  | 'st_err_father_ur'
  | 'st_view_profile'
  | 'st_att_monthly'
  | 'st_phone2'
  | 'st_dob_opt'
  | 'st_parent_username'
  | 'st_parent_password'
  | 'st_fees_heading'
  | 'st_actual_fee'
  | 'st_net_fee'
  | 'st_annual_charges'
  | 'st_admission_fee'
  | 'st_paid'
  | 'st_unpaid'
  | 'st_err_fee'
  | 'st_err_net_gt'
  | 'res_imp_title'
  | 'res_imp_hint'
  | 'res_imp_btn'
  | 'res_imp_err_cols'
  | 'res_imp_done'
  | 'rm_title'
  | 'rm_hint'
  | 'rm_selected_btn'
  | 'rm_all_btn'
  | 'rm_all_hint'
  | 'rm_orphans_btn'
  | 'rm_confirm_selected'
  | 'rm_done'
  | 'rm_select_shown'
  | 'rm_clear'
  | 'rm_type_delete'
  | 'rm_btn'
  | 'fee_imp_title'
  | 'daily_imp_title'
  | 'daily_imp_btn'
  | 'daily_imp_hint'
  | 'daily_imp_err_cols'
  | 'daily_imp_done'
  | 'fee_imp_hint'
  | 'fee_imp_btn'
  | 'fee_imp_err_cols'
  | 'fee_imp_done'
  | 'cl_import_title'
  | 'cl_import_hint'
  | 'cl_import_btn'
  | 'cl_import_err_cols'
  | 'cl_import_done'
  | 'st_bulk_btn'
  | 'st_bulk_title'
  | 'st_bulk_hint'
  | 'st_bulk_template'
  | 'st_bulk_checking'
  | 'st_bulk_import'
  | 'st_bulk_done'
  | 'st_bulk_new_parents'
  | 'st_bulk_print'
  | 'st_bulk_pick_section'
  | 'st_bulk_err_status'
  | 'st_bulk_err_number'
  | 'st_bulk_err_cols'
  | 'st_err_pw'
  | 'su_tab_school'
  | 'su_tab_classes'
  | 'su_tab_fees'
  | 'su_tab_holidays'
  | 'su_tab_grading'
  | 'su_name_en'
  | 'su_name_ur'
  | 'su_phones'
  | 'su_address'
  | 'su_lock'
  | 'su_off_days'
  | 'su_save'
  | 'su_saved'
  | 'su_add_class'
  | 'su_class_name_en'
  | 'su_class_name_ur'
  | 'su_subjects_heading'
  | 'vp_student_fees'
  | 'vp_fees_hint'
  | 'ac_edit_btn'
  | 'ac_edit_title'
  | 'ac_username'
  | 'ac_new_password'
  | 'ac_password_hint'
  | 'ac_parent_heading'
  | 'ac_parent_none'
  | 'ac_parent_unlink'
  | 'ac_parent_link_search'
  | 'su_sections_heading'
  | 'su_subject_en'
  | 'su_subject_ur'
  | 'su_add_subject'
  | 'su_add_section'
  | 'su_section_name'
  | 'su_class_teacher'
  | 'su_no_teacher'
  | 'su_edit'
  | 'su_delete'
  | 'su_students_n'
  | 'su_fee_hint'
  | 'su_tuition'
  | 'su_annual_month'
  | 'su_add_holiday'
  | 'su_title_en'
  | 'su_title_ur'
  | 'su_date'
  | 'su_date_to'
  | 'su_campus'
  | 'su_no_holidays'
  | 'su_grade'
  | 'su_min_percent'
  | 'su_add_grade'
  | 'su_grade_hint'
  | 'ad_void_btn'
  | 'ad_void_title'
  | 'ad_void_note'
  | 'ad_waive_btn'
  | 'ad_waive_title'
  | 'ad_waive_amount'
  | 'ad_waive_max'
  | 'ad_waive_err'
  | 'ad_reason_label'
  | 'ad_confirm_btn'
  | 'ad_att_btn'
  | 'ad_att_title'
  | 'ad_att_date'
  | 'ad_att_pick'
  | 'ad_att_none'
  | 'ad_att_unmarked'
  | 'ad_att_save'
  | 'ad_att_done'
  | 'ad_att_close'
  | 'ex_tab'
  | 'ex_new'
  | 'ex_name_en'
  | 'ex_name_ur'
  | 'ex_type'
  | 'ex_type_MONTHLY_TEST'
  | 'ex_type_MID_TERM'
  | 'ex_type_FINAL_TERM'
  | 'ex_start'
  | 'ex_end'
  | 'ex_status_DRAFT'
  | 'ex_status_MARKS_ENTRY'
  | 'ex_status_PUBLISHED'
  | 'ex_btn_open_entry'
  | 'ex_btn_publish'
  | 'ex_btn_unpublish'
  | 'ex_none'
  | 'ex_subjects_heading'
  | 'ex_subject'
  | 'ex_total'
  | 'ex_pass'
  | 'ex_copy_all'
  | 'ex_progress'
  | 'ex_edit_marks'
  | 'ex_saved_draft'
  | 'ex_entered'
  | 'ex_of'
  | 'ex_submit'
  | 'ex_submitted'
  | 'ex_absent'
  | 'ex_pick_exam'
  | 'ex_no_open'
  | 'ex_no_assign'
  | 'ex_roll'
  | 'ex_all_needed'
  | 'ex_invalid'
  | 'ex_save_changes'
  | 'ex_reason_edit'
  | 'ex_sections_hint'
  | 'ex_no_class_subjects'
  | 'ex_saved'
  | 'ex_all_campus'
  | 'rs_none'
  | 'rs_trend'
  | 'rs_percentage'
  | 'rs_grade'
  | 'rs_result'
  | 'rs_pass'
  | 'rs_fail'
  | 'rs_position'
  | 'rs_obtained'
  | 'rs_total_marks'
  | 'rs_obtained_total'
  | 'rs_grand_total'
  | 'rs_midterm'
  | 'rs_subject_chart'
  | 'rs_print'
  | 'rs_report_title'
  | 'rs_back'
  | 'rs_not_entered'
  | 'rs_show_position'
  | 'rs_students'
  | 'rs_avg'
  | 'rs_pass_rate'
  | 'rs_incomplete'
  | 'rs_grade_dist'
  | 'rs_subject_avgs'
  | 'rs_top10'
  | 'rs_choose_class'
  | 'rs_pick_class_hint'
  | 'rs_all_classes'
  | 'rs_no_exams'
  | 'rs_publish_hint'
  | 'nt_title'
  | 'nt_none'
  | 'nt_view_all'
  | 'nt_show_less'
  | 'nt_new'
  | 'nt_field_title'
  | 'nt_field_body'
  | 'nt_audience'
  | 'nt_aud_ALL'
  | 'nt_aud_CAMPUS'
  | 'nt_aud_CLASS'
  | 'nt_aud_STAFF'
  | 'nt_aud_PARENTS'
  | 'nt_expiry'
  | 'nt_publish'
  | 'nt_expired'
  | 'nt_delete'
  | 'nt_manage_btn'
  | 'nf_none'
  | 'nf_mark_all'
  | 'nf_close'
  | 'ms_new'
  | 'ms_pick_teacher'
  | 'ms_pick_student'
  | 'ms_pick_parent'
  | 'ms_none'
  | 'ms_type'
  | 'ms_send'
  | 'ms_note'
  | 'ms_templates'
  | 'ms_tpl_1'
  | 'ms_tpl_2'
  | 'ms_tpl_3'
  | 'ms_tpl_4'
  | 'ms_tpl_5'
  | 'ms_audit_btn'
  | 'ms_audit_title'
  | 'ms_about'
  | 'ms_read_only'
  | 'ms_back'
  | 'ms_empty_chat';

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
  login_error_network: 'Cannot reach the server. Check your internet connection and try again.',
  sync_saving: 'Saving…',
  sync_failed: 'Could not save to the server',
  sync_retry: 'Retry',
  sync_reload: 'Discard & reload',
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
  role_vice_principal: 'Vice Principal',
  role_accountant: 'Accountant',
  role_attendance_coordinator: 'Attendance Coordinator',
  tab_mark_attendance: 'Mark',
  ad_unlock_title: 'Open attendance for editing',
  ad_unlock_hint: 'Teachers and attendance coordinators assigned to the class can change the attendance of that day, even after the lock time, until the minutes run out. Then it locks again by itself. Everything else about the lock stays the same.',
  ad_unlock_section: 'Class and section',
  ad_unlock_all: 'All sections',
  ad_unlock_minutes: 'Minutes open',
  ad_unlock_open_btn: 'Open now',
  ad_unlock_active: 'Open right now',
  ad_unlock_none: 'Nothing is open. Attendance is locked as usual.',
  ad_unlock_lock_now: 'Lock now',
  ad_unlock_err_minutes: 'Enter minutes between 1 and 240.',
  teacher_att_unlocked: 'Opened by Admin for editing. Time left:',
  fb_title: 'Fee breakdown',
  fb_collected_at: 'Received at which campus counter',
  fb_at_boys: 'Boys campus counter',
  fb_at_girls: 'Girls campus counter',
  fb_this_month: 'This month\'s fee',
  fb_other: 'Other dues',
  fb_charged: 'Charged',
  fb_received: 'Received',
  fb_pending: 'Pending',
  fb_total_charged: 'Total charged',
  fb_collected_month: 'Received this month, by type',
  fb_total: 'Total received',
  co_tab_progress: 'Assigned vs remaining',
  co_tab_totals: 'Present vs absent',
  co_no_sections: 'No classes are assigned to you yet.',
  co_assigned: 'Assigned',
  co_marked: 'Marked',
  co_remaining: 'Remaining',
  co_students: 'students',
  co_totals_note: '{n} section(s) not marked yet are not counted.',
  co_by_section: 'Section-wise today',
  co_not_marked: 'Not marked yet',
  tab_att_records: 'Records',
  att_call: 'Call',
  att_whatsapp: 'WhatsApp',
  att_no_phone: 'No phone number on file.',
  ad_coord_classes: 'Classes this coordinator can see and mark',
  ad_coord_classes_hint: 'All sections of each ticked class.',
  ad_coord_pick_class: 'Tick at least one class.',
  role_attendance_coordinator_desc: 'Marks attendance of assigned classes and contacts parents of absentees',
  role_admin: 'Admin',
  role_parent_desc: 'Child attendance, fee vouchers & notices',
  role_teacher_desc: 'Class roll call, exam marks & parent messages',
  role_principal_desc: 'Boys & Girls campus overview & approvals',
  role_vice_principal_desc: 'School overview without overall fee collection; individual student fee status',
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
  acc_close_btn: 'Close',
  acc_cancel_btn: 'Cancel',
  acc_pick_date: 'Date',
  acc_father_label: 'Father',
  acc_class_col: 'Class',
  acc_student_col: 'Student',
  acc_receipt_col: 'Receipt',
  acc_method_col: 'Method',
  acc_received_by_label: 'Received by',
  acc_amount_in_words_label: 'Amount in words',
  acc_signature_label: 'Signature / Stamp',
  acc_reference_short: 'Ref.',
  acc_remarks_short: 'Remarks',
  acc_pending_word: 'pending',
  acc_no_dues_tag: 'No dues',
  acc_void_badge: 'Void',
  acc_void_note: 'Only the Admin can void payments or waive fees.',
  acc_print_receipt_from: 'Received with thanks from',
  acc_applied_to_heading: 'Money was applied to',
  acc_cat_ARREARS: 'Previous Arrears',
  acc_cat_MONTHLY: 'Monthly Tuition',
  acc_cat_ANNUAL: 'Annual Charges',
  acc_cat_ADMISSION: 'Admission Fee',
  acc_cat_EXAM: 'Exam Fee',
  acc_cat_LATE: 'Late Fee',
  acc_cat_OTHER: 'Other',
  acc_search_placeholder: 'Search by name, admission no., father name or phone',
  acc_all_classes: 'All classes',
  acc_search_hint_title: 'Search for a student to collect fees',
  acc_search_hint_body: 'Type at least 2 letters of the name, or the admission number.',
  acc_no_results_title: 'No students found',
  acc_no_results_body: 'Try a different name, admission number or filter.',
  acc_more_results_note: 'Showing the first 30 matches. Type more letters to narrow the list.',
  acc_account_title: 'Student fee account',
  acc_receive_payment_btn: 'Receive payment',
  acc_pending_balance_label: 'Pending balance',
  acc_amount_label: 'Amount (Rs)',
  acc_pay_full_btn: 'Fill full pending amount',
  acc_method_label: 'Payment method',
  acc_payment_date_label: 'Payment date',
  acc_reference_label: 'Reference number',
  acc_reference_hint: 'Required for Bank, JazzCash and Easypaisa',
  acc_remarks_label: 'Remarks (optional)',
  acc_save_payment_btn: 'Save payment',
  acc_err_amount_required: 'Enter an amount above Rs 0.',
  acc_err_amount_exceeds: 'Amount cannot be more than the pending balance.',
  acc_err_reference_required: 'Reference number is required for this method.',
  acc_err_date_future: 'Payment date cannot be in the future.',
  acc_err_no_pending: 'This student has no pending balance.',
  acc_err_save_failed: 'Could not save the payment. Please try again.',
  acc_success_title: 'Payment received',
  acc_new_payment_btn: 'New payment',
  acc_back_to_search_btn: 'Back to search',
  acc_gen_title: 'Generate monthly vouchers',
  acc_gen_campus_label: 'Campus',
  acc_gen_class_label: 'Class (optional)',
  acc_gen_month_label: 'Billing month',
  acc_gen_due_label: 'Due date',
  acc_gen_preview_btn: 'Preview',
  acc_gen_preview_create: 'Vouchers to create',
  acc_gen_preview_skipped: 'Skipped (already have this month’s voucher)',
  acc_gen_preview_total: 'Total expected',
  acc_gen_confirm_btn: 'Confirm and generate',
  acc_gen_safe_note: 'Safe to run twice: students who already have this month’s voucher are skipped. Monthly vouchers never include the Admission Fee.',
  acc_gen_nothing: 'Nothing to create: every student already has a voucher for this month.',
  acc_gen_done: 'Vouchers created',
  acc_err_due_invalid: 'Choose a due date on or after the 1st of the billing month.',
  acc_voucher_search_placeholder: 'Search by student or voucher number',
  acc_status_all: 'All statuses',
  acc_month_all: 'All months',
  acc_vouchers_found: 'vouchers',
  acc_vouchers_none_title: 'No vouchers match',
  acc_print_vouchers_title: 'Print vouchers (2 per A4)',
  acc_print_vouchers_btn: 'Open print page',
  acc_print_class_required: 'Select a class to print its vouchers.',
  acc_print_none_found: 'No vouchers found for this class and month.',
  acc_print_ready_count: 'vouchers ready to print',
  acc_daily_title: 'Daily collection report',
  acc_total_collected: 'Total collected',
  acc_receipts_count: 'Receipts',
  acc_cash_in_hand: 'Cash in hand',
  acc_by_method: 'By payment method',
  acc_by_category: 'By fee category',
  acc_receipts_of_day: 'Receipts of the day',
  acc_print_report_btn: 'Print report',
  acc_no_receipts_title: 'No receipts in this period',
  acc_period_title: 'Period report',
  acc_range_today: 'Today',
  acc_range_week: 'This week',
  acc_range_month: 'This month',
  acc_range_custom: 'Custom',
  acc_from_date: 'From',
  acc_to_date: 'To',
  acc_filter_category: 'Fee category',
  acc_filter_method: 'Payment method',
  acc_filter_all_categories: 'All categories',
  acc_filter_all_methods: 'All methods',
  acc_group_by_day: 'Collection by day',
  acc_day_col: 'Day',
  acc_chart_title: 'Collection per day',
  acc_export_csv_btn: 'Export CSV',
  acc_err_range_invalid: '“From” date must not be after “To” date.',
  acc_def_title: 'Defaulters',
  acc_def_total_due: 'Total due',
  acc_def_students: 'students',
  acc_def_min_months: 'Minimum months unpaid',
  acc_def_this_month: 'Current month only (unpaid this month)',
  acc_def_months: 'months unpaid',
  acc_def_call: 'Call',
  acc_def_whatsapp: 'WhatsApp',
  acc_def_empty_title: 'No defaulters',
  acc_def_empty_body: 'Every student is up to date with past months.',
  acc_wa_message: 'Assalam-o-Alaikum! {school}: the fee of {child} is pending (Rs {amount}). Please pay at the school office. Thank you.',
  acc_more_structure_title: 'Fee structure (read-only)',
  acc_more_structure_note: 'Only the Admin can change fee heads, class fees and concessions.',
  acc_more_heads_heading: 'Fee heads',
  acc_more_class_fees_heading: 'Class fees',
  acc_more_concessions_heading: 'Student concessions',
  acc_more_no_concessions: 'No concessions recorded.',
  acc_concession_FIXED_OFF: 'Fixed discount',
  acc_concession_PERCENT_OFF: 'Percent discount',
  acc_concession_OVERRIDE: 'Override amount',
  acc_concession_reason: 'Reason',
  acc_charged_in_month: 'charged in',
  acc_vtab_generate: 'Generate',
  acc_vtab_list: 'List',
  acc_vtab_print: 'Print',
  acc_err_campus_required: 'Choose a campus.',
  acc_gen_failed: 'Could not generate vouchers. Please try again.',
  acc_showing_first: 'Showing the first 50. Use filters or search to narrow down.',
  pr_date_label: 'Date',
  pr_kpi_students: 'Total students',
  pr_kpi_boys_girls: 'Boys / Girls',
  pr_kpi_attendance: 'Attendance today',
  pr_kpi_present_absent: 'Present / Absent',
  pr_kpi_unmarked: 'Sections not marked',
  pr_kpi_collected_today: 'Collected today',
  pr_kpi_collected_month: 'Collected this month',
  pr_kpi_outstanding: 'Total outstanding',
  pr_kpi_defaulters: 'Defaulters',
  pr_kpi_tap_hint: 'Tap a card for details',
  pr_all_marked: 'All sections have marked attendance.',
  pr_unmarked_teachers: 'Teachers',
  pr_no_teacher: 'No teacher assigned',
  pr_chart_trend30: 'Attendance trend (30 days)',
  pr_chart_monthly12: 'Monthly collection (12 months)',
  pr_chart_expected: 'Expected vs collected (6 months)',
  pr_chart_daily: 'Daily collection',
  rs_exams_of_class: 'Exams of this class',
  rs_all_exams: 'All exams',
  attkpi_total: 'Total students',
  attkpi_present: 'Present students',
  attkpi_absent: 'Absent students',
  attkpi_sections: 'Sections marked',
  adatt_submit_tab: 'Submit attendance',
  adatt_student_tab: 'Student by student',
  adatt_no_students: 'No students in this class.',
  adatt_tap_hint: 'Tap a day: Present, then Absent, then Leave, then Present again. Saved at once, no lock. Sundays, holidays and future days are greyed out.',
  adatt_mark_all: 'Mark all present',
  adatt_next_student: 'Next student',
  attimp_btn: 'Bulk attendance of a month (CSV)',
  attimp_title: 'Monthly attendance upload',
  attimp_hint: 'One row per student. Columns: Admission No, Student Name, Father Name, Class, Campus, Month, Year, then 1 to 31 for the days. Under each day write P (Present), A (Absent), L (Late), Le (Leave) or H (Holiday: nothing is saved). Leave a day empty to skip it. Class and Campus are only checked and a difference shows a note. Students are matched by Admission No. Existing marks for those days are replaced. Future days are skipped.',
  attimp_err_cols: 'The file needs the columns Admission No, Month, Year and the days 1 to 31.',
  attimp_days: 'days',
  attimp_done: 'Attendance saved',
  pr_tap_open: 'Tap to open',
  pr_chart_category: 'Collection by fee category (this month)',
  pr_chart_campus_att: 'Campus comparison: attendance %',
  pr_chart_campus_fee: 'Campus comparison: collected this month',
  pr_chart_class_att: 'Class-wise attendance today',
  pr_chart_expected_label: 'Expected',
  pr_chart_collected_label: 'Collected',
  pr_chart_no_data: 'No data for this selection yet.',
  pr_recent_activity: 'Recent activity',
  pr_activity_payment: 'Payment received',
  pr_activity_void: 'Payment voided',
  pr_activity_correction: 'Attendance correction',
  pr_present: 'Present',
  pr_absent: 'Absent',
  pr_leave: 'Leave',
  pr_late: 'Late',
  pr_att_filters: 'Attendance report',
  pr_section_filter: 'Section',
  pr_all_sections: 'All sections',
  pr_overall_percent: 'Overall attendance',
  pr_days_covered: 'Days covered',
  pr_class_table: 'Class / section table',
  pr_student_list: 'Students',
  pr_today_absent: 'Today\'s absentees',
  pr_today_absent_none: 'No student is absent today.',
  pr_today_not_marked: 'Attendance has not been marked today yet.',
  pr_chronic_title: 'Chronic absentees',
  pr_chronic_below: 'Below',
  pr_chronic_none: 'No student is below this attendance.',
  pr_show_all_students: 'All students',
  pr_percent_col: '%',
  pr_students_col: 'Students',
  pr_print_view_btn: 'Print view',
  pr_att_none_title: 'No attendance recorded in this period',
  pr_fees_reports: 'Fee reports',
  pr_fees_defaulters: 'Defaulters',
  pr_results_soon_title: 'Results are coming soon',
  pr_results_soon_body: 'Exam results and publishing will appear here once exams are added.',
  pr_more_compliance: 'Attendance submission by section',
  pr_more_compliance_hint: 'Share of school days each section marked attendance.',
  pr_range_week: 'Last 7 days',
  pr_range_month: 'This month',
  pr_days_marked: 'days marked',
  pr_more_students: 'Student search',
  pr_profile_title: 'Student profile',
  pr_profile_dob: 'Date of birth',
  pr_profile_admission: 'Admission date',
  pr_profile_phone: 'Guardian phone',
  pr_profile_attendance: 'Attendance (all time)',
  pr_profile_fees: 'Fees',
  pr_notices_soon: 'Notices and message oversight will appear here in a later update.',
  pr_tab_attendance_hint: 'Marked attendance only; leave days are not counted.',
  ad_sys_title: 'System overview',
  ad_sys_users_by_role: 'Users by role',
  ad_sys_students_by_campus: 'Students by campus',
  ad_sys_audit_count: 'Audit log entries',
  ad_users_new_btn: 'New user',
  ad_users_search: 'Search by name, login ID or phone',
  ad_users_all_roles: 'All roles',
  ad_users_all_status: 'All',
  ad_users_active: 'Active',
  ad_users_inactive: 'Inactive',
  ad_users_none: 'No users match',
  ad_form_title: 'Create user',
  ad_form_role: 'Role',
  ad_form_name_en: 'Full name (English)',
  ad_form_name_ur: 'Full name (Urdu)',
  ad_form_phone: 'Phone',
  ad_form_campus: 'Campus',
  ad_form_campus_all: 'All campuses',
  ad_form_create_btn: 'Create user',
  ad_err_name_en: 'Enter the full name in English.',
  ad_err_name_ur: 'Enter the full name in Urdu.',
  ad_err_phone: 'Enter a valid phone number (10–13 digits).',
  ad_err_campus: 'Choose a campus for this role.',
  ad_err_generic: 'Could not complete this action. Please try again.',
  ad_cred_title: 'Login details',
  ad_cred_once: 'Shown only once. Write it down or print the slip now.',
  ad_cred_login_id: 'Login ID',
  ad_cred_password: 'Password',
  ad_cred_copy: 'Copy',
  ad_cred_copied: 'Copied',
  ad_cred_print: 'Print slip',
  ad_cred_done: 'Done',
  ad_slips_btn: 'Credential slips',
  ad_slips_empty: 'Slips appear here for users you create or reset in this session.',
  ad_slips_clear: 'Clear queue',
  ad_slip_install: 'Install the Al Furqan School app on your phone and sign in with these details. Keep the password private.',
  ad_slip_children: 'Student(s)',
  ad_detail_reset: 'Reset password',
  ad_detail_reset_confirm: 'Generate a new password for this user? The old one stops working.',
  ad_detail_deactivate: 'Deactivate',
  ad_detail_reactivate: 'Reactivate',
  ad_detail_deactivate_confirm: 'This user will no longer be able to sign in.',
  ad_detail_confirm: 'Confirm',
  ad_detail_self_warning: 'You cannot deactivate your own account.',
  ad_children_title: 'Linked students',
  ad_children_none: 'No students linked yet.',
  ad_children_unlink: 'Unlink',
  ad_children_link_search: 'Search a student to link',
  ad_children_link: 'Link',
  ad_rel_FATHER: 'Father',
  ad_rel_MOTHER: 'Mother',
  ad_rel_GUARDIAN: 'Guardian',
  ad_assign_title: 'Teaching assignments',
  ad_assign_none: 'No assignments yet.',
  ad_assign_add: 'Add assignment',
  ad_assign_section: 'Section',
  ad_assign_subject: 'Subject',
  ad_assign_no_subject: 'No specific subject (class teacher)',
  ad_assign_attendance: 'Can mark attendance',
  ad_assign_marks: 'Can enter marks',
  ad_assign_delete: 'Remove',
  ad_assign_pick_section: 'Choose a section.',
  ad_audit_title: 'Audit log',
  ad_audit_none: 'No audit entries yet.',
  ad_audit_by: 'by',
  ad_soon_setup: 'School setup (classes, fees, holidays, grading) is the next update.',
  ad_soon_students: 'Student admission and profiles are the next update.',
  st_search: 'Search by name, admission no., father name or phone',
  st_new_btn: 'Admit student',
  st_promote_btn: 'Year-end promotion',
  st_status_all: 'All',
  st_status_active: 'Active',
  st_status_left: 'Left',
  st_none: 'No students match',
  st_section_label: 'Class and section',
  st_pick_section: 'Choose class / section',
  st_form_admit_title: 'Admit a new student',
  st_form_edit_title: 'Edit student',
  st_name_en: 'Student name (English)',
  st_name_ur: 'Student name (Urdu)',
  st_father: 'Father\'s name',
  st_gender: 'Gender',
  st_gender_MALE: 'Boy',
  st_gender_FEMALE: 'Girl',
  st_dob: 'Date of birth',
  st_admission_date: 'Admission date',
  st_phone: 'Guardian phone',
  st_save_admit: 'Admit student',
  st_save_edit: 'Save changes',
  st_err_name_en: 'Enter the student\'s name in English.',
  st_err_name_ur: 'Enter the student\'s name in Urdu.',
  st_err_father: 'Enter the father\'s name.',
  st_err_phone: 'Enter a valid phone number (10–13 digits).',
  st_err_dob: 'Choose a valid date of birth in the past.',
  st_err_section: 'Choose a class and section.',
  st_err_admission_date: 'Admission date cannot be in the future.',
  st_parent_heading: 'Parent account',
  st_parent_none: 'Do not link now',
  st_parent_create: 'Create new parent account',
  st_parent_link: 'Link existing parent',
  st_parent_search: 'Search parent by name, login ID or phone',
  st_parent_pick: 'Choose a parent from the list.',
  st_admitted: 'Student admitted',
  st_admitted_no: 'Admission no.',
  st_tab_info: 'Info',
  st_tab_attendance: 'Attendance',
  st_tab_fees: 'Fees',
  st_tab_results: 'Results',
  st_results_soon: 'Results will appear here once exams are added.',
  st_edit_btn: 'Edit',
  st_linked_parents: 'Linked parents',
  st_no_parents: 'No parent account linked yet.',
  st_roll: 'Roll no.',
  st_transfer_btn: 'Transfer',
  st_transfer_title: 'Transfer to another section',
  st_transfer_reason: 'Reason for transfer',
  st_transfer_confirm: 'Confirm transfer',
  st_err_reason: 'A reason is required.',
  st_left_btn: 'Mark as left',
  st_left_title: 'Mark student as left',
  st_left_reason: 'Reason',
  st_left_date: 'Date left',
  st_left_confirm: 'Confirm',
  st_left_note: 'Fee and attendance history is kept. The student no longer appears in active lists.',
  st_promo_title: 'Year-end promotion',
  st_promo_from: 'From section',
  st_promo_to: 'Promote to section',
  st_promo_students: 'Students to promote (untick to keep back)',
  st_promo_preview: 'Preview',
  st_promo_confirm: 'Confirm promotion',
  st_promo_summary: 'students will move to the new section; the rest stay.',
  st_promo_done: 'Students promoted',
  st_promo_none: 'No students selected.',
  st_promo_same: 'Choose a different target section.',
  st_promo_campus: 'Target section must be in the same campus.',
  st_csv_btn: 'Import parents (CSV)',
  st_csv_title: 'Bulk create parent accounts',
  st_csv_hint: 'CSV columns: name_en, name_ur, phone, campus (B or G). First row can be a header.',
  st_csv_pick: 'Choose CSV file',
  st_csv_valid: 'valid rows',
  st_csv_invalid: 'rows with problems',
  st_csv_row: 'Row',
  st_csv_create: 'Create accounts',
  st_csv_done: 'Accounts created. Print the slips from the queue.',
  st_csv_none: 'No valid rows found.',
  st_father_ur: 'Father\'s name (Urdu)',
  st_err_father_ur: 'Enter the father\'s name in Urdu to create the parent account.',
  st_view_profile: 'Student profile',
  st_att_monthly: 'Monthly attendance',
  st_phone2: 'Phone 2 (optional)',
  st_dob_opt: 'Date of birth (optional)',
  st_parent_username: 'Parent user name (blank = auto)',
  st_parent_password: 'Parent password (blank = auto)',
  st_fees_heading: 'Fees',
  st_actual_fee: 'Actual fee (monthly)',
  st_net_fee: 'Net fee (monthly, after concession)',
  st_annual_charges: 'Annual charges',
  st_admission_fee: 'Admission fee',
  st_paid: 'Paid',
  st_unpaid: 'Unpaid',
  st_err_fee: 'Enter fee amounts as whole numbers.',
  st_err_net_gt: 'Net fee cannot be more than the actual fee.',
  st_bulk_btn: 'Import students (CSV)',
  st_bulk_title: 'Bulk admit students',
  st_bulk_hint: 'Upload a CSV (save from Excel as \'CSV UTF-8\'). Columns are read by their heading, in any order: Admission No., Student Name (en), Student Name (ur), Father Name, Father Name (ur), Contact 1, Contact 2, Campus (Boys/Girls), Class, Section, Status (Active), User Id, Password. Missing classes and sections are created automatically. Students with the same User Id share one parent account.',
  st_bulk_template: 'Download template',
  st_bulk_checking: 'Checking rows...',
  st_bulk_import: 'Import students',
  st_bulk_done: 'Students imported. Parent slips were added to the queue.',
  st_bulk_new_parents: 'new parent accounts',
  st_bulk_print: 'Print parent slips',
  st_bulk_pick_section: 'Choose class and section first',
  st_bulk_err_status: 'Status must be Paid or Unpaid',
  st_bulk_err_number: 'Amount is not a number',
  st_bulk_err_cols: 'The file headings were not recognised. Download the template and use its headings.',
  res_imp_title: 'Import results (CSV)',
  res_imp_hint: 'Columns: Adm No, Campus, Exam (name), then one column per subject written Subject/Total, e.g. English/80. Use A for absent. A new exam is created and published automatically; students in the file get their marks for that exam replaced.',
  res_imp_btn: 'Import results (CSV)',
  res_imp_err_cols: 'The file headings were not recognised. Download the template: it needs Adm No, Exam and subject columns like English/80.',
  res_imp_done: 'Results imported.',
  rm_title: 'Remove students and parents',
  rm_hint: 'Tick students to remove them with their attendance, fees, marks and chats. A parent account is removed too when none of their children are left. This cannot be undone.',
  rm_selected_btn: 'Remove selected students',
  rm_all_btn: 'Remove ALL students and parents',
  rm_all_hint: 'Danger: removes every student and every parent account with all their records. Classes, teachers and staff stay.',
  rm_orphans_btn: 'Remove parent accounts without a student',
  rm_confirm_selected: 'Remove {n} students? This cannot be undone.',
  rm_done: 'Removed (students / parents)',
  rm_select_shown: 'Select all shown',
  rm_clear: 'Clear',
  rm_type_delete: 'Type DELETE to confirm',
  rm_btn: 'Remove students / parents',
  fee_imp_title: 'Opening balance (CSV)',
  daily_imp_title: 'Daily fee entries (CSV)',
  daily_imp_btn: 'Daily fee entries (CSV)',
  daily_imp_hint: 'One line per payment: Receipt No, Payment Date, Adm No, Fee For (a month like Oct-2026, or Previous Arrears) and Amount. Each amount first clears that month\'s monthly fee; anything extra goes to previous arrears. If one receipt covers several fees (monthly fee plus arrears), write each on its own line with the same Receipt No - it is saved as one receipt. A receipt already recorded is not added twice; uploading it again only fills in the fee type and the Collected At counter (Boys/Girls). The opening balance must be uploaded first.',
  daily_imp_err_cols: 'The file headings were not recognised. Download the template (Receipt No, Payment Date, Adm No, Fee For, Amount).',
  daily_imp_done: 'Payments recorded.',
  fee_imp_hint: 'One line per student with what the student owes on the day you start: Adm No, Billing Month (e.g. Oct-2026), Monthly Fee, Previous Arrears, Admission Fee Due, Annual Charges Due and Total Due (the sum of those four). Use 0 where nothing is due. A student who already has payments is not changed. After this, record fees with the daily fee sheet.',
  fee_imp_btn: 'Opening balance (CSV)',
  fee_imp_err_cols: 'The file headings were not recognised. Download the template and use its headings (Adm No, Billing Month, Monthly Fee...).',
  fee_imp_done: 'Fee records imported.',
  cl_import_title: 'Import classes (CSV)',
  cl_import_hint: 'Columns: Campus (Boys/Girls), Class (en), Class (ur), Sections (separate with ;), Subjects (separate with ;, optional Urdu after |, e.g. English|انگریزی). Existing classes are kept; only new sections and subjects are added.',
  cl_import_btn: 'Import classes (CSV)',
  cl_import_err_cols: 'The file headings were not recognised. Download the template and use its headings.',
  cl_import_done: 'Classes imported.',
  st_err_pw: 'Password must be at least 6 characters.',
  su_tab_school: 'School',
  su_tab_classes: 'Classes',
  su_tab_fees: 'Fees',
  su_tab_holidays: 'Holidays',
  su_tab_grading: 'Grading',
  su_name_en: 'School name (English)',
  su_name_ur: 'School name (Urdu)',
  su_phones: 'Office phones (separate with commas)',
  su_address: 'Address',
  su_lock: 'Attendance lock time (HH:MM)',
  su_off_days: 'Weekly off days',
  su_save: 'Save',
  su_saved: 'Saved.',
  su_add_class: 'Add class',
  su_class_name_en: 'Class name (English)',
  su_class_name_ur: 'Class name (Urdu)',
  su_subjects_heading: 'Subjects of this class (add as many as you need)',
  vp_student_fees: 'Student fees',
  vp_fees_hint: 'Search a student to see their fee status.',
  ac_edit_btn: 'Edit account',
  ac_edit_title: 'Edit account',
  ac_username: 'User name (Login ID)',
  ac_new_password: 'New password',
  ac_password_hint: 'Leave empty to keep the current password',
  ac_parent_heading: 'Parent accounts linked to this student',
  ac_parent_none: 'No parent account is linked yet.',
  ac_parent_unlink: 'Unlink',
  ac_parent_link_search: 'Search a parent account to link (name, ID or phone)',
  su_sections_heading: 'Section names (rename here)',
  su_subject_en: 'Subject name (English)',
  su_subject_ur: 'Subject name (Urdu, optional)',
  su_add_subject: 'Add subject',
  su_add_section: 'Add section',
  su_section_name: 'Section name',
  su_class_teacher: 'Class teacher',
  su_no_teacher: 'No class teacher',
  su_edit: 'Edit',
  su_delete: 'Delete',
  su_students_n: 'students',
  su_fee_hint: 'Changes apply to vouchers generated from now on. Existing vouchers and individual concessions are not changed.',
  su_tuition: 'Monthly tuition',
  su_annual_month: 'Annual charges month (1-12)',
  su_add_holiday: 'Add holiday',
  su_title_en: 'Title (English)',
  su_title_ur: 'Title (Urdu)',
  su_date: 'Date',
  su_date_to: 'Last day (optional, for a range)',
  su_campus: 'Campus',
  su_no_holidays: 'No holidays added for this year.',
  su_grade: 'Grade',
  su_min_percent: 'From %',
  su_add_grade: 'Add grade',
  su_grade_hint: 'A student gets the highest grade whose \'From %\' is at or below their percentage. The lowest grade must start at 0.',
  ad_void_btn: 'Void payment',
  ad_void_title: 'Void this payment?',
  ad_void_note: 'The amount goes back to pending on the vouchers it paid. This cannot be undone.',
  ad_waive_btn: 'Waive',
  ad_waive_title: 'Waive fee item',
  ad_waive_amount: 'Total amount to waive on this item',
  ad_waive_max: 'Most you can waive:',
  ad_waive_err: 'Enter a whole amount within the allowed limit.',
  ad_reason_label: 'Reason (required, saved in the audit log)',
  ad_confirm_btn: 'Confirm',
  ad_att_btn: 'Attendance correction',
  ad_att_title: 'Correct attendance',
  ad_att_date: 'Date',
  ad_att_pick: 'Choose a section',
  ad_att_none: 'No students in this section.',
  ad_att_unmarked: 'Not marked',
  ad_att_save: 'Save correction',
  ad_att_done: 'Attendance updated.',
  ad_att_close: 'Back',
  ex_tab: 'Exams',
  ex_new: 'New exam',
  ex_name_en: 'Exam name (English)',
  ex_name_ur: 'Exam name (Urdu)',
  ex_type: 'Type',
  ex_type_MONTHLY_TEST: 'Monthly test',
  ex_type_MID_TERM: 'Mid-term',
  ex_type_FINAL_TERM: 'Final term',
  ex_start: 'Start date',
  ex_end: 'End date',
  ex_status_DRAFT: 'Draft',
  ex_status_MARKS_ENTRY: 'Marks entry',
  ex_status_PUBLISHED: 'Published',
  ex_btn_open_entry: 'Open marks entry',
  ex_btn_publish: 'Publish results',
  ex_btn_unpublish: 'Unpublish',
  ex_none: 'No exams yet.',
  ex_subjects_heading: 'Subjects and marks',
  ex_subject: 'Subject',
  ex_total: 'Total',
  ex_pass: 'Pass',
  ex_copy_all: 'Copy to all classes of this campus',
  ex_progress: 'Marks progress',
  ex_edit_marks: 'Marks',
  ex_saved_draft: 'Draft saved',
  ex_entered: 'entered',
  ex_of: 'of',
  ex_submit: 'Submit marks',
  ex_submitted: 'Submitted',
  ex_absent: 'Absent',
  ex_pick_exam: 'Choose an exam',
  ex_no_open: 'No exam is open for marks entry right now.',
  ex_no_assign: 'You have no sections assigned for marks entry.',
  ex_roll: 'Roll',
  ex_all_needed: 'Enter a mark or Absent for every student before submitting.',
  ex_invalid: 'Marks must be between 0 and the total (half marks allowed).',
  ex_save_changes: 'Save changes',
  ex_reason_edit: 'Reason for changing published marks (required)',
  ex_sections_hint: 'Pick a class to set its subjects, then open marks entry.',
  ex_no_class_subjects: 'This class has no subjects configured.',
  ex_saved: 'Saved.',
  ex_all_campus: 'Both campuses',
  rs_none: 'No results have been published yet.',
  rs_trend: 'Progress across exams',
  rs_percentage: 'Percentage',
  rs_grade: 'Grade',
  rs_result: 'Result',
  rs_pass: 'Pass',
  rs_fail: 'Fail',
  rs_position: 'Class position',
  rs_obtained: 'Obtained',
  rs_total_marks: 'Total marks',
  rs_obtained_total: 'Obtained / Total marks',
  rs_grand_total: 'Grand total',
  rs_midterm: 'Mid-term',
  rs_subject_chart: 'Subject-wise percentage',
  rs_print: 'Print report card',
  rs_report_title: 'Report Card',
  rs_back: 'Back to results',
  rs_not_entered: 'Not entered',
  rs_show_position: 'Show class position on report cards',
  rs_students: 'Students',
  rs_avg: 'Average',
  rs_pass_rate: 'Pass rate',
  rs_incomplete: 'Incomplete',
  rs_grade_dist: 'Grade distribution',
  rs_subject_avgs: 'Subject averages',
  rs_top10: 'All students (ranked by percentage)',
  rs_choose_class: 'Choose class',
  rs_pick_class_hint: 'Choose an exam and a class to see the result.',
  rs_all_classes: 'All classes',
  rs_no_exams: 'No exam has reached marks entry yet.',
  rs_publish_hint: 'Parents see results only after you publish.',
  nt_title: 'Notices',
  nt_none: 'No notices right now.',
  nt_view_all: 'View all',
  nt_show_less: 'Show less',
  nt_new: 'New notice',
  nt_field_title: 'Title',
  nt_field_body: 'Notice text',
  nt_audience: 'Audience',
  nt_aud_ALL: 'Everyone',
  nt_aud_CAMPUS: 'One campus',
  nt_aud_CLASS: 'One class',
  nt_aud_STAFF: 'Staff only',
  nt_aud_PARENTS: 'Parents only',
  nt_expiry: 'Expires on (optional)',
  nt_publish: 'Publish',
  nt_expired: 'Expired',
  nt_delete: 'Delete',
  nt_manage_btn: 'Notices',
  nf_none: 'No notifications yet.',
  nf_mark_all: 'Mark all as read',
  nf_close: 'Close',
  ms_new: 'New message',
  ms_pick_teacher: 'Choose a teacher',
  ms_pick_student: 'Choose a student',
  ms_pick_parent: 'Choose a parent',
  ms_none: 'No conversations yet.',
  ms_type: 'Type a message',
  ms_send: 'Send',
  ms_note: 'The school office may review messages.',
  ms_templates: 'Quick messages',
  ms_tpl_1: 'Homework was not done today. Please follow up.',
  ms_tpl_2: 'Your child was absent without leave. Please tell us the reason.',
  ms_tpl_3: 'Great performance today. Well done!',
  ms_tpl_4: 'Please send the diary and books tomorrow.',
  ms_tpl_5: 'Please meet me at school at your convenience.',
  ms_audit_btn: 'All conversations',
  ms_audit_title: 'All conversations (read only)',
  ms_about: 'About',
  ms_read_only: 'Read-only view',
  ms_back: 'Back',
  ms_empty_chat: 'No messages yet. Say hello.',
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
  login_error_network: 'سرور سے رابطہ نہیں ہو سکا۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔',
  sync_saving: 'محفوظ ہو رہا ہے…',
  sync_failed: 'سرور پر محفوظ نہیں ہو سکا',
  sync_retry: 'دوبارہ کوشش',
  sync_reload: 'ترمیم ختم کر کے دوبارہ لوڈ کریں',
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
  role_vice_principal: 'وائس پرنسپل',
  role_accountant: 'اکاؤنٹنٹ',
  role_attendance_coordinator: 'حاضری کوآرڈینیٹر',
  tab_mark_attendance: 'حاضری لگائیں',
  ad_unlock_title: 'حاضری میں ترمیم کھولیں',
  ad_unlock_hint: 'کلاس سے منسلک اساتذہ اور حاضری کوآرڈینیٹر اس دن کی حاضری، لاک ٹائم کے بعد بھی، مقررہ منٹ ختم ہونے تک بدل سکتے ہیں۔ اس کے بعد خود بخود دوبارہ لاک ہو جاتی ہے۔ لاک کی باقی تمام شرائط وہی رہتی ہیں۔',
  ad_unlock_section: 'کلاس اور سیکشن',
  ad_unlock_all: 'تمام سیکشن',
  ad_unlock_minutes: 'کھلا رہنے کے منٹ',
  ad_unlock_open_btn: 'ابھی کھولیں',
  ad_unlock_active: 'اس وقت کھلی ہوئی',
  ad_unlock_none: 'کچھ بھی کھلا نہیں۔ حاضری معمول کے مطابق لاک ہے۔',
  ad_unlock_lock_now: 'ابھی لاک کریں',
  ad_unlock_err_minutes: '1 سے 240 کے درمیان منٹ لکھیں۔',
  teacher_att_unlocked: 'ایڈمن نے ترمیم کے لیے کھولی ہے۔ باقی وقت:',
  fb_title: 'فیس کی تفصیل',
  fb_collected_at: 'کس کیمپس کاؤنٹر پر وصول ہوئی',
  fb_at_boys: 'بوائز کیمپس کاؤنٹر',
  fb_at_girls: 'گرلز کیمپس کاؤنٹر',
  fb_this_month: 'اس ماہ کی فیس',
  fb_other: 'دیگر واجبات',
  fb_charged: 'واجب',
  fb_received: 'وصول',
  fb_pending: 'باقی',
  fb_total_charged: 'کل واجب',
  fb_collected_month: 'اس ماہ وصولی، قسم وار',
  fb_total: 'کل وصولی',
  co_tab_progress: 'تفویض شدہ بمقابلہ باقی',
  co_tab_totals: 'حاضر بمقابلہ غیر حاضر',
  co_no_sections: 'ابھی آپ کو کوئی کلاس تفویض نہیں کی گئی۔',
  co_assigned: 'تفویض شدہ',
  co_marked: 'لگی ہوئی',
  co_remaining: 'باقی',
  co_students: 'طلبہ',
  co_totals_note: '{n} سیکشن کی حاضری ابھی نہیں لگی، وہ شمار نہیں۔',
  co_by_section: 'آج سیکشن وار',
  co_not_marked: 'ابھی نہیں لگی',
  tab_att_records: 'ریکارڈ',
  att_call: 'کال',
  att_whatsapp: 'واٹس ایپ',
  att_no_phone: 'فون نمبر موجود نہیں۔',
  ad_coord_classes: 'وہ کلاسیں جن کی حاضری یہ کوآرڈینیٹر دیکھ اور لگا سکتا ہے',
  ad_coord_classes_hint: 'ٹک کی گئی ہر کلاس کے تمام سیکشن۔',
  ad_coord_pick_class: 'کم از کم ایک کلاس منتخب کریں۔',
  role_attendance_coordinator_desc: 'مقررہ کلاسوں کی حاضری لگانا اور غیر حاضر طلبہ کے والدین سے رابطہ',
  role_admin: 'ایڈمن',
  role_parent_desc: 'بچے کی حاضری، فیس واؤچر اور نوٹس بلیٹن',
  role_teacher_desc: 'کلاس حاضری، امتحانی نمبر اور والدین کے پیغامات',
  role_principal_desc: 'بوائز اور گرلز کیمپس کی نگرانی اور منظوری',
  role_vice_principal_desc: 'اسکول کی نگرانی، مجموعی فیس وصولی کے بغیر؛ انفرادی طالب علم کی فیس کی صورتحال',
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
  acc_close_btn: 'بند کریں',
  acc_cancel_btn: 'منسوخ کریں',
  acc_pick_date: 'تاریخ',
  acc_father_label: 'والد',
  acc_class_col: 'کلاس',
  acc_student_col: 'طالب علم',
  acc_receipt_col: 'رسید',
  acc_method_col: 'طریقہ',
  acc_received_by_label: 'وصول کنندہ',
  acc_amount_in_words_label: 'رقم الفاظ میں',
  acc_signature_label: 'دستخط / مہر',
  acc_reference_short: 'حوالہ',
  acc_remarks_short: 'ریمارکس',
  acc_pending_word: 'بقایا',
  acc_no_dues_tag: 'کوئی بقایا نہیں',
  acc_void_badge: 'منسوخ',
  acc_void_note: 'ادائیگی منسوخ کرنے یا فیس معاف کرنے کا اختیار صرف ایڈمن کو ہے۔',
  acc_print_receipt_from: 'شکریہ کے ساتھ وصول کیا از',
  acc_applied_to_heading: 'رقم درج ذیل میں لگائی گئی',
  acc_cat_ARREARS: 'سابقہ بقایا جات',
  acc_cat_MONTHLY: 'ماہانہ ٹیوشن فیس',
  acc_cat_ANNUAL: 'سالانہ چارجز',
  acc_cat_ADMISSION: 'داخلہ فیس',
  acc_cat_EXAM: 'امتحانی فیس',
  acc_cat_LATE: 'لیٹ فیس',
  acc_cat_OTHER: 'دیگر',
  acc_search_placeholder: 'نام، داخلہ نمبر، والد کا نام یا فون سے تلاش کریں',
  acc_all_classes: 'تمام کلاسیں',
  acc_search_hint_title: 'فیس وصول کرنے کے لیے طالب علم تلاش کریں',
  acc_search_hint_body: 'نام کے کم از کم 2 حروف یا داخلہ نمبر لکھیں۔',
  acc_no_results_title: 'کوئی طالب علم نہیں ملا',
  acc_no_results_body: 'کوئی اور نام، داخلہ نمبر یا فلٹر آزمائیں۔',
  acc_more_results_note: 'پہلے 30 نتائج دکھائے جا رہے ہیں۔ فہرست کم کرنے کے لیے مزید حروف لکھیں۔',
  acc_account_title: 'طالب علم کا فیس اکاؤنٹ',
  acc_receive_payment_btn: 'ادائیگی وصول کریں',
  acc_pending_balance_label: 'بقایا رقم',
  acc_amount_label: 'رقم (روپے)',
  acc_pay_full_btn: 'پوری بقایا رقم بھریں',
  acc_method_label: 'ادائیگی کا طریقہ',
  acc_payment_date_label: 'ادائیگی کی تاریخ',
  acc_reference_label: 'حوالہ نمبر',
  acc_reference_hint: 'بینک، جاز کیش اور ایزی پیسہ کے لیے لازمی',
  acc_remarks_label: 'ریمارکس (اختیاری)',
  acc_save_payment_btn: 'ادائیگی محفوظ کریں',
  acc_err_amount_required: '0 روپے سے زیادہ رقم درج کریں۔',
  acc_err_amount_exceeds: 'رقم بقایا بیلنس سے زیادہ نہیں ہو سکتی۔',
  acc_err_reference_required: 'اس طریقے کے لیے حوالہ نمبر لازمی ہے۔',
  acc_err_date_future: 'ادائیگی کی تاریخ آنے والے دنوں کی نہیں ہو سکتی۔',
  acc_err_no_pending: 'اس طالب علم کا کوئی بقایا نہیں۔',
  acc_err_save_failed: 'ادائیگی محفوظ نہیں ہو سکی۔ دوبارہ کوشش کریں۔',
  acc_success_title: 'ادائیگی وصول ہو گئی',
  acc_new_payment_btn: 'نئی ادائیگی',
  acc_back_to_search_btn: 'تلاش پر واپس',
  acc_gen_title: 'ماہانہ فیس واؤچرز بنائیں',
  acc_gen_campus_label: 'کیمپس',
  acc_gen_class_label: 'کلاس (اختیاری)',
  acc_gen_month_label: 'بلنگ کا مہینہ',
  acc_gen_due_label: 'آخری تاریخ',
  acc_gen_preview_btn: 'پیش نظارہ',
  acc_gen_preview_create: 'بننے والے واؤچرز',
  acc_gen_preview_skipped: 'چھوڑے گئے (اس ماہ کا واؤچر پہلے سے موجود)',
  acc_gen_preview_total: 'متوقع کل رقم',
  acc_gen_confirm_btn: 'تصدیق کریں اور بنائیں',
  acc_gen_safe_note: 'دو بار چلانا محفوظ ہے: جن طلبہ کا اس ماہ کا واؤچر موجود ہو انہیں چھوڑ دیا جاتا ہے۔ ماہانہ واؤچر میں داخلہ فیس کبھی شامل نہیں ہوتی۔',
  acc_gen_nothing: 'کچھ بنانے کو نہیں: ہر طالب علم کا اس ماہ کا واؤچر پہلے سے موجود ہے۔',
  acc_gen_done: 'واؤچرز بن گئے',
  acc_err_due_invalid: 'بلنگ مہینے کی 1 تاریخ یا اس کے بعد کی آخری تاریخ چنیں۔',
  acc_voucher_search_placeholder: 'طالب علم یا واؤچر نمبر سے تلاش کریں',
  acc_status_all: 'تمام حالتیں',
  acc_month_all: 'تمام مہینے',
  acc_vouchers_found: 'واؤچرز',
  acc_vouchers_none_title: 'کوئی واؤچر نہیں ملا',
  acc_print_vouchers_title: 'واؤچرز پرنٹ کریں (ہر A4 پر 2)',
  acc_print_vouchers_btn: 'پرنٹ صفحہ کھولیں',
  acc_print_class_required: 'واؤچر پرنٹ کرنے کے لیے کلاس منتخب کریں۔',
  acc_print_none_found: 'اس کلاس اور مہینے کے لیے کوئی واؤچر نہیں ملا۔',
  acc_print_ready_count: 'واؤچرز پرنٹ کے لیے تیار',
  acc_daily_title: 'یومیہ وصولی رپورٹ',
  acc_total_collected: 'کل وصولی',
  acc_receipts_count: 'رسیدیں',
  acc_cash_in_hand: 'نقد رقم (کیش)',
  acc_by_method: 'ادائیگی کے طریقے کے لحاظ سے',
  acc_by_category: 'فیس کی قسم کے لحاظ سے',
  acc_receipts_of_day: 'دن کی رسیدیں',
  acc_print_report_btn: 'رپورٹ پرنٹ کریں',
  acc_no_receipts_title: 'اس مدت میں کوئی رسید نہیں',
  acc_period_title: 'مدتی رپورٹ',
  acc_range_today: 'آج',
  acc_range_week: 'اس ہفتے',
  acc_range_month: 'اس مہینے',
  acc_range_custom: 'مرضی کی مدت',
  acc_from_date: 'از',
  acc_to_date: 'تا',
  acc_filter_category: 'فیس کی قسم',
  acc_filter_method: 'ادائیگی کا طریقہ',
  acc_filter_all_categories: 'تمام اقسام',
  acc_filter_all_methods: 'تمام طریقے',
  acc_group_by_day: 'روزانہ وصولی',
  acc_day_col: 'دن',
  acc_chart_title: 'روزانہ وصولی کا چارٹ',
  acc_export_csv_btn: 'CSV ایکسپورٹ کریں',
  acc_err_range_invalid: '«از» تاریخ «تا» تاریخ کے بعد کی نہیں ہو سکتی۔',
  acc_def_title: 'نادہندگان',
  acc_def_total_due: 'کل بقایا',
  acc_def_students: 'طلبہ',
  acc_def_min_months: 'کم از کم بقایا مہینے',
  acc_def_this_month: 'صرف موجودہ مہینہ (اس مہینے کی بقایا فیس)',
  acc_def_months: 'مہینے بقایا',
  acc_def_call: 'کال',
  acc_def_whatsapp: 'واٹس ایپ',
  acc_def_empty_title: 'کوئی نادہندہ نہیں',
  acc_def_empty_body: 'ہر طالب علم گزشتہ مہینوں کی فیس ادا کر چکا ہے۔',
  acc_wa_message: 'السلام علیکم! {school}: آپ کے بچے {child} کی فیس کی مد میں {amount} روپے بقایا ہیں۔ براہِ کرم اسکول آفس میں ادا کر دیں۔ شکریہ۔',
  acc_more_structure_title: 'فیس کا ڈھانچہ (صرف دیکھنے کے لیے)',
  acc_more_structure_note: 'فیس ہیڈز، کلاس فیس اور رعایتیں صرف ایڈمن تبدیل کر سکتا ہے۔',
  acc_more_heads_heading: 'فیس ہیڈز',
  acc_more_class_fees_heading: 'کلاس وار فیس',
  acc_more_concessions_heading: 'طلبہ کی رعایتیں',
  acc_more_no_concessions: 'کوئی رعایت درج نہیں۔',
  acc_concession_FIXED_OFF: 'مقررہ رعایت',
  acc_concession_PERCENT_OFF: 'فیصد رعایت',
  acc_concession_OVERRIDE: 'مقررہ نئی رقم',
  acc_concession_reason: 'وجہ',
  acc_charged_in_month: 'وصولی کا مہینہ',
  acc_vtab_generate: 'بنائیں',
  acc_vtab_list: 'فہرست',
  acc_vtab_print: 'پرنٹ',
  acc_err_campus_required: 'کیمپس منتخب کریں۔',
  acc_gen_failed: 'واؤچرز نہیں بن سکے۔ دوبارہ کوشش کریں۔',
  acc_showing_first: 'پہلے 50 دکھائے جا رہے ہیں۔ فلٹر یا تلاش سے فہرست کم کریں۔',
  pr_date_label: 'تاریخ',
  pr_kpi_students: 'کل طلبہ',
  pr_kpi_boys_girls: 'لڑکے / لڑکیاں',
  pr_kpi_attendance: 'آج کی حاضری',
  pr_kpi_present_absent: 'حاضر / غیر حاضر',
  pr_kpi_unmarked: 'حاضری نہ لگانے والے سیکشن',
  pr_kpi_collected_today: 'آج کی وصولی',
  pr_kpi_collected_month: 'اس ماہ کی وصولی',
  pr_kpi_outstanding: 'کل بقایا',
  pr_kpi_defaulters: 'نادہندگان',
  pr_kpi_tap_hint: 'تفصیل کے لیے کارڈ پر ٹیپ کریں',
  pr_all_marked: 'تمام سیکشنز نے حاضری لگا دی ہے۔',
  pr_unmarked_teachers: 'اساتذہ',
  pr_no_teacher: 'کوئی استاد مقرر نہیں',
  pr_chart_trend30: 'حاضری کا رجحان (30 دن)',
  pr_chart_monthly12: 'ماہانہ وصولی (12 مہینے)',
  pr_chart_expected: 'متوقع بمقابلہ وصول شدہ (6 مہینے)',
  pr_chart_daily: 'روزانہ وصولی',
  rs_exams_of_class: 'اس کلاس کے امتحانات',
  rs_all_exams: 'تمام امتحانات',
  attkpi_total: 'کل طلبہ',
  attkpi_present: 'حاضر طلبہ',
  attkpi_absent: 'غیر حاضر طلبہ',
  attkpi_sections: 'حاضری لگے سیکشن',
  adatt_submit_tab: 'حاضری جمع کریں',
  adatt_student_tab: 'طالب علم وار',
  adatt_no_students: 'اس کلاس میں کوئی طالب علم نہیں۔',
  adatt_tap_hint: 'دن پر دبائیں: حاضر، پھر غیر حاضر، پھر رخصت، پھر دوبارہ حاضر۔ فوراً محفوظ ہوتا ہے، کوئی لاک نہیں۔ اتوار، چھٹیاں اور آنے والے دن بند رہتے ہیں۔',
  adatt_mark_all: 'سب حاضر لگائیں',
  adatt_next_student: 'اگلا طالب علم',
  attimp_btn: 'پورے مہینے کی حاضری (CSV)',
  attimp_title: 'ماہانہ حاضری اپ لوڈ',
  attimp_hint: 'ہر طالب علم کی ایک قطار۔ کالم: Admission No, Student Name, Father Name, Class, Campus, Month, Year، پھر دنوں کے لیے 1 سے 31۔ ہر دن کے نیچے P (حاضر)، A (غیر حاضر)، L (لیٹ)، Le (رخصت) یا H (چھٹی، کچھ محفوظ نہیں ہوتا) لکھیں۔ Class اور Campus صرف جانچے جاتے ہیں، فرق ہو تو نوٹ دکھایا جاتا ہے۔ دن چھوڑنا ہو تو خانہ خالی رکھیں۔ طلبہ کو داخلہ نمبر سے ملایا جاتا ہے۔ ان دنوں کی پہلے سے لگی حاضری بدل جائے گی۔ آنے والے دن چھوڑ دیے جاتے ہیں۔',
  attimp_err_cols: 'فائل میں Admission No، Month، Year اور 1 سے 31 تک کے دنوں کے کالم ضروری ہیں۔',
  attimp_days: 'دن',
  attimp_done: 'حاضری محفوظ ہو گئی',
  pr_tap_open: 'کھولنے کے لیے دبائیں',
  pr_chart_category: 'فیس کی قسم کے لحاظ سے وصولی (اس ماہ)',
  pr_chart_campus_att: 'کیمپس کا موازنہ: حاضری فیصد',
  pr_chart_campus_fee: 'کیمپس کا موازنہ: اس ماہ کی وصولی',
  pr_chart_class_att: 'کلاس وار حاضری (آج)',
  pr_chart_expected_label: 'متوقع',
  pr_chart_collected_label: 'وصول شدہ',
  pr_chart_no_data: 'اس انتخاب کے لیے ابھی کوئی ڈیٹا نہیں۔',
  pr_recent_activity: 'حالیہ سرگرمی',
  pr_activity_payment: 'ادائیگی وصول ہوئی',
  pr_activity_void: 'ادائیگی منسوخ',
  pr_activity_correction: 'حاضری کی درستی',
  pr_present: 'حاضر',
  pr_absent: 'غیر حاضر',
  pr_leave: 'رخصت',
  pr_late: 'تاخیر',
  pr_att_filters: 'حاضری رپورٹ',
  pr_section_filter: 'سیکشن',
  pr_all_sections: 'تمام سیکشنز',
  pr_overall_percent: 'مجموعی حاضری',
  pr_days_covered: 'شامل دن',
  pr_class_table: 'کلاس / سیکشن جدول',
  pr_student_list: 'طلبہ',
  pr_today_absent: 'آج کے غیر حاضر',
  pr_today_absent_none: 'آج کوئی طالب علم غیر حاضر نہیں۔',
  pr_today_not_marked: 'آج کی حاضری ابھی نہیں لگی۔',
  pr_chronic_title: 'مسلسل غیر حاضر طلبہ',
  pr_chronic_below: 'سے کم',
  pr_chronic_none: 'کوئی طالب علم اس حاضری سے کم نہیں۔',
  pr_show_all_students: 'تمام طلبہ',
  pr_percent_col: 'فیصد',
  pr_students_col: 'طلبہ',
  pr_print_view_btn: 'پرنٹ ویو',
  pr_att_none_title: 'اس مدت میں حاضری درج نہیں',
  pr_fees_reports: 'فیس رپورٹس',
  pr_fees_defaulters: 'نادہندگان',
  pr_results_soon_title: 'نتائج جلد دستیاب ہوں گے',
  pr_results_soon_body: 'امتحانات شامل ہونے کے بعد نتائج اور اشاعت یہاں نظر آئیں گے۔',
  pr_more_compliance: 'سیکشن وار حاضری جمع کرانے کی کارکردگی',
  pr_more_compliance_hint: 'اسکول کے دنوں میں سے جتنے دن سیکشن نے حاضری لگائی۔',
  pr_range_week: 'آخری 7 دن',
  pr_range_month: 'اس مہینے',
  pr_days_marked: 'دن حاضری لگی',
  pr_more_students: 'طالب علم تلاش',
  pr_profile_title: 'طالب علم پروفائل',
  pr_profile_dob: 'تاریخ پیدائش',
  pr_profile_admission: 'تاریخ داخلہ',
  pr_profile_phone: 'سرپرست کا فون',
  pr_profile_attendance: 'حاضری (کل)',
  pr_profile_fees: 'فیس',
  pr_notices_soon: 'نوٹسز اور پیغامات کی نگرانی بعد کی اپڈیٹ میں یہاں شامل ہوگی۔',
  pr_tab_attendance_hint: 'صرف لگی ہوئی حاضری شمار ہوتی ہے؛ رخصت کے دن شمار نہیں ہوتے۔',
  ad_sys_title: 'نظام کا خلاصہ',
  ad_sys_users_by_role: 'کردار کے لحاظ سے صارفین',
  ad_sys_students_by_campus: 'کیمپس کے لحاظ سے طلبہ',
  ad_sys_audit_count: 'آڈٹ لاگ اندراجات',
  ad_users_new_btn: 'نیا صارف',
  ad_users_search: 'نام، لاگ ان آئی ڈی یا فون سے تلاش کریں',
  ad_users_all_roles: 'تمام کردار',
  ad_users_all_status: 'سب',
  ad_users_active: 'فعال',
  ad_users_inactive: 'غیر فعال',
  ad_users_none: 'کوئی صارف نہیں ملا',
  ad_form_title: 'صارف بنائیں',
  ad_form_role: 'کردار',
  ad_form_name_en: 'پورا نام (انگریزی)',
  ad_form_name_ur: 'پورا نام (اردو)',
  ad_form_phone: 'فون',
  ad_form_campus: 'کیمپس',
  ad_form_campus_all: 'تمام کیمپس',
  ad_form_create_btn: 'صارف بنائیں',
  ad_err_name_en: 'پورا نام انگریزی میں لکھیں۔',
  ad_err_name_ur: 'پورا نام اردو میں لکھیں۔',
  ad_err_phone: 'درست فون نمبر لکھیں (10 تا 13 ہندسے)۔',
  ad_err_campus: 'اس کردار کے لیے کیمپس منتخب کریں۔',
  ad_err_generic: 'یہ عمل مکمل نہیں ہو سکا۔ دوبارہ کوشش کریں۔',
  ad_cred_title: 'لاگ ان کی تفصیلات',
  ad_cred_once: 'صرف ایک بار دکھایا جاتا ہے۔ ابھی لکھ لیں یا سلپ پرنٹ کریں۔',
  ad_cred_login_id: 'لاگ ان آئی ڈی',
  ad_cred_password: 'پاس ورڈ',
  ad_cred_copy: 'کاپی',
  ad_cred_copied: 'کاپی ہو گیا',
  ad_cred_print: 'سلپ پرنٹ کریں',
  ad_cred_done: 'مکمل',
  ad_slips_btn: 'کریڈینشل سلپس',
  ad_slips_empty: 'اس سیشن میں بنائے یا ری سیٹ کیے گئے صارفین کی سلپس یہاں آئیں گی۔',
  ad_slips_clear: 'قطار صاف کریں',
  ad_slip_install: 'اپنے فون پر الفرقان اسکول ایپ انسٹال کریں اور ان تفصیلات سے لاگ ان کریں۔ پاس ورڈ خفیہ رکھیں۔',
  ad_slip_children: 'طالب علم',
  ad_detail_reset: 'پاس ورڈ ری سیٹ کریں',
  ad_detail_reset_confirm: 'اس صارف کے لیے نیا پاس ورڈ بنائیں؟ پرانا پاس ورڈ کام کرنا بند کر دے گا۔',
  ad_detail_deactivate: 'غیر فعال کریں',
  ad_detail_reactivate: 'دوبارہ فعال کریں',
  ad_detail_deactivate_confirm: 'یہ صارف اب لاگ ان نہیں کر سکے گا۔',
  ad_detail_confirm: 'تصدیق',
  ad_detail_self_warning: 'آپ اپنا اکاؤنٹ غیر فعال نہیں کر سکتے۔',
  ad_children_title: 'منسلک طلبہ',
  ad_children_none: 'ابھی کوئی طالب علم منسلک نہیں۔',
  ad_children_unlink: 'منسلک ختم کریں',
  ad_children_link_search: 'منسلک کرنے کے لیے طالب علم تلاش کریں',
  ad_children_link: 'منسلک کریں',
  ad_rel_FATHER: 'والد',
  ad_rel_MOTHER: 'والدہ',
  ad_rel_GUARDIAN: 'سرپرست',
  ad_assign_title: 'تدریسی ذمہ داریاں',
  ad_assign_none: 'ابھی کوئی ذمہ داری نہیں۔',
  ad_assign_add: 'ذمہ داری شامل کریں',
  ad_assign_section: 'سیکشن',
  ad_assign_subject: 'مضمون',
  ad_assign_no_subject: 'کوئی خاص مضمون نہیں (کلاس ٹیچر)',
  ad_assign_attendance: 'حاضری لگا سکتا ہے',
  ad_assign_marks: 'نمبر درج کر سکتا ہے',
  ad_assign_delete: 'ہٹائیں',
  ad_assign_pick_section: 'سیکشن منتخب کریں۔',
  ad_audit_title: 'آڈٹ لاگ',
  ad_audit_none: 'ابھی کوئی آڈٹ اندراج نہیں۔',
  ad_audit_by: 'بذریعہ',
  ad_soon_setup: 'اسکول سیٹ اپ (کلاسز، فیس، چھٹیاں، گریڈنگ) اگلی اپڈیٹ میں آئے گا۔',
  ad_soon_students: 'طلبہ کا داخلہ اور پروفائلز اگلی اپڈیٹ میں آئیں گے۔',
  st_search: 'نام، داخلہ نمبر، والد کا نام یا فون سے تلاش کریں',
  st_new_btn: 'داخلہ کریں',
  st_promote_btn: 'سالانہ ترقی',
  st_status_all: 'سب',
  st_status_active: 'فعال',
  st_status_left: 'چھوڑ گئے',
  st_none: 'کوئی طالب علم نہیں ملا',
  st_section_label: 'کلاس اور سیکشن',
  st_pick_section: 'کلاس / سیکشن منتخب کریں',
  st_form_admit_title: 'نئے طالب علم کا داخلہ',
  st_form_edit_title: 'طالب علم میں ترمیم',
  st_name_en: 'طالب علم کا نام (انگریزی)',
  st_name_ur: 'طالب علم کا نام (اردو)',
  st_father: 'والد کا نام',
  st_gender: 'جنس',
  st_gender_MALE: 'لڑکا',
  st_gender_FEMALE: 'لڑکی',
  st_dob: 'تاریخ پیدائش',
  st_admission_date: 'تاریخ داخلہ',
  st_phone: 'سرپرست کا فون',
  st_save_admit: 'داخلہ محفوظ کریں',
  st_save_edit: 'تبدیلیاں محفوظ کریں',
  st_err_name_en: 'طالب علم کا نام انگریزی میں لکھیں۔',
  st_err_name_ur: 'طالب علم کا نام اردو میں لکھیں۔',
  st_err_father: 'والد کا نام لکھیں۔',
  st_err_phone: 'درست فون نمبر لکھیں (10 تا 13 ہندسے)۔',
  st_err_dob: 'ماضی کی درست تاریخ پیدائش منتخب کریں۔',
  st_err_section: 'کلاس اور سیکشن منتخب کریں۔',
  st_err_admission_date: 'تاریخ داخلہ آنے والے دنوں کی نہیں ہو سکتی۔',
  st_parent_heading: 'والدین کا اکاؤنٹ',
  st_parent_none: 'ابھی منسلک نہ کریں',
  st_parent_create: 'نیا پیرنٹ اکاؤنٹ بنائیں',
  st_parent_link: 'موجودہ پیرنٹ منسلک کریں',
  st_parent_search: 'نام، لاگ ان آئی ڈی یا فون سے پیرنٹ تلاش کریں',
  st_parent_pick: 'فہرست میں سے پیرنٹ منتخب کریں۔',
  st_admitted: 'داخلہ ہو گیا',
  st_admitted_no: 'داخلہ نمبر',
  st_tab_info: 'معلومات',
  st_tab_attendance: 'حاضری',
  st_tab_fees: 'فیس',
  st_tab_results: 'نتائج',
  st_results_soon: 'امتحانات شامل ہونے کے بعد نتائج یہاں نظر آئیں گے۔',
  st_edit_btn: 'ترمیم',
  st_linked_parents: 'منسلک والدین',
  st_no_parents: 'ابھی کوئی پیرنٹ اکاؤنٹ منسلک نہیں۔',
  st_roll: 'رول نمبر',
  st_transfer_btn: 'تبادلہ',
  st_transfer_title: 'دوسرے سیکشن میں تبادلہ',
  st_transfer_reason: 'تبادلے کی وجہ',
  st_transfer_confirm: 'تبادلے کی تصدیق',
  st_err_reason: 'وجہ لکھنا لازمی ہے۔',
  st_left_btn: 'چھوڑ گیا قرار دیں',
  st_left_title: 'طالب علم کو چھوڑ گیا قرار دیں',
  st_left_reason: 'وجہ',
  st_left_date: 'چھوڑنے کی تاریخ',
  st_left_confirm: 'تصدیق',
  st_left_note: 'فیس اور حاضری کا ریکارڈ محفوظ رہتا ہے۔ طالب علم فعال فہرستوں میں نظر نہیں آئے گا۔',
  st_promo_title: 'سالانہ ترقی',
  st_promo_from: 'موجودہ سیکشن',
  st_promo_to: 'ترقی کا سیکشن',
  st_promo_students: 'ترقی پانے والے طلبہ (روکنے کے لیے نشان ہٹائیں)',
  st_promo_preview: 'پیش نظارہ',
  st_promo_confirm: 'ترقی کی تصدیق',
  st_promo_summary: 'طلبہ نئے سیکشن میں جائیں گے؛ باقی اسی میں رہیں گے۔',
  st_promo_done: 'طلبہ کو ترقی دے دی گئی',
  st_promo_none: 'کوئی طالب علم منتخب نہیں۔',
  st_promo_same: 'مختلف سیکشن منتخب کریں۔',
  st_promo_campus: 'ہدف سیکشن اسی کیمپس میں ہونا چاہیے۔',
  st_csv_btn: 'پیرنٹس درآمد کریں (CSV)',
  st_csv_title: 'پیرنٹ اکاؤنٹس اکٹھے بنائیں',
  st_csv_hint: 'CSV کالم: name_en, name_ur, phone, campus (B یا G)۔ پہلی قطار عنوان ہو سکتی ہے۔',
  st_csv_pick: 'CSV فائل منتخب کریں',
  st_csv_valid: 'درست قطاریں',
  st_csv_invalid: 'مسئلے والی قطاریں',
  st_csv_row: 'قطار',
  st_csv_create: 'اکاؤنٹس بنائیں',
  st_csv_done: 'اکاؤنٹس بن گئے۔ قطار سے سلپس پرنٹ کریں۔',
  st_csv_none: 'کوئی درست قطار نہیں ملی۔',
  st_father_ur: 'والد کا نام (اردو)',
  st_err_father_ur: 'پیرنٹ اکاؤنٹ بنانے کے لیے والد کا نام اردو میں لکھیں۔',
  st_view_profile: 'طالب علم پروفائل',
  st_att_monthly: 'ماہانہ حاضری',
  st_phone2: 'فون 2 (اختیاری)',
  st_dob_opt: 'تاریخ پیدائش (اختیاری)',
  st_parent_username: 'پیرنٹ یوزر نیم (خالی = خودکار)',
  st_parent_password: 'پیرنٹ پاس ورڈ (خالی = خودکار)',
  st_fees_heading: 'فیس',
  st_actual_fee: 'اصل فیس (ماہانہ)',
  st_net_fee: 'خالص فیس (ماہانہ، رعایت کے بعد)',
  st_annual_charges: 'سالانہ چارجز',
  st_admission_fee: 'داخلہ فیس',
  st_paid: 'ادا شدہ',
  st_unpaid: 'غیر ادا شدہ',
  st_err_fee: 'فیس کی رقم پوری عدد میں لکھیں۔',
  st_err_net_gt: 'خالص فیس اصل فیس سے زیادہ نہیں ہو سکتی۔',
  st_bulk_btn: 'طلبہ درآمد کریں (CSV)',
  st_bulk_title: 'طلبہ اکٹھے داخل کریں',
  st_bulk_hint: 'CSV اپ لوڈ کریں (ایکسل سے \'CSV UTF-8\' محفوظ کریں)۔ کالم اپنے عنوان سے پہچانے جاتے ہیں، ترتیب کوئی بھی ہو: Admission No., Student Name (en), Student Name (ur), Father Name, Father Name (ur), Contact 1, Contact 2, Campus (Boys/Girls), Class, Section, Status (Active), User Id, Password۔ جو کلاس یا سیکشن موجود نہ ہو وہ خود بن جاتا ہے۔ ایک ہی User Id والے طلبہ ایک پیرنٹ اکاؤنٹ شیئر کرتے ہیں۔',
  st_bulk_template: 'ٹیمپلیٹ ڈاؤن لوڈ کریں',
  st_bulk_checking: 'قطاریں چیک ہو رہی ہیں...',
  st_bulk_import: 'طلبہ درآمد کریں',
  st_bulk_done: 'طلبہ درآمد ہو گئے۔ پیرنٹ سلپس قطار میں شامل ہو گئیں۔',
  st_bulk_new_parents: 'نئے پیرنٹ اکاؤنٹس',
  st_bulk_print: 'پیرنٹ سلپس پرنٹ کریں',
  st_bulk_pick_section: 'پہلے کلاس اور سیکشن چنیں',
  st_bulk_err_status: 'اسٹیٹس Paid یا Unpaid ہونا چاہیے',
  st_bulk_err_number: 'رقم عدد نہیں ہے',
  st_bulk_err_cols: 'فائل کے عنوان پہچانے نہیں گئے۔ ٹیمپلیٹ ڈاؤن لوڈ کر کے اسی کے عنوان استعمال کریں۔',
  res_imp_title: 'نتائج اپ لوڈ (CSV)',
  res_imp_hint: 'کالم: Adm No، Campus، Exam (نام)، پھر ہر مضمون کا کالم Subject/Total کی صورت میں، مثلاً English/80۔ غیر حاضر کے لیے A لکھیں۔ نیا امتحان خود بن کر شائع ہو جائے گا؛ فائل کے طلبہ کے اس امتحان کے نمبر فائل کے مطابق بدل جائیں گے۔',
  res_imp_btn: 'نتائج اپ لوڈ (CSV)',
  res_imp_err_cols: 'فائل کے عنوانات نہیں پہچانے گئے۔ ٹیمپلیٹ ڈاؤن لوڈ کریں۔',
  res_imp_done: 'نتائج اپ لوڈ ہو گئے۔',
  rm_title: 'طلبہ اور والدین ہٹائیں',
  rm_hint: 'طلبہ منتخب کریں، ان کی حاضری، فیس، نمبر اور چیٹ سمیت ہٹ جائیں گے۔ جس والد کا کوئی بچہ نہ بچے اس کا اکاؤنٹ بھی ہٹ جائے گا۔ یہ عمل واپس نہیں ہو سکتا۔',
  rm_selected_btn: 'منتخب طلبہ ہٹائیں',
  rm_all_btn: 'تمام طلبہ اور والدین ہٹائیں',
  rm_all_hint: 'خبردار: ہر طالب علم اور ہر والد کا اکاؤنٹ تمام ریکارڈ سمیت ہٹ جائے گا۔ کلاسیں، اساتذہ اور عملہ رہیں گے۔',
  rm_orphans_btn: 'بغیر طالب علم والے والدین ہٹائیں',
  rm_confirm_selected: '{n} طلبہ ہٹائیں؟ یہ عمل واپس نہیں ہو سکتا۔',
  rm_done: 'ہٹا دیے گئے (طلبہ / والدین)',
  rm_select_shown: 'نظر آنے والے سب منتخب کریں',
  rm_clear: 'صاف کریں',
  rm_type_delete: 'تصدیق کے لیے DELETE لکھیں',
  rm_btn: 'طلبہ / والدین ہٹائیں',
  fee_imp_title: 'ابتدائی بقایا (CSV)',
  daily_imp_title: 'روزانہ فیس اندراج (CSV)',
  daily_imp_btn: 'روزانہ فیس اندراج (CSV)',
  daily_imp_hint: 'ہر ادائیگی کی ایک لائن: Receipt No، Payment Date، Adm No، Fee For (ماہ جیسے Oct-2026 یا Previous Arrears) اور Amount۔ رقم پہلے اس ماہ کی ماہانہ فیس میں لگتی ہے، بچی ہوئی رقم پچھلے بقایا میں جاتی ہے۔ اگر ایک رسید میں کئی مدیں ہوں (ماہانہ فیس اور بقایا) تو ہر مد الگ لائن میں اسی Receipt No کے ساتھ لکھیں، وہ ایک ہی رسید بنے گی۔ جو رسید پہلے درج ہو چکی ہو وہ چھوڑ دی جاتی ہے، اس لیے وہی فائل دوبارہ اپ لوڈ ہو تو محفوظ ہے۔ پہلے ابتدائی بقایا اپ لوڈ ہونا ضروری ہے۔',
  daily_imp_err_cols: 'فائل کے عنوانات نہیں پہچانے گئے۔ ٹیمپلیٹ ڈاؤن لوڈ کریں۔',
  daily_imp_done: 'ادائیگیاں درج ہو گئیں۔',
  fee_imp_hint: 'ہر طالب علم کی ایک لائن: آغاز کے دن اس کے ذمے جو رقم ہے۔ Adm No، Billing Month (مثلاً Oct-2026)، Monthly Fee، Previous Arrears، Admission Fee Due، Annual Charges Due اور Total Due (ان چاروں کا مجموعہ)۔ جہاں کچھ نہیں وہاں 0 لکھیں۔ جس طالب علم کی ادائیگیاں پہلے سے درج ہوں اس میں تبدیلی نہیں ہوگی۔ اس کے بعد فیس روزانہ فیس شیٹ سے درج کریں۔',
  fee_imp_btn: 'ابتدائی بقایا (CSV)',
  fee_imp_err_cols: 'فائل کے عنوانات نہیں پہچانے گئے۔ ٹیمپلیٹ ڈاؤن لوڈ کر کے اس کے عنوانات استعمال کریں۔',
  fee_imp_done: 'فیس ریکارڈ اپ لوڈ ہو گیا۔',
  cl_import_title: 'کلاسیں درآمد کریں (CSV)',
  cl_import_hint: 'کالم: Campus (Boys/Girls)، Class (en)، Class (ur)، Sections (؛ سے الگ کریں)، Subjects (؛ سے الگ کریں، اردو نام | کے بعد، مثلاً English|انگریزی)۔ موجود کلاسیں برقرار رہتی ہیں، صرف نئے سیکشن اور مضامین شامل ہوتے ہیں۔',
  cl_import_btn: 'کلاسیں درآمد کریں (CSV)',
  cl_import_err_cols: 'فائل کے عنوان پہچانے نہیں گئے۔ ٹیمپلیٹ ڈاؤن لوڈ کر کے اسی کے عنوان استعمال کریں۔',
  cl_import_done: 'کلاسیں درآمد ہو گئیں۔',
  st_err_pw: 'پاس ورڈ کم از کم 6 حروف کا ہو۔',
  su_tab_school: 'اسکول',
  su_tab_classes: 'کلاسز',
  su_tab_fees: 'فیس',
  su_tab_holidays: 'چھٹیاں',
  su_tab_grading: 'گریڈنگ',
  su_name_en: 'اسکول کا نام (انگریزی)',
  su_name_ur: 'اسکول کا نام (اردو)',
  su_phones: 'دفتر کے فون (کاما سے الگ کریں)',
  su_address: 'پتہ',
  su_lock: 'حاضری لاک ٹائم (HH:MM)',
  su_off_days: 'ہفتہ وار چھٹی',
  su_save: 'محفوظ کریں',
  su_saved: 'محفوظ ہو گیا۔',
  su_add_class: 'کلاس شامل کریں',
  su_class_name_en: 'کلاس کا نام (انگریزی)',
  su_class_name_ur: 'کلاس کا نام (اردو)',
  su_subjects_heading: 'اس کلاس کے مضامین (جتنے چاہیں شامل کریں)',
  vp_student_fees: 'طلبہ کی فیس',
  vp_fees_hint: 'فیس کی صورتحال دیکھنے کے لیے طالب علم تلاش کریں۔',
  ac_edit_btn: 'اکاؤنٹ میں ترمیم',
  ac_edit_title: 'اکاؤنٹ میں ترمیم',
  ac_username: 'یوزر نیم (لاگ ان آئی ڈی)',
  ac_new_password: 'نیا پاس ورڈ',
  ac_password_hint: 'موجودہ پاس ورڈ رکھنے کے لیے خالی چھوڑیں',
  ac_parent_heading: 'اس طالب علم سے منسلک والدین کے اکاؤنٹ',
  ac_parent_none: 'ابھی کوئی والدین اکاؤنٹ منسلک نہیں۔',
  ac_parent_unlink: 'منسلکی ختم کریں',
  ac_parent_link_search: 'منسلک کرنے کے لیے والدین اکاؤنٹ تلاش کریں (نام، آئی ڈی یا فون)',
  su_sections_heading: 'سیکشن کے نام (یہاں تبدیل کریں)',
  su_subject_en: 'مضمون کا نام (انگریزی)',
  su_subject_ur: 'مضمون کا نام (اردو، اختیاری)',
  su_add_subject: 'مضمون شامل کریں',
  su_add_section: 'سیکشن شامل کریں',
  su_section_name: 'سیکشن کا نام',
  su_class_teacher: 'کلاس ٹیچر',
  su_no_teacher: 'کوئی کلاس ٹیچر نہیں',
  su_edit: 'ترمیم',
  su_delete: 'حذف کریں',
  su_students_n: 'طلبہ',
  su_fee_hint: 'تبدیلی صرف آئندہ بننے والے واؤچرز پر لاگو ہوگی۔ موجودہ واؤچرز اور انفرادی رعایتیں نہیں بدلیں گی۔',
  su_tuition: 'ماہانہ ٹیوشن فیس',
  su_annual_month: 'سالانہ چارجز کا مہینہ (1-12)',
  su_add_holiday: 'چھٹی شامل کریں',
  su_title_en: 'عنوان (انگریزی)',
  su_title_ur: 'عنوان (اردو)',
  su_date: 'تاریخ',
  su_date_to: 'آخری دن (اختیاری، کئی دنوں کے لیے)',
  su_campus: 'کیمپس',
  su_no_holidays: 'اس سال کی کوئی چھٹی شامل نہیں۔',
  su_grade: 'گریڈ',
  su_min_percent: 'کم از کم %',
  su_add_grade: 'گریڈ شامل کریں',
  su_grade_hint: 'طالب علم کو وہ سب سے اونچا گریڈ ملتا ہے جس کا \'کم از کم %\' اس کے فیصد کے برابر یا کم ہو۔ سب سے نچلا گریڈ 0 سے شروع ہونا چاہیے۔',
  ad_void_btn: 'ادائیگی منسوخ کریں',
  ad_void_title: 'کیا یہ ادائیگی منسوخ کریں؟',
  ad_void_note: 'رقم واپس واجب الادا ہو جائے گی۔ یہ عمل واپس نہیں ہو سکتا۔',
  ad_waive_btn: 'معاف کریں',
  ad_waive_title: 'فیس آئٹم معاف کریں',
  ad_waive_amount: 'اس آئٹم پر کل معافی کی رقم',
  ad_waive_max: 'زیادہ سے زیادہ معافی:',
  ad_waive_err: 'جائز حد کے اندر پوری رقم لکھیں۔',
  ad_reason_label: 'وجہ (لازمی، آڈٹ لاگ میں محفوظ ہوگی)',
  ad_confirm_btn: 'تصدیق کریں',
  ad_att_btn: 'حاضری کی درستی',
  ad_att_title: 'حاضری درست کریں',
  ad_att_date: 'تاریخ',
  ad_att_pick: 'سیکشن چنیں',
  ad_att_none: 'اس سیکشن میں کوئی طالب علم نہیں۔',
  ad_att_unmarked: 'درج نہیں',
  ad_att_save: 'درستی محفوظ کریں',
  ad_att_done: 'حاضری اپڈیٹ ہو گئی۔',
  ad_att_close: 'واپس',
  ex_tab: 'امتحانات',
  ex_new: 'نیا امتحان',
  ex_name_en: 'امتحان کا نام (انگریزی)',
  ex_name_ur: 'امتحان کا نام (اردو)',
  ex_type: 'قسم',
  ex_type_MONTHLY_TEST: 'ماہانہ ٹیسٹ',
  ex_type_MID_TERM: 'مڈ ٹرم',
  ex_type_FINAL_TERM: 'فائنل ٹرم',
  ex_start: 'آغاز کی تاریخ',
  ex_end: 'اختتام کی تاریخ',
  ex_status_DRAFT: 'مسودہ',
  ex_status_MARKS_ENTRY: 'نمبر اندراج',
  ex_status_PUBLISHED: 'شائع شدہ',
  ex_btn_open_entry: 'نمبر اندراج شروع کریں',
  ex_btn_publish: 'نتائج شائع کریں',
  ex_btn_unpublish: 'شائع شدہ واپس لیں',
  ex_none: 'ابھی کوئی امتحان نہیں۔',
  ex_subjects_heading: 'مضامین اور نمبر',
  ex_subject: 'مضمون',
  ex_total: 'کل',
  ex_pass: 'پاس',
  ex_copy_all: 'اس کیمپس کی تمام کلاسوں میں نقل کریں',
  ex_progress: 'نمبروں کی پیش رفت',
  ex_edit_marks: 'نمبر',
  ex_saved_draft: 'مسودہ محفوظ',
  ex_entered: 'درج',
  ex_of: 'میں سے',
  ex_submit: 'نمبر جمع کروائیں',
  ex_submitted: 'جمع شدہ',
  ex_absent: 'غیر حاضر',
  ex_pick_exam: 'امتحان چنیں',
  ex_no_open: 'اس وقت کوئی امتحان نمبر اندراج کے لیے کھلا نہیں۔',
  ex_no_assign: 'آپ کو نمبر اندراج کے لیے کوئی سیکشن تفویض نہیں۔',
  ex_roll: 'رول',
  ex_all_needed: 'جمع کروانے سے پہلے ہر طالب علم کے نمبر یا غیر حاضر درج کریں۔',
  ex_invalid: 'نمبر 0 اور کل نمبروں کے درمیان ہوں (آدھے نمبر جائز)۔',
  ex_save_changes: 'تبدیلیاں محفوظ کریں',
  ex_reason_edit: 'شائع شدہ نمبر بدلنے کی وجہ (لازمی)',
  ex_sections_hint: 'کلاس چن کر اس کے مضامین طے کریں، پھر نمبر اندراج کھولیں۔',
  ex_no_class_subjects: 'اس کلاس کے مضامین طے نہیں۔',
  ex_saved: 'محفوظ ہو گیا۔',
  ex_all_campus: 'دونوں کیمپس',
  rs_none: 'ابھی کوئی نتیجہ شائع نہیں ہوا۔',
  rs_trend: 'امتحانات میں کارکردگی',
  rs_percentage: 'فیصد',
  rs_grade: 'گریڈ',
  rs_result: 'نتیجہ',
  rs_pass: 'پاس',
  rs_fail: 'فیل',
  rs_position: 'کلاس میں پوزیشن',
  rs_obtained: 'حاصل کردہ',
  rs_total_marks: 'کل نمبر',
  rs_obtained_total: 'حاصل / کل نمبر',
  rs_grand_total: 'مجموعہ',
  rs_midterm: 'مڈ ٹرم',
  rs_subject_chart: 'مضمون وار فیصد',
  rs_print: 'رپورٹ کارڈ پرنٹ کریں',
  rs_report_title: 'رپورٹ کارڈ',
  rs_back: 'نتائج پر واپس',
  rs_not_entered: 'درج نہیں',
  rs_show_position: 'رپورٹ کارڈ پر کلاس پوزیشن دکھائیں',
  rs_students: 'طلبہ',
  rs_avg: 'اوسط',
  rs_pass_rate: 'پاس شرح',
  rs_incomplete: 'نامکمل',
  rs_grade_dist: 'گریڈ کی تقسیم',
  rs_subject_avgs: 'مضمون وار اوسط',
  rs_top10: 'تمام طلبہ (فیصد کے لحاظ سے)',
  rs_choose_class: 'کلاس منتخب کریں',
  rs_pick_class_hint: 'نتیجہ دیکھنے کے لیے امتحان اور کلاس منتخب کریں۔',
  rs_all_classes: 'تمام کلاسیں',
  rs_no_exams: 'ابھی کوئی امتحان نمبر اندراج تک نہیں پہنچا۔',
  rs_publish_hint: 'والدین نتیجہ شائع کرنے کے بعد ہی دیکھ سکتے ہیں۔',
  nt_title: 'نوٹس',
  nt_none: 'اس وقت کوئی نوٹس نہیں۔',
  nt_view_all: 'سب دیکھیں',
  nt_show_less: 'کم دکھائیں',
  nt_new: 'نیا نوٹس',
  nt_field_title: 'عنوان',
  nt_field_body: 'نوٹس کا متن',
  nt_audience: 'مخاطب',
  nt_aud_ALL: 'سب',
  nt_aud_CAMPUS: 'ایک کیمپس',
  nt_aud_CLASS: 'ایک کلاس',
  nt_aud_STAFF: 'صرف عملہ',
  nt_aud_PARENTS: 'صرف والدین',
  nt_expiry: 'ختم ہونے کی تاریخ (اختیاری)',
  nt_publish: 'شائع کریں',
  nt_expired: 'میعاد ختم',
  nt_delete: 'حذف کریں',
  nt_manage_btn: 'نوٹس',
  nf_none: 'ابھی کوئی اطلاع نہیں۔',
  nf_mark_all: 'سب پڑھا ہوا کریں',
  nf_close: 'بند کریں',
  ms_new: 'نیا پیغام',
  ms_pick_teacher: 'استاد چنیں',
  ms_pick_student: 'طالب علم چنیں',
  ms_pick_parent: 'والدین چنیں',
  ms_none: 'ابھی کوئی گفتگو نہیں۔',
  ms_type: 'پیغام لکھیں',
  ms_send: 'بھیجیں',
  ms_note: 'اسکول دفتر پیغامات دیکھ سکتا ہے۔',
  ms_templates: 'فوری پیغامات',
  ms_tpl_1: 'آج ہوم ورک نہیں کیا گیا۔ براہِ کرم توجہ فرمائیں۔',
  ms_tpl_2: 'آپ کا بچہ بغیر اطلاع کے غیر حاضر رہا۔ براہِ کرم وجہ سے آگاہ کریں۔',
  ms_tpl_3: 'آج کی کارکردگی بہت اچھی رہی۔ شاباش!',
  ms_tpl_4: 'براہِ کرم کل ڈائری اور کتابیں ساتھ بھیجیں۔',
  ms_tpl_5: 'براہِ کرم کسی وقت اسکول آ کر مل لیں۔',
  ms_audit_btn: 'تمام گفتگو',
  ms_audit_title: 'تمام گفتگو (صرف مطالعہ)',
  ms_about: 'متعلق',
  ms_read_only: 'صرف مطالعہ',
  ms_back: 'واپس',
  ms_empty_chat: 'ابھی کوئی پیغام نہیں۔ بات شروع کریں۔',
};
