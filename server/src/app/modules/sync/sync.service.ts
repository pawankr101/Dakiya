import { loop } from "@dakiya/utils";
import type { PullSyncRawData } from "../../../storage/db/pg";
import { pullSyncData } from "../../../storage/db/repositories";
import { ApiException } from "../../exception";
import type { SyncPullResponse } from "./sync.type";

interface SyncRecord {
    id: string;
    isDeleted?: boolean;
    isActive?: boolean;
}

const categorizeChanges = (() => {
    const buildChangeSet = <T extends SyncRecord>(records: T[], extraDeletedIds?: string[]) => {
        const modified: T[] = [];
        const deleted: string[] = [];

        loop(records, (record) => {
            if (record.isDeleted === true || record.isActive === false) {
                deleted.push(record.id);
            } else {
                modified.push(record);
            }
        });

        if (extraDeletedIds && extraDeletedIds.length > 0) {
            if (deleted.length === 0) {
                return { modified, deleted: extraDeletedIds };
            }
            return {
                modified,
                deleted: Array.from(new Set([...deleted, ...extraDeletedIds]))
            };
        }

        return { modified, deleted };
    };

    return (rawData: PullSyncRawData): SyncPullResponse['data'] => {
        const {
            users,
            user_relationships,
            conversations,
            conversation_members,
            messages,
            message_reactions,
            excludedMessageIds,
            excludedReactionIds
        } = rawData;

        return {
            users: buildChangeSet(users),
            user_relationships: buildChangeSet(user_relationships),
            conversations: buildChangeSet(conversations),
            conversation_members: buildChangeSet(conversation_members),
            messages: buildChangeSet(messages, excludedMessageIds),
            message_reactions: buildChangeSet(message_reactions, excludedReactionIds)
        };
    };
})();

export const pullChangesService = async (userId: string, lastHlc?: string): Promise<SyncPullResponse> => {
    try {
        const { rawData, serverHlc } = await pullSyncData(userId, lastHlc);
        return {
            data: categorizeChanges(rawData),
            pagination: {
                cursor: serverHlc,
                hasMore: false
            }
        };
    } catch (error) {
        throw new ApiException(error as Error, { code: 'SYNC_PULL_ERROR', httpCode: 500 });
    }
};
