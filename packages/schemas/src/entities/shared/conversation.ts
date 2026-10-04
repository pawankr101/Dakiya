import { DType } from '../../schema';

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
