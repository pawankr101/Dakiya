
import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller.js";

export function AuthRoutes(fastify: FastifyInstance, options: any, done: Function) {
    // Define authentication routes
    fastify.post('/auth/register', { schema: {} }, AuthController.register);
    fastify.post('/auth/login', { schema: {} }, AuthController.login);
    fastify.post('/auth/logout', { schema: {} }, AuthController.logout);

    done();
}
