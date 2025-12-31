import { HTTP_SERVER } from '../config.js';
import { Exception } from '../exceptions/exception.js';
import { AppRoutes } from './app.route.js';
import { HttpServer, Request, Response, Server } from '../servers/index.js';
import Fastify from 'fastify';
import { MongoDB } from '../storage/index.js';

export class Application {
    static #httpServer = HttpServer.build(HTTP_SERVER.httpVersion, HTTP_SERVER.httpSecurity, {allowHTTP1: true});
    static #app = Fastify({
        serverFactory: (requestHandler) => <Server>this.#httpServer.addRequestListener(requestHandler)
    });

    static async #setupDatabases() {
        await MongoDB.getConnection().connect();
    }

    static #setupAppLevelErrorHandling() {
        this.#app.setErrorHandler((error, request, response) => {
            const err = error instanceof Exception ? error : new Exception('Internal Server Error', { cause: error as Error, code: 500 });
            response.status(err.code).send({ error: err.message, code: err.code });

        });
    }

    static async #setupApplication() {
        try {
            this.#setupAppLevelErrorHandling();
            await this.#setupDatabases();
            this.#app.register(AppRoutes);
        } catch (error) {
            throw new Exception("Application setup failed.", { code: 500, cause: error as Error });
        }
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
        try {
            await this.#setupApplication();
            this.#app.ready((appError) => {
                if (appError) {
                    console.log(`\u001b[31m  [S] Api Server Could not get started.`);
                    console.log(`\u001b[31m      ERROR: ${appError.message}`);
                    process.exit();
                } else {
                    this.#httpServer.start({
                        host: HTTP_SERVER.host,
                        port: HTTP_SERVER.port
                    }, {
                        onError: (error) => {
                            console.log(`\u001b[33m  [S] Api Server stopped.`);
                            console.log(`\u001b[33m      ERROR: ${error.message}`);
                            process.exit();
                        },
                        listener: () => {
                            console.log(`\u001b[34m  [S] Server Started:`);
                            console.log(`\u001b[34m  [S] Server info:\n\u001b[34m      Base Route: ${HTTP_SERVER.httpSecurity}://${HTTP_SERVER.host}:${HTTP_SERVER.port}\n\u001b[34m      Process id: ${process.pid}`);
                        }
                    });
                }
            });
        }
        catch (error) {
            console.error("Application failed to start:", error);
            process.exit(1);
        }
    }
}
