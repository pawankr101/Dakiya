import { mapLoop } from '@dakiya/shared';
import { DB } from '../../../../config';
import { PG } from '../connection';
import type { Conversation, ConversationMember, Media, Message, MessageEdit, MessageReaction, User } from '../types';

interface RawSyncData {
    users: User[];
    conversations: Conversation[];
    conversationMembers: ConversationMember[];
    messages: Message[];
    messageReactions: MessageReaction[];
    messageEdits: MessageEdit[];
    media: Media[];
}

export interface PulledSyncData {
    timestamp: number,
    rawSyncData: RawSyncData;
}

export const pullSyncData = async (userId: string, lastPulledAtIso?: string): Promise<PulledSyncData> => {
    return PG.sql.begin('ISOLATION LEVEL REPEATABLE READ', async (tx) => {

        // 1. Fetch Atomic Time Snapshot
        const [{serverTimeMs, boundaryIso}] = await tx<{ serverTimeMs: string; boundaryIso: string }[]>`
            WITH snap AS (SELECT NOW() AS ts)
            SELECT
                (EXTRACT(EPOCH FROM ts) * 1000)::bigint AS server_time_ms,
                to_char((ts - (INTERVAL '1 day' * ${DB.syncBoundryInDays})) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS boundary_iso
            FROM snap
        `;

        const rawSyncData: RawSyncData = {
            users: [],
            conversations: [],
            conversationMembers: [],
            messages: [],
            messageReactions: [],
            messageEdits: [],
            media: []
        }

        if (!lastPulledAtIso) {
            // --- INITIAL SYNC ---

            rawSyncData.conversations = await tx<Conversation[]>`
                SELECT * FROM conversations
                WHERE id IN (
                    SELECT conversation_id FROM conversation_members
                    WHERE user_id = ${userId}
                        AND has_left = false
                        AND is_deleted = false
                )
            `;

            if (rawSyncData.conversations.length > 0) {
                const convIds = mapLoop(rawSyncData.conversations, (c) => c.id);

                rawSyncData.conversationMembers = await tx<ConversationMember[]>`
                    SELECT * FROM conversation_members
                    WHERE conversation_id IN ${tx(convIds)}
                `;

                rawSyncData.users = await tx<User[]>`
                    SELECT * FROM users
                    WHERE id IN (
                        SELECT user_id FROM conversation_members
                        WHERE conversation_id IN ${tx(convIds)}
                    )
                `;

                rawSyncData.messages = await tx<Message[]>`
                    SELECT m.* FROM messages m
                    JOIN conversation_members cm
                    ON cm.conversation_id = m.conversation_id
                        AND cm.user_id = ${userId}
                    WHERE m.conversation_id IN ${tx(convIds)}
                        AND m.updated_at >= ${boundaryIso}
                        AND (
                            cm.has_historical_access = true
                            OR m.created_at >= cm.joined_at
                        )
                `;

                if (rawSyncData.messages.length > 0) {
                    const msgIds = mapLoop(rawSyncData.messages, (msg) => msg.id);
                    const userIds = mapLoop(rawSyncData.users, (user) => user.id);

                    rawSyncData.messageReactions = await tx<MessageReaction[]>`
                        SELECT * FROM message_reactions
                        WHERE message_id IN ${tx(msgIds)}
                            AND is_removed = false
                    `;

                    rawSyncData.messageEdits = await tx<MessageEdit[]>`
                        SELECT * FROM message_edits
                        WHERE message_id IN ${tx(msgIds)}
                    `;
                    // media should be feched for messages, conversations and users
                    rawSyncData.media = await tx<Media[]>`
                        SELECT * FROM media
                        WHERE (parent_type = 'message' AND parent_id IN ${tx(msgIds)})
                            OR (parent_type = 'conversation' AND parent_id IN ${tx(convIds)})
                            OR (parent_type = 'user' AND parent_id IN ${tx(userIds)})
                    `;
                }
            }
            return { timestamp: Number(serverTimeMs), rawSyncData };
        }
        // --- DELTA SYNC ---

        const [{ usersConversationsIds }] = await tx<{ usersConversationsIds: string[] }[]>`
            SELECT COALESCE(array_agg(conversation_id), ARRAY[]::uuid[]) AS users_conversations_ids
            FROM conversation_members
            WHERE user_id = ${userId}
                AND has_left = false
                AND is_deleted = false
        `;

        const ownMembershipRows = await tx<ConversationMember[]>`
            SELECT * FROM conversation_members
            WHERE user_id = ${userId}
                AND updated_at >= ${lastPulledAtIso}
        `;

        if (usersConversationsIds.length === 0) {
            rawSyncData.conversationMembers = ownMembershipRows;
            return { timestamp: Number(serverTimeMs), rawSyncData };
        }

        const otherMembershipRows = await tx<ConversationMember[]>`
            SELECT * FROM conversation_members
            WHERE conversation_id IN ${tx(usersConversationsIds)}
                AND user_id != ${userId}
                AND updated_at >= ${lastPulledAtIso}
        `;

        rawSyncData.conversationMembers = [...ownMembershipRows, ...otherMembershipRows];

        const newlyActiveConvIds = mapLoop<ConversationMember, string>(ownMembershipRows, (cm) => {
            if(!cm.hasLeft && !cm.isDeleted) return cm.conversationId;
        });

        rawSyncData.conversations = await tx<Conversation[]>`
            SELECT * FROM conversations
            WHERE id IN ${tx(usersConversationsIds)}
                AND (
                    updated_at >= ${lastPulledAtIso}
                    ${newlyActiveConvIds.length > 0
                        ? tx`OR id IN ${tx(newlyActiveConvIds)}`
                        : tx``}
                )
        `;

        rawSyncData.users = await tx<User[]>`
            SELECT * FROM users
            WHERE id IN (
                    SELECT user_id FROM conversation_members
                    WHERE conversation_id IN ${tx(usersConversationsIds)}
                )
                AND (
                    updated_at >= ${lastPulledAtIso}
                    OR id IN (
                        SELECT user_id FROM conversation_members
                        WHERE conversation_id IN ${tx(usersConversationsIds)}
                            AND updated_at >= ${lastPulledAtIso}
                    )
                )
        `;

        rawSyncData.messages = await tx<Message[]>`
            SELECT m.* FROM messages m
            WHERE m.conversation_id IN ${tx(usersConversationsIds)}
            AND (
                m.updated_at >= ${lastPulledAtIso}
                ${newlyActiveConvIds.length > 0 ? tx`
                OR (
                    m.conversation_id IN ${tx(newlyActiveConvIds)}
                    AND EXISTS (
                        SELECT 1 FROM conversation_members cm
                        WHERE cm.conversation_id = m.conversation_id
                            AND cm.user_id = ${userId}
                            AND (
                                (
                                    cm.has_historical_access = true
                                    AND m.updated_at >= ${boundaryIso}
                                )
                                OR
                                (
                                    cm.has_historical_access = false
                                    AND m.created_at >= cm.joined_at
                                )
                            )
                    )
                )
                ` : tx``}
            )
        `;

        rawSyncData.messageReactions = await tx<MessageReaction[]>`
            SELECT mr.* FROM message_reactions mr
            JOIN messages m ON mr.message_id = m.id
            WHERE m.conversation_id IN ${tx(usersConversationsIds)}
            AND (
                mr.updated_at >= ${lastPulledAtIso}

                ${newlyActiveConvIds.length > 0 ? tx`
                OR (
                    m.conversation_id IN ${tx(newlyActiveConvIds)}
                    AND EXISTS (
                        SELECT 1 FROM conversation_members cm
                        WHERE cm.conversation_id = m.conversation_id
                            AND cm.user_id = ${userId}
                            AND (
                                (
                                    cm.has_historical_access = true
                                    AND mr.updated_at >= ${boundaryIso}
                                )
                                OR
                                (
                                    cm.has_historical_access = false
                                    AND m.created_at >= cm.joined_at
                                )
                            )
                    )
                )
                ` : tx``}
            )
        `;

        rawSyncData.messageEdits = await tx<MessageEdit[]>`
            SELECT me.* FROM message_edits me
            JOIN messages m ON me.message_id = m.id
            WHERE m.conversation_id IN ${tx(usersConversationsIds)}
            AND (
                me.created_at >= ${lastPulledAtIso}
                ${newlyActiveConvIds.length > 0 ? tx`
                OR (
                    m.conversation_id IN ${tx(newlyActiveConvIds)}
                    AND EXISTS (
                        SELECT 1 FROM conversation_members cm
                        WHERE cm.conversation_id = m.conversation_id
                            AND cm.user_id = ${userId}
                            AND (
                                (
                                    cm.has_historical_access = true
                                    AND me.created_at >= ${boundaryIso}
                                )
                                OR
                                (
                                    cm.has_historical_access = false
                                    AND m.created_at >= cm.joined_at
                                )
                            )
                    )
                )
                ` : tx``}
            )
        `;

        const updatedUserIds = mapLoop(rawSyncData.users, (u) => u.id);
        rawSyncData.media = await tx<Media[]>`
            SELECT med.* FROM media med LEFT JOIN messages m
                ON med.parent_id = m.id
                AND med.parent_type = 'message'
                WHERE (
                    (
                        med.parent_type = 'message'
                        AND m.conversation_id IN ${tx(usersConversationsIds)}
                        AND (
                            med.updated_at >= ${lastPulledAtIso}
                            ${newlyActiveConvIds.length > 0 ? tx`
                                OR (
                                    m.conversation_id IN ${tx(newlyActiveConvIds)}
                                    AND EXISTS (
                                        SELECT 1 FROM conversation_members cm
                                        WHERE cm.conversation_id = m.conversation_id
                                            AND cm.user_id = ${userId}
                                            AND (
                                                (
                                                    cm.has_historical_access = true
                                                    AND med.updated_at >= ${boundaryIso}
                                                )
                                                OR
                                                (
                                                    cm.has_historical_access = false
                                                    AND m.created_at >= COALESCE(cm.joined_at, cm.created_at)
                                                )
                                            )
                                    )
                                )
                            ` : tx``}
                        )
                    )
                    OR
                    (
                        med.parent_type = 'conversation'
                        AND med.parent_id IN ${tx(usersConversationsIds)}
                        AND med.updated_at >= ${lastPulledAtIso}
                    )
                    ${updatedUserIds.length > 0 ? tx`
                        OR (
                            med.parent_type = 'user'
                            AND med.parent_id IN ${tx(updatedUserIds)}
                            AND med.updated_at >= ${lastPulledAtIso}
                        )
                    ` : tx`OR false`}
                )
        `;

        return { timestamp: Number(serverTimeMs), rawSyncData };
    });
};
