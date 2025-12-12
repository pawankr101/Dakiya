
import { WebSocket as Ws, WebSocketServer as Wss } from 'ws';
import { Duplex } from 'stream';
import { Server, Request } from './index.js';
import { Exception } from '../../exceptions/exception.js';

export class WSServer {
    static #wss: Wss = new Wss({ noServer: true });

    static setupConnectionUpgrade(server: Server) {
        server.addListener('upgrade', (request: Request, socket: Duplex, head: Buffer) => {
            if(request.url === '/ws') {
                this.#wss.handleUpgrade(request, socket, head, (ws: Ws, req: Request) => this.handleConnection(ws, req));
            } else socket.destroy();
        });
    }

    static handleWsUpgrade(request: Request, socket: Duplex, head: Buffer) {
        if(request.url === '/ws') {
            this.#wss.handleUpgrade(request, socket, head, (ws: Ws, req: Request) => this.handleConnection(ws, req));
        } else socket.destroy();
    }

    static handleConnection(ws: Ws, request: Request) {
        ws.on('message', (data) => {
            // Handle incoming messages
        });
    }
}
