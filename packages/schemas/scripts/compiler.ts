/// <reference types="node" />
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    type TArray, type TBoolean, type TInteger, type TIntersect, type TNumber,
    type TObject, type TSchema, type TString, type TUnion, Type,
} from 'typebox';
import { Code } from 'typebox/compile';

import {
    UserSchema, UserSettingsSchema, DeviceSchema, UserRelationshipSchema,
    LabelsAndCirclesSchema, UserSettingsNotificationsSchema, UserSettingsPrivacySchema,
    UserSettingsBackupSchema, UserSettingsAccountSchema, DeviceChatPrefsSchema, DeviceNotificationPrefsSchema,

    ConversationSchema, ConversationMemberSchema,
    GroupMetadataSchema, ChannelMetadataSchema, SystemMetadataSchema, ConversationMemberChatPrefsSchema,

    MessageSchema, MessageReactionSchema, MessageExclusionSchema,
    TextContentSchema, ImageContentSchema, VideoContentSchema, AudioContentSchema, DocumentContentSchema, ContactContentSchema,
    LocationContentSchema, PollContentSchema, EventContentSchema, SystemContentSchema, DeleteContentSchema
} from '../src/schemas/schemas-with-id';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function escapeStr(str: string): string {
    let out = '"';
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        const code = str.charCodeAt(i);
        switch (c) {
            case '\\': out += '\\\\'; break;
            case '"':  out += '\\"';  break;
            case '\b': out += '\\b';  break;
            case '\f': out += '\\f';  break;
            case '\n': out += '\\n';  break;
            case '\r': out += '\\r';  break;
            case '\t': out += '\\t';  break;
            default:
                if (
                    code < 0x20 ||
                    code === 0x2028 ||
                    code === 0x2029 ||
                    (code >= 0xD800 && code <= 0xDFFF)
                ) {
                    out += `\\u${code.toString(16).padStart(4, '0')}`;
                } else {
                    out += c;
                }
        }
    }
    return `${out}"`;
}

// --- STRICT AST TYPE GUARDS ---

function isObjectSchema(schema: unknown): schema is TObject {
    if (typeof schema !== 'object' || schema === null) return false;
    const s = schema as Record<string, unknown>;
    return (
        s.type === 'object' &&
        typeof s.properties === 'object' &&
        s.properties !== null &&
        !Array.isArray(s.properties)
    );
}

function isIntersectSchema(schema: TSchema): schema is TIntersect {
    return Array.isArray((schema as Record<string, unknown>).allOf);
}

function isUnionSchema(schema: TSchema): schema is TUnion {
    return Array.isArray((schema as Record<string, unknown>).anyOf);
}

function isArraySchema(schema: TSchema): schema is TArray {
    const s = schema as Record<string, unknown>;
    return (
        s.type === 'array' &&
        'items' in s &&
        typeof s.items === 'object' &&
        s.items !== null &&
        !Array.isArray(s.items)
    );
}

function isTupleSchema(schema: TSchema): schema is TArray {
    const s = schema as Record<string, unknown>;
    return s.type === 'array' && Array.isArray(s.items) && s.items.length > 0;
}

function isNullSchema(schema: TSchema): boolean {
    return (schema as Record<string, unknown>).type === 'null';
}

// --- LITERAL EXTRACTION ---

type LiteralValue = string | number | boolean | null;

function getLiteralValue(schema: TSchema | undefined): LiteralValue | undefined {
    if (!schema) return undefined;
    const s = schema as Record<string, unknown>;
    if ('const' in s && s.const !== undefined) return s.const as LiteralValue;
    if ('enum' in s && Array.isArray(s.enum) && s.enum.length === 1) {
        return s.enum[0] as LiteralValue;
    }
    return undefined;
}

// Returns the set of literal values a discriminator may take.
// Handles both `Type.Literal("x")` and `Type.Union([Literal("x"), Literal("y")])`.
function getDiscriminatorValues(schema: TSchema | undefined): LiteralValue[] {
    if (!schema) return [];
    const single = getLiteralValue(schema);
    if (single !== undefined) return [single];
    if (isUnionSchema(schema)) {
        const out: LiteralValue[] = [];
        for (const v of schema.anyOf) {
            const lit = getLiteralValue(v);
            if (lit === undefined) return [];   // not a pure literal union
            out.push(lit);
        }
        return out;
    }
    return [];
}

