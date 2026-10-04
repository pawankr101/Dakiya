/// <reference types="node" />
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Code } from "typebox/compile";
import Format, { type TFormatCheckFunction } from "typebox/format";
import type { XSchemaObject } from "typebox/schema";
import { Intern } from "typebox/schema";
import { SCHEMA_REGISTRY, type SchemaId } from "../src/registry";
import { DType } from "../src/schema";

/**
 * Ahead-of-time validator compiler.
 *
 * 1. INTERN: every schema in SCHEMA_REGISTRY is wrapped into one container object and passed
 *    through TypeBox's `Intern()` in a single call, so every distinct sub-schema across the
 *    *whole* registry (a `Uuid`, `GenderSchema`, a shared metadata schema, ...) is stored exactly
 *    once in one shared `$defs`, keyed by content hash. `Intern()` clears its internal registry
 *    at the start of every call, so this only works as ONE call over the combined container -
 *    interning each schema separately would not share anything across schemas.
 * 2. COMPILE: each original schema id is resolved to its own `$ref` into that shared `$defs`, and
 *    compiled *separately* (`Code()`), so the registry still ends up with one independent,
 *    tree-shakeable check per schema id - just built from the deduplicated definitions.
 * 3. EMIT: the compiled checks are folded into one generated file (`src/validator.ts`) that
 *      - contains no `eval` / `new Function` at runtime (the checks are plain source code),
 *      - eagerly builds `VALIDATORS`, a `Record` of `Validator<...>` keyed by schema id -
 *        cheap, since AOT compilation already happened here at build time,
 *      - only pays for the interpretive TypeBox error engine when a check actually fails.
 *
 * TypeBox's standalone output is not self-contained: format checks and RegExps are passed in
 * through an `External[]` array at runtime. We inline those here (RegExp literals, format
 * lookups by name) and fail loudly if the `Code()` output shape ever changes.
 */
