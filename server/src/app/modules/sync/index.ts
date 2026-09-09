import type { AppFastify, AppPlugin } from "../../types";
import { pullChanges, pushChanges } from "./sync.controller";
import { PullChangesSchema, PushChangesSchema } from "./sync.schema";

export const SyncRoutes: AppPlugin = async (fastify: AppFastify) => {
    // Define Sync routes
    fastify.get('/pull', { schema: PullChangesSchema }, pullChanges);
    fastify.post('/push', { schema: PushChangesSchema }, pushChanges);
}
