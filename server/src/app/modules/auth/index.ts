
import type { FastifyPluginCallback } from "fastify";
import { AuthController } from "./auth.controller.js";

export const AuthRoutes: FastifyPluginCallback = (fastify, _options, done) => {
    // Define authentication routes
    fastify.post('/register', { schema: {} }, AuthController.register);
    fastify.post('/login', { schema: {} }, AuthController.login);
    fastify.post('/logout', { schema: {} }, AuthController.logout);

    done();
}
