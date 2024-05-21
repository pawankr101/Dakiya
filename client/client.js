import { resolve as resolvePath } from 'path';
import { rm, watch } from 'fs';
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
  target: ['ES2022', 'chrome120', 'firefox121', 'edge120', 'safari17'],
  host: 'localhost',
  port: 3500,
  watcherDelay: 2000,
  buildReport: false,
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
    splitting: true,
    format: 'esm',
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

  /** @param {string} privateHash @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {string} tsconfig @param {Array<string>} target @param {boolean} isProd */
  constructor(privateHash, publicDir, entryPoints, tsconfig, target, isProd) {
    if(privateHash !== ProjectBuilder.#staticHash) throw new Exception(`'ProjectBuilder' class constructor can not be called from outside.`);
    
    /** @type {BuildOptions} */
    this.buildOptions = {...ProjectBuilder.#DEFAULT_OPTIONS, outdir: publicDir, entryPoints, tsconfig, target};
    /** @type {boolean} */
    this.isProd = isProd;

    if(isProd)  this.buildOptions = { ...this.buildOptions, minify: true, sourcemap: false, treeShaking: true, write: true };
    else this.buildOptions = { ...this.buildOptions, minify: false, sourcemap: 'inline', treeShaking: false, write: false };
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
      let indexHtml = null;
      if(cachesIndexHtml) {
        indexHtml = StaticFiles.getFile('index.html');
        if(indexHtml) {
          this.buildOptions.entryPoints = this.buildOptions.entryPoints.filter(/** @param {{in: string, out: string}} e*/ (e) => {
            return !(e.in.endsWith('index.html'));
          });
        }
      }
      build(this.buildOptions).then((res) => {
        if(res.outputFiles && res.outputFiles.length) {
          StaticFiles.removeAllFiles();
          if(cachesIndexHtml && indexHtml) StaticFiles.addFile('index.html', indexHtml);
          res.outputFiles.forEach(file => {
            const i = file.path.lastIndexOf('/');
            StaticFiles.addFile((i>-1 ? file.path.slice(i+1) : file.path), file.contents);
          });
          if(consoleOut) console.log('Output Files:', res.outputFiles.map(f => f.path));
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

  /** @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {string} tsconfig @param {Array<string>} target */
  static getBuilder(publicDir, entryPoints, tsconfig, target, isProd=false) {
    return new ProjectBuilder(this.#staticHash, publicDir, entryPoints, tsconfig, target, isProd);
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
        if(path[0]==='/') path = path.slice(1);
        if(!path) path = 'index.html';
        let file = StaticFiles.getFile(path);
        if(!file) file = StaticFiles.getFile(path = 'index.html');
        if(!file) {
          response.writeHead(404, 'Resource not found.', {'content-type': MIME.getType('json')});
          response.end('{"message": "Resource not found."}');
          return;
        }
        response.writeHead(200, 'Success', {'content-type': MIME.getType(path), 'content-length': file.length});
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

  /** @param {string} watchDir @param {number} watcherDelay @param {(acknowledgment: ()=>void)=>void} onChangeCallback */
  static #addWatcher(watchDir, watcherDelay, onChangeCallback) {
    let currentTime = performance.now(), updateCompleted = true;
    watch(watchDir, {recursive: true}, () => {
      if(updateCompleted && performance.now() > (currentTime + watcherDelay)) {
        updateCompleted = false;
        console.log(`\u001b[33m  [C] Changes found.`);
        onChangeCallback(() => {
          currentTime = performance.now();
          updateCompleted = true;
          console.log(`\u001b[33m  [C] Changes applied.`);
        });
      }
    });
  }

  /** @param {string} publicDir @param {[{in: string, out: string}]} entryPoints @param {{port?:number, host?: string, tsconfig?: string, target: Array<string>, consoleOut?:boolean, watchDir?: string, watcherDelay?: number, cachesIndexHtml?: boolean}} options */
  static startStaticDevServer(publicDir, entryPoints, options) {
    options = options || {watcherDelay: 100};
    const builder = ProjectBuilder.getBuilder(publicDir, entryPoints, options.tsconfig, options.target, false);

    builder.build(options.cachesIndexHtml, options.consoleOut).then(() => {
      this.#startServer(options.port, options.host).catch(console.error).then(() => {
        if(options.watchDir) {
          this.#addWatcher(options.watchDir, options.watcherDelay, (acknowledgment) => {
            builder.build(options.cachesIndexHtml, options.consoleOut).then(acknowledgment);
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
      target: CONFIG.target,
      consoleOut: CONFIG.buildReport,
      cachesIndexHtml: CONFIG.cachesIndexHtml
    });
  }
})();