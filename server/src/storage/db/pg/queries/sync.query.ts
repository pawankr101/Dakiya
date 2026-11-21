import { Hlc } from '@dakiya/utils';
import { DB } from '../../../../config';
import type {
    Conversation,
    ConversationMember,
    Message,
    MessageReaction,
    User,
    UserRelationship
} from '../../../../schemas';
import type { DatabaseTables } from '../../../../types';
import { PG } from '../connection';

export interface PullSyncRawData {
    users: User[];
    user_relationships: UserRelationship[];
    conversations: Conversation[];
    conversation_members: ConversationMember[];
    messages: Message[];
    message_reactions: MessageReaction[];
    excludedMessageIds: string[];
    excludedReactionIds: string[];
}

export interface PullSyncResult {
    serverHlc: string;
    rawData: PullSyncRawData;
}

export const pullSyncQuery = async (userId: string, lastHlc?: string): Promise<PullSyncResult> => {
    return PG.sql.begin('ISOLATION LEVEL REPEATABLE READ', async (tx) => {
        const serverHlc = Hlc.generate().toString();

        if (!lastHlc) {
            // ==========================================
            // INITIAL SYNC: Fetch only active, non-deleted, non-excluded records
            // ==========================================
            const boundaryTs = Hlc.now() - DB.syncBoundaryInMS;
            const boundaryHlc = `${boundaryTs.toString(36).padStart(9, '0')}-0000-000000000000000`;

            const [
                users,
                user_relationships,
                conversations,
                conversation_members,
                messages,
                message_reactions
            ] = await Promise.all([
                tx<User[]>`
                    SELECT u.* FROM users u
                    WHERE u.is_deleted = false
                      AND (
                          u.id = ${userId}
                          OR EXISTS (SELECT 1 FROM user_relationships ur WHERE ur.owner_id = ${userId} AND ur.user_id = u.id)
                          OR EXISTS (
                              SELECT 1 FROM conversation_members cm_peer
                              JOIN conversation_members cm_me ON cm_peer.conversation_id = cm_me.conversation_id
                              WHERE cm_peer.user_id = u.id AND cm_peer.is_active = true
                                AND cm_me.user_id = ${userId} AND cm_me.is_active = true
                          )
                      )
                `,
                tx<UserRelationship[]>`
                    SELECT * FROM user_relationships WHERE owner_id = ${userId}
                `,
                tx<Conversation[]>`
                    SELECT c.* FROM conversations c
                    WHERE c.is_deleted = false
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = c.id AND cm.user_id = ${userId} AND cm.is_active = true
                      )
                `,
                tx<ConversationMember[]>`
                    SELECT cm.* FROM conversation_members cm
                    WHERE cm.is_active = true
                      AND EXISTS (
                          SELECT 1 FROM conversation_members my_cm
                          WHERE my_cm.conversation_id = cm.conversation_id AND my_cm.user_id = ${userId} AND my_cm.is_active = true
                      )
                `,
                tx<Message[]>`
                    SELECT m.* FROM messages m
                    WHERE m.hlc >= ${boundaryHlc}
                      AND NOT EXISTS (
                          SELECT 1 FROM message_exclusions me
                          WHERE me.message_root_id = m.root_id AND me.deleted_for = ${userId}
                      )
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = m.conversation_id AND cm.user_id = ${userId} AND cm.is_active = true
                      )
                `,
                tx<MessageReaction[]>`
                    SELECT mr.* FROM message_reactions mr
                    JOIN messages m ON mr.message_id = m.id
                    WHERE mr.is_deleted = false
                      AND mr.hlc >= ${boundaryHlc}
                      AND NOT EXISTS (
                          SELECT 1 FROM message_exclusions me
                          WHERE me.message_root_id = mr.message_root_id AND me.deleted_for = ${userId}
                      )
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = m.conversation_id AND cm.user_id = ${userId} AND cm.is_active = true
                      )
                `
            ]);

            return {
                serverHlc,
                rawData: {
                    users,
                    user_relationships,
                    conversations,
                    conversation_members,
                    messages,
                    message_reactions,
                    excludedMessageIds: [],
                    excludedReactionIds: []
                }
            };
        }

        // ==========================================
        // INCREMENTAL SYNC: Fetch changes & tombstones since lastHlc
        // ==========================================
        const [
            users,
            user_relationships,
            conversations,
            conversation_members,
            messages,
            message_reactions,
            excludedMessages,
            excludedReactions
        ] = await Promise.all([
            tx<User[]>`
                SELECT u.* FROM users u
                WHERE u.hlc > ${lastHlc}
                  AND (
                      u.id = ${userId}
                      OR EXISTS (SELECT 1 FROM user_relationships ur WHERE ur.owner_id = ${userId} AND ur.user_id = u.id)
                      OR EXISTS (
                          SELECT 1 FROM conversation_members cm_peer
                          JOIN conversation_members cm_me ON cm_peer.conversation_id = cm_me.conversation_id
                          WHERE cm_peer.user_id = u.id
                            AND cm_me.user_id = ${userId}
                            AND cm_me.is_active = true
                      )
                  )
            `,
            tx<UserRelationship[]>`
                SELECT * FROM user_relationships
                WHERE owner_id = ${userId} AND hlc > ${lastHlc}
            `,
            tx<Conversation[]>`
                SELECT c.* FROM conversations c
                WHERE c.hlc > ${lastHlc}
                  AND EXISTS (
                      SELECT 1 FROM conversation_members cm
                      WHERE cm.conversation_id = c.id
                        AND cm.user_id = ${userId}
                        AND (cm.is_active = true OR c.hlc <= cm.hlc)
                  )
            `,
            tx<ConversationMember[]>`
                SELECT cm.* FROM conversation_members cm
                WHERE cm.hlc > ${lastHlc}
                  AND EXISTS (
                      SELECT 1 FROM conversation_members my_cm
                      WHERE my_cm.conversation_id = cm.conversation_id
                        AND my_cm.user_id = ${userId}
                        AND (my_cm.is_active = true OR cm.hlc <= my_cm.hlc)
                  )
            `,
            tx<Message[]>`
                SELECT m.* FROM messages m
                WHERE m.hlc > ${lastHlc}
                  AND NOT EXISTS (
                      SELECT 1 FROM message_exclusions me
                      WHERE me.message_root_id = m.root_id AND me.deleted_for = ${userId}
                  )
                  AND EXISTS (
                      SELECT 1 FROM conversation_members cm
                      WHERE cm.conversation_id = m.conversation_id
                        AND cm.user_id = ${userId}
                        AND (cm.is_active = true OR m.hlc <= cm.hlc)
                  )
            `,
            tx<MessageReaction[]>`
                SELECT mr.* FROM message_reactions mr
                JOIN messages m ON mr.message_id = m.id
                WHERE mr.hlc > ${lastHlc}
                  AND NOT EXISTS (
                      SELECT 1 FROM message_exclusions me
                      WHERE me.message_root_id = mr.message_root_id AND me.deleted_for = ${userId}
                  )
                  AND EXISTS (
                      SELECT 1 FROM conversation_members cm
                      WHERE cm.conversation_id = m.conversation_id
                        AND cm.user_id = ${userId}
                        AND (cm.is_active = true OR mr.hlc <= cm.hlc)
                  )
            `,
            tx<{ id: string }[]>`
                SELECT m.id FROM messages m
                JOIN message_exclusions me ON me.message_root_id = m.root_id
                WHERE me.deleted_for = ${userId} AND me.hlc > ${lastHlc}
            `,
            tx<{ id: string }[]>`
                SELECT mr.id FROM message_reactions mr
                JOIN message_exclusions me ON me.message_root_id = mr.message_root_id
                WHERE me.deleted_for = ${userId} AND me.hlc > ${lastHlc}
            `
        ]);

        return {
            serverHlc,
            rawData: {
                users,
                user_relationships,
                conversations,
                conversation_members,
                messages,
                message_reactions,
                excludedMessageIds: excludedMessages.map((row) => row.id),
                excludedReactionIds: excludedReactions.map((row) => row.id)
            }
        };
    });
};

export const pushSyncQuery = async (_userId: string, _changes: Partial<DatabaseTables>): Promise<void> => {
    await PG.sql.begin(async (_tx) => {
        // Push resolution stub: LWW (Last-Writer-Wins) logic using incoming HLCs
    });
};
