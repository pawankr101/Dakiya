import { MessagePort, parentPort, workerData } from 'worker_threads';
import methods from './methods.js';
import { Utils } from '../utils/index.js';

type WorkerInput = {taskId: string, method: string, arg?: any[]}

const messageChannelPort: MessagePort = Utils.getValue(workerData, 'messageChannelPort', parentPort);
messageChannelPort.on('message', (data: WorkerInput) => onMessageAtMessageChannelPort(data));

function onMessageAtMessageChannelPort(data: WorkerInput) {
    const method: Function = Utils.getValue(methods, data.method, () => {
        return Promise.reject('Method not found');
    })
    let result = method(...data.arg);
    if(result instanceof Promise) {
        result.then(res => {
            messageChannelPort.postMessage({taskId: data.taskId, result: res});
        }).catch(err => {
            messageChannelPort.postMessage({taskId: data.taskId, error: err});
        })
    } else messageChannelPort.postMessage({taskId: data.taskId, result: result});
}
