import { parentPort } from 'worker_threads';
import methods from './methods.js';
import { Utils } from '../utils/index.js';

type WorkerInput = { workerExit?: boolean, taskId?: string, method?: string, arg?: unknown[] };
type Fn = (...args: unknown[]) => unknown;

parentPort.on('message', (data: WorkerInput) => onMessageAtMessageChannelPort(data));

function onMessageAtMessageChannelPort(data: WorkerInput) {
    if(data.workerExit) {
        process.exit(0);
    } else {
        const method: Fn = Utils.getValue(methods, data.method, () => {
            return Promise.reject('Method not found');
        });
        const result = method(...data.arg);
        if(result instanceof Promise) {
            result.then(res => {
                parentPort.postMessage({taskId: data.taskId, result: res});
            }).catch(err => {
                parentPort.postMessage({taskId: data.taskId, error: err});
            })
        } else parentPort.postMessage({taskId: data.taskId, result: result});
    }
}
