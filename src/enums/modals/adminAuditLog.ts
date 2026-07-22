export const ADMIN_AUDIT_LOG_MODAL_ID = 'admin_audit_log_modal';

export enum AdminAuditLogBlockId {
	HEADER = 'audit_log_header',
	CATEGORIES = 'audit_log_categories',
	VIEW_LOGS_BTN = 'audit_log_view_logs_btn',
	BACK_BTN = 'audit_log_back_btn',
	DIVIDER = 'audit_log_divider',
	LOG_SECTION = 'audit_log_section',
	EMPTY_STATE = 'audit_log_empty_state',
	SUBMIT_BTN = 'audit_log_submit_btn',
	CLOSE_BTN = 'audit_log_close_btn',
}

export enum AdminAuditLogActionId {
	VIEW_LOGS = 'audit_log_view_logs_action',
	BACK_TO_CONFIG = 'audit_log_back_to_config_action',
	CATEGORIES = 'audit_log_categories_action',
}
