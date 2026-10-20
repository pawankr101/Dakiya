/// <reference types="node" />
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Code } from "typebox/compile";
import Format, { type TFormatCheckFunction } from "typebox/format";
import { Intern } from "typebox/schema";
import { type DSchemaWith$id, SCHEMA_REGISTRY, type SchemaId } from "../src/core";

Format.Set("json-string", (value) => {
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
});

const GENERATED_RUNTIME_SOURCE = `export interface ValidationIssue {
    field: string;
    message: string;
}

export type ValidationResult =
    | { valid: true; issues?: undefined }
    | { valid: false; issues: ValidationIssue[] };

export interface Validator<S extends DSchemaWith$id> {
    /** Type guard backed by the precompiled check. No allocations. */
    isValid(data: unknown): data is DTypeOf<S>;
    /** Same check; collects TypeBox validation issues when the data is invalid. */
    validate(data: unknown): ValidationResult;
    /** JSON.parse + validate. Throws SyntaxError on malformed JSON, SchemaValidationError on a shape mismatch. */
    deserialize(json: string): DTypeOf<S>;
    /**
     * Validate + AST-based serialize. Throws SchemaValidationError when the data is invalid.
     * Only keys declared in the schema are emitted: unknown keys are stripped.
     */
    serialize(data: DTypeOf<S>): string;
    /** Lazily parses and returns the JSON Schema AST. */
    getAst(): S;
}

export class SchemaValidationError extends Error {
    readonly schemaId: string;
    readonly issues: ValidationIssue[];
    constructor(schemaId: string, issues: ValidationIssue[]) {
        const first = issues[0];
        super(schemaId + ' validation failed' + (first ? ': ' + first.field + ' ' + first.message : ''));
        this.name = 'SchemaValidationError';
        this.schemaId = schemaId;
        this.issues = issues;
    }
}

function toValidationIssues(errors: TLocalizedValidationError[]): ValidationIssue[] {
    if (errors.length === 0) return [{ field: '', message: 'Invalid value' }];
    return errors.map((error) => {
        const path = error.instancePath || '';
        return {
            field: path.startsWith('/') ? path.substring(1) : path,
            message: error.message
        };
    });
}

// The compiler's audit guarantees schemas only use this keyword subset.
interface AstSchema {
    type?: string;
    const?: string | number | boolean;
    required?: readonly string[];
    anyOf?: readonly AstSchema[];
    allOf?: readonly AstSchema[];
    properties?: Readonly<Record<string, AstSchema>>;
    items?: AstSchema;
}

const hasOwn = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);
const isPlainObject = (data: unknown): data is Record<string, unknown> =>
    typeof data === 'object' && data !== null && !Array.isArray(data);

/** Loose structural match used to pick union branches. Does not check formats or ranges. */
function astMatch(schema: AstSchema, data: unknown): boolean {
    if (schema.const !== undefined) return data === schema.const;
    if (schema.anyOf) return schema.anyOf.some((s) => astMatch(s, data));
    if (schema.allOf) return schema.allOf.every((s) => astMatch(s, data));

    switch (schema.type) {
        case 'string': return typeof data === 'string';
        case 'number':
        case 'integer': return typeof data === 'number';
        case 'boolean': return typeof data === 'boolean';
        case 'array': return Array.isArray(data);
        case 'object': {
            if (!isPlainObject(data)) return false;
            if (schema.required) {
                for (const key of schema.required) {
                    if (!hasOwn(data, key) || data[key] === undefined) return false;
                }
            }
            for (const key in schema.properties) {
                if (!hasOwn(data, key) || data[key] === undefined) continue;
                if (!astMatch(schema.properties[key], data[key])) return false;
            }
            return true;
        }
        default:
            return schema.type === undefined; // unconstrained schema matches anything
    }
}

function hasObjectBranch(schema: AstSchema): boolean {
    return !!schema.anyOf?.some((s) => s.type === 'object' || !!s.properties || !!s.allOf || hasObjectBranch(s));
}

/** Gathers declared properties from every branch that applies to data. */
function collectProperties(schema: AstSchema, data: unknown, out: Record<string, AstSchema>): void {
    if (schema.properties) Object.assign(out, schema.properties);
    for (const sub of schema.allOf ?? []) collectProperties(sub, data, out);
    for (const sub of schema.anyOf ?? []) {
        if (astMatch(sub, data)) collectProperties(sub, data, out);
    }
}

function astSerialize(schema: AstSchema, data: unknown): string {
    if (data === undefined) return '';
    if (data === null) return 'null';
    if (schema.const !== undefined) return typeof schema.const === 'string' ? JSON.stringify(schema.const) : String(schema.const);

    if (schema.anyOf && !schema.properties && schema.type !== 'object') {
        // Scalar/array unions: first structurally matching branch wins. Unions with object branches
        // fall through to the merge path below for object data, so overlapping branches
        // ({a} vs {a, b}) cannot drop the fields of a later one.
        if (!isPlainObject(data) || !hasObjectBranch(schema)) {
            for (const sub of schema.anyOf) {
                if (astMatch(sub, data)) return astSerialize(sub, data);
            }
        }
    }

    switch (schema.type) {
        case 'string': return JSON.stringify(data);
        case 'number':
        case 'integer': return Number.isFinite(data as number) ? String(data) : 'null';
        case 'boolean': return data ? 'true' : 'false';
    }

    if (schema.type === 'array' && schema.items) {
        const arr = data as unknown[];
        let out = '[';
        for (let i = 0; i < arr.length; i++) {
            if (i > 0) out += ',';
            out += arr[i] === undefined ? 'null' : astSerialize(schema.items, arr[i]);
        }
        return out + ']';
    }

    if (schema.type === 'object' || schema.properties || schema.allOf || schema.anyOf) {
        const obj = data as Record<string, unknown>;
        const props: Record<string, AstSchema> = Object.create(null);
        collectProperties(schema, data, props);
        let out = '{';
        let first = true;
        for (const key in props) {
            if (!hasOwn(obj, key) || obj[key] === undefined) continue;
            if (!first) out += ',';
            first = false;
            out += JSON.stringify(key) + ':' + astSerialize(props[key], obj[key]);
        }
        return out + '}';
    }

    // Unreachable for audited schemas; stay lossless instead of emitting null.
    return JSON.stringify(data);
}

if (!Format.Has('json-string')) {
    Format.Set('json-string', (value: string): boolean => {
        try {
            JSON.parse(value);
            return true;
        } catch {
            return false;
        }
    });
}

/** Resolves a registered format check at module init; fails loudly instead of skipping it. */
/* @__NO_SIDE_EFFECTS__ */
function requireFormat(name: string): (value: string) => boolean {
    const check = Format.Get(name);
    if (!check) throw new Error('Format "' + name + '" is not registered.');
    return check;
}

/* @__NO_SIDE_EFFECTS__ */
function createValidator<S extends DSchemaWith$id>(id: string, check: (value: unknown) => boolean, astString: string): Validator<S> {
    let cachedAst: S | undefined;
    const getAst = (): S => (cachedAst ??= JSON.parse(astString) as S);
    const assertValid = (data: unknown): DTypeOf<S> => {
        if (!check(data)) throw new SchemaValidationError(id, toValidationIssues(Errors(getAst(), data)));
        return data as DTypeOf<S>;
    };
    return {
        isValid: (data: unknown): data is DTypeOf<S> => check(data),
        validate: (data: unknown): ValidationResult =>
            check(data) ? { valid: true } : { valid: false, issues: toValidationIssues(Errors(getAst(), data)) },
        deserialize: (json: string) => assertValid(JSON.parse(json)),
        serialize: (data: DTypeOf<S>) => astSerialize(getAst() as AstSchema, assertValid(data)),
        getAst
    };
}
`;

