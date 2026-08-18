import { Type } from 'typebox';
import { DBTableSchema, EpochTimestampSchema, UUIDSchema } from '../../schema';

const GroupMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    createdById: UUIDSchema,
    isAllowedInvites: Type.Boolean({ default: false }),
    isAllowedEditInfo: Type.Boolean({ default: true })
});

const ChannelMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String()),
    createdById: UUIDSchema,
    handle: Type.Optional(Type.String()),
    isAllowedMessages: Type.Boolean({ default: true })
});

const SystemMetadataSchema = Type.Object({
    title: Type.String(),
    description: Type.Optional(Type.String()),
    avatarUrl: Type.Optional(Type.String())
});

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
            metadata: GroupMetadataSchema
        }),
        Type.Object({
            type: Type.Literal('channel'),
            metadata: ChannelMetadataSchema
        }),
        Type.Object({
            type: Type.Literal('system'),
            metadata: SystemMetadataSchema
        })
    ])
], { $id: 'ConversationSchema' });

const ConversationMemberRoleSchema = Type.Union([
    Type.Literal('member'),
    Type.Literal('admin'),
    Type.Literal('owner')
], { default: 'member' });

export const ConversationMemberSchema = DBTableSchema({
    conversationId: UUIDSchema,
    userId: UUIDSchema,
    role: ConversationMemberRoleSchema,

    chatPrefs: Type.Object({
        theme: Type.Optional(Type.String()),
        notificationSound: Type.Optional(Type.String())
    }),
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
