import type { FastifyRequest } from "fastify";
import { ApiResponse } from "../../response.js";
import type { EndPointHandler } from "../../types.js";


export const register: EndPointHandler = async (_request: FastifyRequest) => {
    // Implement registration logic here.
    return new ApiResponse(200, { message: 'Registration successful' });
};

export const login: EndPointHandler = async (_request: FastifyRequest) => {
    // Implement login logic here.
    return new ApiResponse(200, { message: 'Login successful', token: "token" });
};

export const logout: EndPointHandler = async (_request: FastifyRequest) => {
    // Implement logout logic here.
    return new ApiResponse(200, { message: 'Logout successful' });
};
