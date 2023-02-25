require('colors');
const {fork, spawnSync} = require('child_process');
const watch = require('node-watch');
const {resolve} = require('path');
let watcher=null;
const config = {
    app: null,
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
        preRunCommand: 'npm run webpack',
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
    app_process = fork(config.server.buildFile, {
        cwd: config.server.cwd,
        execArgv: config.server.execArgv,
        env: {HOST : config.server.host, PORT: config.server.port},
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
    watcher = watch(config[config.app].sourceDir, {recursive:true}, () => {
        console.log('\n*** Change(s) detected in codebase ***'.yellow);
        console.log('*** Rebuilding and Restarting Application ***'.cyan);
        config.app==='client' ? null : runServer();
    });
}
setTimeout(run, 15000);