// --- STRICT UTILITY EXTRACTORS ---

export function extractProperty(schema: TSchema, propName: string): TSchema {
    const found = collectProperty(schema, propName);
    if (found.length === 0) {
        throw new Error(`[AOT Compiler] Property "${propName}" not found in provided schema.`);
    }
    if (found.length === 1) return found[0];
    return Type.Intersect(found as [TSchema, ...TSchema[]]);
}

function collectProperty(schema: TSchema, propName: string): TSchema[] {
    if (isObjectSchema(schema) && schema.properties[propName]) {
        return [schema.properties[propName] as TSchema];
    }
    if (isIntersectSchema(schema)) {
        const out: TSchema[] = [];
        for (const sub of schema.allOf) out.push(...collectProperty(sub, propName));
        return out;
    }
    if (isUnionSchema(schema)) {
        const variants: TSchema[] = [];
        for (const variant of schema.anyOf) {
            if (!isObjectSchema(variant)) {
                throw new Error(`[AOT Compiler] Cannot extract "${propName}" from non-object union branch.`);
            }
            const property = variant.properties[propName];
            if (!property) {
                throw new Error(`[AOT Compiler] Property "${propName}" is missing from a union branch.`);
            }
            variants.push(property as TSchema);
        }
        return [variants.length === 1 ? variants[0] : Type.Union(variants as [TSchema, ...TSchema[]])];
    }
    return [];
}

// --- EMITTERS ---

// Produce JSON text for a primitive. Used by the generated stringifier.
function jsonText(v: LiteralValue): string {
    if (v === null)            return 'null';
    if (typeof v === 'string') return escapeStr(v);
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
    return v ? 'true' : 'false';
}

// Produce JS source that evaluates to the given JSON-ish value.
// Used only by the compiler (schema literals, options objects, dedupe keys).
function emitValue(v: unknown): string {
    if (v === null)             return 'null';
    if (v === undefined)        return 'undefined';
    if (typeof v === 'string')  return escapeStr(v);
    if (typeof v === 'number')  return Number.isFinite(v) ? String(v) : 'null';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (v instanceof RegExp) {
        throw new Error(
            `[AOT Compiler] Cannot emit RegExp via emitValue — patterns must be handled separately. Got: ${v.toString()}`
        );
    }
    if (Array.isArray(v)) return `[${v.map(emitValue).join(', ')}]`;
    if (typeof v === 'object') {
        const entries = Object.entries(v as Record<string, unknown>)
            .filter(([, val]) => val !== undefined);
        const body = entries
            .map(([k, val]) => `${escapeStr(k)}: ${emitValue(val)}`)
            .join(', ');
        return `{${body}}`;
    }
    throw new Error(`[AOT Compiler] Cannot emit value of type ${typeof v}`);
}

// --- STRINGIFIER PRIMITIVE DISPATCH ---

function typeofConditionFor(schema: TSchema, dataPath: string): string {
    const lit = getLiteralValue(schema);
    if (lit !== undefined) return `${dataPath} === ${emitValue(lit)}`;
    if (isNullSchema(schema)) return `${dataPath} === null`;
    const t = (schema as Record<string, unknown>).type;
    switch (t) {
        case 'string':  return `typeof ${dataPath} === 'string'`;
        case 'number':
        case 'integer': return `typeof ${dataPath} === 'number'`;
        case 'boolean': return `typeof ${dataPath} === 'boolean'`;
        case 'array':   return `Array.isArray(${dataPath})`;
        case 'object':  return `(typeof ${dataPath} === 'object' && ${dataPath} !== null && !Array.isArray(${dataPath}))`;
        default:        return 'true';
    }
}

// --- AOT STRINGIFIER GENERATOR ---
//
// Supported: String, Number, Integer, Boolean, Literal, single-value Enum, Null,
//            Array<T>, Tuple<[...]>, Object, Intersect (objects + optional
//            discriminated unions), Union (flattened; discriminator /
//            required-field / typeof dispatch).
// Unsupported (throws at compile time): Record with dynamic keys, Date, binary
//            payloads, recursive schemas, variadic tuples, non-object union
//            variants inside an intersect.
// Behavior:  NaN/±Infinity → null; holes in arrays/tuples → null; trailing
//            undefined tuple slots omitted; undefined optional props dropped.

