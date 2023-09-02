import { Worker } from "worker_threads";
import { cpus } from 'os';
import { PATHS } from "../../config.js";
import { Exception } from "../../exceptions/exception.js";
import { Utility } from "./utility.js";

type WorkerResult = {taskId: string, result?: any, error?: any};
type Task = {_id: string, method: {name: string, arg?: any}, onSuccess: (result?: any) => void, onError: (error?: any) => void}

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
        if(this.#data[id]){
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
    static #staticHash = Date.now().toString(36) + Math.random().toString(36).substring(2);
    static #maxThreadsCount = cpus().length;
    static #threads: Mapper<Thread> = new Mapper<Thread>();
    static #maxTasksPerThread = 20; static #workerIdleTimeInMS = 60000;

    #worker: Worker; #tasks: Mapper<Task>; #terminationTimeout: NodeJS.Timeout = null;

    _id:string;

    #buildWorker(workerFilePath: string) {
        this.#worker = new Worker(workerFilePath);
        this.#tasks = new Mapper<Task>();
        this.#worker.on('message', (res: WorkerResult) => {
            let task  = this.#tasks.get(res.taskId);
            if(task) this.#tasks.delete(res.taskId);
            if(!this.#tasks.count) {
                this.#terminationTimeout = setTimeout(() => {
                    this.stop();
                }, Thread.#workerIdleTimeInMS);
            }
            if(task) {
                if(res.error) task.onError(res.error);
                else if(res.result) task.onSuccess(res.result);
            }
        }).on('error', console.error).on('messageerror', console.error);
    }

    private constructor(workerFilePath: string, privateHash:string) {
        if(!privateHash || privateHash!==Thread.#staticHash) throw new Exception(`'Thread' class constructor can not be called from outside.`);
        if(!workerFilePath) throw new Exception(`'workerFilePath' is required to create Thread Object.`);
        this._id = `th-${Date.now().toString(36)}`;
        this.#buildWorker(workerFilePath);
    }

    run(method: string, arg?: any) {
        return new Promise((resolve: (value?: any) => void, reject:(reason?: any) => void) => {
            if(this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            let taskId = `${Date.now().toString(36) + Math.random().toString(36).substring(2)}`;
            this.#tasks.set(taskId, {_id: taskId, method: {name: method, arg: arg}, onSuccess: resolve, onError: reject});
            this.#worker.postMessage({taskId, method, arg});
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
        let thread:Thread = null, minTaskCount: number = null;
        Utility.forLoop(this.#threads.all(), (th) => {
            if(minTaskCount===null || th.#tasks.count<minTaskCount) {
                minTaskCount = th.#tasks.count;
                thread = th;
            }
        });
        if((minTaskCount >= this.#maxTasksPerThread) && (this.#threads.count < this.#maxThreadsCount)) return null;
        return thread;
    }

    static #getThread(): Thread {
        let thread = this.#availableThread();
        if(!thread) {
            thread = new Thread(PATHS.workersIndex, Thread.#staticHash);
            return this.#threads.set(thread._id, thread);
        }
        return thread;
    }

    static execute(method: string, arg?: any) {
        return this.#getThread().run(method, arg);
    }
}



// this class should create and manage worker_thread depends on os parallelism, number of cores available.
// it should distributes received tasks among all available worker thread.
// should be able communicate with each thread as per requirements and can manage tasks and their returned result or error.