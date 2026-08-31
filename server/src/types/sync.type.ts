import type { Conversation, ConversationMember, Device, Message, MessageExclusion, MessageReaction, User, UserRelationship, UserSettings } from './entities.type';

export type SyncEntity = User | UserRelationship | Conversation | ConversationMember | Message | MessageReaction | MessageExclusion;

export interface TableChangeSet<T> {
    created: T[];
    updated: T[];
    deleted: T[];
}

export interface DatabaseTablesChanges {
    users: TableChangeSet<User>;
    user_settings: TableChangeSet<UserSettings>;
    devices: TableChangeSet<Device>;
    user_relationships: TableChangeSet<UserRelationship>;
    conversations: TableChangeSet<Conversation>;
    conversation_members: TableChangeSet<ConversationMember>;
    messages: TableChangeSet<Message>;
    message_reactions: TableChangeSet<MessageReaction>;
    message_exclusions: TableChangeSet<MessageExclusion>;
}

export interface DatabaseTables {
    users: User[];
    user_settings: UserSettings[];
    devices: Device[];
    user_relationships: UserRelationship[];
    conversations: Conversation[];
    conversation_members: ConversationMember[];
    messages: Message[];
    message_reactions: MessageReaction[];
    message_exclusions: MessageExclusion[];
}
