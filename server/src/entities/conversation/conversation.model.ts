import type { Static } from "typebox";
import type { ConversationMemberSchema, ConversationSchema } from "./conversation.schema"

export type Conversation = Static<typeof ConversationSchema>;
export interface ConversationMember extends Static<typeof ConversationMemberSchema> { }
