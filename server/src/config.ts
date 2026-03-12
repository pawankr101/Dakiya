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
    host: process.env.HOST || '127.0.0.1',
    port: parseInt(process.env.PORT, 10) || 4500
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
    jwtSecret: 'SecretKeyForJWT',
}

export const DB = {
    host: '127.0.0.1',
    port: 5432,
    database: 'dakiya',
    user: 'dakiyapg',
    password: 'aDZRI9ccoxQAFn2G',
    maxPoolSize: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
}
