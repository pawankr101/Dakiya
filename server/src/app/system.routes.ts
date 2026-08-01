import { Chrono } from "@dakiya/shared";
import type { FastifyReply, FastifyRequest, FastifySchema } from "fastify";
import { Type } from "typebox";
import { Nats } from "../services";
import { PG } from "../storage";
import type { AppFastify, AppPlugin } from "./types";

const ServiceStatusSchema = Type.Object({
    status: Type.Union([
        Type.Literal('connected'),
        Type.Literal('disconnected')
    ])
});

const HealthSchma: FastifySchema = {
    tags: ['System'],
    summary: 'Liveness and Readiness Probe',
    description: 'Verifies HTTP server liveness and active connections to Database and Cache.',
    response: {
        200: Type.Object({
            healthy: Type.Literal(true),
            timestamp: Type.String({ format: 'date-time' }),
            services: Type.Object({
                postgres: ServiceStatusSchema,
                nats: ServiceStatusSchema
            })
        }),
        503: Type.Object({
            healthy: Type.Literal(false),
            timestamp: Type.String({ format: 'date-time' }),
            error: Type.String()
        })
    }
};

const healthHandler = async (_request: FastifyRequest, response: FastifyReply) => {
    try {
        await Promise.all([
            PG.ping(),
            Nats.ping()
        ]);
        response.send({
            healthy: true,
            timestamp: Chrono.isoNow(),
            services: {
                postgres: { status: 'connected' },
                nats: { status: 'connected' }
            }
        });
    } catch (error) {
        response.status(503).send({
            healthy: false,
            timestamp: Chrono.isoNow(),
            error: (error as Error).message || 'Service Unavailable'
        });
    }

};

const TimeSchema: FastifySchema = {
    tags: ['System'],
    summary: 'Get Server Time',
    description: 'Returns the current server time in Unix milliseconds time format.',
    response: {
        200: Type.Object({
            timestamp: Type.Number()
        })
    }
};

const timeHandler = async (_request: FastifyRequest, response: FastifyReply) => {
    response.send({
        timestamp: Chrono.now()
    });
};

export const SystemRoutes: AppPlugin = async (fastify: AppFastify) => {
    fastify.get('/health', { schema: HealthSchma }, healthHandler);
    fastify.get('/time', { schema: TimeSchema }, timeHandler);
};
