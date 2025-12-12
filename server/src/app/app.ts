import { HTTP_SERVER } from '../config.js';
import { Exception } from '../exceptions/exception.js';
import { AppRoutes } from './app.route.js';
import { HttpServer, Request, Response, Server } from './servers/index.js';
import Fastify from 'fastify';

export class Application {
    static #httpServer = HttpServer.build(HTTP_SERVER.httpVersion, HTTP_SERVER.httpSecurity, {allowHTTP1: true});
    static #app = Fastify({
        serverFactory: (requestHandler) => <Server>this.#httpServer.addRequestListener(requestHandler)
    });

    static #setupAppLevelErrorHandling() {
        this.#app.setErrorHandler((error, request, response) => {
            const err = error instanceof Exception ? error : new Exception('Internal Server Error', { cause: error, code: 500 });
            response.status(err.code).send({ error: err.message, code: err.code });
            
        });
    }

    static async #setupApplication() {
        this.#setupAppLevelErrorHandling();
        this.#app.register(AppRoutes);
    }

    /**
     * Initializes and starts the application server.
     *
     * This method orchestrates the entire server startup sequence. It first
     * sets up the core application logic via `#setupApplication`. It then waits
     * for the Fastify instance to be ready.
     *
     * If an error occurs during the application setup, it logs the error and
     * terminates the process.
     *
     * Upon successful setup, it starts the HTTP server on the configured host and
     * port. It handles server startup errors, such as a port being in use (`EADDRINUSE`),
     * logs a descriptive message, and exits. On a successful start, it logs the
     * server's base URL and process ID to the console.
     *
     * @returns `Promise<void>` 
     * 
     * @remarks
     * A promise that resolves when the startup process is initiated.
     * Note that the process will exit on failure or continue running on success,
     * managed by internal callbacks.
     */
    static async start() {
        await this.#setupApplication();
        this.#app.ready((appError) => {
            if(appError) {
                console.log(`  [S] Api Server Could not get started.`);
                console.log(`      ERROR: ${appError.message}`);
                process.exit();
            } else {
                this.#httpServer.start({
                    host: HTTP_SERVER.host,
                    port: HTTP_SERVER.port
                }, {
                    onError: (error) => {
                        console.log(`  [S] Api Server stopped.`);
                        console.log(`      ERROR: ${error.message}`);
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
