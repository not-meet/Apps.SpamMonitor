import {
	IRead,
	IUIKitSurfaceViewParam,
} from '@rocket.chat/apps-engine/definition/accessors';
import { WhitelistStore } from '../persistence/whiteListStore';
import { WHITELIST_OVERVIEW_MODAL_ID } from '../definition/whitelist';
import { UIKitSurfaceType } from '@rocket.chat/apps-engine/definition/uikit';
import { TextObjectType } from '@rocket.chat/ui-kit';
import { BlockId } from '../enums/modals/whiteList';

export async function buildWhitelistOverviewModal(
	read: IRead,
	appId: string,
): Promise<IUIKitSurfaceViewParam> {
	const { roomIds, roleIds } = await WhitelistStore.get(read);

	const roomLabels = await Promise.all(
		roomIds.map(async (id) => {
			const room = await read.getRoomReader().getById(id);
			return room?.slugifiedName ?? room?.displayName ?? id;
		}),
	);

	return {
		id: WHITELIST_OVERVIEW_MODAL_ID,
		type: UIKitSurfaceType.MODAL,
		title: {
			type: TextObjectType.PLAIN_TEXT,
			text: 'Spam Monitor Whitelist',
		},
		submit: {
			type: 'button',
			appId,
			blockId: BlockId.WHITELIST_SAVE,
			actionId: 'whitelist_save',
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Save' },
		},
		close: {
			type: 'button',
			appId,
			blockId: BlockId.WHITELIST_CLOSE,
			actionId: 'whitelist_close',
			text: { type: TextObjectType.PLAIN_TEXT, text: 'Cancel' },
		},
		blocks: [
			textSection(
				'Channels and roles listed here are fully excluded from spam monitoring — no detection, no restrictions. Edit either list and hit Save; anything removed from a list gets un-whitelisted.',
			),
			{ type: 'divider' },
			{
    type: 'input',
    blockId: BlockId.WHITELIST_CHANNEL_INPUT,
    optional: true,
    label: {
        type: TextObjectType.PLAIN_TEXT,
        text: 'Whitelisted channels (comma-separated)',
    },
    element: {
        type: 'plain_text_input',
        appId,
        blockId: BlockId.WHITELIST_CHANNEL_INPUT,
        actionId: 'channel_list_input',
        multiline: true,
        initialValue: roomLabels.join(', '),
        placeholder: {
            type: TextObjectType.PLAIN_TEXT,
            text: 'general, random, support',
        },
    },
},
{
    type: 'context',
    blockId: BlockId.WHITELIST_CHANNEL_INPUT,
    elements: [
        {
            type: TextObjectType.MRKDWN,
            text: '_Channel names are case-sensitive — enter them exactly as they appear in Rocket.Chat (e.g. "general", not "General").' +
                  '\n' +
                  'If you are unsure about the case of a channel name, check the channel list in Rocket.Chat.',
        },
    ],
} as any,
			{
				type: 'input',
				blockId: BlockId.WHITELIST_ROLE_INPUT,
				optional: true,
				label: {
					type: TextObjectType.PLAIN_TEXT,
					text: 'Whitelisted roles (comma-separated)',
				},
				element: {
					type: 'plain_text_input',
					appId,
					blockId: BlockId.WHITELIST_ROLE_INPUT,
					actionId: 'role_list_input',
					multiline: true,
					initialValue: roleIds.join(', '),
					placeholder: {
						type: TextObjectType.PLAIN_TEXT,
						text: 'moderator, admin, support-team',
					},
				},
			},
		] as any,
	};
}

function textSection(text: string) {
	return { type: 'section', text: { type: TextObjectType.MRKDWN, text } };
}

export function parseWhitelistChannelListInput(
	state: Record<string, Record<string, unknown>>,
): string[] {
	const raw = state[BlockId.WHITELIST_CHANNEL_INPUT]?.[
		'channel_list_input'
	] as string | undefined;
	return splitCommaList(raw).map((name) => name.replace(/^#/, ''));
}

export function parseWhitelistRoleListInput(
	state: Record<string, Record<string, unknown>>,
): string[] {
	const raw = state[BlockId.WHITELIST_ROLE_INPUT]?.[
		'role_list_input'
	] as string | undefined;
	return splitCommaList(raw).map((r) =>
		r.toLowerCase().replace(/\s+/g, '-'),
	);
}
function splitCommaList(raw?: string): string[] {
	if (!raw) return [];
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}