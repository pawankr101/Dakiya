
import { resolve as resolvePath } from "node:path";
import { Worker } from "node:worker_threads";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { rm, watch } from "node:fs";
import { build } from "esbuild";

/******************** CONFIGURATIONS: Start ********************/
const CWD = fileURLToPath(new URL(".", import.meta.url));
const CONFIG = {
    srcdir: resolvePath(CWD, "src"),
    outdir: resolvePath(CWD, "dist"),
    tsconfig: resolvePath(CWD, "tsconfig.json"),
    tsconfigProd: resolvePath(CWD, "tsconfig.prod.json"),
    entryPoints: [
        { in: resolvePath(CWD, "src", "index.ts"), out: "index" },
        { in: resolvePath(CWD, "src", "workers/index.ts"), out: "worker" }
    ],
    target: ["node24", "ES2022"],
    host: "localhost",
    port: 3600,
    watcherDelay: 2000
};
/********************* CONFIGURATIONS: End *********************/

/************************ Types: Start ************************/
/**
 * @typedef {{ outdir: string, entryPoints: [{in: string, out: string}], tsconfig: string, target: Array<string>, isProd?: boolean }} BuilderOptions
 * @typedef {{ host: string, port: number, watchDir?: string, watcherDelay?: number }} AppRunnerOptions
 */
/************************ Types: End *************************/

/*********************** Utils: Start ************************/
/**
 * generates a unique identifier string
 * @returns {string}
 */
function generateId() {
    return randomBytes(4).toString('hex');
}
/************************ utils: End *************************/

/**
 * Project builder using esbuild
 */
class ProjectBuilder {
    /************************ Types: Start ************************/
    /**
     * @typedef { import('esbuild').BuildOptions } BuildOptions
     * @typedef { import('esbuild').Message } BuilderMessage
     */
    /************************ Types: End *************************/

    static #staticHash = generateId();

    /** @type {BuildOptions} */
    static #DEFAULT_BUILD_OPTIONS = {
        bundle: true,
        platform: "node",
        format: "esm",
        packages: "external",
        loader: {
            ".ts": "ts"
        },
    };

    /**
     * @param {string} privateHash
     * @param {BuilderOptions} param1
     */
    constructor(privateHash,{ outdir, entryPoints, tsconfig, target, isProd}) {
        if (privateHash !== ProjectBuilder.#staticHash) throw new Error(`'ProjectBuilder' class constructor can not be called from outside.`);

        /** @type {boolean} */
        this.isProd = isProd ? true : false;

        /** @type {BuildOptions} */
        this.buildOptions = {
            ...ProjectBuilder.#DEFAULT_BUILD_OPTIONS,
            outdir, entryPoints, tsconfig, target,
            minify: isProd,
            treeShaking: isProd,
            write: true,
            sourcemap: 'inline'
        };
        if(isProd) {
            this.buildOptions.sourcemap = false;
            this.buildOptions.legalComments = "linked";
        };
    }

    /**
     * ###### console out build errors and warnings
     * @param {{warnings: BuilderMessage[], errors: BuilderMessage[]}} result
     */
    #logBuilderError(result) {
        if (result.warnings?.length) {
            const warnings = result.warnings.map((w) => w.text);
            console.warn("Warnings:", warnings);
        }
        if (result.errors?.length) {
            const errors = result.errors.map((e) => e.text);
            console.error("Errors:", errors);
        }
    }

    /**
     * #### deletes all files in a directory
     * @param {string} dir
     * @return {Promise<void>}
     */
    #deleteFilesinDir(dir) {
        return new Promise((success, failure) => {
            rm(dir, { recursive: true, force: true }, (error) => {
                if (error) failure(error);
                else success();
            });
        });
    }

    /**
     * #### build project
     */
    async build() {
        try {
            await this.#deleteFilesinDir(this.buildOptions.outdir);
            await build(this.buildOptions);
        } catch (error) {
            if (error.errors || error.warnings) this.#logBuilderError(error);
            else console.error(error);
        }
    }

    /**
     * ### gets a new ProjectBuilder instance
     * @param {BuilderOptions} options
     * @returns {ProjectBuilder}
     */
    static getBuilder(options) {
        return new ProjectBuilder(ProjectBuilder.#staticHash, options);
    }
}

class AppRunner {
    static #staticHash = generateId();

    /** @type {import("child_process").ChildProcess | Worker} */
    #instance = null;

    /** @type {ProjectBuilder} */
    #builder = null;

    /** @type {'process'|'worker'} */
    #mode = 'worker';

    /** @type {string} */
    #entryFile = null;

    #env = { ...process.env, FORCE_COLOR: "1" };

    /** @type {{ watchDir: string | null, watcherDelay: number }} */
    #watcher = { watchDir: null, watcherDelay: 0 };

