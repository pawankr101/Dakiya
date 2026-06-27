import { ModuleRoutes } from "./modules";
import { SystemRoutes } from "./system.routes";
import type { AppFastify, AppPlugin } from "./types";

export const AppRoutes: AppPlugin = async (fastify: AppFastify) => {
    // Define application-specific routes here

    // Moudle Routes
    await fastify.register(ModuleRoutes);

    // System Routes
    await fastify.register(SystemRoutes);
};
