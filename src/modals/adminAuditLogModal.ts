import {
	ActionsBlock,
	ButtonElement,
	ContextBlock,
	DividerBlock,
	InputBlock,
	SectionBlock,
	TextObjectType,
} from '@rocket.chat/ui-kit';
import { IUIKitModalViewParam } from '@rocket.chat/apps-engine/definition/uikit/UIKitInteractionResponder';
import {
	ADMIN_AUDIT_LOG_MODAL_ID,
	AdminAuditLogActionId,
	AdminAuditLogBlockId,
} from '../enums/modals/adminAuditLog';
import { AdminLogCategory } from '../enums/scheduleReports';
import { AdminLogConfig, ConfigAuditEntry } from '../definition/scheduleReports';
import { AdminActionLogEntry } from '../definition/scheduleReports';
import { adminAuditLogModalText as msg, commonModalText } from '../lib/translations/locals/en';

// ─────────────────────────────────────────────────────────────────────────────
// Category option values used in the multi-select and for parsing state
// ─────────────────────────────────────────────────────────────────────────────
export const AUDIT_CATEGORY_VALUE = {
	LEVEL_CONFIG: AdminLogCategory.LEVEL_CONFIG,
	SCHEDULE_REPORT: AdminLogCategory.SCHEDULE_REPORT,
	USER_ACTIONS: AdminLogCategory.USER_ACTIONS,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1 — Config modal
// ─────────────────────────────────────────────────────────────────────────────

export function buildAdminAuditLogConfigModal(
	appId: string,
	savedConfig?: AdminLogConfig | null,
): IUIKitModalViewParam {
	const initialValues: string[] = [];
	if (savedConfig?.levelConfig) initialValues.push(AdminLogCategory.LEVEL_CONFIG);
	if (savedConfig?.scheduleReport) initialValues.push(AdminLogCategory.SCHEDULE_REPORT);
	if (savedConfig?.userActions) initialValues.push(AdminLogCategory.USER_ACTIONS);

	const headerBlock: SectionBlock = {
		type: 'section',
		blockId: AdminAuditLogBlockId.HEADER,
		text: { type: TextObjectType.MRKDWN, text: msg.configStage.header },
	};

	const categoriesBlock: InputBlock = {
		type: 'input',
		blockId: AdminAuditLogBlockId.CATEGORIES,
		optional: true,
		label: {
			type: TextObjectType.PLAIN_TEXT,
			text: msg.configStage.categoriesLabel,
		},
		element: {
			type: 'multi_static_select',
			appId,
			blockId: AdminAuditLogBlockId.CATEGORIES,
			actionId: AdminAuditLogActionId.CATEGORIES,
			placeholder: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.configStage.categoriesPlaceholder,
			},
			initialValue: initialValues,
			options: [
				{
					text: {
						type: TextObjectType.PLAIN_TEXT,
						text: msg.configStage.categoryOptions.levelConfig,
					},
					value: AdminLogCategory.LEVEL_CONFIG,
				},
				{
					text: {
						type: TextObjectType.PLAIN_TEXT,
						text: msg.configStage.categoryOptions.scheduleReport,
					},
					value: AdminLogCategory.SCHEDULE_REPORT,
				},
				{
					text: {
						type: TextObjectType.PLAIN_TEXT,
						text: msg.configStage.categoryOptions.userActions,
					},
					value: AdminLogCategory.USER_ACTIONS,
				},
			],
		},
	};

	const viewLogsActionsBlock: ActionsBlock = {
		type: 'actions',
		blockId: AdminAuditLogBlockId.VIEW_LOGS_BTN,
		elements: [
			{
				type: 'button',
				appId,
				blockId: AdminAuditLogBlockId.VIEW_LOGS_BTN,
				actionId: AdminAuditLogActionId.VIEW_LOGS,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: msg.configStage.viewLogsButton,
				},
			},
		],
	};

	const hintBlock: ContextBlock = {
		type: 'context',
		blockId: AdminAuditLogBlockId.EMPTY_STATE,
		elements: [
			{ type: TextObjectType.MRKDWN, text: msg.configStage.noChangeHint },
		],
	};

	return {
		id: ADMIN_AUDIT_LOG_MODAL_ID,
		title: { type: TextObjectType.PLAIN_TEXT, text: msg.configStage.title },
		blocks: [headerBlock, categoriesBlock, viewLogsActionsBlock, hintBlock],
		submit: {
			type: 'button',
			appId,
			blockId: AdminAuditLogBlockId.SUBMIT_BTN,
			actionId: AdminAuditLogActionId.CATEGORIES,
			style: 'primary',
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: msg.configStage.saveButton,
			},
		} as ButtonElement,
		close: {
			type: 'button',
			appId,
			blockId: AdminAuditLogBlockId.CLOSE_BTN,
			actionId: AdminAuditLogActionId.CATEGORIES,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: commonModalText.cancel,
			},
		} as ButtonElement,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 — Log viewer modal
