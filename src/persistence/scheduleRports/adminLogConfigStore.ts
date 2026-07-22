import {
	IPersistence,
	IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import {
	RocketChatAssociationModel,
	RocketChatAssociationRecord,
} from '@rocket.chat/apps-engine/definition/metadata';
import { AdminLogConfig } from '../../definition/scheduleReports';

const DEFAULT_CONFIG: AdminLogConfig = {
	levelConfig: false,
	scheduleReport: false,
	userActions: false,
};

export class AdminLogConfigStore {
	private static assocs(): RocketChatAssociationRecord[] {
		return [
			new RocketChatAssociationRecord(
				RocketChatAssociationModel.MISC,
				'antispam-admin-log-config',
			),
		];
	}

	public static async get(read: IRead): Promise<AdminLogConfig> {
		const records = await read
			.getPersistenceReader()
			.readByAssociations(AdminLogConfigStore.assocs());
		if (!records.length) return { ...DEFAULT_CONFIG };
		return (records[0] as AdminLogConfig) ?? { ...DEFAULT_CONFIG };
	}

	public static async save(
		persistence: IPersistence,
		config: AdminLogConfig,
	): Promise<void> {
		await persistence.updateByAssociations(
			AdminLogConfigStore.assocs(),
			config,
			true,
		);
	}
}
