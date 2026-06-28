import { Chrono, loop } from "@dakiya/shared";
import { ApiException } from "app/exception";
import { type PulledSyncData, pullSyncData } from "../../../storage/db/pg/repositories/sync.repository";
import type { PulledChanges } from "./sync.type";

const categorizeChanges = (() => {
    const buildChangeSet = <T extends { createdAt: string }>(records: T[], lastPulledAt?: number) => {
        if (!lastPulledAt) return { created: records, updated: [], deleted: [] };
        const created: T[] = [], updated: T[] = [], deleted: string[] = [];
        loop(records, (record) => {
            if (Chrono.isoToTimestamp(record.createdAt) > lastPulledAt) {
                created.push(record);
            } else {
                updated.push(record);
            }
        });
        return { created, updated, deleted };
    }
    return (rawSyncData: PulledSyncData['rawSyncData'], lastPulledAt?: number) => {
        const { users, conversations, conversationMembers, messages, messageReactions, messageEdits, media } = rawSyncData;
        return {
            users: buildChangeSet(users, lastPulledAt),
            conversations: buildChangeSet(conversations, lastPulledAt),
            conversation_members: buildChangeSet(conversationMembers, lastPulledAt),
            messages: buildChangeSet(messages, lastPulledAt),
            message_reactions: buildChangeSet(messageReactions, lastPulledAt),
            message_edits: buildChangeSet(messageEdits, lastPulledAt),
            media: buildChangeSet(media, lastPulledAt)
        };
    }
})();

export const pullChangesService = async (userId: string, lastPulledAt?: number): Promise<PulledChanges> => {
    try {
        const lastPulledAtIso = lastPulledAt ? Chrono.timestampToIso(lastPulledAt) : undefined;
        const data = await pullSyncData(userId, lastPulledAtIso);
        return {
            lastPulledAt: data.timestamp,
            changes: categorizeChanges(data.rawSyncData, lastPulledAt)
        }
    } catch (error) {
        throw new ApiException(error as Error, { code: 'SYNC_PULL_ERROR', httpCode: 500 });
    }
};
