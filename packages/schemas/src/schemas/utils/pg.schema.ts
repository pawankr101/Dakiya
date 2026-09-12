import { type TObjectOptions, type TProperties, type TSchema, type TString, type TUnion, Type } from 'typebox';
import { EpochTimestampSchema, UUIDSchema } from './utility.schema';


export const JsonBSchema = ((s: TSchema | TSchema[], d: unknown) => {
    const schemas = Array.isArray(s) ? s : [s];
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
