
import { Application } from './app/index.js';
import { ENV, HTTP_SERVER } from './config.js';

/**
 * Sets up the necessary environment variables for the application.
 * This function iterates through the `ENV` configuration object and assigns each key-value pair to the `process.env` object, making them available throughout the application.
 */
function setupEnv() {
    for(const key in ENV) {
        process.env[key] = ENV[key as keyof typeof ENV].toString();
    }
}

/**
 * Initializes the application environment and starts the Application.
 * This function sets up necessary environment variables and then runs the application using the specified HTTP server configuration.
 */
function start() {
    setupEnv();
    Application.run({ ...HTTP_SERVER });
}

start();
