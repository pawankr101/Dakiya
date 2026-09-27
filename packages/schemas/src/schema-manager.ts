import type { ValidationResult, Validator } from './__precompiled__';
import * as Precompiled from "./__precompiled__";
import { SCHEMA_REGISTRY, type SchemaId, type SchemaRegistry } from "./registry";
import type { DSchemaWith$id, DTypeOf } from "./schema";

export class Schema<SI extends SchemaId = SchemaId, S extends DSchemaWith$id = DSchemaWith$id> {
    id: SI;
    schema: S;

    // Wire up the exact signatures from the AOT compiler
    isValid: (data: unknown) => data is DTypeOf<S>;
    validate: (data: unknown) => ValidationResult;
    deserialize: (json: string) => DTypeOf<S>;
    serialize: (data: DTypeOf<S>) => string;

    constructor(id: SI, schema: S) {
        this.id = id;
        this.schema = schema;

        // Extract the specific AOT validator for this schema ID
        const validator = Precompiled[`${id}Validator`] as Validator<S>;

        if (!validator) {
            throw new Error(`AOT Validator for '${id}' not found. Ensure compiler.ts ran successfully.`);
        }

        this.isValid = validator.isValid;
        this.validate = validator.validate;
        this.deserialize = validator.deserialize;
        this.serialize = validator.serialize;
    }
}

export class SchemaManager<SI extends SchemaId> {
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = globalThis.crypto.randomUUID();

    private constructor(schemas: SI[], privateHash: string) {
        if(privateHash!==SchemaManager.#staticHash) throw new Error(`'SchemaManager' class constructor can not be called from outside.`);
        this.#loadSchemas(schemas);
    }

    #loadedSchemas = new Map<SI, Schema<SI, SchemaRegistry[SI]>>();

    #loadSchemas = (schemas: SI[]): void => {
        for (const id of schemas) {
            const schemaDef = SCHEMA_REGISTRY[id];
            this.#loadedSchemas.set(id, new Schema(id, schemaDef));
        }
    }

    getSchema(id: SI): Schema<SI, SchemaRegistry[SI]> {
        const schema = this.#loadedSchemas.get(id);
        if (!schema) {
            throw new Error(`Schema '${id}' has not been initialized in the SchemaManager.`);
        }
        return schema;
    }

    static init = (() => {
        let manager: SchemaManager<SchemaId> | null = null
        return (schemas: SchemaId[]): SchemaManager<SchemaId> => {
            if(!manager) {
                manager = new SchemaManager(schemas, SchemaManager.#staticHash);
            }
            return manager;
        }
    })();
}