function flattenUnion(schema: TUnion): TSchema[] {
    const out: TSchema[] = [];
    for (const v of schema.anyOf) {
        if (isUnionSchema(v)) out.push(...flattenUnion(v));
        else out.push(v);
    }
    return out;
}

function collectObjectParts(
    schema: TObject,
    dataPath: string,
    extras: string[] = [],
): string[] {
    const props = schema.properties || {};
    const required: string[] = Array.isArray(schema.required) ? schema.required : [];
    const parts: string[] = [];

    for (const [key, propSchema] of Object.entries(props)) {
        const childPath = `${dataPath}[${escapeStr(key)}]`;
        const isOptional = !required.includes(key);
        const valCode = generateAotStringifier(propSchema as TSchema, childPath);
        const fieldStr = `${escapeStr(escapeStr(key) + ':')} + ${valCode}`;
        parts.push(
            isOptional ? `(${childPath} !== undefined ? ${fieldStr} : null)` : fieldStr
        );
    }
    return [...parts, ...extras];
}

export function generateAotStringifier(schema: TSchema, dataPath: string): string {
    const nullSafeWrap = (code: string) => `(${dataPath} === null ? 'null' : ${code})`;

    const litVal = getLiteralValue(schema);
    if (litVal !== undefined) {
        return nullSafeWrap(escapeStr(jsonText(litVal)));
    }

    if (isNullSchema(schema)) return `'null'`;

    if ((schema as TString).type === 'string') {
        return nullSafeWrap(`escapeStr(String(${dataPath}))`);
    }

    if ((schema as TNumber).type === 'number' || (schema as TInteger).type === 'integer') {
        return nullSafeWrap(`(Number.isFinite(${dataPath}) ? String(${dataPath}) : 'null')`);
    }

    if ((schema as TBoolean).type === 'boolean') {
        return nullSafeWrap(`String(${dataPath})`);
    }

    if (isArraySchema(schema)) {
        const itemCode = generateAotStringifier(schema.items as TSchema, 'item');
        return nullSafeWrap(`'[' + (${dataPath} || []).map((item) => ${itemCode}).join(',') + ']'`);
    }

    if (isTupleSchema(schema)) {
        const slots = (schema.items as TSchema[]).map((item, i) => {
            const childPath = `${dataPath}[${i}]`;
            const ser = generateAotStringifier(item, childPath);
            return `(${childPath} === undefined ? 'null' : ${ser})`;
        });
        return nullSafeWrap(
            `'[' + [${slots.join(', ')}].slice(0, ${dataPath}.length).join(',') + ']'`
        );
    }

    if (isIntersectSchema(schema)) {
        const baseProps: Record<string, TSchema> = {};
        const requiredSet = new Set<string>();
        const extras: string[] = [];

        for (const sub of schema.allOf) {
            if (isObjectSchema(sub)) {
                Object.assign(baseProps, sub.properties);
                if (Array.isArray(sub.required)) {
                    for (const k of sub.required) requiredSet.add(k);
                }
                continue;
            }

            if (isUnionSchema(sub)) {
                for (const variant of sub.anyOf) {
                    if (!isObjectSchema(variant)) {
                        throw new Error(
                            '[AOT Compiler] Intersect-of-union requires object-shaped variants.'
                        );
                    }
                    const discValues = getDiscriminatorValues(variant.properties['type']);
                    if (discValues.length === 0) {
                        throw new Error(
                            '[AOT Compiler] Intersect-of-union variant missing literal "type" discriminator.'
                        );
                    }
                    const variantParts = collectObjectParts(variant as TObject, dataPath);
                    const variantBody = variantParts.length === 0
                        ? `''`
                        : `[${variantParts.join(', ')}].filter(Boolean).join(',')`;
                    const condition = discValues
                        .map((d) => `${dataPath}.type === ${emitValue(d)}`)
                        .join(' || ');
                    extras.push(`((${condition}) ? ${variantBody} : null)`);
                }
                continue;
            }

            throw new Error(
                `[AOT Compiler] Unsupported intersect member: ${JSON.stringify(sub)}`
            );
        }

        const merged = Type.Object(baseProps, { required: [...requiredSet] }) as TObject;
        const parts = collectObjectParts(merged, dataPath, extras);

        if (parts.length === 0) return `'{}'`;
        return nullSafeWrap(`'{' + [${parts.join(', ')}].filter(Boolean).join(',') + '}'`);
    }

    if (isUnionSchema(schema)) {
        const seen = new Set<string>();
        const flat: TSchema[] = [];
        for (const v of flattenUnion(schema)) {
            const key = emitValue(v);
            if (!seen.has(key)) { seen.add(key); flat.push(v); }
        }

        const literals: TSchema[] = [];
        const nulls: TSchema[] = [];
        const discObjs: TObject[] = [];
        const specObjs: TObject[] = [];
        const prims: TSchema[] = [];
        const catchAll: TObject[] = [];

        for (const v of flat) {
            if (getLiteralValue(v) !== undefined) literals.push(v);
            else if (isNullSchema(v)) nulls.push(v);
            else if (isObjectSchema(v)) {
                if (getDiscriminatorValues(v.properties['type']).length > 0) discObjs.push(v);
                else if (Array.isArray(v.required) && v.required.length > 0) specObjs.push(v);
                else catchAll.push(v);
            } else prims.push(v);
        }

        specObjs.sort((a, b) => {
            const ra = Array.isArray(a.required) ? a.required.length : 0;
            const rb = Array.isArray(b.required) ? b.required.length : 0;
            return rb - ra;
        });

        const branches: Array<{ condition: string; serializer: string }> = [];

        for (const v of literals) {
            branches.push({
                condition: `${dataPath} === ${emitValue(getLiteralValue(v))}`,
                serializer: generateAotStringifier(v, dataPath),
            });
        }
        for (const _v of nulls) {
            branches.push({ condition: `${dataPath} === null`, serializer: `'null'` });
        }
        for (const v of discObjs) {
            const values = getDiscriminatorValues(v.properties['type']);
            const condition = values
                .map((d) => `${dataPath}.type === ${emitValue(d)}`)
                .join(' || ');
            branches.push({
                condition: `(${condition})`,
                serializer: generateAotStringifier(v, dataPath),
            });
        }
        for (const v of specObjs) {
            const required = v.required as string[];
            const isObj = `(typeof ${dataPath} === 'object' && ${dataPath} !== null)`;
            const cond = `${isObj} && ${required.map((k) => `${escapeStr(k)} in ${dataPath}`).join(' && ')}`;
            branches.push({ condition: cond, serializer: generateAotStringifier(v, dataPath) });
        }
        for (const v of prims) {
            branches.push({
                condition: typeofConditionFor(v, dataPath),
                serializer: generateAotStringifier(v, dataPath),
            });
        }

        const fallback = catchAll.length > 0
            ? generateAotStringifier(catchAll[0], dataPath)
            : `'null'`;

        let expr = fallback;
        for (let i = branches.length - 1; i >= 0; i--) {
            expr = `(${branches[i].condition} ? ${branches[i].serializer} : ${expr})`;
        }
        return nullSafeWrap(expr);
    }

    if (isObjectSchema(schema)) {
        const parts = collectObjectParts(schema, dataPath);
        if (parts.length === 0) return `'{}'`;
        return nullSafeWrap(`'{' + [${parts.join(', ')}].filter(Boolean).join(',') + '}'`);
    }

    throw new Error(`[AOT Compiler] Unsupported schema kind: ${JSON.stringify(schema)}`);
}

