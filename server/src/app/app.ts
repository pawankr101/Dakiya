import { HTTP_SERVER } from '../config.js';
import { AppRoutes } from './app.route.js';
import { HttpServer, Request, Response, Server } from './servers/index.js';
import Fastify from 'fastify';
import { test } from './services/threads.js';

export class Application {
    static httpServer = new HttpServer(HTTP_SERVER.httpVersion, HTTP_SERVER.httpSecurity, {allowHTTP1: true});
    static app = Fastify({ serverFactory: (requestHandler) => {
        this.httpServer.addRequestListener(requestHandler);
        return <Server>this.httpServer.server;
    } });

    static async setupApplication() {
        this.app.get('/', async (request, response) => {
            await test();
            response.header('Content-Type', 'application/json').send({done: true});
        })
        // this.app.register(AppRoutes);
    }

    static async start() {
        await this.setupApplication();
        this.app.ready((appError) => {
            if(appError) {
                console.log(`  [S] Api Server Could not get started.`);
                console.log(`      ERROR: ${appError.message}`);
                process.exit();
            } else {
                this.httpServer.start({port: HTTP_SERVER.port, host: HTTP_SERVER.host}, {
                    onError: (error) => {
                        console.log(`  [S] Api Server stopped.`);
                        console.log(`      ERROR: ${error['code'] == 'EADDRINUSE' ? `Port No.: ${HTTP_SERVER.port} is already occupied.` : error.message}`);
                        process.exit();
                    },
                    listener: () => {
                        console.log(`  [S] Server Started:`);
                        console.log(`  [S] Server info:\n      Base Route: ${HTTP_SERVER.httpSecurity}://${HTTP_SERVER.host}:${HTTP_SERVER.port}\n      Process id: ${process.pid}`);
                    }
                });
            } 
        })
    }
}