import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { WebSocket as Ws, WebSocketServer as Wss } from 'ws';

const wss = new Wss({
    port: 8080
})

wss.on('connection', (ws: Ws, request, client) => {
    // wss.clients.values
})

export function upgradeToWebSocket(request: IncomingMessage, socket: Duplex, head: Buffer, client) {
    wss.handleUpgrade(request, socket, head, (ws, req) => {
        wss.emit('connection', ws, req, client)
    })
}
