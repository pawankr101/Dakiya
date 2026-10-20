export { SchemaValidationError } from '@dakiya/schemas';

import {
    ApiErrorSchemaValidator,
    ApiErrorWithIssuesSchemaValidator,
    ConversationMemberSchemaValidator,
    ConversationSchemaValidator,
    DeviceSchemaValidator,
    type DTypeOf,
    MessageExclusionSchemaValidator,
    MessageReactionSchemaValidator,
    MessageSchemaValidator,
    type SchemaRegistry,
    SyncPullQuerySchemaValidator,
    SyncPullResponseSchemaValidator,
    SystemHealthErrorSchemaValidator,
    SystemHealthSuccessSchemaValidator,
    SystemTimeResponseSchemaValidator,
    UserRelationshipSchemaValidator,
    UserSchemaValidator,
    UserSettingsSchemaValidator,
    type ValidationResult,
    type Validator
} from '@dakiya/schemas';
import { Dictionary, freeze, type HttpCode, loop } from '@dakiya/utils';
import type { FastifySchema } from 'fastify';

const VALIDATORS = {
    // Server Entities
    UserSchema: UserSchemaValidator,
    UserSettingsSchema: UserSettingsSchemaValidator,
    DeviceSchema: DeviceSchemaValidator,
    UserRelationshipSchema: UserRelationshipSchemaValidator,
    ConversationSchema: ConversationSchemaValidator,
    ConversationMemberSchema: ConversationMemberSchemaValidator,
    MessageSchema: MessageSchemaValidator,
    MessageExclusionSchema: MessageExclusionSchemaValidator,
    MessageReactionSchema: MessageReactionSchemaValidator,

    // API Schemas
    ApiErrorSchema: ApiErrorSchemaValidator,
    ApiErrorWithIssuesSchema: ApiErrorWithIssuesSchemaValidator,
    SyncPullQuerySchema: SyncPullQuerySchemaValidator,
    SyncPullResponseSchema: SyncPullResponseSchemaValidator,
    SystemHealthSuccessSchema: SystemHealthSuccessSchemaValidator,
    SystemHealthErrorSchema: SystemHealthErrorSchemaValidator,
    SystemTimeResponseSchema: SystemTimeResponseSchemaValidator
} as const;

export type SchemaId = keyof typeof VALIDATORS;

export interface Schema<SI extends SchemaId = SchemaId> {
    id: SI;
    ast: SchemaRegistry[SI];

    isValid: (data: unknown) => data is DTypeOf<SchemaRegistry[SI]>;
    validate: (data: unknown) => ValidationResult;
    deserialize: (json: string) => DTypeOf<SchemaRegistry[SI]>;
    serialize: (data: DTypeOf<SchemaRegistry[SI]>) => string;
}

export interface RouteSchema {
    /** Groups the endpoint in Swagger UI */
    tags: string[];
    /** A short title for the endpoint */
    summary: string;
    /** Detailed explanation of what the endpoint does */
    description?: string;

    /** SchemaId for request headers */
    headers?: SchemaId;

    /** SchemaId for request body, query parameters, and path parameters */
    request?: {
        body?: SchemaId;
        query?: SchemaId;
        params?: SchemaId;
    }

    /** SchemaId for response body, keyed by HTTP status code */
    response: Record<200, SchemaId> & Partial<Record<Exclude<HttpCode, 200 | 400 | 404 | 500>, SchemaId>>
}

interface SchemaRef<SI extends SchemaId = SchemaId> { $ref: SI };

interface Schemas {
    init(): void;
    has(schemaId: string): schemaId is SchemaId;
    getSchema<SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI>;
    ref<SI extends SchemaId = SchemaId>(schemaId: SI): SchemaRef<SI>;
    getAll(): Schema<SchemaId>[];
    route(def: RouteSchema): FastifySchema;

}

export const Schemas: Schemas = /* @__PURE__ */ (() => {
    type V = Record<SchemaId, Validator<SchemaRegistry[SchemaId]>>;

    const scm: Schemas = Object.create(null);
    const registry: Dictionary<Schema<SchemaId>, SchemaId> = new Dictionary();

    const buildSchema = <SI extends SchemaId = SchemaId>(schemaId: SI, validator: V[SI]): Schema<SI> => {
        const sch: Schema<SI> = Object.create(null);

        sch.id = schemaId;
        sch.ast = freeze(validator.getAst()) as SchemaRegistry[SI];
        sch.isValid = validator.isValid as (data: unknown) => data is DTypeOf<SchemaRegistry[SI]>;
        sch.validate = validator.validate as (data: unknown) => ValidationResult;
        sch.deserialize = validator.deserialize as (json: string) => DTypeOf<SchemaRegistry[SI]>;
        sch.serialize = validator.serialize as (data: DTypeOf<SchemaRegistry[SI]>) => string;

        return Object.freeze(sch);
    };

    scm.init = /* @__PURE__ */ (() => {
        let initialized = false;
        return () => {
            if (initialized) return;
            initialized = true;
            loop(VALIDATORS as V, (validator, id) => {
                registry.set(id, buildSchema(id, validator));
            });
        }
    })();

    scm.has = (schemaId: string): schemaId is SchemaId => {
        return registry.has(schemaId as SchemaId);
    };

    scm.getSchema = <SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI> => {
        const s = registry.get(schemaId);
        if (s) return s as Schema<SI>;
        throw new Error(`Schema with id '${schemaId}' not found.`);
    };

    scm.ref = <SI extends SchemaId = SchemaId>(schemaId: SI) => ({ $ref: schemaId });

    scm.getAll = (): Schema<SchemaId>[] => {
        return registry.items();
    };

    scm.route = (def: RouteSchema): FastifySchema => {
        const schema: FastifySchema = Object.create(null);

        schema.tags = def.tags;
        schema.summary = def.summary;
        if (def.description) schema.description = def.description;

        if (def.headers) schema.headers = Schemas.ref(def.headers);

        const { body, query, params } = def.request || {};
        if (body) schema.body = Schemas.ref(body);
        if (query) schema.querystring = Schemas.ref(query);
        if (params) schema.params = Schemas.ref(params);

        const response: Record<HttpCode, SchemaRef<SchemaId>> = Object.create(null);
        loop(def.response as Record<HttpCode, SchemaId>, (schemaId, statusCode) => {
            response[statusCode] = Schemas.ref(schemaId);
        });
        response[400] = Schemas.ref('ApiErrorWithIssuesSchema');
        response[404] = Schemas.ref('ApiErrorSchema');
        response[500] = Schemas.ref('ApiErrorSchema');
        schema.response = response;

        return schema;
    };

    return Object.freeze(scm);
})();

export namespace Schemas {
    export type TypeOf<SI extends SchemaId = SchemaId> = DTypeOf<SchemaRegistry[SI]>;
}
