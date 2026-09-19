import type { SCHEMA_REGISTRY } from "../registry";
import type { DSchemaWith$id, DTypeOf } from "../schema";

type SchemaId = keyof typeof SCHEMA_REGISTRY;

class Schema<SI extends SchemaId = SchemaId, S extends DSchemaWith$id = DSchemaWith$id> {
    id: SI;
    schema: S;
    isValid: (data: unknown) => boolean;
    validate: (data: unknown) => { valid: boolean; errors?: Error[] };
    deserialize: <R extends DTypeOf<S>>(json: string) => R;
    serialize: <R extends DTypeOf<S>>(data: R) => string;
    constructor(id: SI, schema: S) {
        this.id = id;
        this.schema = schema;
        this.isValid = (_data: unknown) => false;
        this.validate = (_data: unknown) => ({ valid: false, errors: [new Error('')] });
        this.deserialize = (json: string) => JSON.parse(json);
        this.serialize = (data: unknown) => JSON.stringify(data);
    }
}

export interface SchemaManager<SI extends SchemaId> {
    getSchema: (id: SI) => Schema<SI, typeof SCHEMA_REGISTRY[SI]>;
    init: (schemas: SI[]) => void;
}
