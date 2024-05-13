// dependencies
import { resolve, extname } from 'path';
import { readdir, watchFile, rm } from 'fs';
import { createServer, Server } from 'http';
import { exec } from 'child_process';
import { build } from 'esbuild';

/**
 * @class `Utils`
 * @typedef { {} } Utils
 * @typedef { { 
 *    new () => Utils, watcherDelay: number,
 *    addAnyFileChangeHandler(dirPath: string, requiredExtensions: string[], fileChangeHandler: (file: string) => void): void,
 *    runCommand(command: string, cwd: string, consoleOut?: boolean): Promise<void>,
 *    getMimeType(fileExt: string): string
 *  } } UtilsConstructor
 * @type { UtilsConstructor }
 */
const Utils = (function() { 
    const mimeType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    }

    /** @constructor */
    function Utils(){}

    /**
     * ### Check if file has required extension
     * @private
     * @param {string} fileName 
     * @param {[string]} exts each ext should be in lower case
     * @returns {boolean}
     */
    const isRequiredFile = (fileName, exts) => {
        if(exts && exts.length){
            fileName = fileName.toLowerCase();
            for(var i=exts.length-1; i>=0; i--) {
                if(fileName.endsWith(`.${exts}`)) return true;
            }
            return false;
        }
        return true;
    }

    /** 
     * ### Collect all paths of files inside the directory(`dirPath`), into `filePaths`
     * @private
     * @param {string} dirPath absolute path
     * @param {string[]} exts each ext should be in lower case
     * @param {(file: string)=>void} fileChangeHandler 
     */
    const collectFilePaths = (dirPath, exts, fileChangeHandler) => {
        readdir(dirPath, {withFileTypes:true}, (err, files) => {
            if(err) console.log(err);
            else {
                for(var i=files.length-1;i>=0;i--) {
                    const file = files[i], filePath = resolve(dirPath, file.name);
                    if(file.isDirectory()) collectFilePaths(filePath, exts, fileChangeHandler);
                    else if(file.isFile() && isRequiredFile(file.name, exts)) {
                        watchFile(filePath, {interval: Utils.watcherDelay}, (curr, prev) => {
                            if(curr.mtimeMs != prev.mtimeMs) fileChangeHandler(filePath);
                        });
                    }
                }
            }
        });
    }

    /**
     * ### Delay Time in Millisecond between two consecutive fileChangeHandler trigger.
     * @type {number}
     */
    Utils.watcherDelay = 2000;

    /**
     * ### Add `fileChangeHandler` to all the files matching `requiredExtensions` in given directory(`dirPath`)
     * @param {string} dirPath absolute path
     * @param {[string]} requiredExtensions 
     * @param {(file: string)=>void} fileChangeHandler 
     */
    Utils.addAnyFileChangeHandler = function(dirPath, requiredExtensions, fileChangeHandler) {
        collectFilePaths(dirPath, requiredExtensions.map(ext=>ext.toLowerCase()), fileChangeHandler);
    }

    /**
     * ### Execute a command synchronously.
     * @param {string} command 
     * @param {string} cwd 
     * @param {boolean} [consoleOut=false] 
     * @returns {Promise<void>}
     */
    Utils.runCommand = function(command, cwd, consoleOut=false) {
        return new Promise((res) => {
            if(command) {
                exec(command, {cwd: cwd}, (error, stdOut, stdErr) => {
                    if(error) console.error(error);
                    else if(consoleOut) {
                        if(stdOut) console.log(`\u001b[36m ${stdOut}`);
                        if(stdErr) console.log(`\u001b[31m ${stdErr}`);
                    }
                    res();
                });
            } else res();
        });
    }

    /**
     * ### Get Mime Type for file extension.
     * @param {string} fileExt 
     * @returns {string}
     */
    Utils.getMimeType = function(fileExt) {
        return mimeType[fileExt] || 'text/plain';
    }
    
    return Utils;
})();

/**
 * @class `StaticDataSource`
 * @typedef { { isFileAvailable(filename: string): boolean, getFile(filename: string): Uint8Array, addFile(filename: string, file: Uint8Array): void, removeAllFiles(): void } } StaticDataSource
 * @typedef { { new () => StaticDataSource, create(): StaticDataSource } } StaticDataSourceConstructor
 * @type { StaticDataSourceConstructor }
 */
