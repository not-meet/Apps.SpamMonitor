import { ManageUserActionId } from './modals/manageUsers';

export type LoggedUserAction =
	| ManageUserActionId.VOUCH
	| ManageUserActionId.RESET_COOLDOWN
	| ManageUserActionId.RESET_LEVEL_DOWN
	| ManageUserActionId.RESET_LEVEL_CLEAN;

export const LOGGED_ACTIONS: readonly string[] = [
	ManageUserActionId.VOUCH,
	ManageUserActionId.RESET_COOLDOWN,
	ManageUserActionId.RESET_LEVEL_DOWN,
	ManageUserActionId.RESET_LEVEL_CLEAN,
];

export enum AdminLogCategory {
	LEVEL_CONFIG = 'level_config',
	SCHEDULE_REPORT = 'schedule_report',
	USER_ACTIONS = 'user_actions',
}

export const ADMIN_CONFIG_ACTION = {
	LEVEL_CONFIG_EDITED: 'Level config edited',
	LEVEL_CONFIG_RESET: 'Level reset to default',
	SCHEDULE_SET: 'Schedule set',
	SCHEDULE_REMOVED: 'Schedule removed',
} as const;
