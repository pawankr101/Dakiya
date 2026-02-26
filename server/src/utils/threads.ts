import { cpus } from 'node:os';
import { Worker } from "node:worker_threads";
import { THREADING } from "../config.js";
import { Exception } from "../exceptions/index.js";
import { Dictionary, Helpers, LinkedList, type List, Queue, Utils } from './index.js';

interface WorkerTask {
    id: string;
    method: { name: string; arg?: unknown[] };
    onSuccess: (result?: unknown) => void;
    onError: (error?: Exception) => void;
    attempt: number;
}

interface WorkerResult {
    taskId: string;
    result?: unknown;
    error?: string;
}

const [ WORKER_FILE, MAX_THREADS, MAX_TASKS_PER_THREAD, MAX_IDLE_TIME, MAX_TRY_ATTEMPT ] = [
    THREADING.workersIndexFile,
    THREADING.maxThreadsAllowed || Math.max(1, cpus().length - 1),
    THREADING.maxTasksAllowedPerThread,
    THREADING.maxThreadIdleTimeInMS,
    THREADING.maxTryAttempt
];

export class Thread {
    /*************************** Static members: Start *******************************/
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = Helpers.getUuid();
    /** List of active threads in the pool */
    static readonly #threads: List<Thread> = new LinkedList<Thread>();
    /** Global queue for tasks waiting to be executed by any thread */
    static readonly #globalTaskQueue: Queue<WorkerTask> = new Queue<WorkerTask>();
    /**************************** Static members: End ********************************/

    /************************** Instance members: Start ******************************/
    /** Unique identifier for the thread */
    id: string;
    /** Worker instance associated with the thread */
    #worker: Worker;
    /** Timeout for thread termination */
    #terminationTimeout: NodeJS.Timeout = null;
    /** Dictionary of tasks assigned to the thread */
    readonly #tasks: Dictionary<WorkerTask> = new Dictionary<WorkerTask>();
    /*************************** Instance members: End *******************************/

    /************************** Instance Methods: Start ******************************/
    // Instance methods related to task management, worker communication, and thread lifecycle.

    /** Private constructor to prevent direct instantiation */
    private constructor(workerFilePath: string, privateHash:string) {
        if(privateHash!==Thread.#staticHash) throw new Exception(`'Thread' class constructor can not be called from outside.`);
        if(!workerFilePath) throw new Exception(`'workerFilePath' is required to create Thread Object.`);
        this.id = Helpers.getUuid();
        this.#worker = this.#buildWorker(workerFilePath);
    }

    /**
     * Builds a new Worker instance and sets up event listeners for communication and error handling.
     * @param workerFilePath - The file path to the worker script.
     * @returns A new Worker instance.
     */
    #buildWorker(workerFilePath: string) {
        const worker = new Worker(workerFilePath, { name: this.id }),
        onThreadOnline = () => {
            this.#executeNextTask();
        },
        onWorkerMessage = (data: WorkerResult) => {
            const { taskId, error, result } = data;
            const task = this.#tasks.delete(taskId);
            if (this.#tasks.size < MAX_TASKS_PER_THREAD) {
                this.#executeNextTask();
            }
            if (task) {
                if (error) task.onError(new Exception(error));
                else task.onSuccess(result);
            }
        },
        cleanup = (error?: Error) => {
            if (this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            this.#tasks.loop((task) => {
                if (task.attempt <= MAX_TRY_ATTEMPT) {
                    task.attempt++;
                    Thread.#globalTaskQueue.enqueue(task);
                    console.warn(`Worker ${this.id} died. Re-queueing task ${task.id} (Attempt ${task.attempt})`);
                } else {
                    task.onError(new Exception(`Task ${task.id} failed after ${MAX_TRY_ATTEMPT} attempts.`, { cause: error }));
                }
            });
            this.#tasks.deleteAll();
            if (this.#worker) {
                this.#worker.removeAllListeners();
                this.#worker = null;
            }
            Thread.#threads.findAndDelete((th) => th.id === this.id);
        },
        onWorkerError = (error: Error) => {
            console.log(`worker Error: ${error.message}`);
            this.stop();
        },
        onWorkerExit = (exitCode: number) => {
            if (exitCode) cleanup(new Error(`Worker exited with code ${exitCode}`));
            else cleanup();
        };

