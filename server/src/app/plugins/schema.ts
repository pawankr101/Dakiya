import { fastifyPlugin } from "fastify-plugin";
import {
    ConversationMemberSchema,
    ConversationSchema,
    DeliveryQueueItemSchema,
    DeviceSchema,
    MediaSchema,
    MessageEditSchema,
    MessageReactionSchema,
    MessageSchema,
    UserSchema,
    UserSettingsSchema
} from "../../entities/schemas.js";
import type { AppFastify, AppPlugin } from "../types";

export const GlobalSchemas: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {
    // Registering all Global Schemas.
    fastify.addSchema(UserSchema);
    fastify.addSchema(UserSettingsSchema);
    fastify.addSchema(DeviceSchema);
    fastify.addSchema(ConversationSchema);
    fastify.addSchema(ConversationMemberSchema);
    fastify.addSchema(MessageSchema);
    fastify.addSchema(MessageReactionSchema);
    fastify.addSchema(MessageEditSchema);
    fastify.addSchema(MediaSchema);
    fastify.addSchema(DeliveryQueueItemSchema);
});
