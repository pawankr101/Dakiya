import { Type } from 'typebox';
import { EpochTimestampSchema } from '../../schema';

export const ConversationSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    isGroup: Type.Boolean(),
    groupName: Type.Optional(Type.String()),
    groupDp: Type.Optional(Type.String()),
    description: Type.Optional(Type.String()),
    createdBy: Type.Optional(Type.String({ format: 'uuid' })),
    settings: Type.Object({
        allowInvites: Type.Boolean(),
        adminOnlyMessages: Type.Boolean(),
        adminOnlyEditInfo: Type.Boolean()
    }),
    lastMessageAt: Type.Optional(EpochTimestampSchema),
    createdAt: EpochTimestampSchema,
    updatedAt: EpochTimestampSchema
}, { $id: 'ConversationSchema' });

export const ConversationMemberSchema = Type.Object({
    id: Type.String({ format: 'uuid' }),
    conversationId: Type.String({ format: 'uuid' }),
    userId: Type.String({ format: 'uuid' }),
    muteUntil: Type.Number(), // 0 for not muted
    isArchived: Type.Boolean(),
    isPinned: Type.Boolean(),
    lastReadAt: Type.Optional(EpochTimestampSchema),
    isDeleted: Type.Boolean(),
    joinedAt: EpochTimestampSchema,
    hasHistoricalAccess: Type.Boolean(),
    addedBy: Type.Optional(Type.String({ format: 'uuid' })),
    isAdmin: Type.Boolean(),
    hasLeft: Type.Boolean(),

    createdAt: EpochTimestampSchema,
    updatedAt: EpochTimestampSchema
}, { $id: 'ConversationMemberSchema' });
