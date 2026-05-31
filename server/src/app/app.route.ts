import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { ModuleRoutes } from "./modules/index.js";

export const AppRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define application-specific routes here

    // Moudle Routes
    await fastify.register(ModuleRoutes);

    // Health Check Route
    fastify.get('/health', (_request: FastifyRequest, response: FastifyReply) => {
        response.send({ healthy: true })
    });

    // Not Found Handler
    fastify.setNotFoundHandler((_request: FastifyRequest, response: FastifyReply) => {
        response.status(404).send({ error: 'Not Found', code: 404 });
    });
}
