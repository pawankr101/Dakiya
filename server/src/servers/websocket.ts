import type { Duplex } from 'node:stream';
import { type WebSocket, WebSocketServer } from 'ws';
import type { Request } from './http-server';

export interface WsServer {
    /**
     * Handles WebSocket upgrade requests.
     * @param request - The incoming HTTP request object.
     * @param socket - The network socket between the server and client.
     * @param head - The first packet of the upgraded stream, which may contain data.
     * @remarks
     * * This method is invoked when a client attempts to upgrade an HTTP connection to a WebSocket connection.
     * * It checks if the request URL matches the expected WebSocket endpoint (e.g., '/ws').
     * * If the URL matches, it delegates the upgrade process to the underlying WebSocket server instance.
     * * If the URL does not match, it destroys the socket to prevent unauthorized access.
     */
    handleWsUpgrade(request: Request, socket: Duplex, head: Buffer): void;
}

export const WsServer: WsServer = (() => {
    const wsServer: WsServer = Object.create(null);
    const wss = new WebSocketServer({ noServer: true });

    const handleConnection = (ws: WebSocket, request: Request) => {
        ws.on('message', (data) => {
            // Handle incoming messages
            console.log(request.url);
            console.log(data);
        });
    };

    wsServer.handleWsUpgrade = (request: Request, socket: Duplex, head: Buffer) => {
        if(request.url === '/ws') {
            wss.handleUpgrade(request, socket, head, handleConnection);
        } else {
            socket.destroy();
        }
    };

    return Object.freeze(wsServer);
})();