        worker
            .on('online', onThreadOnline)
            .on('message', onWorkerMessage)
            .on('messageerror', onWorkerError)
            .on('error', onWorkerError)
            .on('exit', onWorkerExit);
        return worker;
    }

    /**
     * Executes the next task in the thread's task queue. If there are no tasks in the thread, it checks the global task queue for pending tasks. If a task is found, it is assigned to the thread and sent to the worker for execution. If there are no tasks in either queue, it initiates a soft termination of the worker.
     */
    #executeNextTask() {
        while (this.#tasks.size < MAX_TASKS_PER_THREAD && !Thread.#globalTaskQueue.isEmpty()) {
            const task = Thread.#globalTaskQueue.dequeue();
            if (this.#terminationTimeout) {
                clearTimeout(this.#terminationTimeout);
                this.#terminationTimeout = null;
            }
            this.#tasks.set(task.id, task);
            const { id: taskId, method: {name: method, arg: args} } = task;
            this.#worker.postMessage({ taskId, method, args });
        }
        if (this.#tasks.isEmpty()) {
            this.#softWorkerTermination();
        }
    }

    /**
     * Initiates a soft termination of the worker after a period of inactivity. If there are no pending tasks in the thread or the global queue, the worker will be terminated. Otherwise, it will attempt to execute the next task.
     */
    #softWorkerTermination() {
        this.#terminationTimeout = setTimeout(() => {
            if (this.#tasks.isEmpty()) {
                if (Thread.#globalTaskQueue.isEmpty()) {
                    if(this.#worker) this.#worker.postMessage({ workerExit: true });
                } else {
                    this.#executeNextTask()
                }
            }
        }, MAX_IDLE_TIME);
    }

    /**
     * Immediately terminates the worker and cleans up resources. This method is called when the worker encounters an error or exits unexpectedly.
     */
    stop() {
        if (this.#worker) {
            this.#worker.terminate();
        }
    }

    /*************************** Instance Methods: End *******************************/

    /*************************** Static methods: Start *******************************/
    // static members and methods related to managing the pool of threads and task distribution.

    /**
     * Retrieves the least busy thread from the pool. If all threads are at maximum capacity, it checks if a new thread can be created. If a new thread can be created, it is added to the pool and returned. If all threads are busy and the maximum number of threads has been reached, it returns undefined, indicating that the task will be queued until a thread is available.
     * @returns The least busy thread or undefined if all threads are busy and the maximum number of threads has been reached.
     */
    static #getLeastBusyThread(): Thread {
        const pool = Thread.#threads;
        if (!pool.isEmpty()) {
            const leastBusyThread = pool.reduce((leastBusy, current) => {
                if(current.#tasks.size < leastBusy.#tasks.size) return current;
                return leastBusy;
            }, pool.getFirst());
            if(leastBusyThread.#tasks.size < MAX_TASKS_PER_THREAD) {
                return leastBusyThread;
            }
        }
        if(pool.size < MAX_THREADS) {
            return pool.addOne(new Thread(WORKER_FILE, Thread.#staticHash));
        }
        console.log(`All threads are busy. Task will be queued until a thread is available.`);
        return undefined;
    }

    /**
     * Executes a method in a worker thread. The method is identified by its name and can accept any number of arguments. The method returns a promise that resolves with the result of the method execution or rejects with an error if the execution fails. The task is added to the global task queue and will be executed by the least busy thread when it becomes available.
     * @param methodName - The name of the method to execute in the worker thread.
     * @param arg - The arguments to pass to the method being executed.
     * @returns A promise that resolves with the result of the method execution or rejects with an error if the execution fails.
     */
    static execute<T = unknown>(methodName: string, ...arg: unknown[]): Promise<T> {
        return new Promise((resolve: (value: T) => void, reject: (reason: Error) => void) => {
            const task: WorkerTask = {
                id: Helpers.getUuid(),
                method: { name: methodName, arg },
                onSuccess: resolve,
                onError: reject,
                attempt: 1
            };
            Thread.#globalTaskQueue.enqueue(task);
            const thread = Thread.#getLeastBusyThread();
            if (Utils.isDefined(thread)) {
                thread.#executeNextTask();
            }
        });
    }
    /**************************** Static methods: End ********************************/
}
