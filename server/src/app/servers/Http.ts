import {Server as HttpServer, ServerOptions as HttpServerOptions, IncomingMessage, ServerResponse, createServer as createHttpServer, OutgoingHttpHeaders as ResponseHeaders} from 'http';
import {Server as HttpsServer, ServerOptions as HttpsServerOptions, createServer as createHttpsServer} from 'https';
import {Http2Server, Http2SecureServer, ServerOptions as Http2ServerOptions, SecureServerOptions as Http2SecureServerOptions, Http2ServerRequest, Http2ServerResponse, createServer as createHttp2Server, createSecureServer as createHttps2Server} from 'http2';
import { ListenOptions } from 'net';

/*** TYPES ****************************************************************/
type ObjectOf<T=any> = {[x: string]: T};
export type HttpVer = 'http1'|'http2';
export type HttpSec = 'http'|'https';
type Server<hv extends HttpVer=HttpVer,hs extends HttpSec=HttpSec> = hv extends 'http1' ? (hs extends 'http' ? HttpServer: HttpsServer) : (hs extends 'http' ? Http2Server : Http2SecureServer);
export type ServerOptions<hv extends HttpVer=HttpVer,hs extends HttpSec=HttpSec> = hv extends 'http1' ? (hs extends 'http' ? HttpServerOptions: HttpsServerOptions) : (hs extends 'http' ? Http2ServerOptions : Http2SecureServerOptions);
type Request<hv extends HttpVer=HttpVer> = (hv extends 'http1' ? IncomingMessage : Http2ServerRequest) & {body: ObjectOf};
type Response<hv extends HttpVer=HttpVer> = hv extends 'http1' ? ServerResponse : Http2ServerResponse;
export type RequestListener<hv extends HttpVer=HttpVer> = (request: Request<hv>, response?: Response<hv>) => void|Promise<void>;
type StartCallbacks = {onError?: (err: Error) => void, listener?: () => void};
/*************************************************************************/

/*** LOCAL CONSTANTS *****************************************************/
const locals: {
        httpVer: HttpVer, httpSec: HttpSec, serverOptions: ServerOptions, server: Server,
        createServer<hv extends HttpVer,hs extends HttpSec>(httpVer: hv, httpSec: hs, options: ServerOptions<hv,hs>, listener: RequestListener<hv>): Server<hv,hs>,
    } = {
    httpVer: null, httpSec: null, serverOptions: null, server: null,
    createServer<hv extends HttpVer,hs extends HttpSec>(httpVer: hv, httpSec: hs, options: ServerOptions<hv,hs>, listener: RequestListener<hv>) {
        let server = (httpVer==='http1')
            ? ((httpSec==='http')
                ? createHttpServer(options as ServerOptions<'http1', 'http'>, listener as RequestListener<'http1'>)
                :  createHttpsServer(options as ServerOptions<'http1', 'https'>, listener as RequestListener<'http1'>))
            : ((httpSec==='http')
                ? createHttp2Server(options as ServerOptions<'http2', 'http'>, listener as RequestListener<'http2'>)
                : createHttps2Server(options as ServerOptions<'http2', 'https'>, listener as RequestListener<'http2'>));
        server.on('upgrade', (request, socket, head) => {
            socket.on('error', (err) => {
                console.error(err);
            });
            // authencate()
            // upgradeToWebSocket(request, socket, head);
        })
        return server as Server<hv,hs>;
    }
}
/*************************************************************************/

export class Http<hv extends HttpVer,hs extends HttpSec> {
    requestListener:RequestListener<hv> = () => {};
    constructor(httpVer: HttpVer,httpSec: HttpSec,options: ServerOptions<hv,hs>={}) {
        if(!options) options = {};
        locals.httpVer = httpVer;
        locals.httpSec = httpSec;
        locals.serverOptions = options;
    }
    addRequestListener(requestListener:RequestListener<hv>) {
        this.requestListener = requestListener;
        return this;
    }
    start(options: ListenOptions, cb: StartCallbacks) {
        if(!cb) cb = {};
        locals.server = locals.createServer(locals.httpVer, locals.httpSec, locals.serverOptions, this.requestListener);
        locals.server.addListener('error', cb.onError).listen(options, cb.listener);
    }
}
