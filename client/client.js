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
    { in: resolvePath(CWD, 'src', 'workers/index.ts'), out: 'worker' },
    { in: resolvePath(CWD, 'src', 'assets/dakiya.ico'), out: 'favicon' }
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
  #cachedFiles = Object.create(null);

  /** @param {string} filename */
  getFile(filename) {
    return this.#cachedFiles[filename];
  }

  /** @param {string} filename @param {Uint8Array} file */
  putFile(filename, file) {
    this.#cachedFiles[filename] = file;
  }

  removeAllFiles() {
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
      '.ico': 'copy',
    }
  }

  /** @param {string} privateHash @param {{publicDir: string, entryPoints: [{in: string, out: string}], tsconfig: string, target: Array<string>, isProd?: boolean, cache?: StaticFiles}} param1 */
  constructor(privateHash, {publicDir, entryPoints, tsconfig, target, isProd, cache}) {
    if(privateHash !== ProjectBuilder.#staticHash) throw new Exception(`'ProjectBuilder' class constructor can not be called from outside.`);
    
    /** @type {BuildOptions} */
    this.buildOptions = {...ProjectBuilder.#DEFAULT_OPTIONS, outdir: publicDir, entryPoints, tsconfig, target};
    /** @type {boolean} */
    this.isProd = isProd;

    if(isProd)  this.buildOptions = { ...this.buildOptions, minify: true, sourcemap: false, treeShaking: true, write: true };
    else {
      this.buildOptions = { ...this.buildOptions, minify: false, sourcemap: 'inline', treeShaking: false, write: false };
      this.cache = cache || new StaticFiles();
    }
  }

  /** @param {BuildResult<BuildOptions>} res  */
  #consoleOutBuildResult(res) {
    if(res.outputFiles && res.outputFiles.length) console.log('Output Files:', res.outputFiles.map(f => f.path));
    if(res.warnings && res.warnings.length) console.warn('Warnings:', res.warnings);
    if(res.errors && res.errors.length) console.error('Errors:', res.errors);
  }

  /** @param {boolean} consoleOut  */
  async #startBuild(consoleOut) {
    try {
      const res = await build(this.buildOptions);
      if(consoleOut) this.#consoleOutBuildResult(res);
      return res.outputFiles || [];
    } catch(error) {
      console.error(error);
      return [];
    }
  }

  /** @param {boolean} consoleOut @returns {Promise<void>} */
  #prodBuild(consoleOut) {
    return new Promise((success) => {
      rm(this.buildOptions.outdir, { recursive: true, force: true }, (error) => {
        if(error) {
          console.error(error);
          success();
          return;
        }
        this.#startBuild(consoleOut).then(() => success());
      });
    });
  }

  /** @param {OutputFile[]} newFiles, @param {Uint8Array} [indexHtml]   */
  #updateCache(newFiles, indexHtml) {
    this.cache.removeAllFiles();
    if(indexHtml) this.cache.putFile('index.html', indexHtml);
    newFiles.forEach(file => {
      const i = file.path.lastIndexOf('/');
      this.cache.putFile((i>-1 ? file.path.slice(i+1) : file.path), file.contents);
    });
  }

  async #devBuild(cachesIndexHtml, consoleOut) {
    let indexHtml = null;
    if(cachesIndexHtml) {
      indexHtml = this.cache.getFile('index.html');
      if(indexHtml) {
        this.buildOptions.entryPoints = this.buildOptions.entryPoints.filter(/** @param {{in: string, out: string}} e*/ (e) => {
          return !(e.in.endsWith('index.html'));
        });
      }
    }
    const outputFiles = await this.#startBuild(consoleOut);
    this.#updateCache(outputFiles, indexHtml);
  }

  async build(cachesIndexHtml=true, consoleOut=false) {
    this.isProd ? await this.#prodBuild(consoleOut) : await this.#devBuild(cachesIndexHtml, consoleOut);
  }

  /** @param { {publicDir: string, entryPoints: [{in: string, out: string}], tsconfig: string, target: Array<string>, isProd: boolean} } options */
  static getBuilder(options) {
    return new ProjectBuilder(this.#staticHash, options);
  }
}

class StaticServer {
  /** @type {Server} */
  static #server = null;
  /** @param {StaticFiles} cache @returns {Promise<void>} */
  static #startServer(cache, port=3500, host='localhost') {
    return new Promise((success, failure) => {
      const server = createServer((request, response) => {
        let path = request.url.split('?')[0];
        if(path[0]==='/') path = path.slice(1);
        if(!path) path = 'index.html';
        let file = cache.getFile(path);
        if(!file) file = cache.getFile(path = 'index.html');
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
    const builder = ProjectBuilder.getBuilder({publicDir, entryPoints, tsconfig: options.tsconfig, target: options.target});
    builder.build(options.cachesIndexHtml, options.consoleOut).then(() => {
      this.#startServer(builder.cache, options.port, options.host).catch(console.error).then(() => {
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