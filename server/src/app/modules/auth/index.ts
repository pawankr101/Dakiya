import type { AppFastify, AppPlugin } from "../../types.js";
import { login, logout, register } from "./auth.controller.js";


export const AuthRoutes: AppPlugin = async (fastify: AppFastify) => {
    // Define authentication routes
    fastify.post('/register', { schema: {tags: ['Authentication']} }, register);
    fastify.post('/login', { schema: {tags: ['Authentication']} }, login);
    fastify.post('/logout', { schema: {tags: ['Authentication']} }, logout);
}
