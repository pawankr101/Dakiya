import type { Duplex } from 'node:stream';
import { type WebSocket as Ws, WebSocketServer as Wss } from 'ws';
import type { Request } from './index.js';

class WSServer {
    #wss: Wss;

    constructor() {
        this.#wss = new Wss({ noServer: true });
    }

    handleWsUpgrade(request: Request, socket: Duplex, head: Buffer) {
        if(request.url === '/ws') {
            this.#wss.handleUpgrade(request, socket, head, this.handleConnection);
        } else socket.destroy();
    }

    handleConnection(ws: Ws, request: Request) {
        ws.on('message', (data) => {
            // Handle incoming messages
            console.log(request.url)
            console.log(data);
        });
    }
}

export const WSSERVER = new WSServer();
