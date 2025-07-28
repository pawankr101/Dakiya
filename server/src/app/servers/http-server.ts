import http from 'http';
import https from 'https';
import http2 from 'http2';
import { ListenOptions } from 'net';

/* ***** Type Declarations: Start ***** */

export type HttpVersion = 'http1'|'http2';
export type HttpSecurity = 'http'|'https';
export type Server<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> = hv extends 'http2' ? (hs extends 'https' ? http2.Http2SecureServer: http2.Http2Server) : (hs extends 'https' ? https.Server: http.Server);
export type ServerOptions<hv extends HttpVersion = 'http1', hs extends HttpSecurity = 'http'> = hv extends 'http2' ? (hs extends 'https' ? http2.SecureServerOptions: http2.ServerOptions) : (hs extends 'https' ? https.ServerOptions: http.ServerOptions);
export type Request<hv extends HttpVersion = 'http1'> = hv extends 'http1' ? http.IncomingMessage : http2.Http2ServerRequest;
export type Response<hv extends HttpVersion = 'http1'> = hv extends 'http1' ? http.OutgoingMessage : http2.Http2ServerResponse;
export type RequestListener<hv extends HttpVersion = 'http1'> = (request: Request<hv>, response?: Response<hv>) => void|Promise<void>;
export type StartCallbacks = { onError?: (err: Error) => void, listener?: () => void };

/* ***** Type Declarations: End ***** */

/**  */
export class HttpServer<hv extends HttpVersion, hs extends HttpSecurity> {
    server: Server<hv, hs>;

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

    constructor(httpVer: hv, httpSec: hs, options?: ServerOptions<hv,hs>) {
        this.server = this.#buildServer(httpVer, httpSec, options);
    }

    addRequestListener(requestListener: RequestListener<hv>) {
        this.server.addListener('request', requestListener);
        return this;
    }

    start(options: ListenOptions, cb?: StartCallbacks) {
        cb = cb || {};
        if(cb.onError) this.server.addListener('error', cb.onError);
        this.server.listen(options, cb.listener);
    }
}
