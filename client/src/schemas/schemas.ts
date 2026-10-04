export type * from '@dakiya/schemas';

import { type DSchemaWith$id, type DTypeOf, type SchemaRegistry, UserSchemaValidator, type ValidationResult, type Validator } from '@dakiya/schemas';
import { loop } from '@dakiya/utils';


const VALIDATORS = {
    UserSchema: UserSchemaValidator,
    // Add more validators here
};

export type SchemaId = keyof typeof VALIDATORS;

export interface Schema<SI extends SchemaId = SchemaId, S extends DSchemaWith$id = DSchemaWith$id> {
    id: SI;

    isValid: (data: unknown) => data is DTypeOf<S>;
    validate: (data: unknown) => ValidationResult;
    deserialize: (json: string) => DTypeOf<S>;
    serialize: (data: DTypeOf<S>) => string;
}

export interface Schemas {
    getSchema<SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI, SchemaRegistry[SI]>;
    init(): void;
}

export const Schemas: Schemas = (() => {

    type V = Record<SchemaId, Validator<SchemaRegistry[SchemaId]>>;

    const scm: Schemas = Object.create(null);
    const registry: Record<SchemaId, Schema<SchemaId, SchemaRegistry[SchemaId]>> = Object.create(null)

    const buildSchema = <SI extends SchemaId = SchemaId>(schemaId: SI, validator: V[SI]): Schema<SI, SchemaRegistry[SI]> => {
        const sch: Schema<SI, SchemaRegistry[SI]> = Object.create(null);

        sch.id = schemaId;
        sch.isValid = validator.isValid as (data: unknown) => data is DTypeOf<SchemaRegistry[SI]>;
        sch.validate = validator.validate as (data: unknown) => ValidationResult;
        sch.deserialize = validator.deserialize as (json: string) => DTypeOf<SchemaRegistry[SI]>;
        sch.serialize = validator.serialize as (data: DTypeOf<SchemaRegistry[SI]>) => string;

        return Object.freeze(sch);
    }

    scm.init = () => {
        loop(VALIDATORS as V, (validator, id) => {
            registry[id] = buildSchema(id,validator);
        });
        Object.freeze(registry);
    };

    scm.getSchema = <SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI, SchemaRegistry[SI]> => {
        const s = registry[schemaId];
        if(s) return s as Schema<SI, SchemaRegistry[SI]>;
        throw new Error(`Schema with id '${schemaId}' not found.`);
    };

    return Object.freeze(scm);
})();
