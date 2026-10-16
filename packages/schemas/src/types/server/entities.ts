import type { DTypeOf } from '../../core/schema';
import type { ConversationMemberSchema, ConversationSchema, DeviceSchema, UserRelationshipSchema, UserSchema, UserSettingsSchema } from '../../definitions/server/entities';

export interface User extends DTypeOf<typeof UserSchema> { }
export interface UserSettings extends DTypeOf<typeof UserSettingsSchema> { }
export interface Device extends DTypeOf<typeof DeviceSchema> { }
export interface UserRelationship extends DTypeOf<typeof UserRelationshipSchema> { }

export type Conversation = DTypeOf<typeof ConversationSchema>;
export interface ConversationMember extends DTypeOf<typeof ConversationMemberSchema> { }
