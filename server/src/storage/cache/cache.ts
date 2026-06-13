import { Exception, Guards } from "@dakiya/shared";
import { jetstream, StorageType } from "@nats-io/jetstream";
import { type KV, Kvm } from "@nats-io/kv";
import type { Nats } from "services/nats.js";
import { CACHE } from "../../config.js";
import type { NatsConnection } from "@nats-io/transport-node";

export interface Cache {

    /**
    * Initializes the cache connection. Must be called before using any other methods.
    * If the connection is already established, it will do nothing.
    * @param nats The NATS client instance to use for cache operations.
    */
    init(nats: Nats): Promise<void>;

    /**
    * Retrieves a value from the cache.
    * @param key The key to retrieve.
    * @returns A promise resolving to the value if found, or null if not found.
    */
    get(key: string): Promise<string | null>;

    /**
    * Sets a value in the cache.
    * @param key The key to set.
    * @param value The value to set.
    * @param maxAge The maximum age of the value in seconds.
    * @returns A promise resolving to true if the value was set successfully, or false otherwise.
    */
    set(key: string, value: string, maxAge?: number): Promise<boolean>;

    /**
    * Checks if a key exists in the cache.
    * @param key The key to check.
    * @returns A promise resolving to true if the key exists, or false otherwise.
    */
    exists(key: string): Promise<boolean>;

    /**
    * Deletes a key from the cache.
    * @param key The key to delete.
    * @returns A promise resolving to true if the key was deleted successfully, or false otherwise.
    */
    del(key: string): Promise<boolean>;

    /**
    * Resets the cache by deleting all keys. Use with caution as this will remove all cached data.
    * @returns A promise resolving to true if the cache was reset successfully, or false otherwise.
    */
    reset(): Promise<boolean>;
}

const createStore = (nc: NatsConnection) => {
    const kvm = new Kvm(jetstream(nc));
    return kvm.create(CACHE.database, {
        history: 1, // Only keep the latest value for a key
        storage: StorageType.File,
        ttl: CACHE.maxTTL * 1000
    });
};

const getKey = async (store: KV, key: string) => {
    try {
        const entry = await store.get(key);
        if (!entry || entry.operation === 'DEL' || entry.operation === 'PURGE') return null;

         //wrapped payloads: [ e: number, v: string ] where e is maxAge in seconds. We need to handle TTL expiry manually since NATS KV doesn't support per-key TTL
        const [e, v] = entry.json<[e: number, v: string]>();

        if(e>0 && (Date.now() - entry.created.getTime()) > (e * 1000)) {  // e == 0 means no expiry
            store.delete(entry.key).catch((err: Error) => {
                console.error(Exception.from(err, { code: 'DAKIYA_CACHE_ERROR' }));
            });
            return null;
        }
        return v ?? null;
    } catch (error) {
        console.error(Exception.from(error as Error, { code: 'DAKIYA_CACHE_ERROR' }));
        return null;
    }
};

const setKey = async (store: KV, key: string, value: string, maxAge: number) => {
    try {
        const e = maxAge <= 0 ? CACHE.maxTTL : Math.min(maxAge, CACHE.maxTTL); // enforce max TTL limit
        await store.put(key, JSON.stringify([e, value])); // wapping value with its maxAge to handle TTL expiry manually since NATS KV doesn't support per-key TTL
        return true;
    } catch (error) {
        console.error(Exception.from(error as Error, { code: 'DAKIYA_CACHE_ERROR' }));
        return false;
    }
};

const deleteKey = async (store: KV, key: string) => {
    try {
        await store.delete(key);
        return true;
    } catch (error) {
        console.error(Exception.from(error as Error, { code: 'DAKIYA_CACHE_ERROR' }));
        return false;
    }
};

export const Cache: Cache = (() => {
    let nats: Nats;
    let kvStore: KV | undefined;

    const Cache: Cache = Object.create(null);

    const buildStore = async (n: Nats) => {
        if(!n.isConnected()) throw new Exception('NATS client is not connected. Please establish a connection before initializing cache.', { code: 'DAKIYA_CACHE_ERROR' });
        try {
            const kv = await createStore(n.nc);
            kvStore = kv; nats = n;
        } catch (error) {
            throw new Exception('Failed to create KV store for cache.', { cause: error as Error, code: 'DAKIYA_CACHE_ERROR' });
        }
    }

    Cache.init = (() => {
        let initPromise: Promise<void> | undefined;
        return (n: Nats) => {
            if(!initPromise) {
                initPromise = buildStore(n).finally(() => {
                    initPromise = undefined;
                });
            }
            return initPromise;
        };
    })();

    Cache.get = async (key: string) => {
        if(kvStore && nats.isConnected()) return getKey(kvStore, key);
        throw new Exception('NATS Disconnected or KV store is not established', { code: 'DAKIYA_CACHE_ERROR' });
    }

    Cache.set = async (key: string, value: string, maxAge: number = 0) => {
        if(kvStore && nats.isConnected()) {
            if (Guards.isString(key) && Guards.isString(value)) return setKey(kvStore, key, value, maxAge);
            throw new Exception('Invalid key or value. Both must be strings.', { code: 'DAKIYA_CACHE_ERROR' });
        }
        throw new Exception('NATS Disconnected or KV store is not established', { code: 'DAKIYA_CACHE_ERROR' });
    }

    Cache.exists = async (key: string) => {
        const val = await Cache.get(key);
        return val !== null;
    }

    Cache.del = async (key: string) => {
        if (kvStore && nats.isConnected()) return deleteKey(kvStore, key);
        throw new Exception('NATS Disconnected or KV store is not established', { code: 'DAKIYA_CACHE_ERROR' });
    }

    Cache.reset = async () => {
        if (kvStore && nats.isConnected()) {
            try {
                await kvStore.destroy();
                kvStore = undefined;
                kvStore = await createStore(nats.nc);
                return true;
            } catch (error) {
                console.error(Exception.from(error as Error, { code: 'DAKIYA_CACHE_ERROR' }));
                return false;
            }
        }
        throw new Exception('NATS Disconnected or KV store is not established', { code: 'DAKIYA_CACHE_ERROR' });
    }

    return Cache;
})();
