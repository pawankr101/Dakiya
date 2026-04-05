import type { FastifyInstance, FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import { ModuleRoutes } from "./modules/index.js";

export const AppRoutes: FastifyPluginCallback = (fastify: FastifyInstance, _options, done) => {
    // Define application-specific routes here

    // Moudle Routes
    fastify.register(ModuleRoutes);

    // Health Check Route
    fastify.get('/health', (_request: FastifyRequest, response: FastifyReply) => {
        response.send({ healthy: true })
    });

    // Not Found Handler
    fastify.setNotFoundHandler((_request: FastifyRequest, response: FastifyReply) => {
        response.status(404).send({ error: 'Not Found', code: 404 });
    });

    done();
}
