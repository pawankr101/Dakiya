import type { AppFastify, AppPlugin } from "../../types.js";
import { pullChanges, pushChanges } from "./sync.controller.js";
import { PullChangesSchema, PushChangesSchema } from "./sync.schema.js";

export const SyncRoutes: AppPlugin = async (fastify: AppFastify) => {
    // Define Sync routes
    fastify.get('/pull', { schema: PullChangesSchema }, pullChanges);
    fastify.post('/push', { schema: PushChangesSchema }, pushChanges);
}
