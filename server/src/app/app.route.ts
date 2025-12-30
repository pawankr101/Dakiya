import type { FastifyPluginCallback } from "fastify";
import { ModuleRoutes } from "./modules/index.js";

export const AppRoutes: FastifyPluginCallback = (fastify, _options, done) => {
    // Define application-specific routes here

    // Moudle Routes
    fastify.register(ModuleRoutes)

    // Health Check Route
    fastify.get('/health', (_request, response) => {
        response.send({ healthy: true })
    });

    done();
}
