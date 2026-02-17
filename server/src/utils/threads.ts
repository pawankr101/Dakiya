import { cpus } from 'os';
import { Worker, MessageChannel, type MessagePort } from "worker_threads";
import { THREADING } from "../config.js";
import { Exception } from "../exceptions/index.js";
import { Helpers, Dictionary } from './index.js';

type WorkerResult = { taskId: string, result?: unknown, error?: unknown };
type Task = {
    _id: string,
    method: { name: string, arg?: unknown[] },
    onSuccess: (result?: unknown) => void,
    onError: (error?: unknown) => void
}

export class Thread {
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = Helpers.getUuid();

    /**
     * Maximum allowed Workers to create.
     * * Default value is count of logical CPU core.
     */
    static readonly #maxThreadsCount = THREADING.maxThreadsAllowed || cpus().length;
    static readonly #maxTasksPerThread = THREADING.maxTasksAllowedPerThread || 20;
    static readonly #workerIdleTimeInMS = THREADING.maxThreadIdleTimeInMS || 60000;
    static readonly #threads: Dictionary<Thread> = new Dictionary<Thread>();

    #worker: Worker;
    #messageChannelPort: MessagePort
    readonly #tasks: Dictionary<Task> = new Dictionary<Task>();
    #terminationTimeout: NodeJS.Timeout = null;

    _id:string;

    readonly #onChannelMessage = (result: WorkerResult) => {
        const task = this.#tasks.get(result.taskId);
        if(task) this.#tasks.delete(result.taskId);
        if(!this.#tasks.size) {
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
        const task  = this.#tasks.get(result.taskId);
        if(task) this.#tasks.delete(result.taskId);
        if(!this.#tasks.size) {
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

    run<T>(method: string, arg?: unknown[]) {
        return new Promise((resolve: (value?: T) => void, reject:(reason?: unknown) => void) => {
            if(this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            const taskId = Helpers.getUuid();
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
        Thread.#threads.loop((th) => {
            if ((minTaskCount === (-1)) || th.#tasks.size < minTaskCount) {
                minTaskCount = th.#tasks.size;
                thread = th;
            }
        });
        if(minTaskCount >= Thread.#maxTasksPerThread) {
            if(Thread.#threads.size < Thread.#maxThreadsCount) return null;
            // console.log(`Reached to the maximum allowed Threads and maximum tasks per Thread.`);
        }
        return thread;
    }

    static #getThread(): Thread {
        let thread = Thread.#availableThread();
        if(!thread) {
            thread = new Thread(THREADING.workersIndexFile, Thread.#staticHash);
            return Thread.#threads.set(thread._id, thread);
        }
        return thread;
    }

    /**
     * Execute a method on a thread.
     * @param method The method to execute.
     * @param arg The arguments to pass to the method.
     * @returns A promise that resolves with the result of the method.
     */
    static execute<T>(method: string, arg?: unknown[]): Promise<T> {
        return Thread.#getThread().run(method, arg);
    }
}
