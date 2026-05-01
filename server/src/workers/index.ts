import { parentPort } from 'node:worker_threads';
import { Guards, getValue } from '@dakiya/shared';
import methods from './methods.js';

type WorkerInput = { taskId: string, method: string, arg?: unknown[] };
type Fn = (...args: unknown[]) => unknown;

function getMessageChannelPort() {
    if (Guards.isNull(parentPort)) {
        throw new Error('This file should be run as a worker thread');
    }
    return parentPort;
}

const onMessageAtMessageChannelPort = (port: MessagePort) => {
    return (data: WorkerInput) => {
        if ((data as unknown as {workerExit: boolean}).workerExit) {
            process.exit(0);
        } else {
            const method: Fn = getValue(methods, data.method, (() => {
                return Promise.reject(new Error('Method not found'));
            }) as unknown) as Fn;
            const result = method(...(data.arg || []));
            if (result instanceof Promise) {
                result.then(res => {
                    port.postMessage({ taskId: data.taskId, result: res });
                }).catch(err => {
                    port.postMessage({ taskId: data.taskId, error: err });
                })
            } else port.postMessage({ taskId: data.taskId, result: result });
        }
    }
};

function startWorker() {
    const port = getMessageChannelPort();
    const onMessageHandler = onMessageAtMessageChannelPort(port);
    port.on('message', onMessageHandler);
}
startWorker();
