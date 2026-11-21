import { DType } from '../../../core/schema';
import { ChannelMetadataSchema, ConversationMemberChatPrefsSchema, ConversationMemberRoleSchema, GroupMetadataSchema, SystemMetadataSchema } from '../../shared/entities';

export const ClientConversationSchema = DType.DbTable(DType.Intersection([
    DType.Object({
        pinnedMessageRootId: DType.Optional(DType.Uuid()),
        pinnedMessageRootIdForMe: DType.Optional(DType.Uuid()),
        muteUntil: DType.Optional(DType.Iso()),

        labelIds: DType.Array(DType.Uuid(), { default: [] }),

        isActive: DType.Boolean({ default: true }),
        joinedAt: DType.Iso(),
        leftAt: DType.Optional(DType.Iso()),
        clearedAt: DType.Optional(DType.Iso()),

        lastReadMessageId: DType.Optional(DType.Uuid()),
        lastReadAt: DType.Optional(DType.Iso()),

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