const StaticDataSource = (function() {
    const staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);
    /** @type {StaticDataSource} */
    let instance;

    /**
     * @typedef { {[filename: string]: Uint8Array} } DataSource
    */

    /** 
     * @constructor `StaticDataSource`
     * @returns { StaticDataSource }
     */
    function StaticDataSource() {
        if(!new.target || (new.target && arguments[0]!==staticHash)) throw new Error('Use `StaticDataSource.create` method to create Object.');
        if(instance) return instance;

        /**  @type { DataSource } */
        this.dataSource = Object.create(null);

        instance = this;
    }

    /**
     * @param { string } filename 
     * @returns { boolean }
     */
    StaticDataSource.prototype.isFileAvailable = function(filename) {
        return this.dataSource[filename];
    }

    /**
     * 
     * @param {string} filename 
     * @returns {Uint8Array}
     */
    StaticDataSource.prototype.getFile = function(filename) {
        return this.dataSource[filename];
    }

    /**
     * @param {string} filename 
     * @param {Uint8Array} file
     */
    StaticDataSource.prototype.addFile = function(filename, file) {
        this.dataSource[filename] = file;
    }

    StaticDataSource.prototype.removeAllFiles = function() {
        this.dataSource = Object.create(null);
    }

    StaticDataSource.create = function() {
        return new StaticDataSource(staticHash)
    }

    return StaticDataSource;
})();

/**
 * @class `StaticDataSource`
 * @typedef { { start(port: number, host?: string): Promise<void> } } StaticServer
 * @typedef { { new () => StaticServer, create(): StaticServer } } StaticServerConstructor
 * @type { StaticServerConstructor }
 */
const StaticServer = (function() {
    const staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);

    /** @constructor */
    function StaticServer() {
        if(!new.target || (new.target && arguments[0]!==staticHash)) throw new Error('Use `StaticServer.create` method to create Object.');
        if(instance) return instance;

        /** @type {Server} */
        this.server = null;
        instance = this;
    }
    
    /** @type {StaticServer} */
    let instance;

    /** ### Create `StaticServer` instance */
    StaticServer.create = function() {
        return new StaticServer(staticHash);
    }

    /**
     * ### Start Static Server
     * @param {string} publicDir Absolute path for public directory
     * @param {number} port
     * @param {string} [host='localhost']
     * @returns {Promise<void>}
     */
    StaticServer.prototype.start = function(port, host='localhost') {
        return new Promise((res, rej) => {
            const dataSource = StaticDataSource.create();
            const server = createServer((request, response) => {
                let path = request.url.split('?')[0];
                path = path==='/'? 'index.html' : (path[0]==='/' ? path.slice(1) : path);
                let file = dataSource.getFile(path);
                if(!file) file = dataSource.getFile(path = 'index.html');
                if(!file) {
                    response.writeHead(500, 'Internal Server Error.', {'Content-Type': 'text/plain'});
                    response.end(err.message);
                } else {
                    response.setHeader('Content-Type', Utils.getMimeType(extname(path)));
                    response.end(file);
                }
            }).on('error', rej);
            if(this.server) this.server.close();
            this.server = server;
            this.server.listen(port, host, () => {
                console.log(`\u001b[32m  [C] Client Application Started.`);
                console.log(`\u001b[32m  [C] Client Application listening at => \u001b[34mhttp://${host}:${port}`);
                res();
            });
        });
    }
    
    return StaticServer;
})();

/**
 * @class `Builder`
 * @typedef { import('esbuild').BuildOptions } BuildOptions
 * @typedef { { builderOptions: BuildOptions, addEntry(srcFile: string, outputFile: string): Builder, build(): Promise<void>, prodBuild(publicDir: string, tsconfig: string, consoleOut?: boolean): Promise<void> } } Builder
 * @typedef { { new(builderOptions: BuildOptions): Builder, create(srcDir: string, publicDir: string, tsconfig: string, entryPoints?: {in: string, out: string}[]): Builder } } BuilderConstructor
 * @type { BuilderConstructor }
 */
