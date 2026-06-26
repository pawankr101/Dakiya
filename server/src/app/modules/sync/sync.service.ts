import { Chrono, loop } from "@dakiya/shared";
import { type PulledSyncData, pullSyncData } from "../../../storage/db/pg/repositories/sync.repository";
import type { DatabaseChanges, PullChangesSuccess } from "./sync.type";

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
    return (rawSyncData: PulledSyncData['rawSyncData'], lastPulledAt?: number): DatabaseChanges => {
        return {
            users: buildChangeSet(rawSyncData.users, lastPulledAt),
            conversations: buildChangeSet(rawSyncData.conversations, lastPulledAt),
            conversation_members: buildChangeSet(rawSyncData.conversationMembers, lastPulledAt),
            messages: buildChangeSet(rawSyncData.messages, lastPulledAt),
            message_reactions: buildChangeSet(rawSyncData.messageReactions, lastPulledAt),
            message_edits: buildChangeSet(rawSyncData.messageEdits, lastPulledAt),
            media: buildChangeSet(rawSyncData.media, lastPulledAt),
        };
    }
})();

export const pullChangesService = async (userId: string, lastPulledAt?: number): Promise<PullChangesSuccess> => {
    const lastPulledAtIso = lastPulledAt ? Chrono.timestampToIso(lastPulledAt) : undefined;
    const data: PulledSyncData = await pullSyncData(userId, lastPulledAtIso);
    return {
        lastPulledAt: data.timestamp,
        changes: categorizeChanges(data.rawSyncData),
    }
};
