import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { ApiResponder } from "./responder";
import { GlobalSchemas } from "./schema";
import { GlobalSecurityPlugin } from "./security";
import { DakiyaSwagger } from "./swagger";

export const AppPlugin: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {
	// Register all Application Level Plugins here.

	// Global Schemas
	await fastify.register(GlobalSchemas);
	// Global Security Plugin (Helmet + CORS)
	await fastify.register(GlobalSecurityPlugin);
    // API Responder Plugin (Response Formatter)
    await fastify.register(ApiResponder);
    // Dakiya Swagger Plugin
    await fastify.register(DakiyaSwagger);
});
