import { Hlc } from '@dakiya/utils';
import { DB } from '../../../../config';
import type { Conversation, ConversationMember, Message, MessageExclusion, MessageReaction, User, UserRelationship } from '../../../../schemas';
import type { DatabaseTables } from '../../../../types';
import { PG } from '../connection';

export const pullSyncQuery = async (userId: string, lastHlc?: string): Promise<{ serverHlc: string, rawData: Partial<DatabaseTables & {message_exclusions: MessageExclusion[]}> }> => {
    return PG.sql.begin('ISOLATION LEVEL REPEATABLE READ', async (tx) => {
        const serverHlc = Hlc.generate().toString();
        let rawData: Partial<DatabaseTables & {message_exclusions: MessageExclusion[]}>;

        if (!lastHlc) {
            // ==========================================
            // INITIAL SYNC: Fetch only active, non-deleted records
            // ==========================================
            const boundaryTs = Hlc.now() - DB.syncBoundaryInMS;
            const boundaryHlc = `${boundaryTs.toString(36).padStart(9, '0')}-0000-000000000000000`;

            const [
                users,
                user_relationships,
                conversations,
                conversation_members,
                messages,
                message_reactions,
                message_exclusions
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
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = m.conversation_id AND cm.user_id = ${userId} AND cm.is_active = true
                      )
                `,
                tx<MessageExclusion[]>`
                    SELECT * FROM message_exclusions
                    WHERE deleted_for = ${userId} AND hlc >= ${boundaryHlc}
                `
            ]);
            rawData = { users, user_relationships, conversations, conversation_members, messages, message_reactions, message_exclusions };
        } else {
            // ==========================================
            // INCREMENTAL SYNC: Fetch all changes (including tombstones/deletions) since lastHlc
            // ==========================================
            const [
                users,
                user_relationships,
                conversations,
                conversation_members,
                messages,
                message_reactions,
                message_exclusions
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
                              WHERE cm_peer.user_id = u.id AND cm_me.user_id = ${userId}
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
                          WHERE cm.conversation_id = c.id AND cm.user_id = ${userId}
                      )
                `,
                tx<ConversationMember[]>`
                    SELECT cm.* FROM conversation_members cm
                    WHERE cm.hlc > ${lastHlc}
                      AND EXISTS (
                          SELECT 1 FROM conversation_members my_cm
                          WHERE my_cm.conversation_id = cm.conversation_id AND my_cm.user_id = ${userId}
                      )
                `,
                tx<Message[]>`
                    SELECT m.* FROM messages m
                    WHERE m.hlc > ${lastHlc}
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = m.conversation_id AND cm.user_id = ${userId}
                      )
                `,
                tx<MessageReaction[]>`
                    SELECT mr.* FROM message_reactions mr
                    JOIN messages m ON mr.message_id = m.id
                    WHERE mr.hlc > ${lastHlc}
                      AND EXISTS (
                          SELECT 1 FROM conversation_members cm
                          WHERE cm.conversation_id = m.conversation_id AND cm.user_id = ${userId}
                      )
                `,
                tx<MessageExclusion[]>`
                    SELECT * FROM message_exclusions
                    WHERE hlc > ${lastHlc} AND deleted_for = ${userId}
                `
            ]);
            rawData = { users, user_relationships, conversations, conversation_members, messages, message_reactions, message_exclusions };
        }

        return { serverHlc, rawData };
    });
};

export const pushSyncQuery = async (_userId: string, _changes: Partial<DatabaseTables>): Promise<void> => {
    await PG.sql.begin(async (_tx) => {
        // Push resolution stub: LWW (Last-Writer-Wins) logic using incoming HLCs
    });
};
