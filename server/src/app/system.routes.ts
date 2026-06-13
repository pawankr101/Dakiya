import type { FastifyInstance, FastifyPluginAsync, FastifyReply, FastifyRequest, FastifySchema } from "fastify";
import { Type } from "typebox";
import { Nats } from "../services";
import { PG } from "../storage";


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
            timestamp: new Date().toISOString(),
            services: {
                postgres: { status: 'connected' },
                nats: { status: 'connected' }
            }
        });
    } catch (error) {
        response.status(503).send({
            healthy: false,
            timestamp: new Date().toISOString(),
            error: (error as Error).message || 'Service Unavailable'
        });
    }

};

export const SystemRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.get('/health', { schema: HealthSchma }, healthHandler);
};
