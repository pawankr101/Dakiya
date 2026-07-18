import type { Static } from "typebox";
import type { Conversation, ConversationMember, Media, Message, MessageEdit, MessageReaction, User } from "../../../entities";
import type { PullChangesQuerySchema, PullChangesSuccessSchema } from "./sync.schema";

export interface PullChangesQuery extends Static<typeof PullChangesQuerySchema> { }
export interface PulledChanges extends Static<typeof PullChangesSuccessSchema> { }
export interface TableChangeSet<T> {
    created: T[];
    updated: T[];
    deleted: T[];
}
export interface DatabaseChanges {
    users?: TableChangeSet<User>;
    conversations?: TableChangeSet<Conversation>;
    conversation_members?: TableChangeSet<ConversationMember>;
    messages?: TableChangeSet<Message>;
    message_reactions?: TableChangeSet<MessageReaction>;
    message_edits?: TableChangeSet<MessageEdit>;
    media?: TableChangeSet<Media>;
}
