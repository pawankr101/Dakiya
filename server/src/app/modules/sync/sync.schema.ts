import type { FastifySchema } from 'fastify';

const TAGS = ['Synchronization'] as const;

export const PullChangesSchema: FastifySchema = {
    summary: 'Pull changes',
    description: 'Pull changes from the server since the last pull time.',
    tags: TAGS,
    querystring: "ApiQuerySchema",
    response: {
        200: "ApiResponseSchema",
        400: "ApiErrorSchema",
        401: "ApiErrorSchema",
        404: "ApiErrorSchema",
        500: "ApiErrorSchema"
    }
};

export const PushChangesSchema: FastifySchema = {
    summary: 'Push changes',
    description: 'Push local changes to the server and receive any new changes since the last pull time.',
    tags: TAGS,
    body: "ApiBodySchema",
    response: {
        200: "ApiResponseSchema",
        400: "ApiErrorSchema",
        401: "ApiErrorSchema",
        404: "ApiErrorSchema",
        500: "ApiErrorSchema"
    }
};
