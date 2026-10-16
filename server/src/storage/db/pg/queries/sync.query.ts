import { Hlc } from '@dakiya/utils';
import { DB } from '../../../../config';
import type { Conversation, ConversationMember, Message, MessageExclusion, MessageReaction, User, UserRelationship } from '../../../../schemas';
import type { DatabaseTables, DatabaseTablesChanges } from '../../../../types';
import { PG } from '../connection';

export const pullSyncQuery = async (userId: string, lastHlc?: string): Promise<{ serverHlc: string, rawData: Partial<DatabaseTables> }> => {
    return PG.sql.begin('ISOLATION LEVEL REPEATABLE READ', async (tx) => {

        // 1. Generate the server HLC bookmark for this exact transaction snapshot
        const serverHlc = Hlc.generate().toString();

        let rawData: Partial<DatabaseTables>;

        if (!lastHlc) {
            // --- INITIAL SYNC ---
            // Construct a boundary HLC prefix utilizing the synchronized database offset
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
                    SELECT * FROM users
                    WHERE is_deleted = false
                      AND (
                          id = ${userId}
                          OR id IN (SELECT user_id FROM user_relationships WHERE owner_id = ${userId})
                          OR id IN (
                              SELECT user_id FROM conversation_members
                              WHERE is_active = true
                                AND conversation_id IN (
                                    SELECT conversation_id FROM conversation_members
                                    WHERE user_id = ${userId} AND is_active = true
                                )
                          )
                      )
                `,
                tx<UserRelationship[]>`
                    SELECT * FROM user_relationships
                    WHERE owner_id = ${userId}
                `,
                tx<Conversation[]>`
                    SELECT * FROM conversations
                    WHERE is_deleted = false
                      AND id IN (
                          SELECT conversation_id FROM conversation_members
                          WHERE user_id = ${userId} AND is_active = true
                      )
                `,
                tx<ConversationMember[]>`
                    SELECT * FROM conversation_members
                    WHERE is_active = true
                      AND conversation_id IN (
                          SELECT conversation_id FROM conversation_members
                          WHERE user_id = ${userId} AND is_active = true
                      )
                `,
                tx<Message[]>`
                    SELECT * FROM messages
                    WHERE conversation_id IN (
                        SELECT conversation_id FROM conversation_members
                        WHERE user_id = ${userId} AND is_active = true
                    )
                    AND hlc >= ${boundaryHlc}
                `,
                tx<MessageReaction[]>`
                    SELECT mr.* FROM message_reactions mr
                    JOIN messages m ON mr.message_id = m.id
                    WHERE mr.is_deleted = false
                      AND m.conversation_id IN (
                          SELECT conversation_id FROM conversation_members
                          WHERE user_id = ${userId} AND is_active = true
                      )
                      AND mr.hlc >= ${boundaryHlc}
                `,
                tx<MessageExclusion[]>`
                    SELECT * FROM message_exclusions
                    WHERE deleted_for = ${userId}
                      AND hlc >= ${boundaryHlc}
                `
            ]);

            rawData = { users, user_relationships, conversations, conversation_members, messages, message_reactions, message_exclusions };
        } else {
            // --- DELTA SYNC ---
            // Fetch everything mutated strictly after the client's last HLC (including soft-deleted records)
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
                    SELECT * FROM users
                    WHERE hlc > ${lastHlc}
                      AND (
                          id = ${userId}
                          OR id IN (SELECT user_id FROM user_relationships WHERE owner_id = ${userId})
                          OR id IN (
                              SELECT user_id FROM conversation_members
                              WHERE conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = ${userId})
                          )
                      )
                `,
                tx<UserRelationship[]>`
                    SELECT * FROM user_relationships
                    WHERE owner_id = ${userId}
                      AND hlc > ${lastHlc}
                `,
                tx<Conversation[]>`
                    SELECT * FROM conversations
                    WHERE hlc > ${lastHlc}
                      AND id IN (SELECT conversation_id FROM conversation_members WHERE user_id = ${userId})
                `,
                tx<ConversationMember[]>`
                    SELECT * FROM conversation_members
                    WHERE hlc > ${lastHlc}
                      AND conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = ${userId})
                `,
                tx<Message[]>`
                    SELECT * FROM messages
                    WHERE hlc > ${lastHlc}
                      AND conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = ${userId})
                `,
                tx<MessageReaction[]>`
                    SELECT mr.* FROM message_reactions mr
                    JOIN messages m ON mr.message_id = m.id
                    WHERE mr.hlc > ${lastHlc}
                      AND m.conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = ${userId})
                `,
                tx<MessageExclusion[]>`
                    SELECT * FROM message_exclusions
                    WHERE hlc > ${lastHlc}
                      AND deleted_for = ${userId}
                `
            ]);

            rawData = { users, user_relationships, conversations, conversation_members, messages, message_reactions, message_exclusions };
        }

        return { serverHlc, rawData };
    });
};

export const pushSyncQuery = async (userId: string, changes: Partial<DatabaseTablesChanges>): Promise<void> => {
    await PG.sql.begin(async (_tx) => {
        // Push resolution stub: LWW (Last-Writer-Wins) logic using incoming HLCs
    });
};
