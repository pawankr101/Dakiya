import { fastifyPlugin } from "fastify-plugin";
import type { AppFastify, AppPlugin } from "../types";

export const GlobalSchemas: AppPlugin = fastifyPlugin(async (_fastify: AppFastify) => {
    // Registering all Global Schemas.
});