const ValidatorCompiler = (() => {
    interface ParsedImport {
        names: string[];
        from: string;
    }

    interface ModuleImportSpec {
        default?: string;
        named?: readonly string[];
        types?: readonly string[];
    }

    interface CompiledSchema {
        id: SchemaId;
        identifier: string;
        imports: ParsedImport[];
        externals: string[];
        body: string;
        astString: string;
    }

    const CURRENT_DIR = fileURLToPath(new URL(".", import.meta.url));
    const SRC_DIR = resolve(CURRENT_DIR, "..", "src");
    const CONFIG = {
        generatedValidatorDir: resolve(SRC_DIR, "__precompiled__"),
        generatedValidatorFileName: "validator",
        generatedValidatorFileExtension: ".ts"
    };

    const INDENT = "    ";
    const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
    const IDENTIFIER_TOKEN = /[A-Za-z_$][\w$]*/g;
    const IMPORT_LINE = /^import \{ ([\w$]+(?:, [\w$]+)*) \} from "([^"]+)"$/;

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    function indent(text: string, level = 1): string {
        const pad = INDENT.repeat(level);
        return text.split("\n").map((line) => (line.length ? pad + line : line)).join("\n");
    }

    function unexpectedShape(id: string, detail: string): Error {
        return new Error(`[${id}] unexpected TypeBox Code() output (${detail}). TypeBox was probably upgraded: review compileSchema() in scripts/compiler.ts.`);
    }

    function buildFormatNameIndex(): Map<TFormatCheckFunction, string> {
        const index = new Map<TFormatCheckFunction, string>();
        for (const [name, check] of Format.Entries()) {
            if (!index.has(check)) index.set(check, name);
        }
        return index;
    }

    function serializeExternal(id: string, index: number, value: unknown, formatNames: Map<TFormatCheckFunction, string>): string {
        if (value instanceof RegExp) return String(value);

        if (typeof value === "function") {
            const name = formatNames.get(value as TFormatCheckFunction);
            if (name) return `requireFormat(${JSON.stringify(name)})`;
        }
        throw new Error( `[${id}] cannot inline External[${index}] (${typeof value}). Only RegExp and registered format checks are supported.`);
    }

    function parseImport(id: string, line: string): ParsedImport {
        const match = IMPORT_LINE.exec(line);
        if (!match) throw unexpectedShape(id, `unrecognized import: ${line}`);
        return { names: match[1].split(", "), from: match[2] };
    }

    function countBraces(line: string): number {
        let delta = 0;
        for (const ch of line) {
            if (ch === "{") delta++;
            else if (ch === "}") delta--;
        }
        return delta;
    }

    // One alternation so whichever token starts first wins. Stripping comments before strings
    // would mangle string literals that contain `//` (e.g. Literal("https://x")).
    const COMMENTS_AND_STRINGS = /\/\/.*$|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/gm;

    /**
     * Strips comments and string literals before tokenizing identifiers so:
     * 1. Identifiers starting with `$` are matched accurately (unlike `\b`), and
     * 2. Words inside string literals or comments never trigger false-positive imports.
     */
    function extractUsedIdentifiers(source: string): Set<string> {
        return new Set(source.replace(COMMENTS_AND_STRINGS, " ").match(IDENTIFIER_TOKEN) ?? []);
    }

    // ------------------------------------------------------------------
    // schema audit
    // ------------------------------------------------------------------

    // Everything DType can emit. The generated runtime (astMatch/astSerialize) only understands
    // this subset, so anything else is rejected at build time instead of being silently
    // mis-serialized. Extend both together.
    const STRUCTURAL_KEYWORDS: ReadonlySet<string> = new Set([
        "type", "const", "anyOf", "allOf", "properties", "required", "items", "additionalProperties"
    ]);
    const ANNOTATION_KEYWORDS: ReadonlySet<string> = new Set([
        "$id", "title", "description", "default", "examples", "format", "pattern",
        "minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems", "uniqueItems"
    ]);
    const SUPPORTED_TYPES: ReadonlySet<string> = new Set(["string", "number", "boolean", "object", "array"]);

    function buildKnownFormats(): Set<string> {
        return new Set([...Format.Entries()].map(([name]) => name));
    }

    function auditSchema(id: string, node: unknown, path: string, formats: ReadonlySet<string>): void {
        if (typeof node !== "object" || node === null) return;
        const schema = node as Record<string, unknown>;

        for (const key of Object.keys(schema)) {
            if (key.startsWith("~")) continue; // TypeBox-internal markers, if any survive JSON
            if (!STRUCTURAL_KEYWORDS.has(key) && !ANNOTATION_KEYWORDS.has(key)) {
                throw new Error(`[${id}] unsupported keyword "${key}" at ${path}`);
            }
        }
        if (schema.type !== undefined && !SUPPORTED_TYPES.has(schema.type as string)) {
            throw new Error(`[${id}] unsupported type ${JSON.stringify(schema.type)} at ${path}`);
        }
        if(schema.const !== undefined && typeof schema.const !== "string" && typeof schema.const !== "number" && typeof schema.const !== "boolean") {
            throw new Error(`[${id}] unsupported const value ${JSON.stringify(schema.const)} at ${path}`);
        }
        if (schema.additionalProperties !== undefined && schema.additionalProperties !== false) {
            throw new Error(`[${id}] additionalProperties other than false is not serializable at ${path}: the serializer only emits declared keys.`);
        }
        if (typeof schema.format === "string" && !formats.has(schema.format)) {
            throw new Error(`[${id}] format "${schema.format}" at ${path} is not registered at build time, so the generated check would not enforce it.`);
        }
        if (schema.type === "array" && (typeof schema.items !== "object" || schema.items === null)) {
            throw new Error(`[${id}] array without "items" at ${path}`);
        }

        for (const [name, child] of Object.entries((schema.properties as Record<string, unknown> | undefined) ?? {})) {
            auditSchema(id, child, `${path}/properties/${name}`, formats);
        }
        if (schema.items !== undefined) auditSchema(id, schema.items, `${path}/items`, formats);
        for (const keyword of ["anyOf", "allOf"] as const) {
            const branches = schema[keyword];
            if (!Array.isArray(branches)) continue;
            branches.forEach((branch, i) => auditSchema(id, branch, `${path}/${keyword}/${i}`, formats));
        }
    }

    // ------------------------------------------------------------------
    // per-schema compilation
    // ------------------------------------------------------------------

    function compileSchema(id: SchemaId, formatNames: Map<TFormatCheckFunction, string>, knownFormats: ReadonlySet<string>): CompiledSchema {
        const rawSchema = SCHEMA_REGISTRY[id];
        if (!IDENTIFIER.test(id)) throw new Error(`[${id}] registry key must be a valid identifier`);
        if (rawSchema.$id !== id) throw new Error(`[${id}] registry key does not match schema $id "${rawSchema.$id}"`);

        // Serialize once so both `Code(Intern(...))` and runtime `Errors(getAst(), ...)`
        // operate on the exact same normalized JSON Schema AST.
        const astString = JSON.stringify(rawSchema, (key, value) => {
            if (key === "$id" && typeof value === "string" && value !== id) return undefined;
            if (value instanceof RegExp) {
                // Dropping flags would silently change what the AST-driven Errors() path enforces.
                if (value.flags) throw new Error(`[${id}] RegExp flags are not supported (key "${key}": ${value}).`);
                return value.source;
            }
            return value;
        });
        const normalizedSchema = JSON.parse(astString) as DSchemaWith$id;
        auditSchema(id, normalizedSchema, "#", knownFormats);

        const { Code: code, External } = Code(Intern(normalizedSchema));
        const identifier = External.identifier;

        const imports: ParsedImport[] = [];
        const bodyLines: string[] = [];
        let externalDeclarations = 0;
        let setExternalFunctions = 0;
        let checkExports = 0;
        let skippingBraceDepth = 0;

        const dropWithDirective = () => {
            if (bodyLines.at(-1) === "// @ts-ignore") bodyLines.pop();
        };

        for (const line of code.split("\n")) {
            if (skippingBraceDepth > 0) {
                skippingBraceDepth += countBraces(line);
                continue;
            }

            if (line.startsWith("import ")) {
                imports.push(parseImport(id, line));
            } else if (line === `let ${identifier} = []`) {
                externalDeclarations++;
                dropWithDirective();
            } else if (line.startsWith("export function SetExternal(")) {
                setExternalFunctions++;
                dropWithDirective();
                skippingBraceDepth = countBraces(line);
            } else if (line.startsWith("export function Check(")) {
                checkExports++;
                bodyLines.push(line.slice("export ".length));
            } else {
                bodyLines.push(line);
            }
        }

        if (externalDeclarations !== 1 || setExternalFunctions !== 1 || checkExports !== 1) {
            throw unexpectedShape(id,`expected one External declaration, SetExternal and Check, got ${externalDeclarations}/${setExternalFunctions}/${checkExports}`);
        }
        if (bodyLines.some((line) => /^(import|export)\b/.test(line))) {
            throw unexpectedShape(id, "leftover import/export in body");
        }

        const externals = External.variables.map((value, index) =>
            serializeExternal(id, index, value, formatNames)
        );
        const body = bodyLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

        return { id, identifier, imports, externals, body, astString };
    }

    // ------------------------------------------------------------------
    // source code builders
    // ------------------------------------------------------------------

    type ModuleName = string;

    const BASE_IMPORTED_MODULES: Readonly<Record<ModuleName, ModuleImportSpec>> = {
        "typebox/error": { types: ["TLocalizedValidationError"] },
        "typebox/format": { default: "Format" },
        "typebox/value": { named: ["Errors"] },
        "../core": { types: ["DSchemaWith$id", "DTypeOf", "SchemaRegistry"] }
    };

    function collectDynamicImportedModules(compiled: readonly CompiledSchema[]): Record<ModuleName, ModuleImportSpec> {
        const usedIdentifiers = extractUsedIdentifiers(compiled.map((c) => c.body).join("\n"));
        const candidates = new Map<ModuleName, Set<string>>();

        for (const { imports } of compiled) {
            for (const { names, from } of imports) {
                let set = candidates.get(from);
                if (!set) {
                    set = new Set<string>();
                    candidates.set(from, set);
                }
                for (const name of names) {
                    if (usedIdentifiers.has(name)) set.add(name);
                }
            }
        }

        const modules: Record<ModuleName, ModuleImportSpec> = {};
        for (const [from, names] of candidates) {
            if (names.size > 0) {
                modules[from] = { named: [...names].sort() };
            }
        }
        return modules;
    }

    function buildImports(compiled: readonly CompiledSchema[]): string {
        const sources: Readonly<Record<ModuleName, ModuleImportSpec>>[] = [
            BASE_IMPORTED_MODULES,
            collectDynamicImportedModules(compiled)
        ];

        const merged = new Map<ModuleName, { default?: string; named: Set<string>; types: Set<string> }>();

        const ensureEntry = (module: ModuleName) => {
            let entry = merged.get(module);
            if (!entry) {
                entry = { named: new Set<string>(), types: new Set<string>() };
                merged.set(module, entry);
            }
            return entry;
        };

        // Pass 1: resolve default imports
        for (const source of sources) {
            for (const [module, spec] of Object.entries(source)) {
                if (!spec.default) continue;
                const entry = ensureEntry(module);
                if (entry.default !== undefined && entry.default !== spec.default) {
                    throw new Error(
                        `module "${module}" needs two different default imports ("${entry.default}" and "${spec.default}").`
                    );
                }
                entry.default = spec.default;
            }
        }

        // Pass 2: union value and type imports, skipping any identifier already bound as default
        for (const source of sources) {
            for (const [module, spec] of Object.entries(source)) {
                const entry = ensureEntry(module);
                for (const name of spec.named ?? []) {
                    if (entry.default !== name) {
                        entry.named.add(name);
                        entry.types.delete(name);
                    }
                }
                for (const typeName of spec.types ?? []) {
                    if (entry.default !== typeName && !entry.named.has(typeName)) {
                        entry.types.add(typeName);
                    }
                }
            }
        }

        const orderedModules = [
            ...Object.keys(BASE_IMPORTED_MODULES),
            ...[...merged.keys()].filter((module) => !(module in BASE_IMPORTED_MODULES)).sort()
        ];

        return orderedModules.reduce((acc, module) => {
            const entry = merged.get(module);
            if (!entry) return acc;

            const defaultName = entry.default;
            const namedValues = [...entry.named].sort();
            const namedTypes = [...entry.types].sort();

            // Pure type-only import: `import type { A, B } from "..."`
            if (!defaultName && namedValues.length === 0 && namedTypes.length > 0) {
                return `${acc}import type { ${namedTypes.join(", ")} } from "${module}";\n`;
            }

            // Value or mixed import: inline `type X` specifiers when paired with default or value imports
            const specifiers = [
                ...namedValues,
                ...namedTypes.map((t) => `type ${t}`)
            ];
            const namedPart = specifiers.length > 0 ? `{ ${specifiers.join(", ")} }` : "";
            const clause = defaultName && namedPart ? `${defaultName}, ${namedPart}` : (defaultName ?? namedPart);

            return clause ? `${acc}import ${clause} from "${module}";\n` : acc;
        }, "");
    }

    function buildCheckFactoryCode({ id, identifier, externals, body }: CompiledSchema): string {
        let sc = `/* @__NO_SIDE_EFFECTS__ */\n`;
        sc += `function createCheck_${id}(): (value: unknown) => boolean {\n`;
        sc += externals.length
            ? `${INDENT}const ${identifier}: ReadonlyArray<RegExp | ((value: string) => boolean)> = [\n${indent(externals.join(",\n"), 2)}\n${INDENT}];\n\n`
            : `${INDENT}const ${identifier}: ReadonlyArray<RegExp | ((value: string) => boolean)> = [];\n\n`;
        sc += `${indent(body)}\n\n`;
        sc += `${INDENT}return Check;\n`;
        sc += `}\n`;
        return sc;
    }

    function buildRegistryCode(compiled: readonly CompiledSchema[]): string {
        return compiled
            .map(({ id, astString }) => {
                return `export const ${id}Validator: Validator<SchemaRegistry["${id}"]> = /* @__PURE__ */ createValidator("${id}", /* @__PURE__ */ createCheck_${id}(), ${JSON.stringify(astString)});`;
            })
            .join("\n");
    }

    function buildValidatorCodeBody(): string {
        const formatNames = buildFormatNameIndex();
        const knownFormats = buildKnownFormats();

        const ids = (Object.keys(SCHEMA_REGISTRY) as SchemaId[]).sort(); // stable diffs
        const compiled = ids.map((id) => compileSchema(id, formatNames, knownFormats));

        const sections = [
            buildImports(compiled),
            GENERATED_RUNTIME_SOURCE,
            ...compiled.map(buildCheckFactoryCode),
            buildRegistryCode(compiled)
        ];
        return `${sections.map((section) => section.trimEnd()).join("\n\n")}\n`;
    }

    function buildValidatorSourceCode(): string {
        const sourceCodeHeader = `// AUTO-GENERATED FILE. DO NOT EDIT.\n// Generated by scripts/compiler.ts\n`;
        return `${sourceCodeHeader}\n${buildValidatorCodeBody()}`;
    }

    function generateValidator(outdir: string, outFile: string, outExt: string): void {
        const sourceCode = buildValidatorSourceCode();
        const outPath = resolve(outdir, `${outFile}${outExt}`);
        mkdirSync(outdir, { recursive: true });
        writeFileSync(outPath, sourceCode);
        writeFileSync(resolve(outdir, `index${outExt}`), `export * from './${outFile}';\n`);
    }

    return {
        compile: () => generateValidator(CONFIG.generatedValidatorDir, CONFIG.generatedValidatorFileName, CONFIG.generatedValidatorFileExtension)
    };
})();

ValidatorCompiler.compile();
