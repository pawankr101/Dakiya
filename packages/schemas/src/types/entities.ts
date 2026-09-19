import type { ConversationMemberSchema, ConversationSchema, DeviceSchema, MessageExclusionSchema, MessageReactionSchema, MessageSchema, UserRelationshipSchema, UserSchema, UserSettingsSchema } from '../entities';
import type { DTypeOf } from '../schema';

export interface User extends DTypeOf<typeof UserSchema> { }
export interface UserSettings extends DTypeOf<typeof UserSettingsSchema> { }
export interface Device extends DTypeOf<typeof DeviceSchema> { }
export interface UserRelationship extends DTypeOf<typeof UserRelationshipSchema> { }

export type Conversation = DTypeOf<typeof ConversationSchema>;
export interface ConversationMember extends DTypeOf<typeof ConversationMemberSchema> { }

export type Message = DTypeOf<typeof MessageSchema>;
export interface MessageExclusion extends DTypeOf<typeof MessageExclusionSchema> { }
export interface MessageReaction extends DTypeOf<typeof MessageReactionSchema> { }
