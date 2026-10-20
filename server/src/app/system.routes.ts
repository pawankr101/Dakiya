import { Chrono } from "@dakiya/utils";
import type { FastifyReply, FastifyRequest, FastifySchema } from "fastify";
import { Schemas } from "../schemas";
import { Nats } from "../services";
import { PG } from "../storage";
import type { AppFastify, AppPlugin } from "./types";

const HealthSchema: FastifySchema = Schemas.route({
    tags: ['System'],
    summary: 'Liveliness and Readiness Probe',
    description: 'Verifies HTTP server Liveliness and active connections to Database and Cache.',
    response: {
        200: 'SystemHealthSuccessSchema',
        503: 'SystemHealthErrorSchema'
    }
});

const healthHandler = async (_request: FastifyRequest, response: FastifyReply) => {
    try {
        await Promise.all([
            PG.ping(),
            Nats.ping()
        ]);
        response.code(200);
        return {
            healthy: true,
            timestamp: Chrono.isoNow(),
            services: {
                postgres: { status: 'connected' },
                nats: { status: 'connected' }
            }
        };
    } catch (error) {
        response.code(503);
        return {
            healthy: false,
            timestamp: Chrono.now(),
            error: (error as Error).message || 'Service Unavailable'
        };
    }
};

const TimeSchema: FastifySchema = Schemas.route({
    tags: ['System'],
    summary: 'Get Server Time',
    description: 'Returns the current server time in Unix milliseconds time format.',
    response: {
        200: 'SystemTimeResponseSchema'
    }
});

const timeHandler = async (_request: FastifyRequest, response: FastifyReply) => {
    response.code(200);
    return {
        timestamp: Chrono.now()
    };
};

export const SystemRoutes: AppPlugin = async (fastify: AppFastify) => {
    fastify.get('/health', { schema: HealthSchema }, healthHandler);
    fastify.get('/time', { schema: TimeSchema }, timeHandler);
};
