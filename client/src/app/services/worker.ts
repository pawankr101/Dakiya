import { Exception } from "../../exceptions"

type WorkerMessageDataInput = {
    method: string,
    arg: any[]
}
type WorkerMessageDataOutput<T=any> = {
    error: Exception,
    output: T
}
const worker = new Worker('worker.js', {name: 'worker'});

export async function callWorkerMethod<T>(method: string, arg: any[]) {
    return new Promise((resolve: (v: T)=>void, reject) => {
        if(method) {
            worker.onmessage = (event: MessageEvent<WorkerMessageDataOutput<T>>) => {
                if(event.data?.error) reject(new Exception(event.data.error));
                else if(event.data?.output) resolve(event.data.output);
                else reject(new Exception(`Message from ${worker}`));
            }
            worker.postMessage({method, arg});
        }
    })
}

