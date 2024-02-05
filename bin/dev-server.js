// dependencies
const { resolve, extname } = require("path");
const { readdir, watchFile, readFile } = require('fs');
const { createServer, Server } = require('http');
const { exec } = require('child_process');

/** @class Utils */
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
     * @param {[string]} exts each ext should be in lower case
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
     * @param {string[]} args 
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
 * @typedef { { publicDir: string, isFileAvailable(filename: string): boolean, getFileStream(filename: string): Promise<Buffer> } } StaticDataSource
 * @typedef { { new () => StaticDataSource, build(publicDir: string): Promise<StaticDataSource> } } StaticDataSourceConstructor
 * @type { StaticDataSourceConstructor }
 */
const StaticDataSource = (function() {
    const staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);

    /**
     * @typedef { {[filename: string]: Buffer} } DataSource
    */

    /**
     * 
     * @param {string} publicDir 
     * @param {DataSource} dataSource 
     * @returns {Promise<void>}
     */
    const buildDataSource = function(publicDir, dataSource) {
        return new Promise((res, rej) => {
            readdir(publicDir, { withFileTypes: true }, (err, files) => {
                if(err) rej(err);
                else {
                    for(var i=files.length-1;i>=0;i--) {
                        const file = files[i];
                        if(file.isFile()) dataSource[file.name] = null;
                    }
                    res();
                }
            });
        });
    }

    /** 
     * @constructor `StaticDataSource`
     * @param { string } publicDir 
     * @returns { StaticDataSource }
     */
    function StaticDataSource(publicDir) {
        if(!new.target || (new.target && arguments[1]!==staticHash)) throw new Error('Use `StaticDataSource.build` method to create Object.');

        /**  @type { string } */
        this.publicDir = publicDir;

        /**  @type { DataSource } */
        this.dataSource = Object.create(null);
    }

    /**
     * 
     * @param { string } filename 
     * @returns { boolean }
     */
    StaticDataSource.prototype.isFileAvailable = function(filename) {
        if(this.dataSource[filename] || this.dataSource[filename] === null) return true;
        return false;
    }

    /**
     * 
     * @param {string} filename 
     * @returns {Promise<Buffer>}
     */
    StaticDataSource.prototype.getFileStream = function(filename) {
        return new Promise((res, rej) => {
            if(this.dataSource[filename]) {
                res(this.dataSource[filename]);
            } else if(this.dataSource[filename] === null) {
                readFile(resolve(this.publicDir, filename), (err, data) => {
                    if(err) rej(err);
                    else {
                        this.dataSource[filename] = data;
                        res(this.dataSource[filename]);
                    }
                });
            } else rej(new Error(`File '${filename}' is not available.`));
        });
    }

    /**
     * 
     * @param { string } publicDir 
     * @returns { Promise<StaticDataSource> }
     */
    StaticDataSource.build = function(publicDir) {
        return new Promise((res, rej) => {
            const staticDataSource = new StaticDataSource(publicDir, staticHash);
            buildDataSource(publicDir, staticDataSource.dataSource).then(() => res(staticDataSource)).catch(rej);
        });
    }

    return StaticDataSource;
})();

/** @class StaticServer */
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
    StaticServer.prototype.start = function(publicDir, port, host='localhost') {
        return new Promise((res, rej) => {
            StaticDataSource.build(publicDir).then((dataSource) => {
                const server = createServer((request, response) => {
                    let path = request.url.split('?')[0];
                    path = path==='/'? 'index.html' : (path[0]==='/' ? path.slice(1) : path);
                    if(!dataSource.isFileAvailable(path)) path = 'index.html';
                    dataSource.getFileStream(path).then((fileBuffer) => {
                        response.setHeader('Content-Type', Utils.getMimeType(extname(path)));
                        response.end(fileBuffer);
                    }).catch((err) => {
                        response.writeHead(500, 'Internal Server Error.', {'Content-Type': 'text/plain'});
                        response.end(err.message);
                    });
                }).on('error', rej);
                if(this.server) this.server.close();
                this.server = server;
                this.server.listen(port, host, () => {
                    console.log(`\u001b[32m  [C] Client Application Started.`);
                    console.log(`\u001b[32m  [C] Client Application listening at => \u001b[34mhttp://${host}:${port}`);
                    res();
                });
            }).catch(rej);
        });
    }
    
    return StaticServer;
})();

/**
 * ### Start static Dev Server.
 * @typedef {{host?: string, preStartCommand?: string, watch?: boolean, watchDir?: string, fileExtensionsToWatch?: [string], watcherDelay?: number, cwd?: string, outputForPreRunCommand?: boolean}} StaticServerOptions
 * @param {string} publicDir
 * @param {number} port
 * @param {StaticServerOptions} [options]
 */
function startStaticDevServer(publicDir, port, options) {
    const ss = StaticServer.create();
    options = options || {};
    Utils.runCommand(options.preStartCommand, (options.cwd || __dirname), options.outputForPreRunCommand).then(() => {
        ss.start(publicDir, port, options.host).catch(console.error).then(() => {
            if(options.watch && options.watchDir) {
                console.log(`\u001b[33m  [C] Watch mode: ON`);
                if(options.watcherDelay) Utils.watcherDelay = options.watcherDelay;
                Utils.addAnyFileChangeHandler(options.watchDir, options.fileExtensionsToWatch || [], () => {
                    console.log(`\u001b[33m  [C] Changes found. Restarting the server...`);
                    Utils.runCommand(options.preStartCommand, (options.cwd || __dirname), options.outputForPreRunCommand)
                        .then(() => ss.start(publicDir, port, options.host));
                })
            }
        });
    });
    
}

module.exports = { startStaticDevServer };