// --- SCHEMA LITERAL EMITTER ---

function emitSchemaLiteral(schema: TSchema): string {
    const s = schema as Record<string, unknown>;

    const lit = getLiteralValue(schema);
    if (lit !== undefined) return `Type.Literal(${emitValue(lit)})`;
    if (isNullSchema(schema)) return `Type.Null()`;

    switch (s.type) {
        case 'string': {
            const opts: Record<string, unknown> = {};
            for (const k of ['minLength', 'maxLength', 'pattern', 'format', 'default']) {
                if (s[k] !== undefined) opts[k] = s[k];
            }
            return Object.keys(opts).length ? `Type.String(${emitValue(opts)})` : `Type.String()`;
        }
        case 'number':
        case 'integer': {
            const opts: Record<string, unknown> = {};
            for (const k of ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']) {
                if (s[k] !== undefined) opts[k] = s[k];
            }
            const ctor = s.type === 'integer' ? 'Type.Integer' : 'Type.Number';
            return Object.keys(opts).length ? `${ctor}(${emitValue(opts)})` : `${ctor}()`;
        }
        case 'boolean':
            return `Type.Boolean()`;
    }

    if (isArraySchema(schema)) return `Type.Array(${emitSchemaLiteral(schema.items as TSchema)})`;
    if (isTupleSchema(schema)) {
        return `Type.Tuple([${(schema.items as TSchema[]).map(emitSchemaLiteral).join(', ')}])`;
    }
    if (isObjectSchema(schema)) {
        const required: string[] = Array.isArray(schema.required) ? schema.required : [];
        const props = Object.entries(schema.properties).map(([k, v]) => {
            const inner = emitSchemaLiteral(v as TSchema);
            return `${escapeStr(k)}: ${required.includes(k) ? inner : `Type.Optional(${inner})`}`;
        }).join(', ');
        return `Type.Object({${props}})`;
    }
    if (isIntersectSchema(schema)) {
        return `Type.Intersect([${schema.allOf.map(emitSchemaLiteral).join(', ')}])`;
    }
    if (isUnionSchema(schema)) {
        return `Type.Union([${schema.anyOf.map(emitSchemaLiteral).join(', ')}])`;
    }
    return `Type.Unsafe(${emitValue(s)})`;
}

