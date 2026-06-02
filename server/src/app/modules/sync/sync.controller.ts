import { ApiResponse } from "app/response";
import type { EndPointHandler } from "app/types";
import type { FastifyRequest } from "fastify";

/**
 * Gets the changes from the server since the last sync.
 * The client should send the timestamp of the last successful sync, and the server will return all changes that occurred after that timestamp.
 */
export const pullChanges: EndPointHandler = async (_request: FastifyRequest) => {
    // Implement logic to pull changes from the server
    return new ApiResponse(200, { message: 'Pull successful', changes: [] });
}

/**
 * Pushes the local changes from the client to the server.
 * The client should send all the changes that occurred locally since the last sync, and the server will process those changes and update its state accordingly.
 */
export const pushChanges: EndPointHandler = async (_request: FastifyRequest) => {
    // Implement logic to push changes to the server
    return new ApiResponse(200, { message: 'Push successful', changes: [] });
}
