import { Chrono } from "./chrono";
import { Exception } from "./errors";
import { Guards } from "./guards";
import { getShortId } from "./id";

type HLC = Hlc | string;

export class Hlc {
    /*************************** Static Members: Start *******************************/
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = getShortId();

    /** Current Client ID for HLC Generation */
    static #currentClientId: string = getShortId();

    /** Timestamp Offset for HLC Generation */
    static #timestampOffset: number = 0;

    /** Maximum Offset Tolerance for HLC Generation */
    static #maxOffsetTolerance: number = 1000 * 60 * 60 * 24; // 24 hours in milliseconds

    /** Last Timestamp for HLC Generation */
	static #lastTimestamp: number = 0;

	/** Counter for HLC Generation */
	static #counter: number = 0;

    /**************************** Static Members: End ********************************/

    /************************** Instance Members: Start ******************************/

    #ts: number = 0;
    #ct: number = 0;
    #cId: string = '';

    get timestamp(): number {
        return this.#ts;
    }

    get counter(): number {
        return this.#ct;
    }

    get clientId(): string {
        return this.#cId;
    }

    /*************************** Instance Members: End *******************************/

    /************************** Instance Methods: Start ******************************/

    private constructor(privateHash: string) {
        if (privateHash !== Hlc.#staticHash) {
            throw new Error('Hlc constructor is private. Use Hlc.generate() to create an instance.');
        }
    }

    /**
     * Returns a string representation of the HLC.
     * @note:
     * * String format Used: `<9 char timestamp in base-36>-<4 char counter in base-36>-<15 char clientId>`.
     */
    toString(): string {
        const t36 = this.#ts.toString(36).padStart(9, '0');
        const c36 = this.#ct.toString(36).padStart(4, '0');

        return `${t36}-${c36}-${this.#cId}`;
    }

    /*************************** Instance Methods: End *******************************/

    /************************** Static Methods: Start ******************************/

    static setTimestampOffset(offset: number): void {
        if (Math.abs(offset) > Hlc.#maxOffsetTolerance) {
            throw new Exception(`Timestamp offset exceeds maximum tolerance of ${Hlc.#maxOffsetTolerance} milliseconds.`, { code: 'ERR_DEVICE_TIME_INACCURATE' });
        }
		Hlc.#timestampOffset = offset;
	}

	static now() {
	    return Chrono.now() + Hlc.#timestampOffset;
    }

    static #buildFromHlcString(hlcString: string): Hlc {
        const hlc = new Hlc(Hlc.#staticHash);
        if(hlcString.length === 30) {
            hlc.#ts = Number.parseInt(hlcString.slice(0, 9), 36);
            hlc.#ct = Number.parseInt(hlcString.slice(10, 14), 36);
            hlc.#cId = hlcString.slice(15);
        } else {
            const [t36, c36, cId] = hlcString.split('-');
            hlc.#ts = Number.parseInt(t36, 36);
            hlc.#ct = Number.parseInt(c36, 36);
            hlc.#cId = cId;
        }
        return hlc;
    }
    static #buildFromComponents(ts: number, ct: number, cId: string): Hlc {
        const hlc = new Hlc(Hlc.#staticHash);
        hlc.#ts = ts;
        hlc.#ct = ct;
        hlc.#cId = cId;
        return hlc;
    }

    static #getUpdatedHlc(hlc: HLC, now: number): Hlc {
        const remote = Guards.isString(hlc) ? Hlc.#buildFromHlcString(hlc) : hlc;
        const ts = Math.max(now, Hlc.#lastTimestamp, remote.timestamp);
        let ct = 0;

        if (ts === Hlc.#lastTimestamp && ts === remote.timestamp) {
            ct = Math.max(Hlc.#counter, remote.counter) + 1;
        } else if (ts === Hlc.#lastTimestamp) {
            ct = Hlc.#counter + 1;
        } else if (ts === remote.timestamp) {
            ct = remote.counter + 1;
        }

        Hlc.#lastTimestamp = ts;
        Hlc.#counter = ct;

        return Hlc.#buildFromComponents(ts, ct, Hlc.#currentClientId);
    }

    static #getNewHlc(now: number): Hlc {
        if (now > Hlc.#lastTimestamp) {
            Hlc.#lastTimestamp = now;
            Hlc.#counter = 0;
        } else {
            Hlc.#counter++;
        }
        return Hlc.#buildFromComponents(Hlc.#lastTimestamp, Hlc.#counter, Hlc.#currentClientId);
    }

    static parseHlcString(hlcString: string): Hlc {
        return Hlc.#buildFromHlcString(hlcString);
    }

    static generate(hlc?: HLC): Hlc {
        const now = Hlc.now();
        return hlc ? Hlc.#getUpdatedHlc(hlc, now) : Hlc.#getNewHlc(now);
    }

    static init = (() => {
        let initialized = false;
        return (clientId: string, maxOffsetTolerance?: number, initialState?: { timestampOffset?: number, lastTimestamp?: number, lastCounter?: number }): void => {
            if (initialized) {
                throw new Exception('Hlc has already been initialized. Initialization can only be done once.', { code: 'HLC_INITIALIZATION_ERROR' });
            }
            initialized = true;

            Hlc.#currentClientId = clientId;
            Hlc.#maxOffsetTolerance = maxOffsetTolerance || Hlc.#maxOffsetTolerance;

            const { timestampOffset = 0, lastTimestamp = 0, lastCounter = 0 } = initialState || {};
            Hlc.#timestampOffset = timestampOffset;
            Hlc.#lastTimestamp = lastTimestamp;
            Hlc.#counter = lastCounter;
        }
    })();

    /*************************** Static Methods: End *******************************/
}