const ValidatorCompiler = (() => {

    interface ParsedImport { names: string[]; from: string; }
    interface CompiledSchema { id: SchemaId; identifier: string; imports: ParsedImport[]; externals: string[]; body: string; }

    /** The shape we know the interned container resolves to - `Intern()` only tells TypeScript `XSchemaObject = object`. */
    interface InternedContainerSchema { readonly properties: { readonly [K in SchemaId]: { readonly $ref: string } }; }
    /** A `$ref` into a shared `$defs`, compilable on its own via `Code()` / `Compile()`. */
    interface InternedRef { readonly $ref: string; readonly $defs: Readonly<Record<string, XSchemaObject>>; }

    const CURRENT_DIR = fileURLToPath(new URL('.', import.meta.url));
    const SRC_DIR = resolve(CURRENT_DIR, '..', 'src');
    const CONFIG = {
        generatedValidatorDir: resolve(SRC_DIR, '__precompiled__'),
        generatedValidatorFileName: 'validator',
        generatedValidatorFileExtension: '.ts',
    };

    const INDENT = '    ';
    const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
    const IMPORT_LINE = /^import \{ ([\w$]+(?:, [\w$]+)*) \} from "([^"]+)"$/;
    const DEFS_PREFIX = '#/$defs/';

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    function indent(text: string, level = 1): string {
        const pad = INDENT.repeat(level);
        return text.split('\n').map((line) => (line.length ? pad + line : line)).join('\n');
    }

    function escapeRegExp(text: string): string {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function unexpectedShape(id: string, detail: string): Error {
        return new Error(`[${id}] unexpected TypeBox Code() output (${detail}). TypeBox was probably upgraded: review parseModule() in scripts/compiler.ts.`);
    }

    /** check function -> registered format name, so externals can be re-resolved by name at runtime. */
    function buildFormatNameIndex(): Map<TFormatCheckFunction, string> {
        const index = new Map<TFormatCheckFunction, string>();
        for (const [name, check] of Format.Entries()) {
            if (!index.has(check)) index.set(check, name);
        }
        return index;
    }

    function serializeExternal(id: string, index: number, value: unknown, formatNames: Map<TFormatCheckFunction, string>): string {
        // `String(/x/i)` is a valid regex literal, flags included.
        if (value instanceof RegExp) return String(value);

        // Built-in format checks close over module-level state, so `fn.toString()` is not safe.
        // Look them up by name and re-resolve through `Format.Get()` instead. We already know the
        // name is registered - `formatNames` was built from `Format.Entries()`, i.e. only
        // registered checks - so the `!` reflects a fact this function already verified, not an
        // unchecked assumption; `Format.Get()` is TypeBox's own public accessor, not our code.
        if (typeof value === 'function') {
            const name = formatNames.get(value as TFormatCheckFunction);
            if (name !== undefined) return `Format.Get(${JSON.stringify(name)})!`;
        }
        throw new Error(`[${id}] cannot inline External[${index}] (${typeof value}). Only RegExp and registered format checks are supported.`);
    }

    function parseImport(id: string, line: string): ParsedImport {
        const match = IMPORT_LINE.exec(line);
        if (!match) throw unexpectedShape(id, `unrecognized import: ${line}`);
        return { names: match[1].split(', '), from: match[2] };
    }

    // ------------------------------------------------------------------
    // interning (once, over the whole registry)
    // ------------------------------------------------------------------

    /**
     * Combines every schema into one container object and interns it in a single `Intern()` call,
     * so identical sub-schemas anywhere in the registry collapse to one shared `$defs` entry.
     * Returns, per schema id, a standalone `{ $ref, $defs }` pointing into that shared `$defs`.
     */
    function internRegistry(ids: readonly SchemaId[]): Readonly<Record<SchemaId, InternedRef>> {
        const container = DType.Object(SCHEMA_REGISTRY);
        const interned = Intern(container);
        const rootKey = interned.$ref.slice(DEFS_PREFIX.length);
        const rootDefinition = interned.$defs[rootKey];
        if (typeof rootDefinition !== 'object' || rootDefinition === null) {
            throw unexpectedShape('<registry>', 'interned root definition is not an object');
        }
        // We built `container`'s properties from SCHEMA_REGISTRY's own keys, so we know this shape
        // even though TypeBox's low-level Schema layer types every $defs entry as plain `object`.
        const root = rootDefinition as InternedContainerSchema;

        const entries = ids.map((id): [SchemaId, InternedRef] => {
            const propertyRef = root.properties[id];
            if (!propertyRef || typeof propertyRef.$ref !== 'string') {
                throw unexpectedShape(id, `no interned $ref for property "${id}" on the combined container`);
            }
            return [id, { $ref: propertyRef.$ref, $defs: interned.$defs }];
        });
        return Object.fromEntries(entries) as Record<SchemaId, InternedRef>;
    }

    // ------------------------------------------------------------------
    // per-schema compilation
    // ------------------------------------------------------------------

    /**
     * Code() emits an ESM module:  imports, `let External = []`, `SetExternal()`, helper
     * functions, then `export function Check`. Split it into imports + a body that can live
     * inside a factory function, and drop the External plumbing (we inline the externals).
     */
    function compileSchema(id: SchemaId, ref: InternedRef, formatNames: Map<TFormatCheckFunction, string>): CompiledSchema {
        const schema = SCHEMA_REGISTRY[id];
        if (!IDENTIFIER.test(id)) throw new Error(`[${id}] registry key must be a valid identifier`);
        if (schema.$id !== id) throw new Error(`[${id}] registry key does not match schema $id "${schema.$id}"`);

        const { Code: code, External } = Code(ref);
        const identifier = External.identifier;

        const imports: ParsedImport[] = [];
        const bodyLines: string[] = [];
        let externalDeclarations = 0;
        let setExternalFunctions = 0;
        let checkExports = 0;

        const dropWithDirective = () => {
            if (bodyLines.at(-1) === '// @ts-ignore') bodyLines.pop();
        };

        for (const line of code.split('\n')) {
            if (line.startsWith('import ')) {
                imports.push(parseImport(id, line));
            } else if (line === `let ${identifier} = []`) {
                externalDeclarations++;
                dropWithDirective();
            } else if (line.startsWith('export function SetExternal(')) {
                setExternalFunctions++;
                dropWithDirective();
            } else if (line.startsWith('export function Check(')) {
                checkExports++;
                bodyLines.push(line.slice('export '.length));
            } else {
                bodyLines.push(line);
            }
        }

        if (externalDeclarations !== 1 || setExternalFunctions !== 1 || checkExports !== 1) {
            throw unexpectedShape(id, `expected one External declaration, SetExternal and Check, got ${externalDeclarations}/${setExternalFunctions}/${checkExports}`);
        }
        if (bodyLines.some((line) => /^(import|export)\b/.test(line))) {
            throw unexpectedShape(id, 'leftover import/export in body');
        }

        const externals = External.variables.map((value, index) => serializeExternal(id, index, value, formatNames));
        const body = bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

        return { id, identifier, imports, externals, body };
    }

    // ------------------------------------------------------------------
    // source code builders
    // ------------------------------------------------------------------

    type ModuleName = string;
    type ModuleExports = string | string[];

    /** Imports the generated file always needs, regardless of which schemas end up in the registry. */
    const BASE_IMPORTED_MODULES: Readonly<Record<ModuleName, ModuleExports>> = {
        'typebox/format': 'Format',
        'typebox/error': ['TLocalizedValidationError'],
        'typebox/value': ['Errors'],
        '../registry': ['SCHEMA_REGISTRY', 'SchemaId'],
        '../schema': ['DSchemaWith$id', 'DTypeOf']
    };

    /**
     * TypeBox's own `Code()` output imports its runtime helpers (e.g. `Hashing` from
     * `typebox/system`, `Guard` from `typebox/guard`) on top of BASE_IMPORTED_MODULES, but only
     * the ones a given schema's compiled body actually calls - so this is computed per registry,
     * not hardcoded, to avoid emitting unused imports as the schemas change over time.
     */
    function collectDynamicImportedModules(compiled: readonly CompiledSchema[]): Record<ModuleName, ModuleExports> {
        const usedSource = compiled.map((c) => c.body).join('\n');
        const modules: Record<ModuleName, Set<string>> = {};

        for (const { imports } of compiled) {
            for (const { names, from } of imports) {
                for (const name of names) {
                    if (!new RegExp(`\\b${escapeRegExp(name)}\\b`).test(usedSource)) continue;
                    modules[from] ??= new Set<string>();
                    (modules[from]).add(name);
                }
            }
        }
        return Object.fromEntries(Object.entries(modules).map(([from, names]) => [from, [...names].sort()]));
    }

    /** Fixed imports for the glue code, plus only those TypeBox imports the compiled bodies really use. */
    function buildImports(compiled: readonly CompiledSchema[]): string {
        const sources: Readonly<Record<ModuleName, ModuleExports>>[] = [BASE_IMPORTED_MODULES, collectDynamicImportedModules(compiled)];

        // Pass 1: resolve each module's default import name, if any. A module can only have ONE
        // local default binding, so two different requested names for the same module's default
        // can't both be represented in a single `import` statement.
        const defaultNames = new Map<ModuleName, string>();
        for (const source of sources) {
            for (const [module, exports] of Object.entries(source)) {
                if (typeof exports !== 'string') continue;
                const existing = defaultNames.get(module);
                if (existing !== undefined && existing !== exports) {
                    throw new Error(`module "${module}" needs two different default imports ("${existing}" and "${exports}") - not representable in one import statement.`);
                }
                defaultNames.set(module, exports);
            }
        }

        // Pass 2: union the named imports per module - run after pass 1 so a name that also
        // happens to be that module's default binding (e.g. `Format` from `typebox/format`, which
        // TypeBox's own Code() output sometimes imports by name even though we already import it
        // as our default) is recognized as the SAME identifier and skipped, rather than emitted
        // twice (`import Format, { Format } from "..."` is a duplicate declaration, not valid JS).
        const namedImports = new Map<ModuleName, Set<string>>();
        for (const source of sources) {
            for (const [module, exports] of Object.entries(source)) {
                if (!Array.isArray(exports)) continue;
                for (const name of exports) {
                    if(defaultNames.get(module) !== name) {
                        if (!namedImports.has(module)) namedImports.set(module, new Set());
                        namedImports.get(module)?.add(name);
                    }
                }
            }
        }

        // Base modules first (in their declared order, for a stable diff across regenerations),
        // then any dynamically-discovered module BASE_IMPORTED_MODULES doesn't already cover.
        const orderedModules = [
            ...Object.keys(BASE_IMPORTED_MODULES),
            ...[...new Set([...defaultNames.keys(), ...namedImports.keys()])]
                .filter((module) => !(module in BASE_IMPORTED_MODULES))
                .sort()
        ];

        return orderedModules.reduce((acc, module) => {
            const defaultName = defaultNames.get(module);
            const named = namedImports.get(module);
            const namedPart = named?.size ? `{ ${[...named].sort().join(', ')} }` : '';
            const clause = defaultName && namedPart ? `${defaultName}, ${namedPart}` : defaultName ?? namedPart;
            return `${acc}import ${clause} from "${module}";\n`;
        }, '');
    }

    /** Public types + the tiny runtime that wraps a compiled check into a Validator. */
    function buildInterfacesCode(): string {
        let sc = '';

        sc += `export interface ValidationIssue {\n`;
        sc += `    /** JSON pointer to the offending field (e.g. "/email"); "/" for a root-level issue. */\n`;
        sc += `    field: string;\n`;
        sc += `    message: string;\n`;
        sc += `}\n\n`;


        sc += `export type ValidationResult =\n`;
        sc += `    | { valid: true; errors?: undefined }\n`;
        sc += `    | { valid: false; errors: ValidationIssue[] };\n\n`;

        sc += `export interface Validator<S extends DSchemaWith$id> {\n`;
        sc += `    /** Type guard backed by the precompiled check. No allocations. */\n`;
        sc += `    isValid(data: unknown): data is DTypeOf<S>;\n`;
        sc += `    /** Same check; collects TypeBox validation errors when the data is invalid. */\n`;
        sc += `    validate(data: unknown): ValidationResult;\n`;
        sc += `    /** JSON.parse + validate. Throws SyntaxError on malformed JSON, SchemaValidationError on a shape mismatch. */\n`;
        sc += `    deserialize(json: string): DTypeOf<S>;\n`;
        sc += `    /** Validate + JSON.stringify. Throws SchemaValidationError when the data is invalid. */\n`;
        sc += `    serialize(data: DTypeOf<S>): string;\n`;
        sc += `    getAst(): S;\n`;
        sc += `}\n\n`;

        sc += `export class SchemaValidationError extends Error {\n`;
        sc += `    readonly schemaId: string;\n`;
        sc += `    readonly errors: ValidationIssue[];\n`;
        sc += `    constructor(schemaId: string, errors: ValidationIssue[]) {\n`;
        sc += `        const first = errors[0];\n`;
        sc += `        super(schemaId + ' validation failed' + (first ? ': ' + first.field + ' ' + first.message : ''));\n`;
        sc += `        this.name = 'SchemaValidationError';\n`;
        sc += `        this.schemaId = schemaId;\n`;
        sc += `        this.errors = errors;\n`;
        sc += `    }\n`;
        sc += `}\n\n`;

        sc += `function toValidationIssues(errors: TLocalizedValidationError[]): ValidationIssue[] {\n`;
        sc += `    return errors.map((error) => ({ field: error.instancePath || '/', message: error.message }));\n`;
        sc += `}\n\n`;

        sc += `function createValidator<S extends DSchemaWith$id>(id: string, schema: S, check: (value: unknown) => boolean, astString: string): Validator<S> {\n`;
        sc += `    const assertValid = (data: unknown): DTypeOf<S> => {\n`;
        sc += `        if (!check(data)) throw new SchemaValidationError(id, toValidationIssues(Errors(schema, data)));\n`;
        sc += `        return data as DTypeOf<S>;\n`;
        sc += `    };\n`;
        sc += `    return {\n`;
        sc += `        isValid: (data: unknown): data is DTypeOf<S> => check(data),\n`;
        sc += `        validate: (data: unknown): ValidationResult => (check(data) ? { valid: true } : { valid: false, errors: toValidationIssues(Errors(schema, data)) }),\n`;
        sc += `        deserialize: (json: string) => assertValid(JSON.parse(json)),\n`;
        sc += `        serialize: (data: DTypeOf<S>) => JSON.stringify(assertValid(data)),\n`;
        sc += `        getAst: () => JSON.parse(astString)\n`;
        sc += `    };\n`;
        sc += `}\n`;

        return sc;
    }

    function buildCheckFactoryCode({ id, identifier, externals, body }: CompiledSchema): string {
        let sc = '';
        sc += `function createCheck_${id}(): (value: unknown) => boolean {\n`;
        sc += externals.length
            ? `${INDENT}const ${identifier}: ReadonlyArray<RegExp | ((value: string) => boolean)> = [\n${indent(externals.join(',\n'), 2)}\n${INDENT}];\n\n`
            : `${INDENT}const ${identifier}: ReadonlyArray<RegExp | ((value: string) => boolean)> = [];\n\n`;
        sc += `${indent(body)}\n\n`;
        sc += `${INDENT}return Check;\n`;
        sc += `}\n`;
        return sc;
    }

    /** Every validator is built eagerly here - cheap, since compilation itself already happened above at build time. */
    function buildRegistryCode(ids: readonly SchemaId[]): string {
        let sc = '';
        sc += ids
            .map((id) => {
                const astString = JSON.stringify(SCHEMA_REGISTRY[id], (_key, value) => {
                    if(value instanceof RegExp) return value.source;
                    return value;
                });
                return `export const ${id}Validator = createValidator("${id}", SCHEMA_REGISTRY.${id}, createCheck_${id}(), ${JSON.stringify(astString)})`;
            }).join(';\n');
        return sc;
    }

    function buildValidatorCodeBody(): string {
        const formatNames = buildFormatNameIndex();

        const ids = Object.keys(SCHEMA_REGISTRY) as SchemaId[];
        const refs = internRegistry(ids);
        const compiled = ids.map((id) => compileSchema(id, refs[id], formatNames));

        const sections = [
            buildImports(compiled),
            buildInterfacesCode(),
            ...compiled.map(buildCheckFactoryCode),
            buildRegistryCode(ids)
        ];
        return `${sections.map((section) => section.trimEnd()).join('\n\n')}\n`;
    }

    function buildValidatorSourceCode(): string {
        const sourceCodeHeader = `// AUTO-GENERATED FILE. DO NOT EDIT.\n// Generated by scripts/compiler.ts\n`;
        return `${sourceCodeHeader}\n${buildValidatorCodeBody()}`;
    }

    function generateValidator(outdir: string, outFile: string, outExt:string) {
        const sourceCode = buildValidatorSourceCode();
        const outPath = resolve(outdir, `${outFile}${outExt}`);
        mkdirSync(outdir, { recursive: true });
        writeFileSync(outPath, sourceCode);
        writeFileSync(resolve(outdir, `index${outExt}`), `export * from './validator';\n`)
    }

    return {
        compile: () => generateValidator(CONFIG.generatedValidatorDir, CONFIG.generatedValidatorFileName, CONFIG.generatedValidatorFileExtension)
    };
})();

ValidatorCompiler.compile();
