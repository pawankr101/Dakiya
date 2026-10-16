// server/src/app/modules/sync/sync.service.ts
import { loop } from "@dakiya/utils";
import { pullSyncData } from "../../../storage/db/repositories";
import type { DatabaseTables } from "../../../types";
import { ApiException } from "../../exception";
import type { PulledChanges } from "./sync.type";

interface SyncRecord {
    id: string;
    hlc: string;
    isDeleted?: boolean;
    isActive?: boolean;
}

const categorizeChanges = (() => {
    const buildChangeSet = <T extends SyncRecord>(records: T[]) => {
        const modified: T[] = [], deleted: string[] = [];

        loop(records, (record) => {
            // Check tombstone flags
            if (record.isDeleted === true || record.isActive === false) {
                deleted.push(record.id);
            } else {
                // Everything else is just an upsert
                modified.push(record);
            }
        });

        return { modified, deleted };
    };

    return (rawData: Partial<DatabaseTables>) => {
        const {
            users = [],
            user_relationships = [],
            conversations = [],
            conversation_members = [],
            messages = [],
            message_reactions = [],
            message_exclusions = []
        } = rawData;

        return {
            users: buildChangeSet(users as SyncRecord[]),
            user_relationships: buildChangeSet(user_relationships as SyncRecord[]),
            conversations: buildChangeSet(conversations as SyncRecord[]),
            conversation_members: buildChangeSet(conversation_members as SyncRecord[]),
            messages: buildChangeSet(messages as SyncRecord[]),
            message_reactions: buildChangeSet(message_reactions as SyncRecord[]),
            message_exclusions: buildChangeSet(message_exclusions as SyncRecord[])
        };
    };
})();

export const pullChangesService = async (userId: string, lastHlc?: string): Promise<PulledChanges> => {
    try {
        const BATCH_LIMIT = 2000;
        const data = await pullSyncData(userId, lastHlc);

        const { messages, message_reactions, conversation_members } = data.rawData;

        let hasMore = false;
        let checkpointHlc = data.serverHlc; // Default to absolute present

        // Check if any high-volume table hit the pagination limit
        if (messages?.length === BATCH_LIMIT) {
            hasMore = true;
            checkpointHlc = messages[BATCH_LIMIT - 1].hlc; // Use the HLC of the 2000th message
        } else if (message_reactions?.length === BATCH_LIMIT) {
            hasMore = true;
            checkpointHlc = message_reactions[BATCH_LIMIT - 1].hlc;
        }

        return {
            lastHlc: checkpointHlc, // Send the checkpoint, NOT the present time
            hasMore,
            changes: categorizeChanges(data.rawData)
        };
    } catch (error) {
        throw new ApiException(error as Error, { code: 'SYNC_PULL_ERROR', httpCode: 500 });
    }
};
