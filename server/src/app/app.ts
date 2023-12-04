import { SERVER_CONFIG } from '../config.js';
import { AppRoutes } from './app.route.js';
import { HttpServer, Server } from './servers/index.js';
import Fastify from 'fastify';

export class Application {
    static httpServer = new HttpServer(SERVER_CONFIG.httpVersion, SERVER_CONFIG.httpSecurity, {allowHTTP1: true});
    static app = Fastify({ serverFactory: (requestHandler) => {
        this.httpServer.addRequestListener(requestHandler);
        return <Server>this.httpServer.server;
    } });

    static async setupApplication() {
        this.app.register(AppRoutes);
    }

    static async start() {
        await this.setupApplication();
        this.app.ready((appError) => {
            if(appError) {
                console.log(`  [S] Api Server Could not get started.`);
                console.log(`      ERROR: ${appError.message}`);
                process.exit();
            } else {
                this.httpServer.start({port: SERVER_CONFIG.port, host: SERVER_CONFIG.host}, {
                    onError: (error) => {
                        console.log(`  [S] Api Server stopped.`);
                        console.log(`      ERROR: ${error['code'] == 'EADDRINUSE' ? `Port No.: ${SERVER_CONFIG.port} is already occupied.` : error.message}`);
                        process.exit();
                    },
                    listener: () => {
                        console.log(`  [S] Server Started:`);
                        console.log(`  [S] Server info:\n      Base Route: ${SERVER_CONFIG.httpSecurity}://${SERVER_CONFIG.host}:${SERVER_CONFIG.port}\n      Process id: ${process.pid}`);
                    }
                });
            } 
        })
    }
}