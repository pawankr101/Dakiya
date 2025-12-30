import type { FastifyPluginCallback } from "fastify";
import { AuthRoutes } from "./auth/index.js";

export const ModuleRoutes: FastifyPluginCallback =(fastify, _options, done) => {

    // Auth Module Routes
    fastify.register(AuthRoutes, { prefix: '/auth' })

    done();
}
