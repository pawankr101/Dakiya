import { FastifyInstance } from "fastify";
import { test } from "./services/threads.js";


export function AppRoutes(fastify: FastifyInstance, options: any, done: Function) {
    fastify.get('/app', (request, response) => {
        test();
        response.header('Content-Type', 'application/json').send({done: true});
    });
    done();
}
