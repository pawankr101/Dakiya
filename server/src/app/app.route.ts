import { FastifyPluginCallback } from "fastify";

export const AppRoutes: FastifyPluginCallback = (fastify, options, done) => {
    fastify.get('/app', (request, response) => {
        response.header('Content-Type', 'application/json').send({done: true});
    });
    done();
}
