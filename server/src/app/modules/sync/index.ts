
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { pullChanges, pushChanges } from "./sync.controller.js";
import { PullChangesSchema, PushChangesSchema } from "./sync.schema.js";

export const SyncRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define Sync routes
    fastify.get('/pull', { schema: PullChangesSchema }, pullChanges);
    fastify.post('/push', { schema: PushChangesSchema }, pushChanges);
}
