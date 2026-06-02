import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { API_DOCS } from "config";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import {fastifyPlugin} from "fastify-plugin";

const { routePrefix, title, description, version } = API_DOCS;

export const DakiyaSwagger: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {
    // 1. Registering Swagger (OpenAPI Specification)
    await fastify.register(fastifySwagger, {
        openapi: {
            openapi: "3.0.0",
            info: { title, description, version }
        }
    });

    // 2. Registering Swagger UI (Interactive API Documentation)
    await fastify.register(fastifySwaggerUi, {
        routePrefix,
        uiConfig: {
            docExpansion: "full",
        }
    });
});
