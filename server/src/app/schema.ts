import { type TArray, type TObject, type TSchema, type TString, Type } from "typebox";

export const buildApiResponseSchema = <T extends TSchema, M extends TSchema>(dataSchema: T, metaSchema?: M) => {
    return Type.Object({
        data: dataSchema,
        ...(metaSchema && { meta: Type.Optional(metaSchema) })
    })
};


export const buildApiErrorSchema = <I extends TArray<TObject<{ message: TString }>>>(issuesSchema?: I) => {
    return Type.Object({
        requestId: Type.String({ format: 'uuid' }),
        code: Type.String(),
        message: Type.String(),
        ...(issuesSchema && { issues: Type.Optional(issuesSchema) })
    });
}
