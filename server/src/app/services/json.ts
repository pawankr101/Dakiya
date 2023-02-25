import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

type WorkerData = {method?: string, arg?: any}
type Json = {
    data?: WorkerData;
    parse(str: string): Promise<any>;
    stringify(data: any): Promise<string>;
}
let Json: Json;

if(isMainThread) {
    const createWorkerTask: (wd: WorkerData)=>Promise<any> = (wd) => {
        return new Promise((resolve, reject) => {
            new Worker(__filename, {
                workerData: wd
            }).on('message', resolve).on('error', reject).on('exit', (exitCode) => {
                if(exitCode) reject(new Error("JSON got some error."))
            });
        });
    }
    Json={
        parse(str) {
            return createWorkerTask({ method: "parse", arg: str });
        },
        stringify(data) {
            return createWorkerTask({ method: "stringify", arg: data });
        }
    }
} else {
    Json={
        data: workerData,
        parse: (str) => {
            return JSON.parse(str);
        },
        stringify: (data): any => {
            return JSON.stringify(data);
        }
    };
    parentPort.postMessage(Json[Json.data.method](Json.data.arg));
}
export { Json };