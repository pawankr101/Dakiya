import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyPluginCallback } from "fastify";

export const DakiyaSwagger: FastifyPluginCallback = (fastify: FastifyInstance, _options, done) => {

    fastify.register(fastifySwagger, {
        openapi: {
            openapi: "3.0.0",
            info: {
                title: "Dakiya API",
                description: "API documentation for Dakiya",
                version: "1.0.0",
            }
        }
    });

    fastify.register(fastifySwaggerUi, {
        routePrefix: "/docs",
        uiConfig: {
            docExpansion: "full",
            deepLinking: false,
        }
    });

    done();
}
