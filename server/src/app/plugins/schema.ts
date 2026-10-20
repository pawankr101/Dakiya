import { Exception, loop } from "@dakiya/utils";
import { fastifyPlugin } from "fastify-plugin";
import { type SchemaId, Schemas, SchemaValidationError } from "../../schemas";
import type { AppFastify, AppPlugin } from "../types";

interface FastifySchemaWithId {
    $id?: string;
    $ref?: string;
}

const resolveSchemaId = (schema: { $id?: string; $ref?: string }): SchemaId => {
    const id = schema.$id ?? schema.$ref;
    if (!id || !Schemas.has(id)) {
        throw new Exception(`Invalid or unregistered schema ID: '${id}'`, { code: "DAKIYA_SCHEMA_ERROR" });
    }
    return id;
};

export const GlobalSchemas: AppPlugin = fastifyPlugin(async (fastify: AppFastify) => {
    // Initialize the pre-compiled schema wrapper registry
    Schemas.init();

    // Register all JSON Schema ASTs with Fastify (enables $ref resolution & Swagger OpenAPI generation)
    loop(Schemas.getAll(), (schema) => {
        fastify.addSchema(schema.ast);
    });

    fastify.setValidatorCompiler(({ schema }) => {
        const schemaId = resolveSchemaId(schema as FastifySchemaWithId);
        const compiled = Schemas.getSchema(schemaId)

        return (data: unknown) => {
            const result = compiled.validate(data);
            if (result.valid) {
                return { value: data };
            }
            return { error: new SchemaValidationError(schemaId, result.issues) };
        };
    });

    fastify.setSerializerCompiler(({ schema }) => {
        const schemaId = resolveSchemaId(schema as FastifySchemaWithId);
        const compiled = Schemas.getSchema(schemaId);

        return (data: unknown) => compiled.serialize(data as Schemas.TypeOf<SchemaId>);
    });
});
