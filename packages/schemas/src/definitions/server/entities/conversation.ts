import { DType } from '../../../core/schema';
import { ChannelMetadataSchema, ConversationMemberChatPrefsSchema, ConversationMemberRoleSchema, GroupMetadataSchema, SystemMetadataSchema } from '../../shared/entities';

export const ConversationSchema = DType.DbTable(DType.Intersection([
    DType.Object({
        pinnedMessageRootId: DType.Optional(DType.Uuid()),
        isDeleted: DType.Boolean({ default: false }),
        deletedAt: DType.Optional(DType.Epoch())
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
    role: ConversationMemberRoleSchema,
    chatPrefs: DType.JsonB(ConversationMemberChatPrefsSchema),
    muteUntil: DType.Optional(DType.Iso()),
    pinnedMessageRootId: DType.Optional(DType.Uuid()),
    labelIds: DType.Array(DType.Uuid(), { maxItems: 4, default: [] }),
    isActive: DType.Boolean({ default: true }),
    joinedAt: DType.Iso(),
    leftAt: DType.Optional(DType.Iso()),
    clearedAt: DType.Optional(DType.Iso()),
    lastReadMessageId: DType.Optional(DType.Uuid()),
    lastReadAt: DType.Optional(DType.Iso())
}), { $id: 'ConversationMemberSchema' });
