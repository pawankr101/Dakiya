import type { FastifyError } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { Schemas, SchemaValidationError } from "../../schemas";
import { ApiException } from "../exception";
import { ApiResponse } from "../response";
import type { AppFastify, AppPlugin } from "../types";

export const ApiResponder: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {

    fastify.addHook('preSerialization', async (_request, response, payload) => {
        if (payload instanceof ApiResponse) {
            response.code(payload.status);
            return {
                data: payload.data,
                ...(payload.pagination && { pagination: payload.pagination }),
                ...(payload.meta && { meta: payload.meta })
            };
        }
        return payload;
    });

    fastify.setNotFoundHandler(async (request, response) => {
        response.code(404);
        return {
            requestId: request.id,
            code: 'ROUTE_NOT_FOUND',
            message: `The requested route '${request.method} ${request.url}' was not found on the server.`
        };
    });

    fastify.setErrorHandler(async (error: FastifyError, request, response) => {
        const requestId = request.id;

        // Incoming request validation errors
        if (error.validation instanceof SchemaValidationError) {
            response.code(400);
            return {
                requestId,
                code: 'DAKIYA_VALIDATION_ERROR',
                message: error.validationContext
                    ? `Validation Failed for request ${error.validationContext}.`
                    : error.validation.message,
                issues: error.validation.issues
            };
        }

        // Outgoing response serialization errors
        if (error instanceof SchemaValidationError) {
            response.code(500);

            // Log the exact schema issues so your backend team can fix the route handler
            console.error(`[Serialization Error] Route ${request.url} failed to match ${error.schemaId}:`, error.issues);

            return {
                requestId,
                code: 'INTERNAL_SERVER_ERROR',
                message: 'The server attempted to send an invalid response payload.'
            };
        }

        // Shared ApiException
        if (error instanceof ApiException) {
            response.code(error.httpCode);
            return {
                requestId,
                code: error.code,
                message: error.message,
                ...(error.issues && { issues: error.issues })
            };
        }

        // Unhandled System Exception
        response.code(500);
        return {
            requestId,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again later.'
        };
    });
});
