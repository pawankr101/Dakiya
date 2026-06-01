import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";

export const GlobalSecurityPlugin: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {
    // 1. Registering Helmet (Security Headers)
    await fastify.register(helmet, {
        global: true,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "validator.swagger.io"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    });

    // 2. Registering CORS (Access Headers)
    await fastify.register(cors, {
        origin: [ '*' ],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],
        credentials: true,
    });
});
