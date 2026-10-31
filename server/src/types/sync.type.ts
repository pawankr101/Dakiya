import type { Conversation, ConversationMember, Device, Message, MessageExclusion, MessageReaction, User, UserRelationship, UserSettings } from '../schemas';

export type SyncEntity = User | UserRelationship | Conversation | ConversationMember | Message | MessageReaction | MessageExclusion;

export interface DatabaseTables {
    users?: User[];
    user_settings?: UserSettings[];
    devices?: Device[];
    user_relationships?: UserRelationship[];
    conversations?: Conversation[];
    conversation_members?: ConversationMember[];
    messages?: Message[];
    message_reactions?: MessageReaction[];
}
