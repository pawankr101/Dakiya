import { resolve as resolvePath } from 'path';
import { readdir, watchFile, rm } from 'fs';
import { createServer, Server } from 'http';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import MIME from 'mime/lite';

/****************************** CONFIGURATIONS ******************************/
const CWD = fileURLToPath(new URL('.', import.meta.url));
const CONFIG = {
  srcDir: resolvePath(CWD, 'src'),
  publicDir: resolvePath(CWD, 'dist'),
  tsconfig: resolvePath(CWD, 'tsconfig.json'),
  tsconfigProd: resolvePath(CWD, 'tsconfig.prod.json'),
  entryPoints: [
    { in: resolvePath(CWD, 'src', 'index.html'), out: 'index' },
    { in: resolvePath(CWD, 'src', 'index.tsx'), out: 'main' },
    { in: resolvePath(CWD, 'src', 'workers/index.ts'), out: 'worker' }
  ],
  host: 'localhost',
  port: 3500,
  watcherDelay: 3000,
  buildReport: true,
  cachesIndexHtml: true
}
/****************************************************************************/

/** @typedef { import('esbuild').BuildOptions } BuildOptions */

class StaticFiles {
  /** @type {{[filename: string]: Uint8Array}} */
  static #cachedFiles = Object.create(null);

  /** @param {string} filename */
  static getFile(filename) {
    return this.#cachedFiles[filename];
  }

  /** @param {string} filename @param {Uint8Array} file */
  static addFile(filename, file) {
    this.#cachedFiles[filename] = file;
  }

  static removeAllFiles() {
    this.#cachedFiles = Object.create(null);
  }
}

class ProjectBuilder {
  static #staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);
  /** @type {BuildOptions} */
  static #DEFAULT_OPTIONS = {
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
  }

  /** @param {string} privateHash @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {string} tsconfig @param {boolean} isProd */
  constructor(privateHash, publicDir, entryPoints, tsconfig, isProd) {
    if(privateHash !== ProjectBuilder.#staticHash) throw new Exception(`'ProjectBuilder' class constructor can not be called from outside.`);
    
    /** @type {BuildOptions} */
    this.buildOptions = ProjectBuilder.#DEFAULT_OPTIONS;
    /** @type {boolean} */
    this.isProd = isProd;

    if(isProd)  this.buildOptions = { ...this.buildOptions, outdir: publicDir, entryPoints, tsconfig, minify: true, treeShaking: true };
    else this.buildOptions = { ...this.buildOptions, outdir: publicDir, entryPoints, tsconfig, sourcemap: 'inline', write: false };
  }

  /** @returns {Promise<void>} */
  #prodBuild(consoleOut) {
    return new Promise((success, failure) => {
      rm(this.buildOptions.outdir, { recursive: true, force: true }, (error) => {
        if(error) {
          console.error(error);
          success();
        } else {
          build(this.buildOptions).then((res) => {
            if(consoleOut) {
              if(res.outputFiles && res.outputFiles.length) console.log('Output Files:', res.outputFiles);
              if(res.warnings && res.warnings.length) console.warn('Warnings:', res.warnings);
              if(res.errors && res.errors.length) console.error('Errors:', res.errors);
            }
            success();
          }).catch((error) => {
            console.error(error);
            success();
          });
        }
      })
    });
  }

  /** @returns {Promise<void>} */
  #devBuild(cachesIndexHtml, consoleOut) {
    return new Promise((success) => {
      if(cachesIndexHtml) {
        let indexHtml = StaticFiles.getFile('index.html');
        if(indexHtml) {
          this.buildOptions.entryPoints = this.buildOptions.entryPoints.filter(/** @param {{in: string, out: string}} e*/ (e) => {
            return !(e.in.endsWith('index.html'));
          });
        }
      }
      build(this.buildOptions).then((res) => {
        if(res.outputFiles && res.outputFiles.length) {
          StaticFiles.removeAllFiles();
          res.outputFiles.forEach(file => {
            const i = file.path.lastIndexOf('/');
            StaticFiles.addFile((i>-1 ? file.path.slice(i+1) : file.path), file.contents);
          });
          if(consoleOut) console.log('Output Files:', res.outputFiles);
        }
        if(consoleOut) {
          if(res.warnings && res.warnings.length) console.warn('Warnings:', res.warnings);
          if(res.errors && res.errors.length) console.error('Errors:', res.errors);
        }
        success();
      }).catch((error) => {
        console.error(error);
        success();
      });
    });
  }

  /** @returns {Promise<void>} */
  build(cachesIndexHtml=true, consoleOut=false) {
    return this.isProd ? this.#prodBuild(consoleOut) : this.#devBuild(cachesIndexHtml, consoleOut);
  }

  /** @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {string} tsconfig */
  static getBuilder(publicDir, entryPoints, tsconfig, isProd=false) {
    return new ProjectBuilder(this.#staticHash, publicDir, entryPoints, tsconfig, isProd);
  }
}

