import Fastify, { type FastifyServerFactory, type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import { type HttpSecurity, HttpServer, type HttpVersion, type RequestListener, type Server, type ServerOptions } from '../servers/index.js';
import { Exception, getUuid, Guards } from '@dakiya/shared';
import { AppRoutes } from './app.route.js';
import { PG, Cache } from '../storage/index.js';
import { APIException } from './exception.js';

type ApplicationOptions<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> = {
    httpVersion: hv;
    httpSecurity: hs;
    host: string;
    port: number;
};

export class Application<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> {
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = getUuid();

    #httpVersion: hv; #httpSecurity: hs;
    #httpServer: HttpServer<hv, hs>;
    #fastifyApp: FastifyInstance;

    private constructor(hv: hv, hs: hs, privateHash: string) {
        if (privateHash !== Application.#staticHash) throw new Exception(`'Application' class constructor can not be called from outside.`, { code: 'DAKIYA_APP_ERROR' });

        this.#httpVersion = hv;
        this.#httpSecurity = hs;
        const serverOptions: ServerOptions<hv, hs> = {};
        if (hv === 'http2') {
            if (hs === 'https') {
                (serverOptions as ServerOptions<'http2', 'https'>).allowHTTP1 = true;
            }
        }
        this.#httpServer = HttpServer.build(hv, hs, serverOptions);
        this.#fastifyApp = Fastify({
            serverFactory: ((requestHandler: RequestListener): Server => (this.#httpServer as HttpServer).addRequestListener(requestHandler)) as unknown as FastifyServerFactory<Server>
        }) as unknown as FastifyInstance;
    }

    async #setupDatabases() {
        // Initialize Cache connection
        await Cache.init();
        // Initialize Postgres connection
        await PG.init();
    }

    #setupAppLevelErrorHandling() {
        // Handle client errors globally for the server
        this.#httpServer.addClientErrorHandler((err, socket) => {
            if(err.code !== 'ECONNRESET' && socket.writable) {
                console.error(new Exception(err, { code: 'DAKIYA_CLIENT_ERROR' }));
                socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            }
        });
        // Handle global Application errors
        this.#fastifyApp.setErrorHandler((error: Error, _request: FastifyRequest, response: FastifyReply) => {
            const err = error instanceof APIException ? error : new APIException(error, { code: 'DAKIYA_APP_ERROR', httpCode: 500 });
            response.status(err.httpCode).type('application/json').send({ error: err.message, code: err.code });
        });
    }

    async #setupApplication() {
        try {
            this.#setupAppLevelErrorHandling();
            await this.#setupDatabases();
            await this.#fastifyApp.register(AppRoutes);
        } catch (error) {
            throw Exception.from(error as Exception, { code: 'APPLICATION_SETUP_ERROR' });
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
    async start(host: string, port: number) {
        try {
            await this.#setupApplication();
            await this.#fastifyApp.ready();
            this.#httpServer.start({ host, port }, {
                onError: (error) => {
                    console.log(`\u001b[33m  [S] Api Server stopped.`);
                    console.log(`\u001b[33m      ERROR: ${error.message}`);
                    process.exit(1);
                },
                listener: () => {
                    console.log(`\u001b[34m  [S] Server Started:`);
                    console.log(`\u001b[34m  [S] Server info:\n\u001b[34m      Base Route: ${this.#httpSecurity}://${host}:${port}\n\u001b[34m      Network Protocol: ${this.#httpVersion}\n\u001b[34m      Process id: ${process.pid}`);
                }
            });
        } catch (error) {
            console.log(`\u001b[31m  [S] Api Server Could not get started.`);
            console.log(`\u001b[31m      ERROR: ${(error as Exception).message}`);
            process.exit(1);
        }
    }

    static #getApplication = (() => {
        let app: Application<HttpVersion, HttpSecurity> | null = null;
        return <hv extends HttpVersion, hs extends HttpSecurity>(hv: hv, hs: hs): Application<hv, hs> => {
            if (!hv) throw new Exception(`'httpVersion' is required to get Application instance.`, { code: 'DAKIYA_APP_ERROR' });
            if (!hs) throw new Exception(`'httpSecurity' is required to get Application instance.`, { code: 'DAKIYA_APP_ERROR' });
            if (Guards.isNull(app)) {
                app = new Application(hv, hs, Application.#staticHash);
            }
            return app as Application<hv, hs>;
        }
    })();


    static run<hv extends HttpVersion, hs extends HttpSecurity>(options: ApplicationOptions<hv, hs>) {
        const { httpVersion: hv, httpSecurity: hs, host, port } = options;
        const app = Application.#getApplication(hv, hs);
        if (Guards.isString(host) && Guards.isNumber(port)) {
            return app.start(host, port);
        }
        return Promise.reject(new Exception(`'host' and 'port' are required to start the application server.`, { code: 'DAKIYA_APP_ERROR' }));
    }
}
