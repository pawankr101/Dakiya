import { type Static, type TArray, type TBoolean, type TFormat, type TIntersect, type TLiteral, type TNumber, type TObject, type TOptional, type TSchema, type TSchemaOptions, type TString, type TUnion, Type } from 'typebox'

export interface DSchema extends TSchema {}

export interface DSchemaWith$id extends DSchema {
    $id: string;
}

export interface DString extends TString {}
export interface DNumber extends TNumber {}
export interface DBoolean extends TBoolean {}
export interface DLiteral<T extends string | number | boolean> extends TLiteral<T> {}

export interface DProperties extends DSchema {
    [key: PropertyKey]: DSchema | DUnion<DArrayOfMin2<DSchema>> | DIntersection<DArrayOfMin2<DSchema>>;
}
export interface DObject<P extends DProperties = DProperties> extends TObject<P> {}
export interface DArray<T extends DSchema = DSchema> extends TArray<T> {}

export type DOptional<T extends DSchema = DSchema> = TOptional<T>;
export interface DUnion<T extends DArrayOfMin2<DSchema>> extends TUnion<T> {}
export interface DIntersection<T extends DArrayOfMin2<DSchema>> extends TIntersect<T> {}

export interface DUuid extends DString {}
export interface DEpoch extends DNumber {}
export interface DHlc extends DString {}

type DJsonBBodySchema = DSchemaWith$id | DUnion<DArrayOfMin2<DSchemaWith$id>> | DIntersection<DArrayOfMin2<DSchemaWith$id>>;
export interface DJsonB<T extends DJsonBBodySchema> extends DUnion<[DString, T]> {}

export type DDbTableBaseProperties = {
    id: DUuid;
    createdAt: DEpoch;
    updatedAt: DEpoch;
    hlc: DHlc;
}

type DObjectWithoutTableBaseProperties = DObject<DProperties & { [K in keyof DDbTableBaseProperties]?: never }>
type DDbTableBodySchema = DObjectWithoutTableBaseProperties | DUnion<DArrayOfMin2<DDbTableBodySchema>> | DIntersection<DArrayOfMin2<DDbTableBodySchema>>;

export interface DDbTable<S extends DDbTableBodySchema> extends DSchemaWith$id, DIntersection<[DObject<DDbTableBaseProperties>, S]>  {}

export interface DSchemaOptions extends TSchemaOptions {}

export interface DStringOptions extends DSchemaOptions {
    /**
     * Specifies the expected string format. May also be a custom format string.
     */
    format?: TFormat;
    /**
     * Specifies the minimum number of characters allowed in the string.
     * Must be a non-negative integer.
     */
    minLength?: number;
    /**
     * Specifies the maximum number of characters allowed in the string.
     * Must be a non-negative integer.
     */
    maxLength?: number;
}

export interface DNumberOptions extends DSchemaOptions {
    /**
     * Specifies an inclusive upper limit for the number (number must be less than or equal to this value).
     */
    maximum?: number;
    /**
     * Specifies an inclusive lower limit for the number (number must be greater than or equal to this value).
     */
    minimum?: number;
}

export interface DObjectOptions extends Omit<DSchemaOptions, '$id'> {
    /**
     * Defines whether additional properties are allowed beyond those explicitly defined in `properties`.
     */
    additionalProperties?: DSchema | boolean;
}

export interface DObjectOptionsWithId extends DObjectOptions {
    /**
     * A URI that serves as a unique identifier for the schema.
     */
    $id: string;
}

export interface DArrayOptions extends DSchemaOptions {
    /**
     * Specifies the minimum number of items allowed in the array.
     * Must be a non-negative integer.
     */
    minItems?: number;
    /**
     * Specifies the maximum number of items allowed in the array.
     * Must be a non-negative integer.
     */
    maxItems?: number;
    /**
     * If `true`, all items in the array must be unique.
     */
    uniqueItems?: boolean;
}

export interface DArrayOptionsWithId extends DArrayOptions {
    /**
     * A URI that serves as a unique identifier for the schema.
     */
    $id: string;
}

export interface DJsonBOptions<S extends DSchema> {
    /**
     * A default value for the data, used when no value is provided.
     */
    default?: string | Static<S>;
}

export interface DDbTableOptions extends DSchemaOptions {
    /**
     * A URI that serves as a unique identifier for the schema.
     */
    $id: string;
}

type DNonEmptyObject<T extends {}> = keyof T extends never ? never : T;
type DArrayOfMin2<T> = [T, T, ...T[]];

