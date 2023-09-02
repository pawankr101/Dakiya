// dependencies
const { resolve, extname } = require("path");
const { readdirSync, watchFile, createReadStream } = require('fs');
const { createServer, Server } = require('http');
const { spawnSync } = require('child_process');

/** @class Utils */
const Utils = (function() {  

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
        const files = readdirSync(dirPath, {withFileTypes:true});
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

    /**
     * ### Delay Time in Millisecond between two consecutive fileChangeHandler trigger.
     * @type {number}
     */
    Utils.watcherDelay = 3000;

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
     */
    Utils.runCommand = function(command, args, cwd, consoleOut=false) {
        spawnSync(command, args, {cwd: cwd, stdio: consoleOut ? 'inherit' : 'ignore', stderr: consoleOut ? 'inherit' : 'ignore'});
    }
    
    return Utils;
})();

/** @class StaticServer */
const StaticServer = (function() {
    const staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);
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
     */
    StaticServer.prototype.start = function(publicDir, port, host='localhost') {
        if(this.server) this.server.close();
            this.server = createServer((request, response) => {
                const filePath = resolve(publicDir, request.url==='/'? 'index.html' : (request.url[0]==='/' ? request.url.slice(1) : request.url));
                response.setHeader('Content-Type', mimeType[extname(filePath)]);
                const fileStream = createReadStream(filePath);
                fileStream.pipe(response);
                fileStream.on('error', (err) => {
                    response.writeHead(500, 'Internal Server Error.', {'Content-Type': 'text/plain'});
                    response.end(err.message);
                });
            }).on('error', console.error).listen(port, host, () => {
                console.log(`\u001b[32m  [C] Client Application Started:`);
                console.log(`\u001b[32m  [C] Client Application listening at: => \u001b[34mhttp://${host}:${port}`);
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
    const command = (options.preStartCommand||'').trim().split(' ');
    if(options.preStartCommand) Utils.runCommand(command[0], command.slice(1), (options.cwd || __dirname), options.outputForPreRunCommand);
    ss.start(publicDir, port, options.host);
    if(options.watch && options.watchDir) {
        if(options.watcherDelay) Utils.watcherDelay = options.watcherDelay;
        Utils.addAnyFileChangeHandler(options.watchDir, options.fileExtensionsToWatch || [], (file) => {
            console.log(`\u001b[33m  [C] Changes found. Restarting the server...`);
            if(options.preStartCommand) Utils.runCommand(command[0], command.slice(1), (options.cwd || __dirname), options.outputForPreRunCommand);
            ss.start(publicDir, port, options.host);
        })
    }
}

module.exports = { startStaticDevServer };
