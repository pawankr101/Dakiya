import { fileURLToPath } from "url";
import { resolve } from "path";
import { HttpSecurity, HttpVersion } from "./app/servers/index.js";
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

export const HTTP_SERVER: {httpVersion: HttpVersion, httpSecurity: HttpSecurity, host: string, port: number} = {
    httpVersion: 'http1',
    httpSecurity: 'http',
    host: process.env['HOST'] || '127.0.0.1',
    port: parseInt(process.env['PORT']) || 4000
}

export const ENV = {
    WS_NO_BUFFER_UTIL: true,
    WS_NO_UTF_8_VALIDATE: true
}

export const THREADING = {
    workersIndexFile: resolve(ROOT_DIR, 'workers', 'index.js'),
    maxThreadsAllowed: 4,
    maxTasksAllowedPerThread: 5,
    maxThreadIdleTimeInMS: 600000
}
