import { Guards } from '@dakiya/utils';
import { type TObjectOptions, type TProperties, type TSchema, type TString, type TUnion, Type } from 'typebox';

export const EpochTimestampSchema = Type.Number({
    minimum: 0,
    description: 'Epoch timestamp in milliseconds',
    examples: [1620034828000, 1739168283000, 1783137704453]
});

export const UUIDSchema = Type.String({
    format: 'uuid',
    description: 'UUID v7 string',
    examples: ['01a015bd-eef4-706a-bb7d-6320b45fb90f', '01a015be-3aa6-738c-8b83-f252b80a223a'],
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
});

export const JsonBSchema = ((s: TSchema | TSchema[], d: unknown) => {
    const schemas = Guards.isArray<TSchema>(s) ? s : [s];
    return Type.Union([
        Type.String({
            minLength: 2,
            description: 'Stringified JSON'
        }),
        ...schemas
    ], {
        default: d,
        description: 'JSONB column that can store either a JSON string or a JSON object'
    })
}) as {
    <T extends TSchema, D = unknown>(schema: T, defaultValue?: D): TUnion<[TString, T]>;
    <T extends TSchema[], D = unknown>(schemas: [...T], defaultValue?: D): TUnion<[TString, ...T]>;
};

export const DBTableSchema = <Tp extends TProperties>(properties: Tp, options?: TObjectOptions) => Type.Object(
    {
        id: UUIDSchema,
        createdAt: EpochTimestampSchema,
        updatedAt: EpochTimestampSchema,
        hlc: Type.String(),
        ...properties
    }, {
        ...options
    }
);
