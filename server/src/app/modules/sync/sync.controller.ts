import { ApiResponse } from "app/response";
import type { EndPointHandler } from "app/types";
import { pullChangesService } from "./sync.service";
import type { PullChangesQuery, PullChangesSuccess } from "./sync.type";


/**
 * Gets the changes from the server since the last sync.
 * The client should send the timestamp of the last successful sync, and the server will return all changes that occurred after that timestamp.
 */
export const pullChanges: EndPointHandler<{Querystring: PullChangesQuery}, PullChangesSuccess> = async (request) => {
    const { last_pulled_at } = request.query ?? {};
    const res = await pullChangesService('userId', last_pulled_at);
    return new ApiResponse(200, res);
}

/**
 * Pushes the local changes from the client to the server.
 * The client should send all the changes that occurred locally since the last sync, and the server will process those changes and update its state accordingly.
 */
export const pushChanges: EndPointHandler = async (_request) => {
    // Implement logic to push changes to the server
    return new ApiResponse(200, { message: 'Push successful', changes: {} });
}
