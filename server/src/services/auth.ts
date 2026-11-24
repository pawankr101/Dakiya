import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { Exception, Hlc } from "@dakiya/utils";
import { AUTH } from "../config";
import { Cache } from "../storage";
import { Jwt } from "./jwt";

const { cacheKeyPrefix, sessionTTLInSeconds, passwordHashing: { saltLength, keyLength } } = AUTH;

interface Session {
    uid: string;
    cid: string;
}

/**
 * #### Creates Password Hash
 * Generates a secure hash for the provided password using a random salt and the scrypt algorithm.
 * The resulting hash is stored in the format "salt:hash" for later verification.
 * @param {string} password - The plain text password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password in the format "salt:hash".
 * @throws {Exception} Throws an exception with code 'AUTH_HASHING_FAILED' if there is an error during hashing.
 */
export const createPasswordHash = (password: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        randomBytes(saltLength, (error, buf) => {
            if(error) reject(Exception.from(error, { code: 'AUTH_HASHING_FAILED' }));
            else {
                const salt = buf.toHex();
                scrypt(password, salt, keyLength, (err, hash) => {
                    if(err) reject(Exception.from(err, { code: 'AUTH_HASHING_FAILED' }));
                    else resolve(`${salt}:${hash.toHex()}`);
                })
            }
        });
    });
};

/**
 * #### Verifies Password
 * Compares a provided password with a stored hashed password to determine if they match.
 * The stored password is expected to be in the format "salt:hash".
 * @param {string} password - The plain text password to verify.
 * @param {string} [storedPassword] - The stored hashed password to compare against.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
 * @throws {Exception} Throws an exception with code 'AUTH_HASHING_FAILED' if there is an error during verification.
 */
export const verifyPassword = (password: string, storedPassword?: string): Promise<boolean> => {
    if (!storedPassword) return Promise.resolve(false);
    const [salt, hash] = storedPassword.split(":");
    if (!salt || !hash) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
        const storedBuf = Buffer.from(hash, "hex");
        scrypt(password, salt, keyLength, (error, derivedBuf) => {
            if(error) reject(Exception.from(error, { code: 'AUTH_HASHING_FAILED' }));
            else if(storedBuf.length !== derivedBuf.length) resolve(false);
            else resolve(timingSafeEqual(storedBuf, derivedBuf));
        });
    });
};

const tokenCacheKey = (token: string): string => {
    const digest = createHash("sha256").update(token).digest("hex");
    return `${cacheKeyPrefix}:${digest}`;
};

/**
 * #### Creates Session
 * Generates a JWT token for the user and stores the session information in the cache.
 * @param {string} userId - The unique identifier of the user.
 * @param {string} clientId - The unique identifier of the client.
 * @returns {Promise<string>} A promise that resolves to a generated token.
 */
export const createSession = async (userId: string, clientId: string) => {
    const token = await Jwt.generateToken({ uid: userId, cid: clientId, iat: Hlc.now() });
    await Cache.setData<Session>(tokenCacheKey(token), { uid: userId, cid: clientId }, sessionTTLInSeconds);
    return token;
};

/**
 * #### Gets Session
 * Retrieves the session information associated with the provided token from the cache.
 * @param {string} token - The JWT token for which to retrieve the session.
 * @returns {Promise<Session | null>} A promise that resolves to the session information if found, or null if not found.
 */
export const getSession = async (token: string) => {
    const sessionData = await Cache.getData<Session>(tokenCacheKey(token));
    return sessionData || null;
};

/**
 * #### Validates Session
 * Validates the provided token by checking its existence in the cache and verifying its signature.
 * @param {string} token - The JWT token to validate.
 * @returns {Promise<Session | null>} A promise that resolves to the session information if valid, or null if invalid or not found.
 */
export const validateSession = async (token: string) => {
    try {
        if (!token) return null;
        const decoded = await Jwt.verifyAndDecode<Session>(token);
        const session = await getSession(token);
        if(!session || decoded.uid !== session.uid || decoded.cid !== session.cid) return null;
        return session;
    } catch {
        return null;
    }
};

/**
 * #### Deletes Session
 * Removes the session information associated with the provided token from the cache.
 * @param {string} token - The JWT token for which to delete the session.
 * @returns {Promise<void>} A promise that resolves when the session has been deleted.
 */
export const deleteSession = async (token: string) => {
    await Cache.del(tokenCacheKey(token));
};