    /**
     * @param {string} privateHash
     * @param {BuilderOptions} builderOptions
     * @param {AppRunnerOptions} runnerOptions
     */
    constructor(privateHash, builderOptions, runnerOptions) {
        if (privateHash !== AppRunner.#staticHash) throw new Error(`'AppRunner' class constructor can not be called from outside.`);

        this.#builder = ProjectBuilder.getBuilder(builderOptions);

        this.#entryFile = resolvePath(builderOptions.outdir, 'index.js');
        this.#env.PORT = runnerOptions.port.toString();
        this.#env.HOST = runnerOptions.host;

        if (runnerOptions.watchDir) {
            this.#watcher.watchDir = runnerOptions.watchDir;
            this.#watcher.watcherDelay = runnerOptions.watcherDelay || 2000;
        }
    }

    /**
     * #### stops the old running process or worker
     */
    async #stopOldProcess() {
        if(this.#instance) {
            if (this.#instance instanceof Worker) {
                // WORKER CLEANUP
                await this.#instance.terminate();
            } else {
                // SPAWN CLEANUP (SIGTERM Strategy)
                // 1. Send SIGTERM (Polite request to stop)
                this.#instance.kill("SIGTERM");

                const exitPromise = new Promise((resolve) => {
                    this.#instance.on("exit", resolve)
                });

                // 2. Force SIGKILL if it doesn't close in 2 seconds
                const timeout = new Promise((resolve) => {
                    setTimeout(() => {
                        if (this.#instance && this.#instance.exitCode === null) {
                            this.#instance.kill("SIGKILL");
                        }
                        resolve();
                    }, 2000)
                });

                await Promise.race([exitPromise, timeout]);
            }
            this.#instance = null;
        }
    }

    /**
     * #### starts a new process or worker
     */
    async #startNewProcess() {
        await this.#stopOldProcess();

        if (this.#mode === "worker") {
            // --- WORKER THREAD MODE ---
            this.#instance = new Worker(this.#entryFile, { env: this.#env, stdout: true, stderr: true, argv: ["--inspect", "--enable-source-maps"] });
            this.#instance.stdout.pipe(process.stdout);
            this.#instance.stderr.pipe(process.stderr);
            this.#instance.on("error", (err) => console.error(`[S] Error:`, err));
        } else {
            // --- PROCESS MODE (SPAWN) ---
            this.#instance = spawn("node", ["--inspect", "--enable-source-maps", this.#entryFile], {
                env: this.#env,
                stdio: "inherit"
            });
        }
    }

    /**
     * #### builds the project
     * @returns {Promise<boolean>} - returns true if build is successful, else false
     */
    async #buildProject() {
        try {
            await this.#builder.build();
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    /**
     * #### runs the application with watcher if configured
     */
    #runApp () {
        const { watchDir, watcherDelay } = this.#watcher;
        let timer = null, isBuilding = false, needRebuild = false, isFirstBuild = true;

        const rebuild = async () => {
            isBuilding = true;
            needRebuild = false;

            if(!isFirstBuild) console.log(`\u001b[33m  [S] Changes found.`);

            const isBuildSuccesiful = await this.#buildProject();

            if (isBuildSuccesiful && !needRebuild) {
                if(isFirstBuild) console.log(`\u001b[33m  [S] Starting application...`);
                else console.log(`\u001b[33m  [S] Restarting application...`);
                this.#startNewProcess();
            }

            isBuilding = false;
            isFirstBuild = false;
            if (needRebuild) {
                if (timer) clearTimeout(timer);
                timer = setTimeout(rebuild, watcherDelay);
            }
        }

        if(isFirstBuild) {
            rebuild();
        }

        if(watchDir) {
            watch(watchDir, { recursive: true }, () => {
                if(!isBuilding) {
                    if(timer) clearTimeout(timer);
                    timer = setTimeout(rebuild, watcherDelay);
                } else {
                    needRebuild = true;
                }
            });
        }
    }

    /**
     * #### starts the application
     * @param {'process'|'worker'} mode
     */
    async start(mode) {
        try {
            this.#mode = mode || this.#mode;
            this.#runApp();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * ### gets a new AppRunner instance
     * @param {BuilderOptions} builderOptions
     * @param {AppRunnerOptions} runnerOptions
     */
    static getRunner(builderOptions, runnerOptions) {
        return new AppRunner(AppRunner.#staticHash, builderOptions, runnerOptions);
    }
}


(function start() {
    const builderOptions = {
        outdir: CONFIG.outdir,
        entryPoints: CONFIG.entryPoints,
        tsconfig: CONFIG.tsconfig,
        target: CONFIG.target
    };
    if(process.argv.includes('--build')) {
        if (process.argv.includes('--prod')) {
            ProjectBuilder.getBuilder({
                ...builderOptions,
                tsconfig: CONFIG.tsconfigProd,
                isProd: true
            }).build();
        } else {
            ProjectBuilder.getBuilder(builderOptions).build();
        }
    } else {
        const runner = AppRunner.getRunner(builderOptions, {
            host: CONFIG.host,
            port: CONFIG.port,
            watchDir: CONFIG.srcdir,
            watcherDelay: CONFIG.watcherDelay
        });
        if(process.argv.includes('--process')) {
            runner.start('process');
        } else {
            runner.start('worker');
        }
    }
})();
