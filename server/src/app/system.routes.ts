import { Chrono } from "@dakiya/utils";
import type { FastifySchema } from "fastify";
import { Schemas } from "../schemas";
import { Nats } from "../services";
import { PG } from "../storage";
import { ApiResponse } from "./response";
import type { AppFastify, AppPlugin } from "./types";

const HealthSchema: FastifySchema = Schemas.route({
    tags: ['System'],
    summary: 'Liveliness and Readiness Probe',
    description: 'Verifies HTTP server Liveliness and active connections to Database and Cache.',
    response: {
        200: 'SystemHealthSuccessSchema',
    }
});

const healthHandler = async () => {
    await Promise.all([
        PG.ping(),
        Nats.ping()
    ]);
    return new ApiResponse(200, {
        healthy: true,
        timestamp: Chrono.now(),
        services: {
            postgres: { status: 'connected' },
            nats: { status: 'connected' }
        }
    });
};

const TimeSchema: FastifySchema = Schemas.route({
    tags: ['System'],
    summary: 'Get Server Time',
    description: 'Returns the current server time in Unix milliseconds time format.',
    response: {
        200: 'SystemTimeResponseSchema'
    }
});

const timeHandler = async () => {
    return new ApiResponse(200, {
        timestamp: Chrono.now()
    });
};

export const SystemRoutes: AppPlugin = async (fastify: AppFastify) => {
    fastify.get('/health', { schema: HealthSchema }, healthHandler);
    fastify.get('/time', { schema: TimeSchema }, timeHandler);
};
