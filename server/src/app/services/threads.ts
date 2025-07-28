import { cpus } from 'os';
import { Worker, MessageChannel, MessagePort } from "worker_threads";
import { THREADING } from "../../config.js";
import { Exception } from "../../exceptions/exception.js";
import { Utility } from "./utility.js";
import methods from "../../workers/methods.js";

type WorkerResult = {taskId: string, result?: any, error?: any};
type Task = {_id: string, method: {name: string, arg?: any[]}, onSuccess: (result?: any) => void, onError: (error?: any) => void}

export class Mapper<T> {
    #data: {[id: string]: T} = Object.create(null);
    count = 0;
    get(id: string) {
        return this.#data[id];
    }
    set(id: string, val: T) {
        if(!this.#data[id]) this.count++;
        return (this.#data[id] = val);
    }
    delete(id: string) {
        if(this.#data[id]) {
            delete this.#data[id];
            this.count--;
            return true;
        }
        return false
    }
    deleteAll() {
        this.#data = Object.create(null);
        this.count = 0;
    }
    ids() {
        return Object.keys(this.#data);
    }
    all() {
        return Object.values(this.#data);
    }
}

export class Thread {
    /** #### Random Hash for Private Constructor */
    static readonly #staticHash: string = Utility.generateUid();

    /**
     * #### Maximum allowed Workers to create.
     * * Default value is count of logical CPU core.
     */
    static readonly #maxThreadsCount = THREADING.maxThreadsAllowed || cpus().length;
    static readonly #maxTasksPerThread = THREADING.maxTasksAllowedPerThread || 20;
    static readonly #workerIdleTimeInMS = THREADING.maxThreadIdleTimeInMS || 60000;
    static readonly #threads: Mapper<Thread> = new Mapper<Thread>();

    #worker: Worker;
    #messageChannelPort: MessagePort
    readonly #tasks: Mapper<Task> = new Mapper<Task>();
    #terminationTimeout: NodeJS.Timeout = null;

    _id:string;

    readonly #onChannelMessage = (result: WorkerResult) => {
        let task  = this.#tasks.get(result.taskId);
        if(task) this.#tasks.delete(result.taskId);
        if(!this.#tasks.count) {
            this.#terminationTimeout = setTimeout(() => {
                this.stop();
            }, Thread.#workerIdleTimeInMS);
        }
        if(task) {
            if(result.error) task.onError(result.error);
            else if(result.result) task.onSuccess(result.result);
        }
    }

    readonly #onChannelMessageerror = (error: Error) => {
        console.log('channel Message Error: ' + error.message);
    }

    #buildMessageChannel() {
        const { port1, port2 } = new MessageChannel();
        this.#messageChannelPort = port1;
        this.#messageChannelPort.on('close', () => {
            this.#messageChannelPort = null;
        }).on('message', this.#onChannelMessage).on('messageerror', this.#onChannelMessageerror);
        return port2;
    }

    readonly #onWorkerMessage = (result: WorkerResult) => {
        let task  = this.#tasks.get(result.taskId);
        if(task) this.#tasks.delete(result.taskId);
        if(!this.#tasks.count) {
            this.#terminationTimeout = setTimeout(() => {
                this.stop();
            }, Thread.#workerIdleTimeInMS);
        }
        if(task) {
            if(result.error) task.onError(result.error);
            else if(result.result) task.onSuccess(result.result);
        }
    }

    readonly #onWorkerMessageerror = (error: Error) => {
        console.log('worker Message Error: ' + error.message);
    }

    readonly #onWorkerError = (error: Error) => {
        console.log('worker Error: ' + error.message);
    }

    readonly #onWorkerExit = (exitCode: number) => {
        console.log('exit code: ' + exitCode);
    }

    #buildWorker(workerFilePath: string) {
        const workerMessageChannelPort = this.#buildMessageChannel();
        this.#worker = new Worker(workerFilePath, {
            name: this._id,
            workerData: {
                messageChannelPort: workerMessageChannelPort
            },
            transferList: [ workerMessageChannelPort ]
        });

        this.#worker.on('online', () => {
            console.log('online');
        }).on('message', this.#onWorkerMessage)
          .on('messageerror', this.#onWorkerMessageerror)
          .on('error', this.#onWorkerError)
          .on('exit', this.#onWorkerExit);
    }

    private constructor(workerFilePath: string, privateHash:string) {
        if(!privateHash || privateHash!==Thread.#staticHash) throw new Exception(`'Thread' class constructor can not be called from outside.`);
        if(!workerFilePath) throw new Exception(`'workerFilePath' is required to create Thread Object.`);
        this._id = Utility.generateUid('thread-');
        this.#buildWorker(workerFilePath);
    }

    run(method: string, arg?: any[]) {
        return new Promise((resolve: (value?: any) => void, reject:(reason?: any) => void) => {
            if(this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            let taskId = Utility.generateUid('task-');
            this.#tasks.set(taskId, {_id: taskId, method: {name: method, arg: arg}, onSuccess: resolve, onError: reject});
            this.#messageChannelPort.postMessage({taskId, method, arg});
        });
    }

    async stop() {
        try {
            await this.#worker.terminate();
            Thread.#threads.delete(this._id);
            return true;
        } catch(error) {
            console.log(error);
            return false;
        }
    }

    static #availableThread() {
        let thread:Thread = null, minTaskCount: number = -1;

        // find thread with min tasks in its bucket.
        Utility.forLoop(this.#threads.all(), (th) => {
            if((minTaskCount === (-1)) || th.#tasks.count<minTaskCount) {
                minTaskCount = th.#tasks.count;
                thread = th;
            }
        });
        if(minTaskCount >= this.#maxTasksPerThread) {
            if(this.#threads.count < this.#maxThreadsCount) return null;
            // console.log(`Reached to the maximum allowed Threads and maximum tasks per Thread.`);
        }
        return thread;
    }

    static #getThread(): Thread {
        let thread = this.#availableThread();
        if(!thread) {
            thread = new Thread(THREADING.workersIndexFile, Thread.#staticHash);
            return this.#threads.set(thread._id, thread);
        }
        return thread;
    }

    static execute(method: string, arg?: any[]) {
        return this.#getThread().run(method, arg);
    }
}



// this class should create and manage worker_thread depends on os parallelism, number of cores available.
// it should distributes received tasks among all available worker thread.
// should be able communicate with each thread as per requirements and can manage tasks and their returned result or error.

async function oneCycle() {
    // const t = performance.now();
    // let objStr = await Thread.execute('stringify', [{a: 'a', b: {ba: 'ba', bb: [1, true, 'string', null]}}]);
    // const t1 = performance.now();
    // console.log('stringify: ' + (t1 - t)/1000 + 's');
    // let obj = await Thread.execute('parse', [objStr]);
    // const t2 = performance.now();
    // console.log('parse: ' + (t2 - t1)/1000 + 's');
    // console.log('cycle: ' + (t2 - t)/1000 + 's');
    await Thread.execute('add', ['987898799789879797987987979979898797979789798', '98798949499989497979979879987646689779799899879879']);
    // methods.add('987898799789879797987987979979898797979789798', '98798949499989497979979879987646689779799899879879');
}
export async function test() {
    console.time('Full Cycle<1000000>');
    const promises = [];
    for (let i = 0; i < 1000000; i++) {
        promises.push(oneCycle());
    }
    await Promise.all(promises);
    console.timeEnd('Full Cycle<1000000>');
}
