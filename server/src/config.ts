import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));

export const ENV = {
    WS_NO_BUFFER_UTIL: true,
    WS_NO_UTF_8_VALIDATE: true
}

export const APP_CONFIG = {
    name: 'Dakiya',
    description: 'This is a chat app which provide end to end communication solution.',
    timezone: 'UTC'
}

export const API_DOCS = {
    routePrefix: '/docs',
    title: 'Dakiya API Documentation',
    description: 'API documentation for Dakiya',
    version: '1.0.0',
    externalDocs: {
        url: 'https://github.com/pawankr101/Dakiya/blob/master/README.md',
        description: 'Dakiya readme Docs'
    },
    license: {
        name: 'MIT License',
        url: 'https://github.com/pawankr101/Dakiya/blob/master/LICENSE.md'
    }
}

export const HTTP_SERVER = {
    httpVersion: 'http1' as const,
    httpSecurity: 'http' as const,
    host: process.env.DAKIYA_SERVER_HOST,
    port: Number.parseInt(process.env.DAKIYA_SERVER_PORT, 10),
    rootRoutePrefix: '/api/v1'
};

export const THREADING = {
    workersIndexFile: resolve(ROOT_DIR, 'workers', 'index.js'),
    maxThreadsAllowed: 4, // setting 0 will set the number of threads to the number of CPU cores available
    maxThreadIdleTimeInMS: 60000,
    maxTryAttempt: 3
}

export const AUTH = {
    jwtSecret: process.env.DAKIYA_JWT_SECRET
}

export const DB = {
    host: process.env.DAKIYA_DB_HOST,
    port: Number.parseInt(process.env.DAKIYA_DB_PORT, 10),
    database: process.env.DAKIYA_DB_DATABASE,
    user: process.env.DAKIYA_DB_USER,
    password: process.env.DAKIYA_DB_PASSWORD,
    maxPoolSize: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    syncBoundryInDays: 30
}

export const NATS = {
    connectionName:'dakiya-nats',
    host: process.env.DAKIYA_NATS_HOST,
    port: Number.parseInt(process.env.DAKIYA_NATS_PORT, 10),
    user: process.env.DAKIYA_NATS_USER,
    password: process.env.DAKIYA_NATS_PASSWORD
}

export const CACHE = {
    database: process.env.DAKIYA_CACHE_DATABASE,
    maxTTL: 24 * 60 * 60 // 24 hours in seconds
}
