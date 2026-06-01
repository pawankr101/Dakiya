import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { ModuleRoutes } from "./modules/index.js";
import { SystemRoutes } from "./system.routes.js";

export const AppRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define application-specific routes here

    // Moudle Routes
    await fastify.register(ModuleRoutes);

    // System Routes
    await fastify.register(SystemRoutes);
};
