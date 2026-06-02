import { mapLoop } from "@dakiya/shared";
import type { FastifyError, FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { fastifyPlugin } from "fastify-plugin";
import { ApiException } from "../exception";
import { ApiResponse } from "../response";

export const ApiResponder: FastifyPluginAsync = fastifyPlugin(async (fastify) => {

    fastify.addHook('preSerialization', (_request: FastifyRequest, response: FastifyReply, payload: unknown) => {
        if (payload instanceof ApiResponse) {
            response.code(payload.status);
            return {
                data: payload.data,
                ...(payload.meta && { meta: payload.meta })
            }
        }
        return payload;
    });

    fastify.setNotFoundHandler((request: FastifyRequest, response: FastifyReply) => {
        response.code(404);
        return {
            requestId: request.id,
            code: 'ROUTE_NOT_FOUND',
            message: `The requested route '${request.method} ${request.url}' was not found on the server.`
        };
    });

    fastify.setErrorHandler((error: FastifyError, request: FastifyRequest, response: FastifyReply) => {
        const requestId = request.id;

        // Scenario A: Fastify Validation
        if (error.validation) {
            response.code(400);
            return {
                requestId,
                code: 'DAKIYA_VALIDATION_ERROR',
                message: error.validationContext ? `Validation Failed for request ${error.validationContext}.` : 'The request inputs are invalid.',
                issues: mapLoop(error.validation, (valErr) => ({
                    field: valErr.instancePath.substring(1) || valErr.params.missingProperty || 'unknown',
                    message: valErr.message
                }))
            };
        }

        // Scenario B: Using your shared APIException!
        if (error instanceof ApiException) {
            response.code(error.httpCode);
            return {
                requestId,
                code: error.code,
                message: error.message,
                ...(error.issues && {issues: error.issues})
            }
        }

        // Scenario C: Unhandled System Exception
        response.code(500);
        return {
            requestId,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred. Please try again later.'
        };
    });
});
