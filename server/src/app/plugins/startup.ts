import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { Nats } from "../../services/nats";
import { Cache, PG } from "../../storage";

export const Startup: FastifyPluginAsync = fastifyPlugin(async (fastify: FastifyInstance) => {

    // Initialize NATS connection
    await Nats.init();

    // Initialize Cache with NATS
    await Cache.init(Nats);

    // Initialize Postgres connection
    await PG.init();

    // Closing services gracefully on application shutdown
    fastify.addHook('onClose', async () => {

        // Closing Postgres connection
        await PG.close().catch((error) => {
            console.error('Error closing Postgres connection:', error);
        });

        // Closing NATS connection
        await Nats.close().catch((error) => {
            console.error('Error closing NATS connection:', error);
        });
    });
});
