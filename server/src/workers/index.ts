import { parentPort } from 'node:worker_threads';
import { Guards, getValue } from '@dakiya/shared';
import methods from './methods.js';

type WorkerInput = { workerExit?: boolean, taskId?: string, method?: string, arg?: unknown[] };
type Fn = (...args: unknown[]) => unknown;

function getMessageChannelPort() {
    if (Guards.isNull(parentPort)) {
        throw new Error('This file should be run as a worker thread');
    }
    return parentPort;
}

const onMessageAtMessageChannelPort = (port: MessagePort) => {
    return (data: WorkerInput) => {
        if (data.workerExit) {
            process.exit(0);
        } else {
            const method: Fn = getValue(methods, data.method as string, () => {
                return Promise.reject('Method not found');
            }) as Fn;
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