const Builder = (function() {
    const staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);

    /** @type {Builder} */
    let instance;

    /** @type {BuildOptions} */
    const defaultBuilderOptions = {
        bundle: true,
        platform: 'browser',
        loader: {
            '.ts': 'ts',
            '.tsx': 'tsx',
            '.css': 'css',
            '.json': 'json',
            '.html': 'copy',
            '.ttf': 'file',
            '.ico': 'file',
        }
    };

    /**
     * @constructor `Builder`
     * @param {BuildOptions} builderOptions
     */
    function Builder(builderOptions) {
        if(!new.target || (new.target && arguments[1]!==staticHash)) throw new Error('Use `Builder.create` method to create Object.');
        if(instance) return instance;

        if(!buildOptions.entryPoints) buildOptions.entryPoints = [];

        /** @type {BuildOptions} */
        this.builderOptions = Object.assign(defaultBuilderOptions, builderOptions);
        instance = this;
    }

    /**
     * @param {string} srcFile 
     * @param {string} outputFile 
     * @returns {Builder}
     */
    Builder.prototype.addEntry = function(srcFile, outputFile) {
        this.builderOptions.entryPoints.push({ in: srcFile, out: outputFile });
        return this;
    }

    /**
     * @param {boolean} [consoleOut = false] 
     * @returns {Promise<void>}
     */
    Builder.prototype.build = function() {
        return new Promise((resolve) => {
            const dataSource = StaticDataSource.create();
            let option = Object.assign(this.builderOptions, { sourcemap: 'inline', write: false });
            build(option).then((res) => {
                if(res.outputFiles) {
                    dataSource.removeAllFiles();
                    res.outputFiles.forEach(file => {
                        let i = file.path.lastIndexOf('/');
                        if(i>-1) dataSource.addFile(file.path.slice(i+1), file.contents);
                    });
                }
                if(res.warnings && res.warnings.length) console.log(res.warnings);
                if(res.errors && res.errors.length) console.log(res.errors);
                resolve();
            }).catch((err) => {
                console.error(err);
                resolve()
            });
        });
    }

    Builder.prototype.prodBuild = function(publicDir, tsconfig, consoleOut=false) {
        return new Promise((resolve) => {
            /** @type {BuildOptions} */
            let option = Object.assign(this.builderOptions, {outdir: publicDir, tsconfig: tsconfig, sourcemap: undefined, write: true, minify: true, treeShaking: true,});
            rm(publicDir, {recursive: true, force: true}, () => {
                build(option).then((res) => {
                    if(consoleOut) console.log(res);
                    resolve();
                }).catch((err) => {
                    console.error(err);
                    resolve()
                });
            })
        });
    }

    /**
     * Create `Builder` instance
     * @param {string} srcDir
     * @param {string} publicDir
     * @param {string} tsconfig
     * @param {[{in: string, out: string}]} [entryPoints={}]
     * @returns {Builder}
     */
    Builder.create = function(srcDir, publicDir, tsconfig, entryPoints) {
        return new Builder({
            outdir: publicDir,
            tsconfig: tsconfig,
            entryPoints: (entryPoints || []).map(e => {
                return { in: resolve(srcDir, e.in), out: e.out };
            })
        }, staticHash);
    }

    return Builder;

})();


/**
 * ### Start static Dev Server.
 * @typedef {{host?: string, fileExtensionsToWatch?: [string], watcherDelay?: number, tsconfig?: string, entryPoints?: [{in: string, out: string}]}} StaticServerOptions
 * @param {number} port
 * @param {string} srcDir
 * @param {string} publicDir
 * @param {StaticServerOptions} [options]
 */
export function startStaticDevServer(port, srcDir, publicDir, options) {
    options = options || {};
    const ss = StaticServer.create();
    const builder = Builder.create(srcDir, publicDir, options.tsconfig, options.entryPoints);
    builder.build().then(() => {
        ss.start(port, options.host).catch(console.error).then(() => {
            if(options.watcherDelay) Utils.watcherDelay = options.watcherDelay;
            Utils.addAnyFileChangeHandler(srcDir, options.fileExtensionsToWatch || [], () => {
                console.log(`\u001b[33m  [C] Changes found. Restarting the server...`);
                builder.build().then(() => ss.start(port, options.host));
            })
        });
    });
}

const buildOptions = {
    entryPoints: [
        { in: 'index.tsx', out: 'main' },
        { in: 'workers/index.ts', out: 'worker' },
        { in: 'index.html', out: 'index' }
    ],
    tsconfig: '',
    tsconfigProd:'',
    publicDir: '',
    srcDir: '',
    watcherDelay: 10
}