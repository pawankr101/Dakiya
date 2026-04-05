import { FastifyReply, FastifyRequest } from "fastify";
import { APIException } from "../../exception.js";
// import { AuthService } from "./auth.service.js";

export class AuthController {

    static async register(request: FastifyRequest, response: FastifyReply) {
        // Implement registration logic here
        response.header('Content-Type', 'application/json').send({ message: 'Registration successful' });
    }

    static async login(request: FastifyRequest<{
        Body: { uidEmailOrPhone: string, password: string }
    }>, response: FastifyReply) {
        try {
            const { uidEmailOrPhone, password } = request.body;
            // const token = await AuthService.login(uidEmailOrPhone, password, request.headers['user-agent'], request.ip);

            response.header('Content-Type', 'application/json').send({ message: 'Login successful', token });
        } catch (error) {
            if (error instanceof APIException) {
                response.status(error.httpCode).header('Content-Type', 'application/json').send({ error: error.message });
            } else {
                response.status(500).header('Content-Type', 'application/json').send({ error: 'Internal Server Error' });
            }
        }
    }

    static async logout(request: FastifyRequest, response: FastifyReply) {
        // Implement logout logic here
        response.header('Content-Type', 'application/json').send({ message: 'Logout successful' });
    }
}
