import { decode, sign, verify } from "jws";
import { Readable } from "stream";
import { SessionsQuery, UsersQuery } from "../../../storage/index.js";
import { Utility } from "../../services/index.js";
import { Exception } from "../../../exceptions/index.js";
import { AUTH } from "../../../config.js";

export class AuthService {
    /**
     * Generates a JWT token based on the provided payload.
     * @param payload - The data to be included in the token.
     * @returns A promise that resolves to the generated token.
     */
    public static generateToken(payload: string | Buffer | Readable | {[K: string]: any}): string {
        if(!Utility.isDefinedAndNotNull(payload)) throw new Exception("Payload is required to generate token.", { code: 400 });
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

    static async register(user: any): Promise<any> {
        // Implement registration logic here
        // For example, call UsersQuery.createUser(user);
        return { message: 'Registration successful' };
    }

    static async login(uidEmailOrPhone: string, password: string, userAgent: string, reqIp: string): Promise<string> {
        const user = await UsersQuery.validateUserCredentials(uidEmailOrPhone, password, ['uid', 'email', 'phone']);
        if (!user) throw new Exception("Invalid credentials", { code: 401 });
        
        // Generate a new session for the user
        const session = await SessionsQuery.createSession(user.uid, userAgent, reqIp);
        
        // Generate a JWT token for the user
        const token = this.generateToken({ ...user, sessionId: session.sessionId });

        return token;
    }

    static async logout(): Promise<any> {
        // Implement logout logic here
        return { message: 'Logout successful' };
    }

    static async validateToken(token: string): Promise<any> {
        // Implement token validation logic here
        // For example, decode the token and check its validity
        if (!token) throw new Error("Token is required.");
        // Simulate token validation
        if (token === "valid-token") {
            return { valid: true, userId: "12345" }; // Example response
        }
        throw new Error("Invalid token.");
    }

    static async refreshToken(oldToken: string): Promise<any> {
        // Implement token refresh logic here
        // For example, generate a new token based on the old one
        if (!oldToken) throw new Error("Old token is required.");
        // Simulate token refresh
        return { newToken: "new-valid-token" }; // Example response
    }

    static async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<any> {
        // Implement password change logic here
        // For example, validate the old password and update it with the new one
        if (!userId || !oldPassword || !newPassword) throw new Error("User ID, old password, and new password are required.");
        // Simulate password change
        return { message: 'Password changed successfully' }; // Example response
    }

    static async forgotPassword(email: string): Promise<any> {
        // Implement forgot password logic here
        // For example, send a reset link to the user's email
        if (!email) throw new Error("Email is required.");
        // Simulate sending reset link
        return { message: 'Reset link sent to your email' }; // Example response
    }

    static async resetPassword(token: string, newPassword: string): Promise<any> {
        // Implement reset password logic here
        // For example, validate the token and update the password
        if (!token || !newPassword) throw new Error("Token and new password are required.");
        // Simulate password reset
        return { message: 'Password reset successfully' }; // Example response
    }
}
