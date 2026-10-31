import { loop, mapLoop } from "@dakiya/utils";
import { pullSyncData } from "../../../storage/db/repositories";
import type { DatabaseTables } from "../../../types";
import { ApiException } from "../../exception";
import type { SyncPullResponse } from "./sync.type";
import type { MessageExclusion } from "../../../schemas";

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
            if (record.isDeleted === true || record.isActive === false) {
                deleted.push(record.id);
            } else {
                modified.push(record);
            }
        });

        return { modified, deleted };
    };

    return (rawData: Partial<DatabaseTables & { message_exclusions?: MessageExclusion[] }>) => {
        const {
            users = [],
            user_relationships = [],
            conversations = [],
            conversation_members = [],
            messages = [],
            message_reactions = [],
            message_exclusions = []
        } = rawData;

        const messagesChangeSet = buildChangeSet(messages as SyncRecord[]);
        const reactionsChangeSet = buildChangeSet(message_reactions as SyncRecord[]);

        loop(message_exclusions, (exclusion) => {
            const removedMessageRootId = exclusion.messageRootId;

            const removedMessageIds = mapLoop(messages, (msg) => {
                if(msg.rootId === removedMessageRootId) {
                    return msg.id;
                }
            });
            messagesChangeSet.deleted.push(...removedMessageIds);

            const removedReactionIds = mapLoop(message_reactions, (reaction) => {
                if(reaction.messageRootId === removedMessageRootId) {
                    return reaction.id;
                }
            });
            reactionsChangeSet.deleted.push(...removedReactionIds);
        });
        messagesChangeSet.deleted = Array.from(new Set([...messagesChangeSet.deleted]));
        reactionsChangeSet.deleted = Array.from(new Set([...reactionsChangeSet.deleted]));

        return {
            users: buildChangeSet(users as SyncRecord[]),
            user_relationships: buildChangeSet(user_relationships as SyncRecord[]),
            conversations: buildChangeSet(conversations as SyncRecord[]),
            conversation_members: buildChangeSet(conversation_members as SyncRecord[]),
            messages: messagesChangeSet,
            message_reactions: reactionsChangeSet
        };
    };
})();

export const pullChangesService = async (userId: string, lastHlc?: string): Promise<SyncPullResponse> => {
    try {
        const data = await pullSyncData(userId, lastHlc);
        return {
            data: categorizeChanges(data.rawData) as unknown as SyncPullResponse['data'],
            pagination: {
                cursor: data.serverHlc,
                hasMore: false
            }
        };
    } catch (error) {
        throw new ApiException(error as Error, { code: 'SYNC_PULL_ERROR', httpCode: 500 });
    }
};
