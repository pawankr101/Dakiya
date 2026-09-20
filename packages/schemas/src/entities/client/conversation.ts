import { DType } from '../../schema';
import { ConversationMemberRoleSchema } from '../shared';

export const GroupMetadataSchema = DType.Object({
    title: DType.String(),
    description: DType.Optional(DType.String()),
    avatarUrl: DType.Optional(DType.String()),
    createdById: DType.Uuid(),
    isAllowedInvites: DType.Boolean(),
    isAllowedEditInfo: DType.Boolean()
}, { $id: 'GroupMetadataSchema' });

export const ChannelMetadataSchema = DType.Object({
    title: DType.String(),
    description: DType.Optional(DType.String()),
    avatarUrl: DType.Optional(DType.String()),
    createdById: DType.Uuid(),
    handle: DType.Optional(DType.String()),
    isAllowedMessages: DType.Boolean()
}, { $id: 'ChannelMetadataSchema' });

export const SystemMetadataSchema = DType.Object({
    title: DType.String(),
    description: DType.Optional(DType.String()),
    avatarUrl: DType.Optional(DType.String())
}, { $id: 'SystemMetadataSchema' });

export const ConversationMemberChatPrefsSchema = DType.Object({
    theme: DType.Optional(DType.String()),
    notificationSound: DType.Optional(DType.String())
}, { $id: 'ConversationMemberChatPrefsSchema' });

export const ConversationSchema = DType.DbTable(DType.Intersection([
    DType.Object({
        pinnedMessageRootId: DType.Optional(DType.Uuid()),
        pinnedMessageRootIdForMe: DType.Optional(DType.Uuid()),
        mutedUntil: DType.Optional(DType.Epoch()),

        labelIds: DType.Array(DType.Uuid(), { default: [] }),

        isActive: DType.Boolean({ default: true }),
        joinedAt: DType.Epoch(),
        leftAt: DType.Optional(DType.Epoch()),
        clearedAt: DType.Optional(DType.Epoch()),

        lastReadMessageId: DType.Optional(DType.Uuid()),
        lastReadAt: DType.Optional(DType.Epoch()),

        chatPrefs: DType.JsonB(ConversationMemberChatPrefsSchema)
    }),
    DType.Union([
        DType.Object({
            type: DType.Union([
                DType.Literal('direct'),
                DType.Literal('self')
            ])
        }),
        DType.Object({
            type: DType.Literal('group'),
            metadata: DType.JsonB(GroupMetadataSchema)
        }),
        DType.Object({
            type: DType.Literal('channel'),
            metadata: DType.JsonB(ChannelMetadataSchema)
        }),
        DType.Object({
            type: DType.Literal('system'),
            metadata: DType.JsonB(SystemMetadataSchema)
        })
    ])
]), { $id: 'ConversationSchema' });

export const ConversationMemberSchema = DType.DbTable(DType.Object({
    conversationId: DType.Uuid(),
    userId: DType.Uuid(),
    role: ConversationMemberRoleSchema
}), { $id: 'ConversationMemberSchema' });
