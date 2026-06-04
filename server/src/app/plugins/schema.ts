import type { FastifyInstance, FastifyPluginAsync } from "fastify";
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

export const GlobalSchemas: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {
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
