import type { AppFastify, AppPlugin } from "../types.js";
import { AuthRoutes } from "./auth/index.js";
import { SyncRoutes } from "./sync/index.js";

export const ModuleRoutes: AppPlugin = async (fastify: AppFastify) => {

    await fastify.register(AuthRoutes, { prefix: '/auth' })
    await fastify.register(SyncRoutes, { prefix: '/sync' });
}
