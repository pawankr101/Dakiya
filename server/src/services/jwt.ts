
import { decode, sign, verify } from "jws";
import { Readable } from "stream";
import { AUTH } from "../config.js";
import { Utils } from "../utils/index.js";
import { Exception } from "../exceptions/index.js";

/**
 * JWT (JSON Web Token) service for generating, verifying, and decoding tokens.
 */
export class Jwt {
  /**
   * Generates a JWT token based on the provided payload.
   * @param payload - The data to be included in the token.
   * @returns A promise that resolves to the generated token.
   */
  public static generateToken(payload: string | Buffer | Readable | {[K: string]: any}): string {
      if(Utils.isUndefinedOrNull(payload)) throw new Exception("Payload is required to generate token.", { code: 400 });
      return sign({ header: { alg: 'HS256', typ: 'JWT' }, payload: { data: payload }, secret: AUTH.jwtSecret });
  }

  /**
   * Verifies the provided JWT token.
   * @param token - The JWT token to verify.
   * @returns A boolean indicating whether the token is valid.
   */
  public static isValidToken(token: string): boolean {
      if (!token) throw new Exception("Token is required to verify.", { code: 400 });
      return verify(token, 'HS256', AUTH.jwtSecret);
  }

  /**
   * Decodes the provided JWT token.
   * @param token - The JWT token to decode.
   * @returns The decoded payload of the token.
   */
  public static decodeToken<T= any>(token: string): T {
      if(this.isValidToken(token)) {
          const decoded = decode(token);
          if(decoded && decoded.payload && decoded.payload.data) return decoded.payload.data;
      }
      throw new Exception("Invalid token", { code: 401 });
  }
}
