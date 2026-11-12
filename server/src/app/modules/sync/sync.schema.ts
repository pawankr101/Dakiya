import type { FastifySchema } from 'fastify';
import { Schemas } from '../../../schemas';

const TAGS = ['Synchronization'];

export const PullChangesSchema: FastifySchema = Schemas.route({
    tags: TAGS,
    summary: 'Pull changes',
    description: 'Pull changes from the server since the last pull time.',
    request: {
        query: 'SyncPullQuerySchema'
    },
    response: {
        200: 'SyncPullResponseSchema',
        401: 'ApiErrorSchema'
    }
});

export const PushChangesSchema: FastifySchema = Schemas.route({
    tags: TAGS,
    summary: 'Push changes',
    description: 'Push local changes to the server and receive any new changes since the last pull time.',
    request: {
        body: 'SyncPullResponseSchema' // placeholder for now, will be replaced with a proper schema for push changes
    },
    response: {
        200: 'SyncPullQuerySchema', // placeholder for now, will be replaced with a proper schema for push response
        401: 'ApiErrorSchema'
    }
});
