import { Chrono, loop } from "@dakiya/shared";
import { pullSyncData } from "../../../storage/db/repositories";
import type { DatabaseTables } from "../../../types";
import { ApiException } from "../../exception";
import type { PulledChanges } from "./sync.type";

const categorizeChanges = (() => {
    const buildChangeSet = <T extends { createdAt: number }>(records: T[], lastPulledAt?: number) => {
        if (!lastPulledAt) return { created: records, updated: [], deleted: [] };
        const created: T[] = [], updated: T[] = [], deleted: string[] = [];
        loop(records, (record) => {
            if (record.createdAt > lastPulledAt) {
                created.push(record);
            } else {
                updated.push(record);
            }
        });
        return { created, updated, deleted };
    }
    return (rawData: Partial<DatabaseTables>, lastPulledAt?: number) => {
        const { users = [], user_relationships = [], conversations = [], conversation_members = [], messages = [], message_reactions = [], message_exclusions = [] } = rawData;
        return {
            users: buildChangeSet(users, lastPulledAt),
            user_relationships: buildChangeSet(user_relationships, lastPulledAt),
            conversations: buildChangeSet(conversations, lastPulledAt),
            conversation_members: buildChangeSet(conversation_members, lastPulledAt),
            messages: buildChangeSet(messages, lastPulledAt),
            message_reactions: buildChangeSet(message_reactions, lastPulledAt),
            message_exclusions: buildChangeSet(message_exclusions, lastPulledAt)
        };
    }
})();

export const pullChangesService = async (userId: string, lastPulledAt?: number): Promise<PulledChanges> => {
    try {
        const lastPulledAtIso = lastPulledAt ? Chrono.timestampToIso(lastPulledAt) : undefined;
        const data = await pullSyncData(userId, lastPulledAtIso);
        return {
            lastPulledAt: data.timestamp,
            changes: categorizeChanges(data.rawData, lastPulledAt)
        }
    } catch (error) {
        throw new ApiException(error as Error, { code: 'SYNC_PULL_ERROR', httpCode: 500 });
    }
};
