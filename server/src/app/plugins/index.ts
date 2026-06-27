import { fastifyPlugin } from "fastify-plugin";
import type { AppFastify, AppPlugin } from "../types";
import { ApiResponder } from "./responder";
import { GlobalSchemas } from "./schema";
import { GlobalSecurityPlugin } from "./security";
import { Startup } from "./startup";
import { DakiyaSwagger } from "./swagger";

export const AppPlugins: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {

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
