import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {fastifyPlugin} from "fastify-plugin";

export const DakiyaSwagger: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {

    await fastify.register(fastifySwagger, {
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "Dakiya API",
                description: "API documentation for Dakiya",
                version: "1.0.0",
            }
        }
    });

    await fastify.register(fastifySwaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
            docExpansion: "full",
            deepLinking: false,
        }
    });
});
