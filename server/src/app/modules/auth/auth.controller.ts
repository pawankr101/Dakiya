import type { FastifyReply, FastifyRequest } from "fastify";
import { APIException } from "../../exception.js";
// import { AuthService } from "./auth.service.js";

export class AuthController {

    static async register(_request: FastifyRequest, response: FastifyReply) {
        // Implement registration logic here
        response.header('Content-Type', 'application/json').send({ message: 'Registration successful' });
    }

    static async login(_request: FastifyRequest<{
        Body: { uidEmailOrPhone: string, password: string }
    }>, response: FastifyReply) {
        try {
            // const { uidEmailOrPhone, password } = request.body;
            // const token = await AuthService.login(uidEmailOrPhone, password, request.headers['user-agent'], request.ip);

            response.header('Content-Type', 'application/json').send({ message: 'Login successful', token: "token" });
        } catch (error) {
            if (error instanceof APIException) {
                response.status(error.httpCode).header('Content-Type', 'application/json').send({ error: error.message });
            } else {
                response.status(500).header('Content-Type', 'application/json').send({ error: 'Internal Server Error' });
            }
        }
    }

    static async logout(_request: FastifyRequest, response: FastifyReply) {
        // Implement logout logic here
        response.header('Content-Type', 'application/json').send({ message: 'Logout successful' });
    }
}
