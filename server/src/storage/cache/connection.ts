import { Exception, Guards } from "@dakiya/shared";
import { connect, type NatsConnection, type KV, StorageType } from "nats";
import { CACHE } from "../../config.js";

export interface Cache {
    /**
    * Initializes the cache connection. Must be called before using any other methods.
    * If the connection is already established, it will do nothing.
    */
    init(): Promise<void>;

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

    /**
    * Closes the cache connection.
    * @returns A promise resolving when the connection is closed.
    */
    close(): Promise<void>;
}

function connectServer() {
    return connect({
        name: 'dakiya-nats',
        servers: `nats://${CACHE.host}:${CACHE.port}`,
        user: CACHE.user,
        pass: CACHE.password,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
        pingInterval: 10000,
        maxPingOut: 3,
        timeout: 5000
    });
}

function buildStore(connection: NatsConnection): Promise<KV> {
    const jetstream = connection.jetstream();
    return jetstream.views.kv(CACHE.database, {
        history: 1, // Only keep the latest value for a key
        storage: StorageType.File,
        ttl: CACHE.maxTTL * 1000, // Convert seconds to milliseconds
    });
}

export const Cache: Cache = (() => {
    let connection: NatsConnection | undefined;
    let kvStore: KV | undefined;

    const CacheObj: Cache = Object.create(null);

    const createConnection = async () => {
        let tempConnection: NatsConnection | undefined = undefined;
        try {
            tempConnection = await connectServer();
            const kv = await buildStore(tempConnection);
            connection = tempConnection; kvStore = kv;
            connection.closed().then((error) => {
                if (error) console.error('[NATS] closed with error', error);
                else console.info('[NATS] connection closed');
            }).finally(() => {
                if (connection === tempConnection) {
                    connection = undefined; kvStore = undefined;
                }
            });
        } catch (error) {
            if (tempConnection && !tempConnection.isClosed()) {
                try {
                    await tempConnection.close();
                } catch (err) {
                    throw Exception.from(err as Error, { cause: error as Error, code: 'DAKIYA_NATS_ERROR' });
                }
            }
            throw Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' });
        }
    };

    CacheObj.init = (() => {
        let initPromise: Promise<void> | undefined;
        return () => {
            if(!initPromise) {
                if (!connection || connection.isClosed()) {
                    initPromise = createConnection().finally(() => {
                        initPromise = undefined;
                    });
                } else return Promise.resolve();
            }
            return initPromise;
        };
    })();

    CacheObj.get = async (key: string) => {
        const conn = connection, store = kvStore;
        if(conn && store && !conn.isClosed()) {
            try {
                const entry = await store.get(key);
                if (!entry || entry.operation === 'DEL' || entry.operation === 'PURGE') return null;

                 //wrapped payloads: [ e: number, v: string ] where e is maxAge in seconds. We need to handle TTL expiry manually since NATS KV doesn't support per-key TTL
                const [e, v] = entry.json<[e: number, v: string]>();

                if(e>0 && (Date.now() - entry.created.getTime()) > (e * 1000)) {  // e == 0 means no expiry
                    store.delete(entry.key).catch((err: Error) => {
                        console.error(Exception.from(err, { code: 'DAKIYA_NATS_ERROR' }));
                    });
                    return null;
                }
                return v ?? null;
            } catch (error) {
                console.error(Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' }));
                return null;
            }
        }
        throw new Exception('NATS connection is not established', { code: 'DAKIYA_NATS_ERROR' });
    }

    CacheObj.set = async (key: string, value: string, maxAge: number = 0) => {
        const conn = connection, store = kvStore;
        if(conn && store && !conn.isClosed()) {
            if (Guards.isString(key) && Guards.isString(value)) {
                try {
                    const e = maxAge <= 0 ? CACHE.maxTTL : Math.min(maxAge, CACHE.maxTTL); // enforce max TTL limit
                    await store.put(key, JSON.stringify([e, value])); // wapping value with its maxAge to handle TTL expiry manually since NATS KV doesn't support per-key TTL
                    return true;
                } catch (error) {
                    console.error(Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' }));
                    return false;
                }
            }
            throw new Exception('Invalid key or value. Both must be strings.', { code: 'DAKIYA_NATS_ERROR' });
        }
        throw new Exception('NATS connection is not established', { code: 'DAKIYA_NATS_ERROR' });
    }

    CacheObj.exists = async (key: string) => {
        const val = await CacheObj.get(key);
        return val !== null;
    }

    CacheObj.del = async (key: string) => {
        const conn = connection, store = kvStore;
        if (conn && store && !conn.isClosed()) {
            try {
                await store.delete(key);
                return true;
            } catch (error) {
                console.error(Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' }));
                return false;
            }
        }
        throw new Exception('NATS connection is not established', { code: 'DAKIYA_NATS_ERROR' });
    }

    CacheObj.reset = async () => {
        const conn = connection, store = kvStore;
        if (conn && store && !conn.isClosed()) {
            try {
                await store.destroy();
                kvStore = undefined;
                kvStore = await buildStore(conn);
                return true;
            } catch (error) {
                console.error(Exception.from(error as Error, { code: 'DAKIYA_NATS_ERROR' }));
                return false;
            }
        }
        throw new Exception('NATS connection is not established', { code: 'DAKIYA_NATS_ERROR' });
    }

    CacheObj.close = async () => {
        const conn = connection;
        if (conn && !conn.isClosed()) {
            return conn.close();
        }
    };

    return CacheObj;
})();
