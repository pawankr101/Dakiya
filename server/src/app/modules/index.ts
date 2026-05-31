import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AuthRoutes } from "./auth/index.js";
import { SyncRoutes } from "./sync/index.js";

export const ModuleRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    await fastify.register(AuthRoutes, { prefix: '/auth' })
    await fastify.register(SyncRoutes, { prefix: '/sync' });
}
