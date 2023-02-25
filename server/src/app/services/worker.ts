import { resolve } from 'path';
import { Worker } from 'worker_threads';

type WorkerInput = {taskId: string, method: string, arg?: any}
type WorkerResult = {taskId: string, result?: any, error?: any};
type Task = {method: {name: string, arg?: any}, onSuccess: (result?: any) => void, onError: (error?: any) => void}
const tasks: {[taskId:string]: Task} = {};
const worker = new Worker(resolve(__dirname, './workers/'));

worker.on('message', (res: WorkerResult) => {
    let task  = tasks[res.taskId];
    if(task) {
        delete tasks[res.taskId];
        if(res.error) task.onError(res.error);
        else if(res.result) task.onSuccess(res.result);
    }
}).on('error', console.error).on('messageerror', console.error);

function executeTaskInWorker(method: string, arg?: any) {
    return new Promise((resolve: (value?: any) => void, reject:(reason?: any) => void) => {
        let taskId = `${worker.threadId}${method}${Date.now()}`;
        tasks[taskId] = {method: {name: method, arg: arg}, onSuccess: resolve, onError: reject};
        worker.postMessage({taskId, method, arg});
    })
}
export {executeTaskInWorker};