export interface DType {
    String(options?: DStringOptions): DString;
    Number(options?: DNumberOptions): DNumber;
    Boolean(options?: DSchemaOptions): DBoolean;
    Literal<T extends string | number | boolean>(value: T, options?: DSchemaOptions): DLiteral<T>;

    Object<P extends DProperties>(properties: DNonEmptyObject<P>, options: DObjectOptionsWithId): DObject<P> & DSchemaWith$id;
    Object<P extends DProperties>(properties: DNonEmptyObject<P>, options?: DObjectOptions): DObject<P>;
    Array<T extends DSchema>(item: T, options: DArrayOptionsWithId): DArray<T> & DSchemaWith$id;
    Array<T extends DSchema>(item: T, options?: DArrayOptions): DArray<T>;

    Optional<T extends DSchema>(type: T): DOptional<T>;
    Union<T extends DArrayOfMin2<DSchema>>(anyOf: T, options?: DSchemaOptions): DUnion<T>;
    Intersection<T extends DArrayOfMin2<DSchema>>(allOf: T, options?: DSchemaOptions): DIntersection<T>;

    Epoch(): DEpoch;
    Uuid(): DUuid;
    Hlc(): DHlc;
    JsonB<S extends (DArray & DSchemaWith$id)>(schema: S, options?: DJsonBOptions<S>): DJsonB<S>;
    JsonB<P extends DProperties>(schema: DObject<P> & DSchemaWith$id, options?: DJsonBOptions<DObject<P> & DSchemaWith$id>): DJsonB<DObject<P> & DSchemaWith$id>;
    DbTable<S extends DDbTableBodySchema>(schema: S, options: DDbTableOptions): DDbTable<S>;
};

export const DType = (() => {
    const DTypeObj: DType = Object.create(null);

    DTypeObj.String = (options) => Type.String(options);
    DTypeObj.Number = (options) => Type.Number(options);
    DTypeObj.Boolean = (options) => Type.Boolean(options);
    DTypeObj.Literal = (value, options) => Type.Literal(value, options);

    DTypeObj.Object = (<P extends DProperties>(properties: DNonEmptyObject<P>, options: DObjectOptionsWithId | DObjectOptions) => Type.Object(properties as {}, options)) as DType['Object'];
    DTypeObj.Array = (<T extends DSchema>(item: T, options: DArrayOptionsWithId | DArrayOptions) => Type.Array(item, options)) as DType['Array'];

    DTypeObj.Optional = (type) => Type.Optional(type) as DOptional<typeof type>;
    DTypeObj.Union = (anyOf, options) => Type.Union(anyOf, options) as DUnion<typeof anyOf>;
    DTypeObj.Intersection = (allOf, options) => Type.Intersect(allOf, options) as DIntersection<typeof allOf>;

    DTypeObj.Epoch = () => DTypeObj.Number({
        minimum: 0,
        description: 'Epoch timestamp in milliseconds',
        examples: [1620034828000, 1739168283000, 1783137704453]
    });
    DTypeObj.Uuid = () => DTypeObj.String({
        format: 'uuid',
        description: 'UUID v7 string',
        examples: ['01a015bd-eef4-706a-bb7d-6320b45fb90f', '01a015be-3aa6-738c-8b83-f252b80a223a']
    });
    DTypeObj.Hlc = () => DTypeObj.String({
        pattern: /^[0-9a-z]{9}-[0-9a-z]{4}-[0-9a-z]{15}$/,
        description: 'Hybrid Logical Clock string',
        examples: ['0mu8g758p-f442m-r8qj2l7k5m3n9p4', '0mu8hk6gt-t0pq-9v5j2l534m3nm8h']
    });
    DTypeObj.JsonB = <S extends DSchemaWith$id>(schema: S, options?: DJsonBOptions<S>) => {
        const { default: defaultValue } = options ?? {};
        return DTypeObj.Union([
            DTypeObj.String({ format: 'json-string', description: 'Stringified JSON' }),
            schema
        ], { default: defaultValue });
    };
    DTypeObj.DbTable = ((schema, options) => {
        return DTypeObj.Intersection([
            DTypeObj.Object({
                id: DTypeObj.Uuid(),
                createdAt: DTypeObj.Epoch(),
                updatedAt: DTypeObj.Epoch(),
                hlc: DTypeObj.Hlc()
            }),
            schema
        ], options);
    }) as DType['DbTable'];

    return Object.freeze(DTypeObj);
})();

export type DTypeOf<T> = Static<T>;
