import { fastifyPlugin } from "fastify-plugin";
import type { AppFastify, AppPlugin } from "../types";

export const GlobalSchemas: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {
    // Registering all Global Schemas.
});
