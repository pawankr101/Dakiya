import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { ModuleRoutes } from "./modules";
import { SystemRoutes } from "./system.routes";

export const AppRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define application-specific routes here

    // Moudle Routes
    await fastify.register(ModuleRoutes);

    // System Routes
    await fastify.register(SystemRoutes);
};
