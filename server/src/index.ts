
import { App } from './app/index.js';
import { ENV } from './config.js';

function setupEnv() {
    for(var key in ENV) {
        process.env[key] = ENV[key];
    }
}

function start() {
    setupEnv();
    new App().start();
}
// start();
