import type { AppFastify, AppPlugin } from "../types";
import { AuthRoutes } from "./auth";
import { SyncRoutes } from "./sync";

export const ModuleRoutes: AppPlugin = async (fastify: AppFastify) => {

    await fastify.register(AuthRoutes, { prefix: '/auth' })
    await fastify.register(SyncRoutes, { prefix: '/sync' });
}
