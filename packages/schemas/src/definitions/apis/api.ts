import { type DArray, type DBoolean, type DHlc, type DNonEmptyObject, type DObject, type DObjectOptionsWithId, type DOptional, type DProperties, type DSchema, type DSchemaWith$id, type DString, DType, type DUuid } from "../../core";

export interface DApiError extends DSchemaWith$id, DObject<{
    requestId: DUuid;
    code: DString;
    message: DString;
    issues: DOptional<DArray<DObject<{ field: DString; message: DString }>>>;
}> {}

export interface DApiResponse<D extends DSchema, M extends DSchema = DSchema> extends DSchemaWith$id, DObject<{
    data: D;
    pagination: DOptional<DObject<{
        cursor: DHlc;
        hasMore: DBoolean;
    }>>;
    meta: DOptional<M>;
}> {}

export interface DApiQuery<P extends DProperties> extends DSchemaWith$id, DObject<P> {}

export interface ApiSchema {
    query<P extends DProperties>(properties: DNonEmptyObject<P>, options: DObjectOptionsWithId): DApiQuery<P>;
    success<D extends DSchema, M extends DSchema>(dataSchema: D, options: { $id: string; metaSchema?: M; pagination?: boolean; description?: string }): DApiResponse<D, M>;
    error: () => DApiError;
}

export const ApiSchema: ApiSchema = /* @__PURE__ */ (() => {
    const api: ApiSchema = Object.create(null);

    api.query = <P extends DProperties>(properties: DNonEmptyObject<P>, options: DObjectOptionsWithId) => {
        return DType.Object(properties, options) as DApiQuery<P>;
    };

    api.success = <D extends DSchema, M extends DSchema>(dataSchema: D, options: { $id: string; metaSchema?: M; pagination?: boolean; description?: string }) => {
        const { $id, metaSchema, pagination = false, description = 'Success Response' } = options;
        return DType.Object({
            data: dataSchema,
            ...(pagination && { pagination: DType.Optional(DType.Object({ cursor: DType.Hlc(), hasMore: DType.Boolean() })) }),
            ...(metaSchema && { meta: DType.Optional(metaSchema) })
        }, { $id, description }) as DApiResponse<D, M>;
    };

    api.error = () => DType.Object({
        requestId: DType.Uuid(),
        code: DType.String(),
        message: DType.String(),
        issues: DType.Optional(
            DType.Array(
                DType.Object({
                    field: DType.String(),
                    message: DType.String()
                })
            )
        )
    }, { $id: 'ApiErrorSchema', description: 'Error Response'});

    return Object.freeze(api);
})();
