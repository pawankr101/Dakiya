import type { Static } from "typebox";
import type { ConversationMemberSchema, ConversationSchema, DeviceSchema, MessageExclusionSchema, MessageReactionSchema, MessageSchema, UserRelationshipSchema, UserSchema, UserSettingsSchema } from "../schemas";

export interface User extends Static<typeof UserSchema> { }
export interface UserSettings extends Static<typeof UserSettingsSchema> { }
export interface Device extends Static<typeof DeviceSchema> { }
export interface UserRelationship extends Static<typeof UserRelationshipSchema> { }

export type Conversation = Static<typeof ConversationSchema>;
export interface ConversationMember extends Static<typeof ConversationMemberSchema> { }

export type Message = Static<typeof MessageSchema>;
export interface MessageExclusion extends Static<typeof MessageExclusionSchema> { }
export interface MessageReaction extends Static<typeof MessageReactionSchema> { }
