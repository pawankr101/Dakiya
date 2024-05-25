import { Exception } from "src/exceptions";
import { Utility } from "./utility";


type SignalData = {
    sdp?: RTCSessionDescriptionInit,
    ice?: RTCIceCandidate,
    renegotiate?: boolean
}
type WRtcData = string | Buffer | ArrayBuffer | Blob | Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array
type WRtcEvent = 'signal'|'connect'|'data'|'close'|'error';
type WRtcEventData<Ev extends WRtcEvent> = Ev extends 'signal' ? SignalData : Ev extends 'data' ? WRtcData : Ev extends 'error' ? Exception : unknown
type WRtcEventListener<Ev extends WRtcEvent> = (v: WRtcEventData<Ev>) => void;

type WRtcConfig = {
    initiator?: boolean
    rtcConfig?: RTCConfiguration,
    dataChannel?: { label?: string, options?: RTCDataChannelInit }
}

export class WRtc implements EventTarget {
    #events: Record<WRtcEvent, Array<WRtcEventListener<WRtcEvent>>> = Object.create(null);
    addEventListener<Ev extends WRtcEvent>(event: Ev, callback: WRtcEventListener<Ev>): void {
        if (!this.#events[event]) this.#events[event] = [];
        this.#events[event].push(callback);
    }
    dispatchEvent<Ev extends WRtcEvent>(event: Ev, data?: WRtcEventData<Ev>): boolean {
        const eventCallbacks = this.#events[event];
        if(eventCallbacks && eventCallbacks.length > 0) eventCallbacks.forEach((callback) => callback(data));
        return true;
    }
    removeEventListener<Ev extends WRtcEvent>(event: Ev, callback: WRtcEventListener<Ev>): void {
        const eventCallbacks = this.#events[event];
        if(eventCallbacks && eventCallbacks.length > 0) this.#events[event] = eventCallbacks.filter((cb) => cb !== callback);
    }

    #config: WRtcConfig = {
        initiator: false,
        rtcConfig: { iceServers: [{ urls: ['stun: stun.l.google.com:19302', 'stun: stun1.l.google.com:19302', 'stun.services.mozilla.com:3478'] }] },
        dataChannel: { label: Utility.generateRandomId(), options: {}}
    }
    #connectionClosed = false;
    #connection: RTCPeerConnection;
    #dataChannel: RTCDataChannel;

    #buildConfig(config?: WRtcConfig) {
        if(!config) return;
        if(config.initiator) this.#config.initiator = true;
        if(config.rtcConfig) this.#config.rtcConfig = { ...this.#config.rtcConfig, ...config.rtcConfig };
        if(config.dataChannel) {
            if(config.dataChannel.label) this.#config.dataChannel.label = config.dataChannel.label;
            if(config.dataChannel.options) this.#config.dataChannel.options = { ...this.#config.dataChannel.options, ...config.dataChannel.options };
        }
    }

    #setupDataChannel() {
        this.#dataChannel.binaryType = 'arraybuffer';
        this.#dataChannel.onopen = () => {}
        this.#dataChannel.onmessage = ({data}: MessageEvent<WRtcData>) => {
            this.dispatchEvent('data', data);
        }
        this.#dataChannel.onclose = () => {}
        this.#dataChannel.onerror = () => {
            this.dispatchEvent('error', new Exception('Error found in data channel.'));
        }
    }
    async #setupIce() {
        this.#connection.onicecandidateerror = (ev) => this.dispatchEvent('error', new Exception(ev.errorText, {code: ev.errorCode}));
        this.#connection.onicecandidate = (ev) => {
            this.#connection.addIceCandidate(ev.candidate).then(() => {
                this.dispatchEvent('signal', {ice: ev.candidate});
            }).catch((err) => {
                this.dispatchEvent('error', new Exception('add Ice candidate Error', {cause: err}));
            });
        }
    }
    async #createOffer() {
        try {
            const offer = await this.#connection.createOffer({iceRestart: true});
            await this.#connection.setLocalDescription(offer);
            this.dispatchEvent('signal', {sdp: offer});
        } catch(err) {
            throw new Exception('Error: creating offer', {cause: err});
        }
    }

    constructor(config?: WRtcConfig) {
        if(!WRtc.#isWebRTCSupported()) throw new Exception('WebRTC is not supported.');
        this.#buildConfig(config);
        this.#connection = new RTCPeerConnection(this.#config.rtcConfig);
        this.#setupIce();

        if(this.#config.initiator || this.#config.dataChannel.options.negotiated) {
            this.#dataChannel = this.#connection.createDataChannel(this.#config.dataChannel.label, this.#config.dataChannel.options);
            this.#setupDataChannel();
        } else {
            this.#connection.ondatachannel = (ev) => {
                this.#dataChannel = ev.channel;
                this.#config.dataChannel.label = ev.channel.label
                this.#setupDataChannel();
            }
        }
    }

    signal(data: SignalData) {
        if(!data) this.dispatchEvent('error', new Exception('Incorrect/No Signal data provided.'));
        else if(data.renegotiate) this.#connection.restartIce();
        else if(data.ice) {
            this.#connection.addIceCandidate(data.ice).then(() => {
                this.#createOffer();
            }).catch((err) => {
                this.dispatchEvent('error', new Exception(err));
            });
        }
        else if(data.sdp) this.#connection.setRemoteDescription(data.sdp);
    }


    async createOffer() {
        const offer = await this.#connection.createOffer({iceRestart: true});
        return this.#connection.setLocalDescription(offer);
    }
    async createAnswer() {
        const answer = await this.#connection.createAnswer();
        return this.#connection.setRemoteDescription(answer);
    }


    // Static Members
    static #isWebRTCSupported() {
        if(window.RTCPeerConnection) return true;
        return false;
    }
}