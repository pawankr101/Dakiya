import { DType } from "../../core";

const ServiceStatusSchema = DType.Object({
    status: DType.Union([
        DType.Literal('connected'),
        DType.Literal('disconnected')
    ])
});

export const SystemHealthSuccessSchema = DType.Object({
    healthy: DType.Literal(true),
    timestamp: DType.Epoch(),
    services: DType.Object({
        postgres: ServiceStatusSchema,
        nats: ServiceStatusSchema
    })
}, { $id: 'SystemHealthSuccessSchema' });

export const SystemHealthErrorSchema = DType.Object({
    healthy: DType.Literal(false),
    timestamp: DType.Epoch(),
    error: DType.String()
}, { $id: 'SystemHealthErrorSchema' });

export const SystemTimeResponseSchema = DType.Object({
    timestamp: DType.Epoch()
}, { $id: 'SystemTimeResponseSchema' });
