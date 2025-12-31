type WorkerMessageDataInput = {
    method: string,
    arg: unknown[]
}
type WorkerMessageDataOutput<T> = {
    error: {
        message: string,
        code?: number
    },
    output: T
}
const worker = <DedicatedWorkerGlobalScope><unknown>self;

worker.onmessage = async (event: MessageEvent<WorkerMessageDataInput>) => {
    try {
        if(event.data) {
            const output = await processData(event.data.method, event.data.arg);
            worker.postMessage({output});
        } else worker.postMessage({error: {message: "input data not provided to worker."}});
    } catch(error) {
        worker.postMessage({error: {message: error.message}});
    }
}

async function processData<T, U>(method: string, arg: U[]): Promise<WorkerMessageDataOutput<T>> {
    return {method: method, data: arg[0]} as unknown as WorkerMessageDataOutput<T>;
}
