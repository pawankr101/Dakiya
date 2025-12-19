import { v7 as uuid } from 'uuid';

export class Helpers {

    /**
     * Generates a unique identifier.
     *
     * By default, this method creates a compact, 26-character, base-36 encoded unique ID.
     * This is achieved by combining a standard v7 UUID with random bytes, converting the
     * resulting hexadecimal string to a BigInt, and then encoding it to base-36. The
     * result is then truncated or padded to a fixed length of 26 characters.
     *
     * @param {boolean} [original=false] - If true, the function returns a standard v7 UUID string with hyphens.
     * @returns {string} A 26-character base-36 unique ID, or a standard v7 UUID if `original` is true.
     *
     * @example
     * // Get a custom 26-character ID
     * const customId = Helpers.getUuid(); // e.g., '1fpu6v0c8qj2l7k5m3n9p4o8de'
     *
     * @example
     * // Get a standard v7 UUID
     * const standardUuid = Helpers.getUuid(true); // e.g., '123e4567-e89b-12d3-a456-426614174000'
     */
    static getUuid(original: boolean = false): string {
        if(original) return uuid();
        let uid = uuid().replaceAll('-', '')
        uid = BigInt(`0x${uid}`).toString(36) + Math.random().toString(36).substring(2);

        // Ensure the UID is exactly 26 characters long.
        uid = uid.length > 26 ? uid.substring(0, 26) : uid.padEnd(26, '0');
        return uid;
    }
}
