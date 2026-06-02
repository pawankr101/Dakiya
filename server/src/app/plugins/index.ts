import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { ApiResponder } from "./responder";
import { GlobalSecurityPlugin } from "./security";
import { DakiyaSwagger } from "./swagger";

export const AppPlugin: FastifyPluginAsync = fastifyPlugin	(async (fastify: FastifyInstance) => {
	// Register all Application Level Plugins here.

	// 1. Global Security Plugin (Helmet + CORS)
	await fastify.register(GlobalSecurityPlugin);
	// 2. Dakiya Swagger Plugin
    await fastify.register(DakiyaSwagger);
    // 3. API Responder Plugin (Response Formatter)
    await fastify.register(ApiResponder);
});
