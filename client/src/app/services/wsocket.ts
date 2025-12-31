
export class WSocket {
    #socket: WebSocket
    constructor() {
        this.#socket = new WebSocket('url' )
    }
}