// --- PATTERN COLLECTOR ---

function collectPatterns(schema: TSchema): string[] {
    const out: string[] = [];
    const walk = (s: unknown): void => {
        if (!s || typeof s !== 'object') return;
        const o = s as Record<string, unknown>;
        if (typeof o.pattern === 'string') out.push(o.pattern);
        else if (o.pattern instanceof RegExp) out.push(o.pattern.source);

        if (isObjectSchema(s)) {
            for (const v of Object.values((s as TObject).properties)) walk(v);
        } else if (isArraySchema(s)) {
            walk((s as TArray).items);
        } else if (isTupleSchema(s)) {
            for (const v of (s as TArray).items as TSchema[]) walk(v);
        } else if (isUnionSchema(s)) {
            for (const v of (s as TUnion).anyOf) walk(v);
        } else if (isIntersectSchema(s)) {
            for (const v of (s as TIntersect).allOf) walk(v);
        }
    };
    walk(schema);
    return out;
}

// --- VALIDATOR SOURCE NORMALIZER ---

function normalizeValidatorSource(code: string): { imports: string[]; body: string } {
    const imports: string[] = [];
    let out = code.replace(/^[ \t]*import\s+[^;\n]+;?[ \t]*$/gm, (m) => {
        imports.push(m.trim());
        return '';
    });

    out = out.replace(/\blet\s+External\s*=\s*\[\s*\]/, `let External = __patterns`);
    out = out.replace(/^[ \t]*export\s+/gm, '');

    // Remove the dead SetExternal helper that Code() emits in every model.
    out = out.replace(
        /\n?\s*\/\/ @ts-ignore\s*\n\s*function SetExternal\(external\)\s*\{\s*External\s*=\s*external\.variables\s*\}\s*/g,
        '\n'
    );

    out = out.replace(/\breturn\s+[cC]heck\s*;\s*/g, '');
    out = out.replace(/\s*$/, '\n        return Check;');

    return { imports, body: out };
}

// --- SCHEMAS TO COMPILE ---

const schemaRegistry = {
    UserSchema, UserSettingsSchema, DeviceSchema, UserRelationshipSchema,
    LabelsAndCirclesSchema, UserSettingsNotificationsSchema, UserSettingsPrivacySchema,
    UserSettingsBackupSchema, UserSettingsAccountSchema, DeviceChatPrefsSchema, DeviceNotificationPrefsSchema,

    ConversationSchema, ConversationMemberSchema,
    GroupMetadataSchema, ChannelMetadataSchema, SystemMetadataSchema, ConversationMemberChatPrefsSchema,

    MessageSchema, MessageReactionSchema, MessageExclusionSchema,
    TextContentSchema, ImageContentSchema, VideoContentSchema, AudioContentSchema, DocumentContentSchema, ContactContentSchema,
    LocationContentSchema, PollContentSchema, EventContentSchema, SystemContentSchema, DeleteContentSchema
};

