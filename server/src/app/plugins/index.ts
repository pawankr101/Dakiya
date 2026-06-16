import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { ApiResponder } from "./responder";
import { GlobalSchemas } from "./schema";
import { GlobalSecurityPlugin } from "./security";
import { Startup } from "./startup";
import { DakiyaSwagger } from "./swagger";

export const AppPlugin: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {

	// Global Security Plugin (Helmet + CORS)
    await fastify.register(GlobalSecurityPlugin);

    // Global Schemas
    await fastify.register(GlobalSchemas);

    // Dakiya Swagger Plugin
    await fastify.register(DakiyaSwagger);

    // API Responder Plugin (Response Formatter)
    await fastify.register(ApiResponder);

    // Startup Plugin (Initialize NATS, Cache, DB, etc.)
    await fastify.register(Startup);
});
