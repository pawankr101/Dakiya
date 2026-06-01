import { sendErrorResponse } from "app/utils/helper.js";
import type { FastifyReply, FastifyRequest } from "fastify";


/**
 * Gets the changes from the server since the last sync.
 * The client should send the timestamp of the last successful sync, and the server will return all changes that occurred after that timestamp.
 */
export const pullChanges = async (_request: FastifyRequest, response: FastifyReply) => {
    try {
        // Implement logic to pull changes from the server
        return response.send({ message: 'Pull successful', changes: [] });
    } catch (error) {
        return sendErrorResponse(response, error);
    }
}

/**
 * Pushes the local changes from the client to the server.
 * The client should send all the changes that occurred locally since the last sync, and the server will process those changes and update its state accordingly.
 */
export const pushChanges = async (_request: FastifyRequest, response: FastifyReply) => {
    try {
        // Implement logic to push changes to the server
        return response.send({ message: 'Push successful', changes: [] });
    } catch (error) {
        return sendErrorResponse(response, error);
    }
}
