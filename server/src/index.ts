
import { Application } from './app/index.js';
import { ENV } from './config.js';
import { Helpers } from './utils/helpers.js';

function setupEnv() {
    for(var key in ENV) {
        process.env[key] = ENV[key];
    }
}

function start() {
    console.log(Helpers.getUuid());
    setupEnv();
    Application.start();
}
start();
