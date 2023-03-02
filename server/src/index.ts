
import { App } from './app';
import { ENV } from './config';

function setupEnv() {
    for(var key in ENV) {
        process.env[key] = ENV[key];
    }
}

function start() {
    setupEnv();
    new App().start();
}
start();
