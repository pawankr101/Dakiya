import { DType } from '../../schema';
import { ChannelMetadataSchema, ConversationMemberChatPrefsSchema, ConversationMemberRoleSchema, GroupMetadataSchema, SystemMetadataSchema } from '../shared';

export const ClientConversationSchema = DType.DbTable(DType.Intersection([
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
]), { $id: 'ClientConversationSchema' });

export const ClientConversationMemberSchema = DType.DbTable(DType.Object({
    conversationId: DType.Uuid(),
    userId: DType.Uuid(),
    role: ConversationMemberRoleSchema
}), { $id: 'ClientConversationMemberSchema' });
