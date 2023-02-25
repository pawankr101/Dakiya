import { HttpSec, HttpVer } from "./app/servers/Http"

export const APP_CONFIG = {
    name: 'Dakiya',
    description: 'This is a chat app which provide end to end communication solution.',
    documentation: {
        title: 'ContextCP Hedge Funds',
        description: 'Api description for ContextCP Fund manager App',
        version: '0.0.1',
        basePath: '/api'
    }
}

export const SERVER_CONFIG: {httpVer: HttpVer, httpSec: HttpSec, host: string, port: number, basePath: string} = {
    httpVer: 'http1',
    httpSec: 'http',
    host: process.env['HOST'] || '127.0.0.1',
    port: parseInt(process.env['PORT']) || 4000,
    basePath: '/api',
}