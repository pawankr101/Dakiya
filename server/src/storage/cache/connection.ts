import { Exception } from "@dakiya/shared";
import { Redis } from "ioredis";
import { CACHE } from "../../config.js";

export interface Cache {
    init(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, options?: { expireInSeconds?: number }): Promise<void>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    flush(): Promise<void>;
    close(): Promise<void>;
}

export const Cache: Cache = (() => {
    let connection = null as unknown as Redis, isConnected = false;
    const Cache: Cache = Object.create(null);

    const createConnection = () => {
        return new Promise<void>((resolve, reject) => {
            const { host, port, user: username, password, database } = CACHE;
            connection = new Redis({
                host, port, username, password,
                keyPrefix: `${database}:`,
                enableReadyCheck: true, // Wait until the server is ready before processing commands
                enableOfflineQueue: true, // Queue commands when the connection is not ready
            });
            isConnected = true;
            connection.once('ready', () => {
                console.log('Connected to Redis successfully.');
                resolve();
            });
            connection.once('error', (err) => reject(new Exception(err, { code: 'DAKIYA_REDIS_ERROR' })));
        });
    }

    Cache.init = () => {
        if (!isConnected) return createConnection();
        return Promise.resolve();
    }

    Cache.close = async () => {
        if (isConnected || connection) {
            await connection.end();
            connection = null as unknown as Redis;
            isConnected = false;
            console.log('DB connection closed successfully.');
        }
    };

    return Cache;
})();
