import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { ConfigAuditEntry } from '../../definition/scheduleReports';

const MAX_RECENT = 50;
const MAX_DAILY = 200;

export class AdminConfigAuditStore {
	private static dayKey(timestamp: number): string {
		return new Date(timestamp).toISOString().slice(0, 10);
	}

	private static recentAssocs(): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				'antispam-config-audit-recent',
			),
		];
	}

	private static dailyAssocs(day: string): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				`antispam-config-audit-day:${day}`,
			),
		];
	}

	public static async log(
		persistence: IPersistence,
		read: IRead,
		entry: ConfigAuditEntry,
	): Promise<void> {
		const day = AdminConfigAuditStore.dayKey(entry.timestamp);

		// --- daily bucket ---
		const dailyAssocs = AdminConfigAuditStore.dailyAssocs(day);
		const existingDaily = await read
			.getPersistenceReader()
			.readByAssociations(dailyAssocs);
		const dailyDoc = existingDaily.length
			? (existingDaily[0] as {
					entries: ConfigAuditEntry[];
					truncated?: boolean;
				})
			: { entries: [], truncated: false };

		if (dailyDoc.entries.length < MAX_DAILY) {
			dailyDoc.entries.push(entry);
		} else {
			dailyDoc.truncated = true;
		}
		await persistence.updateByAssociations(dailyAssocs, dailyDoc, true);

		// --- rolling recent list ---
		const recentAssocs = AdminConfigAuditStore.recentAssocs();
		const existingRecent = await read
			.getPersistenceReader()
			.readByAssociations(recentAssocs);
		const recentDoc = existingRecent.length
			? (existingRecent[0] as { entries: ConfigAuditEntry[] })
			: { entries: [] };
		recentDoc.entries.push(entry);
		while (recentDoc.entries.length > MAX_RECENT) {
			recentDoc.entries.shift();
		}
		await persistence.updateByAssociations(recentAssocs, recentDoc, true);
	}

	public static async getRecent(
		read: IRead,
		limit = 25,
	): Promise<ConfigAuditEntry[]> {
		const records = await read
			.getPersistenceReader()
			.readByAssociations(AdminConfigAuditStore.recentAssocs());
		if (!records.length) return [];
		const doc = records[0] as { entries: ConfigAuditEntry[] };
		const entries = doc.entries ?? [];
		// return most-recent first
		return entries.slice(-limit).reverse();
	}

	public static async getActionsForDay(
		read: IRead,
		date: string,
	): Promise<ConfigAuditEntry[]> {
		const records = await read
			.getPersistenceReader()
			.readByAssociations(AdminConfigAuditStore.dailyAssocs(date));
		if (!records.length) return [];
		const doc = records[0] as { entries: ConfigAuditEntry[] };
		return doc.entries ?? [];
	}
}
