import { resolve as resolvePath } from "path";
import { createServer, Server } from "http";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { rm, watch } from "fs";
import { build } from "esbuild";
import MIME from "mime/lite";

/******************** CONFIGURATIONS: Start ********************/
const CWD = fileURLToPath(new URL(".", import.meta.url));
const CONFIG = {
    srcDir: resolvePath(CWD, "src"),
    publicDir: resolvePath(CWD, "dist"),
    tsconfig: resolvePath(CWD, "tsconfig.json"),
    tsconfigProd: resolvePath(CWD, "tsconfig.prod.json"),
    entryPoints: [
        { in: resolvePath(CWD, "src", "index.html"), out: "index" },
        { in: resolvePath(CWD, "src", "index.tsx"), out: "main" },
        { in: resolvePath(CWD, "src", "workers/index.ts"), out: "worker" },
        { in: resolvePath(CWD, "src", "assets/dakiya.ico"), out: "favicon" },
    ],
    target: ["ES2022", "chrome120", "firefox121", "edge120", "safari17"],
    host: "localhost",
    port: 3500,
    watcherDelay: 2000,
    logBuildResult: false,
    cachesIndexHtml: true,
};
/********************* CONFIGURATIONS: End *********************/

/************************ Types: Start ************************/
/**
 * @typedef {{ publicDir: string, entryPoints: [{in: string, out: string}], tsconfig: string, target: Array<string>, isProd?: boolean, cachesIndexHtml?: boolean, logBuildResult?: boolean }} BuilderOptions
 * @typedef {{host: string, port: number, watchDir?: string, watcherDelay?: number}} ServerOptions
 */
/************************ Types: End *************************/

/*********************** Utils: Start ************************/
/**
 * generates a unique identifier string
 * @returns {string}
 */
function generateId() {
    return randomUUID().toString();
}
/************************ utils: End *************************/

/**
 * Static file cache manager
 */
class StaticFiles {
    /** @type {{[filename: string]: Uint8Array}} */
    #cachedFiles = Object.create(null);

    /**
     * ##### gets a cached file
     * @param {string} filename
     * @return {Uint8Array}
     */
    getFile(filename) {
        return this.#cachedFiles[filename];
    }

    /**
     * ##### puts a file into cache
     * @param {string} filename
     * @param {Uint8Array} file
     */
    putFile(filename, file) {
        this.#cachedFiles[filename] = file;
    }

    /**
     * ##### Remove all cached files
     */
    removeAllFiles() {
        this.#cachedFiles = Object.create(null);
    }
}

/**
 * Project builder using esbuild
 */
class ProjectBuilder {
    /************************ Types: Start ************************/
    /**
     * @typedef { import('esbuild').BuildOptions } BuildOptions
     * @typedef { import('esbuild').BuildResult<BuildOptions> } BuildResult
     * @typedef { import('esbuild').Message } BuilderMessage
     * @typedef { import('esbuild').OutputFile } OutputFile
     */
    /************************ Types: End *************************/

    static #staticHash = generateId();

