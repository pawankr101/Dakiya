import { DType } from "../../core";
import { ApiSchema } from "./api";

const ServiceStatusSchema = DType.Object({
    status: DType.Union([
        DType.Literal('connected'),
        DType.Literal('disconnected')
    ])
});

export const SystemHealthSuccessSchema = ApiSchema.success(DType.Object({
    healthy: DType.Literal(true),
    timestamp: DType.Epoch(),
    services: DType.Object({
        postgres: ServiceStatusSchema,
        nats: ServiceStatusSchema
    })
}), { $id: 'SystemHealthSuccessSchema', description: 'System Health Check Success Response Schema' });

export const SystemTimeResponseSchema = ApiSchema.success(DType.Object({
    timestamp: DType.Epoch()
}), { $id: 'SystemTimeResponseSchema', description: 'System Time Response Schema' });
