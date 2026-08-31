import { fastifyPlugin } from "fastify-plugin";
import {
    ConversationMemberSchema,
    ConversationSchema,
    DeviceSchema,
    MessageExclusionSchema,
    MessageReactionSchema,
    MessageSchema,
    UserRelationshipSchema,
    UserSchema,
    UserSettingsSchema
} from "../../schemas";
import type { AppFastify, AppPlugin } from "../types";

export const GlobalSchemas: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {
    // Registering all Global Schemas.
    fastify.addSchema(UserSchema);
    fastify.addSchema(UserSettingsSchema);
    fastify.addSchema(DeviceSchema);
    fastify.addSchema(UserRelationshipSchema);

    fastify.addSchema(ConversationSchema);
    fastify.addSchema(ConversationMemberSchema);

    fastify.addSchema(MessageSchema);
    fastify.addSchema(MessageExclusionSchema);
    fastify.addSchema(MessageReactionSchema);
});