    /** @type {BuildOptions} */
    static #DEFAULT_BUILD_OPTIONS = {
        bundle: true,
        platform: "browser",
        format: "esm",
        loader: {
            ".ts": "ts",
            ".tsx": "tsx",
            ".css": "css",
            ".json": "json",
            ".html": "copy",
            ".ttf": "file",
            ".ico": "copy",
        },
    };

    /**
     * @param {string} privateHash
     * @param {BuilderOptions} param1
     */
    constructor(
        privateHash,
        {
            publicDir,
            entryPoints,
            tsconfig,
            target,
            isProd,
            cachesIndexHtml,
            logBuildResult,
        },
    ) {
        if (privateHash !== ProjectBuilder.#staticHash) {
            throw new Error(
                `'ProjectBuilder' class constructor can not be called from outside.`,
            );
        }

        /** @type {BuildOptions} */
        this.buildOptions = {
            ...ProjectBuilder.#DEFAULT_BUILD_OPTIONS,
            outdir: publicDir,
            entryPoints,
            tsconfig,
            target,
        };

        /** @type {boolean} */
        this.isProd = isProd || false;

        if (isProd)
            this.buildOptions = {
                ...this.buildOptions,
                minify: true,
                sourcemap: false,
                treeShaking: true,
                write: true,
                legalComments: "linked",
            };
        else {
            this.buildOptions = {
                ...this.buildOptions,
                minify: false,
                sourcemap: "inline",
                treeShaking: false,
                write: false,
            };

            /** @type {StaticFiles} */
            this.cache = new StaticFiles();
            this.cachesIndexHtml = cachesIndexHtml || false;
            this.logBuildResult = logBuildResult || false;
        }
    }

    /**
     * ###### console out build errors and warnings
     * @param {{warnings: BuilderMessage[], errors: BuilderMessage[]}} result
     */
    #logBuilderError(result) {
        if (result.warnings && result.warnings.length) {
            const warnings = result.warnings.map((w) => w.text);
            console.warn("Warnings:", warnings);
        }
        if (result.errors && result.errors.length) {
            const errors = result.errors.map((e) => e.text);
            console.error("Errors:", errors);
        }
    }

    /**
     * ###### console out build result
     * @param {BuildResult} res
     */
    #logBuilderResult(res) {
        if (res.outputFiles && res.outputFiles.length) {
            const outputFiles = res.outputFiles.map((f) => f.path);
            console.log("Output Files:", outputFiles);
        }
        this.#logBuilderError(res);
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
     * #### prod build process
     * @return {Promise<void>}
     */
    async #prodBuild() {
        try {
            await this.#deleteFilesinDir(this.buildOptions.outdir);
            await build(this.buildOptions);
        } catch (error) {
            if (error.errors || error.warnings) this.#logBuilderError(error);
            else console.error(error);
        }
    }

    /**
     * ##### updates the static file cache
     * @param {OutputFile[]} newFiles
     * @param {boolean} [retainIndexHtml]
     */
    #updateCache(newFiles) {
        let indexHtml = null;
        if (this.cachesIndexHtml) indexHtml = this.cache.getFile("index.html");
        this.cache.removeAllFiles();
        newFiles.forEach((file) => {
            const i = file.path.lastIndexOf("/");
            this.cache.putFile(
                i > -1 ? file.path.slice(i + 1) : file.path,
                file.contents,
            );
        });
        if (indexHtml) this.cache.putFile("index.html", indexHtml);
    }

    /**
     * #### dev build process
     */
    async #devBuild() {
        try {
            await this.#deleteFilesinDir(this.buildOptions.outdir);
            const res = await build(this.buildOptions);
            if (this.logBuildResult) this.#logBuilderResult(res);
            this.#updateCache(res.outputFiles || []);
        } catch (error) {
            if (error.errors || error.warnings) this.#logBuilderError(error);
            else console.error(error);
        }
    }

    /**
     * #### build project
     */
    async build() {
        if (this.isProd) {
            await this.#prodBuild();
        } else {
            await this.#devBuild();
        }
    }

    /**
     * ### gets a new ProjectBuilder instance
     * @param {BuilderOptions} options
     * @returns {ProjectBuilder}
     */
    static getBuilder(options) {
        return new ProjectBuilder(this.#staticHash, options);
    }
}

/**
 * Static file server
 */
class StaticServer {
    /** @type {Server} */
    static #server = null;

    /** @type {StaticFiles} */
    static #fileSource = null;

