import 'colors';
import {fork, spawnSync} from 'child_process';
import watch from 'node-watch';
import {resolve} from 'path';
import { startStaticDevServer } from './dev-server.js';
import { fileURLToPath } from 'url';
let watcher=null;

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const config = {
    app: 'server',
    client: {
        preRunCommand: 'npm run webpack',
        buildDir: resolve(__dirname, '..', 'client', './dist'),
        sourceDir: resolve(__dirname, '..', 'client', './src'),
        cwd: resolve(__dirname, '..', 'client'),
        buildStatus: false,
        host: '0.0.0.0',
        port: process.env.PORT || 3500
    },
    server: {
        execArgv: process.argv.includes('--debug') ? ['--inspect'] : [],
        preRunCommand: 'npm run build',
        buildFile: resolve(__dirname, '..', 'server', './dist/index.js'),
        sourceDir: resolve(__dirname, '..', 'server', './src'),
        cwd: resolve(__dirname, '..', 'server'),
        buildStatus: true,
        host: '0.0.0.0',
        port: process.env.PORT || 3600
    },
    devSever: {
        client: null,
        server: null
    },
}

function startPreRunner(app=config.app) {
    if(config.devSever[app]) process.kill(config.devSever[app].pid);
    let preRunCommand = config[app].preRunCommand.trim().split(' ');
    if(preRunCommand[0]) spawnSync(preRunCommand[0], preRunCommand.slice(1),{
        cwd: config[app].cwd,
        stdio: config[app].buildStatus?'inherit':'ignore',
        stderr: config[app].buildStatus?'inherit':'ignore'
    });
}

function runServer() {
    startPreRunner('server');
    config.devSever.server = fork(config.server.buildFile, {
        cwd: config.server.cwd,
        execArgv: config.server.execArgv,
        env: {HOST: config.server.host, PORT: config.server.port},
    }).on('message', console.log).on('error', (err) => {
        console.error(err);
        process.kill(config.devSever.server.pid);
    });
}

function run() {
    config.app = process.argv.includes('--client') ? 'client' : (process.argv.includes('--server') ? 'server' : null);
    if(!config.app) {
        console.error("Provide --client or --server as an argument to start expected Application");
        return;
    }
    console.log(`\n*** Starting ${config.app==='client' ? 'Web App Client' : 'Api Server'} ***`.cyan);
    // watcher = watch(config[config.app].sourceDir, {recursive:true}, () => {
    //     console.log('\n*** Change(s) detected in codebase ***'.yellow);
    //     console.log('*** Rebuilding and Restarting Application ***'.cyan);
    //     config.app==='client' ? null : runServer();
    // });
    if(config.app) startStaticDevServer(config.client.port, config.client.sourceDir, config.client.buildDir, {
        entryPoints: [
            { in: 'index.tsx', out: 'main' },
            { in: 'workers/index.ts', out: 'worker' },
            { in: 'index.html', out: 'index' }
        ],
        watcherDelay: 10,
        tsconfig: resolve(config.client.cwd, './tsconfig.json')
    });
}
setTimeout(run, 100);