import { v7 as uuid } from 'uuid';

/**
* Generates a unique identifier.
* By default, this method creates a compact, 28-character, base-36 encoded unique ID.
* This is achieved by combining a standard v7 UUID with random bytes, converting the
* resulting hexadecimal string to a BigInt, and then encoding it to base-36. The
* result is then truncated or padded to a fixed length of 28 characters.
*
* @param {boolean} [original=false] - If true, the function returns a standard v7 UUID string with hyphens.
* @returns {string} A 28-character base-36 unique ID, or a standard v7 UUID if `original` is true.
*
* @example
* // Get a custom 28-character ID
* const customId = getUuid(); // e.g., '1fpu6v0c8qj2l7k5m3n9p4o8de'
*
* @example
* // Get a standard v7 UUID
* const standardUuid = getUuid(true); // e.g., '123e4567-e89b-12d3-a456-423614174000'
*/
export const getUuid = (() => {
    const randomBuffer = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomBuffer);
    let counter = randomBuffer[0] % 1679616; // Initialize counter with a random value between 0 and 1679615

    return (original: boolean = false): string => {
        if(original) return uuid();
        let uid = uuid().replaceAll('-', '');
        uid = BigInt(`0x${uid}`).toString(36);
        uid += counter.toString(36).padStart(4, '0');
        counter = counter < 1679615 ? counter + 1 : 0; // Reset counter after 'zzzz' in base-36

        // Ensure the UID is exactly 28 characters long.
        if(uid.length === 28) return uid;
        else if(uid.length > 28) return uid.substring(0, 28);
        return uid.padEnd(28, '0');
    }
})();

/**
 * Generates a short unique identifier.
 * @returns {string} A short unique identifier of 15 characters.
 * @note
 *  * The generated ID is a combination of a timestamp, a counter, and random bytes, all encoded in base-36.
 *  * The timestamp is based on a custom epoch (2026-01-01T00:00:00.000Z).
 *  * The counter increments with each call and wraps around after reaching 1295 (base-36 'zz').
 *  * Random bytes are generated using the Web Crypto API and are limited to a maximum of 5 characters in base-36.
 * @example
 * // Get a short unique ID
 * const shortId = getShortId(); // e.g., 'r8qj2l7k5m3n9p4'
 */
export const getShortId = (() => {
    // Custom epoch: 2026-01-01T00:00:00.000Z
    const customEpoch = 1767225600000;
    // Reusable typed array for the Web Crypto API
    const randomBuffer = new Uint32Array(1);

    globalThis.crypto.getRandomValues(randomBuffer);
    let counter = randomBuffer[0] % 1296; // Initialize counter with a random value between 0 and 1295

    return () => {
        // Calculate the timestamp in base-36, ensuring it is non-negative and divided by 10 to reduce its size.
        const timestamp = Math.max(0, (Date.now() - customEpoch));
        const timestampBase36 = timestamp.toString(36).padStart(8, '0');

        // Increment the counter and wrap around after reaching 1295 (2-character base-36 'zz')
        const counterBase36 = counter.toString(36).padStart(2, '0');
        counter = counter < 1295 ? counter + 1 : 0;

        globalThis.crypto.getRandomValues(randomBuffer);
        // Ensure the value falls within the 5-character base-36 limit (60,466,176)
        // randomBuffer[0] gives a number up to ~4.29 billion.
        const secureRandomNumber = randomBuffer[0] % 60466176;
        const randomBytes = secureRandomNumber.toString(36).padStart(5, '0');

        const uid = `${timestampBase36}${counterBase36}${randomBytes}`;

        // Ensure the UID is exactly 15 characters long.
        if(uid.length === 15) return uid;
        else if(uid.length > 15) return uid.substring(0, 15);
        return uid.padEnd(15, '0');
    };
})();
