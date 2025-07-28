import { machineIdSync } from "node-machine-id";

export class Helpers {

    /**
     * #### Get Machine Id Hash
     * @returns string
     * @description
     * - It generates a hash from the machine ID.
     * - The hash is a base-36 representation of the machine ID, processed to ensure it is unique and consistent.
     * - The hash is used to generate unique IDs.
     */
    static #getMachineIdHash() {
        const mi = machineIdSync(true).toLocaleLowerCase();
        const mib36 = BigInt(`0x${mi.replaceAll(/[^a-f0-9]/g, '')}`).toString(36);
        let mib36lastIndex = mib36.length;
        if(mib36lastIndex % 2 !== 0) mib36.padEnd(mib36lastIndex + 1, '0');
        else mib36lastIndex--;
    
        let machineIdHash = '';
        while(mib36lastIndex >= 0) {
            let num = `${parseInt(mib36.substring(mib36lastIndex-1, mib36lastIndex+1), 36)}`;
            let ds = 0, numLen = num.length - 1;
            while(numLen >= 0) {
                ds += parseInt(num[numLen--], 10);
            }
            machineIdHash += ds.toString(36);
            mib36lastIndex -= 2;
        }
        return machineIdHash;
    }
    
    /**
     * #### Generate Unique Id
     * @param prefix string
     * @returns string
     * @description
     * - It generates a unique ID of 32 characters length excluding prefix.
     * - The generated ID is a combination of the machine ID, current timestamp, a cyclic character counter, and a random hash.
     * - The cyclic character counter ensures that the ID is unique even if generated multiple times in quick succession resulting at least 46,655,000 unique ids per second.
     * - The ID is padded with random characters if it is shorter than 32 characters.
     * @example
     *   Helpers.generateUid('prefix-'); // e.g., 'prefix-1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6'
     */
    static generateUid = (() => {
        const machineId = this.#getMachineIdHash();
        let cyclicCharCounter = 0;
        return (prefix: string = '') => {
            const timeStampHash = Date.now().toString(36);
            const randomHash = Math.random().toString(36).substring(2);
            let id = (`${machineId}${timeStampHash}${cyclicCharCounter.toString(36)}${randomHash}`).slice(0, 32);
            cyclicCharCounter = cyclicCharCounter < 46655 ? cyclicCharCounter + 1 : 0; // Reset after 'zzz'
            let il = 32 - id.length;
            
            while(il>0) {
                id += Math.random().toString(36).substring(2);
                id = id.slice(0, 32);
                il = 32 - id.length;
            }
    
            return `${prefix}${id}`;
        };
    })();
}
