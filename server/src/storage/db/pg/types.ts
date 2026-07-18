import type { Conversation, ConversationMember, DeliveryQueueItem, Device, Media, Message, MessageEdit, MessageReaction, User, UserSettings } from '../../../entities/models';

export type { Conversation, ConversationMember, DeliveryQueueItem, Device, Media, Message, MessageEdit, MessageReaction, User, UserSettings };
export type SyncEntity = User | Conversation | ConversationMember | Message | MessageReaction | MessageEdit | Media;