    /**
     * #### gets the requested file from the static file sources
     * @param {string} url
     * @return {{name: string, size: number, contents: Uint8Array}}
     */
    static #getRequestedFile(url) {
        if (!this.#fileSource) return null;
        let path = url.split("?")[0];
        if (path[0] === "/") path = path.slice(1);
        if (!path) path = "index.html";

        let file = this.#fileSource.getFile(path);
        if (!file) {
            path = "index.html";
            file = this.#fileSource.getFile(path);
        }

        return file ? { name: path, size: file.length, contents: file } : null;
    }

    /**
     * #### handles incoming requests
     * @param {import("http").IncomingMessage} request
     * @param {import("http").ServerResponse} response
     * @param {StaticFiles} source
     */
    static #requestHandler = (request, response) => {
        const file = this.#getRequestedFile(request.url);
        if (!file) {
            response.writeHead(404, "Resource not found.", {
                "content-type": MIME.getType("json"),
            });
            response.end('{"message": "Resource not found."}');
        } else {
            response.writeHead(200, "Success", {
                "content-type": MIME.getType(file.name),
                "content-length": file.size,
            });
            response.end(file.contents);
        }
    };

    /**
     * #### Start the static files server
     * @param {string} host
     * @param {number} port
     * @return {Promise<void>}
     */
    static #startServer(host, port) {
        return new Promise((success, failure) => {
            // create server
            const server = createServer(this.#requestHandler);
            server.on("error", failure);

            if (this.#server) this.#server.close();
            this.#server = server;

            server.listen(port, host, () => {
                console.log(`\u001b[32m  [C] Client Application Started.`);
                console.log(
                    `\u001b[32m  [C] Client Application listening at => \u001b[34mhttp://${host}:${port}`,
                );
                success();
            });
        });
    }

    /**
     * #### watches a directory for changes
     * @param {string} watchDir
     * @param {number} watcherDelay
     * @param {ProjectBuilder} builder
     * @return {void}
     */
    static #watchDirectory(watchDir, watcherDelay, builder) {
        let currentTime = performance.now(),
            updateCompleted = true;
        const watcher = watch(watchDir, { recursive: true }, () => {
            if (
                updateCompleted &&
                performance.now() > currentTime + watcherDelay
            ) {
                updateCompleted = false;
                console.log(`\u001b[33m  [C] Changes found.`);
                builder
                    .build()
                    .then(() => {
                        currentTime = performance.now();
                        updateCompleted = true;
                        console.log(`\u001b[33m  [C] Changes applied.`);
                    })
                    .catch((error) => {
                        console.error(error);
                        watcher.close();
                    });
            }
        });
    }

    /**
     *
     * @param {BuilderOptions} builderOptions
     * @param {ServerOptions} serverOptions
     */
    static async start(builderOptions, serverOptions) {
        try {
            const builder = ProjectBuilder.getBuilder(builderOptions);
            await builder.build();
            this.#fileSource = builder.cache;

            await this.#startServer(serverOptions.host, serverOptions.port);
            if (serverOptions.watchDir) {
                this.#watchDirectory(
                    serverOptions.watchDir,
                    serverOptions.watcherDelay,
                    builder,
                );
            }
        } catch (error) {
            console.error(error);
            process.exit(1);
        }
    }
}

(function start() {
    if (process.argv.includes("--build")) {
        ProjectBuilder.getBuilder({
            publicDir: CONFIG.publicDir,
            entryPoints: CONFIG.entryPoints,
            tsconfig: CONFIG.tsconfigProd,
            target: CONFIG.target,
            isProd: true,
        }).build();
    } else {
        StaticServer.start(
            {
                publicDir: CONFIG.publicDir,
                entryPoints: CONFIG.entryPoints,
                tsconfig: CONFIG.tsconfig,
                target: CONFIG.target,
                cachesIndexHtml: CONFIG.cachesIndexHtml,
                logBuildResult: CONFIG.logBuildResult,
            },
            {
                host: CONFIG.host,
                port: CONFIG.port,
                watchDir: CONFIG.srcDir,
                watcherDelay: CONFIG.watcherDelay,
            },
        );
    }
})();
