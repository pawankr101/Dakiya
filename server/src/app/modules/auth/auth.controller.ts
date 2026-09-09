import { ApiResponse } from "../../response";
import type { EndPointHandler } from "../../types";

export const register: EndPointHandler = async (_request) => {
    // Implement registration logic here.
    return new ApiResponse(200, { message: 'Registration successful' });
};

export const login: EndPointHandler = async (_request) => {
    // Implement login logic here.
    return new ApiResponse(200, { message: 'Login successful', token: "token" });
};

export const logout: EndPointHandler = async (_request) => {
    // Implement logout logic here.
    return new ApiResponse(200, { message: 'Logout successful' });
};
