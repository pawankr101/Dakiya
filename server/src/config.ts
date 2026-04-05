import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { HttpSecurity, HttpVersion } from "./servers/index.js";

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));

export const APP_CONFIG = {
    name: 'Dakiya',
    description: 'This is a chat app which provide end to end communication solution.',
    documentation: {
        title: 'ContextCP Hedge Funds',
        description: 'Api description for ContextCP Fund manager App',
        version: '0.0.1'
    }
}

export const HTTP_SERVER: { httpVersion: HttpVersion, httpSecurity: HttpSecurity, host: string, port: number } = {
    httpVersion: 'http1',
    httpSecurity: 'http',
    host: process.env.DAKIYA_SERVER_HOST,
    port: Number.parseInt(process.env.DAKIYA_SERVER_PORT, 10)
}

export const ENV = {
    WS_NO_BUFFER_UTIL: true,
    WS_NO_UTF_8_VALIDATE: true
}

export const THREADING = {
    workersIndexFile: resolve(ROOT_DIR, 'workers', 'index.js'),
    maxThreadsAllowed: 4, // setting 0 will set the number of threads to the number of CPU cores available
    maxTasksAllowedPerThread: 10,
    maxThreadIdleTimeInMS: 60000,
    maxTryAttempt: 3
}

export const AUTH = {
    jwtSecret: process.env.DAKIYA_JWT_SECRET,
}

export const DB = {
    host: process.env.DAKIYA_DB_HOST,
    port: Number.parseInt(process.env.DAKIYA_DB_PORT, 10),
    database: process.env.DAKIYA_DB_DATABASE,
    user: process.env.DAKIYA_DB_USER,
    password: process.env.DAKIYA_DB_PASSWORD,
    maxPoolSize: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
}

export const CACHE = {
    host: process.env.DAKIYA_CACHE_HOST,
    port: Number.parseInt(process.env.DAKIYA_CACHE_PORT, 10),
    database: process.env.DAKIYA_CACHE_DATABASE,
    user: process.env.DAKIYA_CACHE_USER,
    password: process.env.DAKIYA_CACHE_PASSWORD
}
