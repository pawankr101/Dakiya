import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { API_DOCS, HTTP_SERVER } from "../../config";

const { routePrefix, title, description, version, externalDocs, license } = API_DOCS;

export const DakiyaSwagger: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {
    // Registering Swagger (OpenAPI Specification)
    await fastify.register(fastifySwagger, {
        stripBasePath: true,
        hideUntagged: true,
        openapi: {
            openapi: "3.0.0",
            info: { title, description, version, license },
            externalDocs,
            tags: [
                { name: 'System', description: 'System related endpoints for health checks and diagnostics' },
                { name: 'Synchronization', description: 'Synchronization endpoints for real-time updates and data consistency' },
                { name: 'Authentication', description: 'Authentication related endpoints for user login, registration, and logout' }
            ],
            servers: [{ url: HTTP_SERVER.rootRoutePrefix }]
        }
    });

    // Registering Swagger UI (Interactive API Documentation)
    await fastify.register(fastifySwaggerUi, {
        routePrefix,
        uiConfig: {
            docExpansion: 'none',
            showExtensions: true,
            showCommonExtensions: true,
            displayRequestDuration: true,
            filter: true
        },
        staticCSP: true
    });
});
