import { FastifyPluginCallback } from "fastify";
import { ModuleRoutes } from "./modules/index.js";

export const AppRoutes: FastifyPluginCallback = (fastify, options, done) => {
    // Define application-specific routes here

    // Moudle Routes
    fastify.register(ModuleRoutes)

    // Health Check Route
    fastify.get('/health', (request, response) => {
        response.send({ healthy: true })
    });

    done();
}
