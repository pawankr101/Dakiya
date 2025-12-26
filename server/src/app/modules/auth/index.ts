
import { FastifyInstance } from "fastify";
import { AuthController } from "./auth.controller.js";

export function AuthRoutes(fastify: FastifyInstance, options: any, done: Function) {
    // Define authentication routes
    fastify.post('/register', { schema: {} }, AuthController.register);
    fastify.post('/login', { schema: {} }, AuthController.login);
    fastify.post('/logout', { schema: {} }, AuthController.logout);

    done();
}
