type WorkerMessageDataInput = {
    method: string,
    arg: any[]
}
type WorkerMessageDataOutput<T=any> = {
    error: {
        message: string,
        code?: number
    },
    output: T
}
let worker = <DedicatedWorkerGlobalScope><unknown>self;

worker.onmessage = async (event: MessageEvent<WorkerMessageDataInput>) => {
    try {
        if(event.data) {
            let output = await processData(event.data.method, event.data.arg);
            worker.postMessage({output});
        } else worker.postMessage({error: {message: "input data not provided to worker."}});
    } catch(error) {
        worker.postMessage({error: {message: error.message}});
    }
}

async function processData<T=any>(method: string, arg: any[]): Promise<WorkerMessageDataOutput<T>> {
    return <WorkerMessageDataOutput><unknown>{data: arg[0]};
}