// ─────────────────────────────────────────────────────────────────────────────

export function buildAdminAuditLogViewerModal(
	appId: string,
	config: AdminLogConfig,
	configEntries: ConfigAuditEntry[],
	userActionEntries: AdminActionLogEntry[],
): IUIKitModalViewParam {
	const backBlock: ActionsBlock = {
		type: 'actions',
		blockId: AdminAuditLogBlockId.BACK_BTN,
		elements: [
			{
				type: 'button',
				appId,
				blockId: AdminAuditLogBlockId.BACK_BTN,
				actionId: AdminAuditLogActionId.BACK_TO_CONFIG,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: msg.viewerStage.backButton,
				},
			},
		],
	};

	const noCategoriesEnabled =
		!config.levelConfig && !config.scheduleReport && !config.userActions;

	if (noCategoriesEnabled) {
		const emptyBlock: SectionBlock = {
			type: 'section',
			blockId: AdminAuditLogBlockId.EMPTY_STATE,
			text: {
				type: TextObjectType.MRKDWN,
				text: msg.viewerStage.noCategoriesEnabled,
			},
		};
		return {
			id: ADMIN_AUDIT_LOG_MODAL_ID,
			title: { type: TextObjectType.PLAIN_TEXT, text: msg.viewerStage.title },
			blocks: [backBlock, emptyBlock],
			close: {
				type: 'button',
				appId,
				blockId: AdminAuditLogBlockId.CLOSE_BTN,
				actionId: AdminAuditLogActionId.CATEGORIES,
				text: {
					type: TextObjectType.PLAIN_TEXT,
					text: commonModalText.cancel,
				},
			} as ButtonElement,
		};
	}

	const blocks: (SectionBlock | ActionsBlock | DividerBlock | ContextBlock)[] = [
		backBlock,
	];

	// ── Level Config section ──────────────────────────────────────────────────
	if (config.levelConfig) {
		blocks.push(divider(appId, 'lc'));
		blocks.push(sectionHeading(
			appId,
			'lc-h',
			msg.viewerStage.categoryHeadings.levelConfig,
		));
		const lcEntries = configEntries
			.filter((e) => e.category === AdminLogCategory.LEVEL_CONFIG)
			.slice(0, 10);
		if (lcEntries.length === 0) {
			blocks.push(sectionText(
				appId,
				'lc-empty',
				msg.viewerStage.emptyForCategory('level config'),
			));
		} else {
			for (const entry of lcEntries) {
				blocks.push(entryBlock(appId, `lc-${entry.timestamp}`, entry));
			}
		}
	}

	// ── Schedule Report section ───────────────────────────────────────────────
	if (config.scheduleReport) {
		blocks.push(divider(appId, 'sr'));
		blocks.push(sectionHeading(
			appId,
			'sr-h',
			msg.viewerStage.categoryHeadings.scheduleReport,
		));
		const srEntries = configEntries
			.filter((e) => e.category === AdminLogCategory.SCHEDULE_REPORT)
			.slice(0, 10);
		if (srEntries.length === 0) {
			blocks.push(sectionText(
				appId,
				'sr-empty',
				msg.viewerStage.emptyForCategory('schedule report'),
			));
		} else {
			for (const entry of srEntries) {
				blocks.push(entryBlock(appId, `sr-${entry.timestamp}`, entry));
			}
		}
	}

	// ── User Actions section ──────────────────────────────────────────────────
	if (config.userActions) {
		blocks.push(divider(appId, 'ua'));
		blocks.push(sectionHeading(
			appId,
			'ua-h',
			msg.viewerStage.categoryHeadings.userActions,
		));
		const uaEntries = userActionEntries.slice(0, 10);
		if (uaEntries.length === 0) {
			blocks.push(sectionText(
				appId,
				'ua-empty',
				msg.viewerStage.emptyForCategory('user action'),
			));
		} else {
			for (const entry of uaEntries) {
				blocks.push(userActionEntryBlock(appId, entry));
			}
		}
	}

	return {
		id: ADMIN_AUDIT_LOG_MODAL_ID,
		title: { type: TextObjectType.PLAIN_TEXT, text: msg.viewerStage.title },
		blocks,
		close: {
			type: 'button',
			appId,
			blockId: AdminAuditLogBlockId.CLOSE_BTN,
			actionId: AdminAuditLogActionId.CATEGORIES,
			text: {
				type: TextObjectType.PLAIN_TEXT,
				text: commonModalText.cancel,
			},
		} as ButtonElement,
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatTs(timestamp: number): string {
	return new Date(timestamp)
		.toISOString()
		.slice(0, 16)
		.replace('T', ' ') + ' UTC';
}

function divider(appId: string, suffix: string): DividerBlock {
	return {
		type: 'divider',
		blockId: `${AdminAuditLogBlockId.DIVIDER}-${suffix}`,
	};
}

function sectionHeading(
	appId: string,
	id: string,
	text: string,
): SectionBlock {
	return {
		type: 'section',
		blockId: `${AdminAuditLogBlockId.LOG_SECTION}-${id}`,
		text: { type: TextObjectType.MRKDWN, text },
	};
}

function sectionText(appId: string, id: string, text: string): SectionBlock {
	return {
		type: 'section',
		blockId: `${AdminAuditLogBlockId.LOG_SECTION}-${id}`,
		text: { type: TextObjectType.MRKDWN, text },
	};
}

function entryBlock(
	appId: string,
	id: string,
	entry: ConfigAuditEntry,
): SectionBlock {
	return {
		type: 'section',
		blockId: `${AdminAuditLogBlockId.LOG_SECTION}-${id}`,
		text: {
			type: TextObjectType.MRKDWN,
			text: msg.viewerStage.entryLine(
				formatTs(entry.timestamp),
				entry.action,
				entry.detail,
				entry.adminUsername,
			),
		},
	};
}

function userActionEntryBlock(
	appId: string,
	entry: AdminActionLogEntry,
): SectionBlock {
	const detail = entry.previousLevel !== undefined && entry.newLevel !== undefined
		? `Level: ${entry.previousLevel} → ${entry.newLevel} for @${entry.username}`
		: `Target: @${entry.username}`;
	return {
		type: 'section',
		blockId: `${AdminAuditLogBlockId.LOG_SECTION}-ua-${entry.timestamp}-${entry.userId}`,
		text: {
			type: TextObjectType.MRKDWN,
			text: msg.viewerStage.entryLine(
				formatTs(entry.timestamp),
				String(entry.action),
				detail,
				entry.adminUsername,
			),
		},
	};
}

// ─────────────────────────────────────────────────────────────────────────────
// State parser (used in viewSubmitHandler to read the multi-select values)
// ─────────────────────────────────────────────────────────────────────────────

export function parseAdminAuditLogConfigState(
	state: Record<string, Record<string, unknown>>,
): AdminLogConfig {
	const raw =
		state?.[AdminAuditLogBlockId.CATEGORIES]?.[
			AdminAuditLogActionId.CATEGORIES
		];
	const selected: string[] = Array.isArray(raw) ? (raw as string[]) : [];
	return {
		levelConfig: selected.includes(AdminLogCategory.LEVEL_CONFIG),
		scheduleReport: selected.includes(AdminLogCategory.SCHEDULE_REPORT),
		userActions: selected.includes(AdminLogCategory.USER_ACTIONS),
	};
}
