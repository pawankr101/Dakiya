import { Chrono, Exception, getShortId, Hlc } from "@dakiya/utils";
import { HLC } from "../config";
import { Cache, PG } from "../storage";

/**
 * #### Initializes HLC
 * Initializes the Hybrid Logical Clock (HLC) system by fetching the current PostgreSQL time, calculating the timestamp offset, and setting up the HLC with the last known state from the cache.
 * If no previous state is found, a new client ID is generated. This function ensures that the HLC is properly initialized for accurate timestamp generation in distributed systems.
 * @throws {Exception} Throws an exception with code 'DAKIYA_HLC_ERROR' if there is an error during initialization.
 */
export const initializeHlc = async () => {
    try {
        const pgTime = await PG.now();
        const timestampOffset = pgTime - Chrono.now();
        let clientId: string, lastTimestamp: number = 0, lastCounter: number = 0;

        const lastHlc = await Cache.get(HLC.cacheKey);
        if(lastHlc) {
            const lh = Hlc.parseHlcString(lastHlc);
            clientId = lh.clientId;
            lastTimestamp = lh.timestamp;
            lastCounter = lh.counter;
        }
        clientId ??= getShortId();

        Hlc.init(clientId, HLC.maxOffsetToleranceMS, { timestampOffset, lastTimestamp, lastCounter })
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_HLC_ERROR' });
    }
}

/**
 * #### Updates HLC Offset
 * Updates the timestamp offset for the Hybrid Logical Clock (HLC) by fetching the current PostgreSQL time and calculating the difference from the local system time.
 * This ensures that the HLC remains synchronized with the database time, which is crucial for maintaining consistency in distributed systems.
 * @throws {Exception} Throws an exception with code 'DAKIYA_HLC_ERROR' if there is an error during the update process.
 */
export const updateHlcOffset = async () => {
    try {
        const pgTime = await PG.now();
        const offset = pgTime - Chrono.now();
        Hlc.setTimestampOffset(offset);
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_HLC_ERROR' });
    }
}

/**
 * #### Saves Latest HLC to Cache
 * Generates a new HLC and saves it to the cache for future use.
 * @throws {Exception} Throws an exception with code 'DAKIYA_HLC_ERROR' if there is an error during the save process.
 */
export const saveLatestHlcToCache = async () => {
    try {
        const hlc = Hlc.generate().toString();
        await Cache.set(HLC.cacheKey, hlc);
    } catch (error) {
        throw Exception.from(error as Error, { code: 'DAKIYA_HLC_ERROR' });
    }
}
