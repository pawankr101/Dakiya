
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { AuthController } from "./auth.controller.js";

export const AuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define authentication routes
    fastify.post('/register', { schema: {tags: ['Auth']} }, AuthController.register);
    fastify.post('/login', { schema: {tags: ['Auth']} }, AuthController.login);
    fastify.post('/logout', { schema: {tags: ['Auth']} }, AuthController.logout);
}
