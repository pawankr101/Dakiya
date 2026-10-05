import { Exception } from "@dakiya/utils";
import { fastifyPlugin } from "fastify-plugin";
import { HLC } from "../../config";
import { initializeHlc, Nats, saveLatestHlcToCache, updateHlcOffset } from "../../services";
import { Cache, PG } from "../../storage";
import type { AppFastify, AppPlugin } from "../types";

export const Startup: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {

    // Initialize NATS connection
    await Nats.init();

    // Initialize Cache with NATS
    await Cache.init(Nats);

    // Initialize Postgres connection
    await PG.init();

    // Initialize HLC (Hybrid Logical Clock) system
    await initializeHlc();

    // Set up interval to update HLC offset and save state to cache to ensures that the HLC offset accurate and up-to-date.
    const hlcOffsetUpdateInterval = setInterval(async () => {
        try {
            await updateHlcOffset();
            await saveLatestHlcToCache();
        } catch(error) {
            throw Exception.from(error as Error, { code: 'DAKIYA_HLC_ERROR' });
        }
    }, HLC.offsetUpdateIntervalMS);

    // Closing services gracefully on application shutdown
    fastify.addHook('onClose', async () => {
        // Clearing HLC offset update interval on shutdown.
        clearInterval(hlcOffsetUpdateInterval);

        // Saving latest hlc to cache before shutdown.
        await saveLatestHlcToCache().catch((error) => {
            console.error('Error saving HLC state to cache on shutdown:', error);
        });

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
