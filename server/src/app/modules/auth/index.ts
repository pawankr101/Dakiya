
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { login, logout, register } from "./auth.controller.js";

export const AuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Define authentication routes
    fastify.post('/register', { schema: {tags: ['Authentication']} }, register);
    fastify.post('/login', { schema: {tags: ['Authentication']} }, login);
    fastify.post('/logout', { schema: {tags: ['Authentication']} }, logout);
}