// --- CODE GENERATION ---

const hoistedImportSet = new Set<string>();
const schemaIds = Object.keys(schemaRegistry);
let modelSources = '';
let bodyHaystack = '';

for (const [schemaId, schema] of Object.entries(schemaRegistry)) {
    const { imports, body } = normalizeValidatorSource(Code(schema).Code);
    for (const imp of imports) hoistedImportSet.add(imp);

    const generatedStringifier = generateAotStringifier(schema, 'data');
    const generatedSchema      = emitSchemaLiteral(schema);
    const patternsLiteral      = `[${collectPatterns(schema)
        .map((p) => `new RegExp(${escapeStr(p)})`)
        .join(', ')}]`;
    const idLit = escapeStr(schemaId);

    modelSources += `
const ${schemaId}Raw   = ${generatedSchema};
const ${schemaId}Check = (function() {
    const __patterns = ${patternsLiteral};
    ${body}
})();

export const ${schemaId}Model = {
    id: ${idLit},
    raw: ${schemaId}Raw,
    isValid: ${schemaId}Check,
    validate: function(data) {
        if (${schemaId}Check(data)) return { valid: true };
        return { valid: false, errors: extractErrors(${schemaId}Raw, data) };
    },
    serialize: function(data) {
        if (!${schemaId}Check(data)) throw makeValidationError(${idLit}, ${schemaId}Raw, data);
        return ${generatedStringifier};
    },
    deserialize: function(json) {
        const parsed = JSON.parse(json);
        if (!${schemaId}Check(parsed)) throw makeValidationError(${idLit}, ${schemaId}Raw, parsed);
        return parsed;
    }
};
`;

    bodyHaystack += body;
}

// Drop hoisted imports whose top-level binding never appears in any body.
const importBinding = (imp: string): string | null => {
    const braced = imp.match(/^import\s*\{([^}]+)\}/);
    if (braced) {
        const first = braced[1].split(',')[0].trim();
        const asMatch = first.match(/\bas\s+(\w+)$/);
        return asMatch ? asMatch[1] : first;
    }
    const def = imp.match(/^import\s+(\w+)/);
    return def ? def[1] : null;
};

for (const imp of [...hoistedImportSet]) {
    const binding = importBinding(imp);
    if (binding && !bodyHaystack.includes(binding)) {
        hoistedImportSet.delete(imp);
    }
}

const schemaMapSource = `
export const SchemaMap = {
${schemaIds.map((id) => `    ${id}: ${id}Model,`).join('\n')}
};

/** @type {readonly string[]} */
export const SchemaIds = [${schemaIds.map((id) => escapeStr(id)).join(', ')}];
`;

const hoistedImports = [...hoistedImportSet].join('\n');

const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Generated by scripts/compiler.ts
//
// Exception        = { path: string; message: string; value?: unknown }
// ValidationResult = { valid: true } | { valid: false; errors: Exception[] }

import { Type } from 'typebox';
import { Value } from 'typebox/value';
import { escapeStr } from './escape.js';
${hoistedImports}

function extractErrors(raw, data) {
    const out = [];
    for (const e of Value.Errors(raw, data)) {
        out.push({ path: e.path, message: e.message, value: e.value });
    }
    if (out.length === 0) out.push({ path: '', message: 'Validation failed' });
    return out;
}

function makeValidationError(id, raw, data) {
    const errors = extractErrors(raw, data);
    const summary = errors.slice(0, 3)
        .map((e) => \`\${e.path || '<root>'}: \${e.message}\`)
        .join('; ');
    const suffix = errors.length > 3 ? \` (+ \${errors.length - 3} more)\` : '';
    const err = new Error(\`[AOT] Invalid data for \${id}: \${summary}\${suffix}\`);
    err.id = id;
    err.errors = errors;
    return err;
}

${modelSources}
${schemaMapSource}
`;

const outputPath = path.join(__dirname, '../src/validator.js');
fs.writeFileSync(outputPath, fileContent);

console.log("\u001b[32m  [C] TypeBox 1.x AOT Validators compiled successfully!\u001b[0m");
