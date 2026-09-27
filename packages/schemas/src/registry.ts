import { ConversationMemberSchema, ConversationSchema, DeviceSchema, MessageExclusionSchema, MessageReactionSchema, MessageSchema, UserRelationshipSchema, UserSchema, UserSettingsSchema } from './entities';

export const SCHEMA_REGISTRY = {
    UserSchema,
    UserSettingsSchema,
    UserRelationshipSchema,
    DeviceSchema,

    ConversationSchema,
    ConversationMemberSchema,

    MessageSchema,
    MessageExclusionSchema,
    MessageReactionSchema
};

export type SchemaId = keyof typeof SCHEMA_REGISTRY;
export type SchemaRegistry = Record<SchemaId, typeof SCHEMA_REGISTRY[SchemaId]>;
