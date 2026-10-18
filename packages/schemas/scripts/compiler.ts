/// <reference types="node" />
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Code } from "typebox/compile";
import Format, { type TFormatCheckFunction } from "typebox/format";
import { Intern } from "typebox/schema";
import { type DSchemaWith$id, SCHEMA_REGISTRY, type SchemaId } from "../src/core";

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
            if (name) return `Format.Get(${JSON.stringify(name)})`;
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

    /**
     * Strips comments and string literals before tokenizing identifiers so:
     * 1. Identifiers starting with `$` are matched accurately (unlike `\b`), and
     * 2. Words inside string literals or comments never trigger false-positive imports.
     */
    function extractUsedIdentifiers(source: string): Set<string> {
        const stripped = source
            .replace(/\/\/.*$/gm, " ")
            .replace(/\/\*[\s\S]*?\*\//g, " ")
            .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, " ");
        return new Set(stripped.match(IDENTIFIER_TOKEN) ?? []);
    }

    // ------------------------------------------------------------------
    // per-schema compilation
    // ------------------------------------------------------------------

    function compileSchema(id: SchemaId, formatNames: Map<TFormatCheckFunction, string>): CompiledSchema {
        const rawSchema = SCHEMA_REGISTRY[id];
        if (!IDENTIFIER.test(id)) throw new Error(`[${id}] registry key must be a valid identifier`);
        if (rawSchema.$id !== id) throw new Error(`[${id}] registry key does not match schema $id "${rawSchema.$id}"`);

        // Serialize once so both `Code(Intern(...))` and runtime `Errors(getAst(), ...)`
        // operate on the exact same normalized JSON Schema AST.
        const astString = JSON.stringify(rawSchema, (key, value) => {
            if (key === "$id" && typeof value === "string" && value !== id) return undefined;
            if (value instanceof RegExp) return value.source;
            return value;
        });
        const normalizedSchema = JSON.parse(astString) as DSchemaWith$id;

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

    function buildInterfacesCode(): string {
        let sc = "";

        sc += `export interface ValidationIssue {\n`;
        sc += `    field: string;\n`;
        sc += `    message: string;\n`;
        sc += `}\n\n`;

        sc += `export type ValidationResult =\n`;
        sc += `    | { valid: true; issues?: undefined }\n`;
        sc += `    | { valid: false; issues: ValidationIssue[] };\n\n`;

        sc += `export interface Validator<S extends DSchemaWith$id> {\n`;
        sc += `    /** Type guard backed by the precompiled check. No allocations. */\n`;
        sc += `    isValid(data: unknown): data is DTypeOf<S>;\n`;
        sc += `    /** Same check; collects TypeBox validation issues when the data is invalid. */\n`;
        sc += `    validate(data: unknown): ValidationResult;\n`;
        sc += `    /** JSON.parse + validate. Throws SyntaxError on malformed JSON, SchemaValidationError on a shape mismatch. */\n`;
        sc += `    deserialize(json: string): DTypeOf<S>;\n`;
        sc += `    /** Validate + JSON.stringify. Throws SchemaValidationError when the data is invalid. */\n`;
        sc += `    serialize(data: DTypeOf<S>): string;\n`;
        sc += `    /** Lazily parses and returns the JSON Schema AST. */\n`;
        sc += `    getAst(): S;\n`;
        sc += `}\n\n`;

        sc += `export class SchemaValidationError extends Error {\n`;
        sc += `    readonly schemaId: string;\n`;
        sc += `    readonly issues: ValidationIssue[];\n`;
        sc += `    constructor(schemaId: string, issues: ValidationIssue[]) {\n`;
        sc += `        const first = issues[0];\n`;
        sc += `        super(schemaId + ' validation failed' + (first ? ': ' + first.field + ' ' + first.message : ''));\n`;
        sc += `        this.name = 'SchemaValidationError';\n`;
        sc += `        this.schemaId = schemaId;\n`;
        sc += `        this.issues = issues;\n`;
        sc += `    }\n`;
        sc += `}\n\n`;

        sc += `function toValidationIssues(errors: TLocalizedValidationError[]): ValidationIssue[] {\n`;
        sc += `    if (errors.length === 0) return [{ field: '/', message: 'Invalid value' }];\n`;
        sc += `    return errors.map((error) => ({ field: error.instancePath || '/', message: error.message }));\n`;
        sc += `}\n\n`;

        sc += `/* @__NO_SIDE_EFFECTS__ */\n`;
        sc += `function createValidator<S extends DSchemaWith$id>(id: string, check: (value: unknown) => boolean, astString: string): Validator<S> {\n`;
        sc += `    let cachedAst: S | undefined;\n`;
        sc += `    const getAst = (): S => (cachedAst ??= JSON.parse(astString) as S);\n`;
        sc += `    const assertValid = (data: unknown): DTypeOf<S> => {\n`;
        sc += `        if (!check(data)) throw new SchemaValidationError(id, toValidationIssues(Errors(getAst(), data)));\n`;
        sc += `        return data as DTypeOf<S>;\n`;
        sc += `    };\n`;
        sc += `    return {\n`;
        sc += `        isValid: (data: unknown): data is DTypeOf<S> => check(data),\n`;
        sc += `        validate: (data: unknown): ValidationResult => (check(data) ? { valid: true } : { valid: false, issues: toValidationIssues(Errors(getAst(), data)) }),\n`;
        sc += `        deserialize: (json: string) => assertValid(JSON.parse(json)),\n`;
        sc += `        serialize: (data: DTypeOf<S>) => JSON.stringify(assertValid(data)),\n`;
        sc += `        getAst\n`;
        sc += `    };\n`;
        sc += `}\n`;

        return sc;
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

        const ids = Object.keys(SCHEMA_REGISTRY) as SchemaId[];
        const compiled = ids.map((id) => compileSchema(id, formatNames));

        const sections = [
            buildImports(compiled),
            buildInterfacesCode(),
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
