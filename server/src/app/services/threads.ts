import { cpus } from 'os';
import { Worker, MessageChannel, MessagePort } from "worker_threads";
import { THREADING } from "../../config.js";
import { Exception } from "../../exceptions/exception.js";
import { Utility } from "./utility.js";
import methods from "../../workers/methods.js";
import { Helpers, Mapper } from '../../utils/index.js';

type WorkerResult = {taskId: string, result?: any, error?: any};
type Task = {_id: string, method: {name: string, arg?: any[]}, onSuccess: (result?: any) => void, onError: (error?: any) => void}

export class Thread {
    /** #### Random Hash for Private Constructor */
    static readonly #staticHash: string = Helpers.getUuid();

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
        this._id = Helpers.getUuid();
        this.#buildWorker(workerFilePath);
    }

    run(method: string, arg?: any[]) {
        return new Promise((resolve: (value?: any) => void, reject:(reason?: any) => void) => {
            if(this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            let taskId = Helpers.getUuid();
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
        Utility.forLoop(this.#threads.items(), (th) => {
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
