import type { Readable } from "node:stream";
import { Exception, Guards, type ObjectOf } from "@dakiya/shared";
import { type Algorithm, type DecodeOptions, decode, type Signature, type SignOptions, sign, verify } from "jws";
import { AUTH } from "../config.js";

const signAsync = (option: SignOptions) => {
    return new Promise<string>((resolve, reject) => {
        try {
            resolve(sign(option));
        } catch (error) {
            reject(Exception.from(error as Error, { code: "DAKIYA_JWT_ERROR"}));
        }
    });
};

const verifyAsync = (signature: string, algorithm: Algorithm, secretOrKey: string | Buffer) => {
    return new Promise<boolean>((resolve, reject) => {
        try {
            resolve(verify(signature, algorithm, secretOrKey));
        } catch (error) {
            reject(Exception.from(error as Error, { code: "DAKIYA_JWT_ERROR"}));
        }
    });
};

const decodeAsync = (signature: string, options?: DecodeOptions) => {
    return new Promise<Signature>((resolve, reject) => {
        try {
            const decoded = decode(signature, options);
            if (Guards.isNull(decoded)) {
                reject(new Exception("JWT signature is invalid or malformed", { code: "DAKIYA_JWT_ERROR"}))
            } else resolve(decoded);
        } catch (error) {
            reject(Exception.from(error as Error, { code: "DAKIYA_JWT_ERROR"}));
        }
    });
};

/**
 * JWT (JSON Web Token) service for generating, verifying, and decoding tokens.
 */
export interface Jwt {
    /**
     * Generates a JWT token based on the provided payload.
     * @param payload - The data to be included in the token.
     * @returns A promise that resolves to the generated token.
     */
    generateToken(payload: string | Buffer | Readable | ObjectOf): Promise<string>;
    /**
     * Verifies the provided JWT token.
     * @param token - The JWT token to verify.
     * @returns A promise that resolves to a boolean indicating whether the token is valid.
     */
    isValid(token: string): Promise<boolean>;
    /**
     * Decodes the provided JWT token.
     * @param token - The JWT token to decode.
     * @returns A promise that resolves to the decoded payload of the token.
     */
    decode<T = unknown>(token: string): Promise<T>;
    /**
     * Verifies and decodes the provided JWT token.
     * @param token - The JWT token to verify and decode.
     * @returns A promise that resolves to the decoded payload of the token.
     */
    verifyAndDecode<T= unknown>(token: string): Promise<T>;
}

export const Jwt = (() => {
    const Jwt: Jwt = Object.create(null);

    Jwt.generateToken = async (payload) => {
        if(Guards.isUndefinedOrNull(payload)) throw new Exception("Payload is required to generate token.", { code: 'DAKIYA_JWT_ERROR' });
        return signAsync({ header: { alg: 'HS256', typ: 'JWT' }, payload, secret: AUTH.jwtSecret });
    };

    Jwt.isValid = async (token) => {
        if (!token) throw new Exception("Token is required to verify.", { code: 'DAKIYA_JWT_ERROR' });
        return verifyAsync(token, 'HS256', AUTH.jwtSecret);
    };

    Jwt.decode = async <T = unknown>(token: string): Promise<T> => {
        const decoded = await decodeAsync(token);
        return decoded.payload as T;
    };

    Jwt.verifyAndDecode = async <T = unknown>(token: string): Promise<T> => {
        const isValid = await Jwt.isValid(token);
        if(isValid) {
            const decoded = await decodeAsync(token);
            return decoded.payload as T;
        }
        throw new Exception("Invalid token", { code: 'DAKIYA_JWT_ERROR' });
    };

    return Jwt;
})();
