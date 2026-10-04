export type * from '@dakiya/schemas';

import { type DTypeOf, type SchemaRegistry, UserSchemaValidator, UserSettingsSchemaValidator, type ValidationResult, type Validator } from '@dakiya/schemas';
import { loop } from '@dakiya/utils';


const VALIDATORS = {
    UserSchema: UserSchemaValidator,
    UserSettingsSchema: UserSettingsSchemaValidator,
    // Add more validators here
};

export type SchemaId = keyof typeof VALIDATORS;

export interface Schema<SI extends SchemaId = SchemaId> {
    id: SI;
    ast: SchemaRegistry[SI];

    isValid: (data: unknown) => data is DTypeOf<SchemaRegistry[SI]>;
    validate: (data: unknown) => ValidationResult;
    deserialize: (json: string) => DTypeOf<SchemaRegistry[SI]>;
    serialize: (data: DTypeOf<SchemaRegistry[SI]>) => string;
}

export interface Schemas {
    getSchema<SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI>;
    init(): void;
}

export const Schemas: Schemas = (() => {

    type V = Record<SchemaId, Validator<SchemaRegistry[SchemaId]>>;

    const scm: Schemas = Object.create(null);
    const registry: Record<SchemaId, Schema<SchemaId>> = Object.create(null)

    const buildSchema = <SI extends SchemaId = SchemaId>(schemaId: SI, validator: V[SI]): Schema<SI> => {
        const sch: Schema<SI> = Object.create(null);

        sch.id = schemaId;
        sch.ast = validator.getAst() as SchemaRegistry[SI];
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

    scm.getSchema = <SI extends SchemaId = SchemaId>(schemaId: SI): Schema<SI> => {
        const s = registry[schemaId];
        if(s) return s as Schema<SI>;
        throw new Error(`Schema with id '${schemaId}' not found.`);
    };

    return Object.freeze(scm);
})();
