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