class StaticServer {
  /** @type {Server} */
  static #server = null;
  /** @returns {Promise<void>} */
  static #startServer(port=3500, host='localhost') {
    return new Promise((success, failure) => {
      const server = createServer((request, response) => {
        let path = request.url.split('?')[0];
        path = path==='/'? 'index.html' : (path[0]==='/' ? path.slice(1) : path);
        let file = StaticFiles.getFile(path);
        if(!file) file = StaticFiles.getFile(path = 'index.html');
        if(!file) {
          response.writeHead(500, 'Internal Server Error.', {'content-type': MIME.getType('json')});
          response.end({message: 'Resource not found.'});
          return;
        }
        response.writeHead(200, 'Success', {'content-type': MIME.getType(path), 'content-length': file.length})
        response.end(file);
      }).on('error', failure);
      if(this.#server) this.#server.close();
      (this.#server = server).listen(port, host, () => {
        console.log(`\u001b[32m  [C] Client Application Started.`);
        console.log(`\u001b[32m  [C] Client Application listening at => \u001b[34mhttp://${host}:${port}`);
        success();
      });
    });
  }

  /** @param {string} watchDir @param {number} watcherDelay @param {(filepath: string)=>void} onChangeCallback */
  static #addFileWatcher(watchDir, watcherDelay, onChangeCallback) {
    readdir(watchDir, {withFileTypes:true}, (err, files) => {
      if(err) console.error(err);
      else {
        for(let i=files.length-1;i>=0;i--) {
          const file = files[i], filePath = resolvePath(watchDir, file.name);
          if(file.isDirectory()) this.#addFileWatcher(filePath, watcherDelay, onChangeCallback);
          else if(file.isFile()) {
            watchFile(filePath, {interval: watcherDelay}, (curr, prev) => {
              if(curr.mtimeMs != prev.mtimeMs) onChangeCallback(filePath);
            });
          }
        }
      }
    });
  }

  /** @param {string} watchDir @param {number} watcherDelay @param {(acknowledgment: ()=>void)=>void} onChangeCallback */
  static #addWatcher(watchDir, watcherDelay, onChangeCallback) {
    let currentTime = performance.now(), updateCompleted = true;
    this.#addFileWatcher(watchDir, watcherDelay, (filepath) => {
      if(updateCompleted && performance.now() > (currentTime + watcherDelay)) {
        updateCompleted = false;
        onChangeCallback(() => {
          currentTime = performance.now();
          updateCompleted = true;
        });
      }
    })
  }

  /** @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {{port?:number, host?: string, tsconfig?: string, consoleOut?:boolean, watchDir?: string, watcherDelay?: number, cachesIndexHtml?: boolean}} options */
  static startStaticDevServer(publicDir, entryPoints, options) {
    options = options || {watcherDelay: 100};
    const builder = ProjectBuilder.getBuilder(publicDir, entryPoints, options.tsconfig, options.consoleOut);

    builder.build(options.cachesIndexHtml, options.consoleOut).then(() => {
      this.#startServer(options.port, options.host).catch(console.error).then(() => {
        if(options.watchDir) {
          this.#addWatcher(options.watchDir, options.watcherDelay, (acknowledgment) => {
            console.log(`\u001b[33m  [C] Changes found. Restarting the server...`);
            builder.build(options.consoleOut).then(() => this.#startServer(options.port, options.host).then(acknowledgment));
          });
        }
      })
    });
  }
}

(function start() {
  if(process.argv.includes('--build')) {
    ProjectBuilder.getBuilder(CONFIG.publicDir, CONFIG.entryPoints, CONFIG.tsconfigProd, true).build(CONFIG.buildReport);
  } else {
    StaticServer.startStaticDevServer(CONFIG.publicDir, CONFIG.entryPoints, {
      watchDir: CONFIG.srcDir,
      watcherDelay: CONFIG.watcherDelay,
      port: CONFIG.port, host: CONFIG.host,
      tsconfig: CONFIG.tsconfig,
      consoleOut: CONFIG.buildReport,
      cachesIndexHtml: CONFIG.cachesIndexHtml
    });
  }
})();