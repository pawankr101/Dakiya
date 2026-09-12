import { Type } from 'typebox';
import { ConversationMemberRoleSchema, DBTableSchema, EpochTimestampSchema, JsonBSchema, UUIDSchema } from '../utils';

export const GroupMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    createdById: UUIDSchema,
    isAllowedInvites: Type.Boolean(),
    isAllowedEditInfo: Type.Boolean()
}, { $id: 'GroupMetadataSchema' });

export const ChannelMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    createdById: UUIDSchema,
    handle: Type.Optional(Type.String()),
    isAllowedMessages: Type.Boolean()
}, { $id: 'ChannelMetadataSchema' });

export const SystemMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String())
}, { $id: 'SystemMetadataSchema' });

export const ConversationSchema = Type.Intersect([
    DBTableSchema({
        pinnedMessageRootId: Type.Optional(UUIDSchema),
        isDeleted: Type.Boolean({ default: false }),
        deletedAt: Type.Optional(EpochTimestampSchema)
    }),
    Type.Union([
        Type.Object({
            type: Type.Union([
                Type.Literal('direct'),
                Type.Literal('self')
            ])
        }),
        Type.Object({
            type: Type.Literal('group'),
            metadata: JsonBSchema(GroupMetadataSchema)
        }),
        Type.Object({
            type: Type.Literal('channel'),
            metadata: JsonBSchema(ChannelMetadataSchema)
        }),
        Type.Object({
            type: Type.Literal('system'),
            metadata: JsonBSchema(SystemMetadataSchema)
        })
    ])
], { $id: 'ConversationSchema' });


export const ConversationMemberChatPrefsSchema = Type.Object({
    theme: Type.Optional(Type.String()),
    notificationSound: Type.Optional(Type.String())
}, { $id: 'ConversationMemberChatPrefsSchema' });

export const ConversationMemberSchema = DBTableSchema({
    conversationId: UUIDSchema,
    userId: UUIDSchema,
    role: ConversationMemberRoleSchema,
    chatPrefs: JsonBSchema(ConversationMemberChatPrefsSchema),
    muteUntil: Type.Optional(EpochTimestampSchema),
    pinnedMessageRootId: Type.Optional(UUIDSchema),
    labelIds: Type.Array(UUIDSchema, { maxItems: 4, default: [] }),
    isActive: Type.Boolean({ default: true }),
    joinedAt: EpochTimestampSchema,
    leftAt: Type.Optional(EpochTimestampSchema),
    clearedAt: Type.Optional(EpochTimestampSchema),
    lastReadMessageId: Type.Optional(UUIDSchema),
    lastReadAt: Type.Optional(EpochTimestampSchema)
}, { $id: 'ConversationMemberSchema' });
