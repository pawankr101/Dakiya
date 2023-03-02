import { SERVER_CONFIG } from '../config';
import express, {Express} from 'express';
import {resolve} from 'path';
import { Http, RequestListener } from './servers/http';
declare global {
    var APP: Express
}
global.APP = express()

// const createServerOption: ServerOptions<'http2', 'https'> = {
//     cert: readFileSync(resolve(__dirname, '..', '..', '..', 'keys', 'localhost.cert')),
//     key: readFileSync(resolve(__dirname, '..', '..', '..', 'keys', 'localhost.key')),
//     allowHTTP1: true
// }

export class App {
    httpServer = new Http(SERVER_CONFIG.httpVer, SERVER_CONFIG.httpSec);
    start() {
        this.httpServer.addRequestListener(APP as RequestListener<'http1'>)
        .start({port: SERVER_CONFIG.port, host: SERVER_CONFIG.host}, {
            onError: (error)=>{
                console.log(`  [S] Api Server stopped.`);
                console.log(`      ERROR: ${error['code'] == 'EADDRINUSE' ? `Port No.: ${SERVER_CONFIG.port} is already occupied.` : error.message}`);
                process.exit();
            },
            listener: () => {
                console.log(`  [S] Server Started:`);
                console.log(`  [S] Server info:\n      Base Route: ${SERVER_CONFIG.httpSec}://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}${SERVER_CONFIG.basePath}\n      Process id: ${process.pid}`);
            }
        });
    }
}