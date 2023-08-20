import { parentPort } from 'worker_threads';
import methods from './methods.js';

type WorkerInput = {taskId: string, method: string, arg?: any}

parentPort.on('message', (data: WorkerInput) => {
    if(data) callMethod(data);
})

function callMethod(data: WorkerInput) {
    if(methods[data.method]) {
        let result = methods[data.method](data.arg);
        if(result instanceof Promise) {
            result.then(res => {
                parentPort.postMessage({taskId: data.taskId, result: res});
            }).catch(err => {
                parentPort.postMessage({taskId: data.taskId, error: err});
            })
        } else parentPort.postMessage({taskId: data.taskId, result: result});
    }
}