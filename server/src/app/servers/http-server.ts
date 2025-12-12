import http from 'http';
import https from 'https';
import http2 from 'http2';
import { ListenOptions } from 'net';
import { WSServer } from './index.js';
import { Exception } from '../../exceptions/index.js';
import { Helpers } from '../../utils/index.js';

/* ***** Type Declarations: Start ***** */

export type HttpVersion = 'http1'|'http2';
export type HttpSecurity = 'http'|'https';
export type Server<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> = hv extends 'http2' ? (hs extends 'https' ? http2.Http2SecureServer: http2.Http2Server) : (hs extends 'https' ? https.Server: http.Server);
export type ServerOptions<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> = hv extends 'http2' ? (hs extends 'https' ? http2.SecureServerOptions: http2.ServerOptions) : (hs extends 'https' ? https.ServerOptions: http.ServerOptions);
export type Request<hv extends HttpVersion = 'http1'> = hv extends 'http1' ? http.IncomingMessage : http2.Http2ServerRequest;
export type Response<hv extends HttpVersion = 'http1'> = hv extends 'http1' ? http.OutgoingMessage : http2.Http2ServerResponse;
export type RequestListener<hv extends HttpVersion = 'http1'> = (request: Request<hv>, response?: Response<hv>) => void|Promise<void>;
export type StartCallbacks = { onError?: (err: Exception) => void, listener?: () => void };

/* ***** Type Declarations: End ***** */

export class HttpServer<hv extends HttpVersion, hs extends HttpSecurity> {
    /** #### Random Hash for Private Constructor */
    static readonly #staticHash: string = Helpers.getUuid();
    static #httpServer: HttpServer<HttpVersion, HttpSecurity> = null;

    #server: Server<hv, hs>;
    #isRequestListenerAdded: boolean = false;

    #buildServer(httpVer: hv, httpSec: hs, options?: ServerOptions<hv, hs>): Server<hv, hs> {
        const server = (httpVer==='http2')
            ? ((httpSec==='https')
                ? http2.createSecureServer(<ServerOptions<'http2', 'https'>>options)
                : http2.createServer(<ServerOptions<'http2'>>options))
            : ((httpSec==='https')
                ? https.createServer(<ServerOptions<'http1', 'https'>>options)
                : http.createServer(<ServerOptions>options));
        return <Server<hv, hs>>server;
    }

    /**
     * Private constructor for the HttpServer class.
     * This constructor enforces a singleton pattern by requiring a private static hash.
     * It initializes the underlying Node.js HTTP/HTTPS server.
     *
     * @private
     * @remarks
     * Direct instantiation is prohibited. Use the static `HttpServer.build()` method
     * to get the singleton instance of this class.
     *
     * @param httpVer - The HTTP version (`http` or `http2`) for the server.
     * @param httpSec - The security context (`http` or `https`) for the server.
     * @param [options] - Optional server configuration options.
     * @param [privateHash] - An internal hash to prevent direct instantiation from outside the class. @internal
     * @throws {Exception} If the constructor is called without the correct private hash.
     */
    private constructor(httpVer: hv, httpSec: hs, options?: ServerOptions<hv,hs>, privateHash?: string) {
        if(!privateHash || privateHash!==HttpServer.#staticHash) throw new Exception(`'HttpServer' class constructor can not be called from outside. use 'HttpServer.build()' static method to get the singleton instance of this class.`);
        this.#server = this.#buildServer(httpVer, httpSec, options);
    }


    /**
     * Creates or returns the singleton HttpServer instance configured for the specified HTTP version and security.
     *
     * @template hv - HTTP version type (extends HttpVersion).
     * @template hs - HTTP security type (extends HttpSecurity).
     * @param httpVer - The HTTP version to use for the server (type hv).
     * @param httpSec - The HTTP security mode to use for the server (type hs).
     * @param options - Optional server options appropriate for the given version and security (ServerOptions<hv, hs>).
     * @returns The singleton HttpServer instance typed with the supplied generics.
     *
     * @remarks
     * This method implements lazy initialization: it constructs a new HttpServer using the provided
     * version, security and options (together with an internal static hash) only if one does not already exist.
     * Subsequent calls will return the previously created instance.
     */
    static build<hv extends HttpVersion, hs extends HttpSecurity>(httpVer: hv, httpSec: hs, options?: ServerOptions<hv,hs>) {
        if(!this.#httpServer) this.#httpServer = new HttpServer<hv, hs>(httpVer, httpSec, options, HttpServer.#staticHash);
        return this.#httpServer;
    }
    
    /**
     * Attaches a request listener and a global client error handler to the server.
     *
     * This method is idempotent; it ensures that listeners are only attached on the
     * first call. On the initial call, it adds:
     * 1. A global 'clientError' listener to gracefully handle socket errors,
     *    logging them and responding with a 400 Bad Request.
     * 2. The provided `requestListener` to handle incoming 'request' events.
     *
     * Subsequent calls will have no effect.
     *
     * @param requestListener - The callback function to execute for each incoming request.
     * @returns The underlying Node.js server instance, allowing for method chaining.
     */
    addRequestListener(requestListener: RequestListener<hv>) {
        // Attach the request listener only once
        if(!this.#isRequestListenerAdded) {

            // Handle client errors globally for the server
            this.#server.addListener('clientError', (err, socket) => {
                if(err['code'] !== 'ECONNRESET' && socket.writable) {
                    console.error(new Exception('Client Error', { cause: err, code: 400 }));
                    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                }
            });
            
            // Attach the provided request listener
            this.#server.addListener('request', requestListener);

            this.#isRequestListenerAdded = true;
        }

        return this.#server;
    }


    /**
     * Enables WebSocket support on the HTTP server.
     *
     * This method attaches an event listener to the underlying Node.js HTTP server's
     * 'upgrade' event. When a client sends an HTTP Upgrade request to switch to the
     * WebSocket protocol, the request is handed off to the `WSServer.handleWsUpgrade`
     * method to complete the connection handshake.
     *
     * @see {@link WSServer.handleWsUpgrade}
     */
    enableWebSocketConnection() {
        this.#server.on('upgrade', WSServer.handleWsUpgrade);
    }

    /**
     * Start the underlying HTTP server.
     *
     * Attaches an optional error listener from the provided callbacks and invokes the internal server's
     * listen method with the given options and optional completion listener.
     *
     * @param options - The listen options to forward to the underlying server (e.g. port, host, backlog).
     * @param cb - Optional callbacks:
     *  - cb.onError: if provided, will be added as an 'error' event listener on the internal server.
     *  - cb.listener: if provided, will be passed as the completion callback to server.listen.
     *
     * @remarks
     * If `cb` is omitted, an empty callbacks object is used. This method delegates to the internal server
     * and does not return a value.
     */
    start(options: ListenOptions, cb?: StartCallbacks) {
        cb = cb || {};
        if(cb.onError) {
            this.#server.on('error', (err) => {
                cb.onError(err['code'] === 'EADDRINUSE' ? new Exception(`Port ${options.port} is already occupied.`, { cause: err }) : new Exception(err));
            });
        }
        this.#server.listen(options, cb.listener);
    }
}
