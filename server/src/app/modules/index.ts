import { FastifyInstance } from "fastify";
import { AuthRoutes } from "./auth/index.js";


export function ModuleRoutes(fastify: FastifyInstance, options: any, done: Function) {
    // Define module-specific routes here

    // Auth Module Routes
    fastify.register(AuthRoutes, { prefix: '/auth' })

    done();
}
