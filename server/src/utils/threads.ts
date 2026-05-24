import { cpus } from 'node:os';
import { Worker } from "node:worker_threads";
import { Dictionary, Exception, getUuid, LinkedList, type List, Queue } from '@dakiya/shared';
import { THREADING } from "../config.js";

interface Task {
    id: string;
    method: { name: string; arg?: unknown[] };
    onSuccess: (result?: unknown) => void;
    onError: (error: Exception) => void;
    attempt: number;
}

interface WorkExitTask {
    workerExit: true;
}

interface WorkerResult {
    result?: unknown;
    error?: string;
}

export type ThreadStatus = typeof ThreadStatus[keyof typeof ThreadStatus];
export const ThreadStatus = (() => {
    const ts: { starting: symbol, idle: symbol, busy: symbol, terminating: symbol, dead: symbol, error: symbol } = Object.create(null);
    ts.starting = Symbol('___STARTING');
    ts.idle = Symbol('___IDLE');
    ts.busy = Symbol('___BUSY');
    ts.terminating = Symbol('___TERMINATING');
    ts.dead = Symbol('___DEAD');
    ts.error = Symbol('___ERROR');
    return ts;
})();

const [ WORKER_FILE, MAX_THREADS, MAX_IDLE_TIME, MAX_TRY_ATTEMPT ] = [
    THREADING.workersIndexFile,
    THREADING.maxThreadsAllowed || Math.max(1, cpus().length - 1),
    THREADING.maxThreadIdleTimeInMS,
    THREADING.maxTryAttempt
];
class ThreadStack {
    readonly #threads: List<Thread> = new LinkedList<Thread>();

    push(thread: Thread) {
        this.#threads.addOne(thread);
    }

    pop(): Thread | undefined {
        if (this.#threads.isEmpty()) return undefined;
        return this.#threads.deleteOne(this.#threads.size - 1);
    }

    delete(threadId: string): Thread | undefined {
        return this.#threads.findAndDelete((th) => th.id === threadId);
    }
}

export class Thread {
    /*************************** Static members: Start *******************************/
    /** Random Hash for Private Constructor */
    static readonly #staticHash: string = getUuid();
    /** Pool of all threads, both idle and busy */
    static readonly #threadPool: Dictionary<Thread> = new Dictionary<Thread>();
    /** Stack to manage sleeping threads that can be reused for new tasks */
    static readonly #sleepingThreads: ThreadStack = new ThreadStack();
    /** Global queue for tasks waiting to be executed by any thread */
    static readonly #pendingTasksQueue: Queue<Task> = new Queue<Task>();

    /**************************** Static members: End ********************************/

    /************************** Instance members: Start ******************************/
    /** Unique identifier for the thread */
    id: string;
    /** Current status of the thread */
    status: ThreadStatus;
    /** Worker instance associated with the thread */
    #worker: Worker | null = null;
    /** Timeout for thread termination */
    #terminationTimeout: NodeJS.Timeout | null = null;
    /** Tasks assigned to the thread */
    #activeTask: Task | null = null;
    /** Flag to indicate if the thread has been destroyed */
    #destroyed = false;
    /*************************** Instance members: End *******************************/

    /************************** Instance Methods: Start ******************************/
    // Instance methods related to task management, worker communication, and thread lifecycle.

    /** Private constructor to prevent direct instantiation */
    private constructor(workerFilePath: string, privateHash:string) {
        if(privateHash!==Thread.#staticHash) throw new Exception(`'Thread' class constructor can not be called from outside.`, { code : 'DAKIYA_WORKER_ERROR' });
        if(!workerFilePath) throw new Exception(`'workerFilePath' is required to create Thread Object.`, { code : 'DAKIYA_WORKER_ERROR' });
        this.id = getUuid();
        this.status = ThreadStatus.starting;
        this.#worker = this.#buildWorker(workerFilePath);
    }

    #buildWorker(workerFilePath: string) {
        const onThreadOnline = () => {
            this.status = ThreadStatus.idle;
            this.#executeNextTask();
        },
        onWorkerMessage = (data: WorkerResult) => {
            const task = this.#activeTask;
            this.#activeTask = null;
            this.status = ThreadStatus.idle;
            const { error, result } = data;
            if (task) {
                if (error) {
                    queueMicrotask(() => {
                        task.onError(new Exception(error, { code: 'DAKIYA_WORKER_ERROR' }));
                    });
                } else {
                    queueMicrotask(() => {
                        task.onSuccess(result);
                    });
                }
            }
            this.#executeNextTask();
        },
        onWorkerMessageError = (error: Error) => {
            console.error(Exception.from(error, { code: 'DAKIYA_WORKER_ERROR' }));
        },
        onWorkerError = (error: Error) => {
            console.error(Exception.from(error, { code: 'DAKIYA_WORKER_ERROR' }));
            this.status = ThreadStatus.terminating;
            if (this.#worker) this.#worker.terminate().catch(console.error).finally(() => this.#cleanup(error));
        },
        onWorkerExit = (exitCode: number) => {
            if (exitCode) {
                this.status = ThreadStatus.error;
                this.#cleanup(new Error(`Worker exited with code ${exitCode}`));
            } else {
                this.status = ThreadStatus.dead;
                this.#cleanup();
            }
        };
        const worker = new Worker(workerFilePath, { name: this.id });
        worker
            .on('online', onThreadOnline)
            .on('message', onWorkerMessage)
            .on('messageerror', onWorkerMessageError)
            .on('error', onWorkerError)
            .on('exit', onWorkerExit);
        return worker;
    }

    #sendTaskToWorker(exitTask?: WorkExitTask) {
        try {
            if (this.#worker) {
                if (exitTask) {
                    this.#worker.postMessage(exitTask);
                    return true;
                } else if (this.#activeTask) {
                    const { method: { name: method, arg: args } } = this.#activeTask as Task;
                    this.#worker.postMessage({ method, args });
                    return true;
                } else throw new Exception(`No active task to send to Worker with id: ${this.id}.`, { code : 'DAKIYA_WORKER_ERROR' });
            }
        } catch (error) {
            if (this.#activeTask) {
                const task = this.#activeTask;
                task.attempt++;
                if (task.attempt < MAX_TRY_ATTEMPT) {
                    Thread.#pendingTasksQueue.enqueue(task);
                    console.warn(new Exception(`Failed to send task to Worker with id: ${this.id}. Re-queueing task ${task.id} (Attempt ${task.attempt})`, { cause: error as Error, code : 'DAKIYA_WORKER_ERROR' }));
                } else {
                    queueMicrotask(() => {
                        task.onError(new Exception(`Failed to send task to Worker with id: ${this.id}. Task ${task.id} has reached max retry attempts.`, { cause: error as Error, code: 'DAKIYA_WORKER_ERROR' }));
                    })
                }
                this.#activeTask = null;
            } else {
                console.error(new Exception(`Failed to send task to Worker with id: ${this.id}. No task is currently assigned to the thread.`, { cause: error as Error, code : 'DAKIYA_WORKER_ERROR' }));
            }
        }
        return false;
    }

    #executeNextTask() {
        let consecutiveFailures = 0;
        while (this.#worker) {
            if (Thread.#pendingTasksQueue.isEmpty()) {
                if (!this.#terminationTimeout) this.#softWorkerTermination();
                return;
            }
            const task = Thread.#pendingTasksQueue.dequeue();
            this.status = ThreadStatus.busy;
            this.#activeTask = task;
            if (this.#sendTaskToWorker()) {
                const thid = this.id;
                if (!Thread.#threadPool.get((thid))) {
                    const th = Thread.#sleepingThreads.delete(thid) ?? this;
                    Thread.#threadPool.set(thid, th);
                }
                return;
            }
            this.status = ThreadStatus.idle;
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_TRY_ATTEMPT) {
                this.#worker.terminate().catch(console.error);
                return;
            }
        }
        if (this.status !== ThreadStatus.starting && this.status !== ThreadStatus.terminating) {
            if(this.status !== ThreadStatus.error) this.status = ThreadStatus.dead;
            this.#cleanup();
        }
    }

    #cleanup(error?: Error) {
        if (this.#destroyed) return;
        this.#destroyed = true;
        if (this.#terminationTimeout) {
            clearTimeout(this.#terminationTimeout);
            this.#terminationTimeout = null;
        }
        if (this.#activeTask) {
            const task = this.#activeTask;
            task.attempt++;
            if (task.attempt < MAX_TRY_ATTEMPT) {
                Thread.#pendingTasksQueue.enqueue(task);
                console.warn(new Exception(`Worker ${this.id} died. Re-queueing task ${task.id} (Attempt ${task.attempt})`, { cause: error, code : 'DAKIYA_WORKER_ERROR' }));
            } else {
                queueMicrotask(() => {
                    task.onError(new Exception(`Task ${task.id} failed after ${MAX_TRY_ATTEMPT} attempts.`, { cause: error, code: 'DAKIYA_WORKER_ERROR' }));
                });
            }
            this.#activeTask = null;
        }
        if (this.#worker) {
            this.#worker.removeAllListeners();
            this.#worker = null;
        }
        if (!Thread.#threadPool.delete(this.id)) {
            Thread.#sleepingThreads.delete(this.id)
        }
        if (!Thread.#pendingTasksQueue.isEmpty()) {
            if (!Thread.#awakenSleepingThread()) {
                Thread.#createNewThread();
            }
        }
    }

    #softWorkerTermination() {
        if (!this.#terminationTimeout) {
            const th = Thread.#threadPool.delete(this.id) ?? this;
            this.#terminationTimeout = setTimeout(() => {
                this.status = ThreadStatus.terminating;
                if (!this.#sendTaskToWorker({ workerExit: true })) {
                    if (this.#worker) this.#worker.terminate().catch(console.error)
                }
            }, MAX_IDLE_TIME);
            Thread.#sleepingThreads.push(th);
        }
    }

    wakeUp() {
        if (this.#terminationTimeout) {
            clearTimeout(this.#terminationTimeout);
            this.#terminationTimeout = null;
        }
        this.#executeNextTask();
    }

    stop(force = false) {
        if (this.#worker) {
            this.status = ThreadStatus.terminating;
            if (force) this.#worker.terminate().catch(console.error);
            else if (!this.#sendTaskToWorker({ workerExit: true })) {
                this.#worker.terminate().catch(console.error);
            }
        }
    }

    /*************************** Instance Methods: End *******************************/

    /*************************** Static methods: Start *******************************/
    // static members and methods related to managing the pool of threads and task distribution.

    static #awakenSleepingThread() {
        const th = Thread.#sleepingThreads.pop();
        if (th) {
            if (th.status === ThreadStatus.idle) {
                th.wakeUp();
                return true;
            }
        }
        return false;
    }

    static #createNewThread() {
        if (Thread.#threadPool.size < MAX_THREADS) {
            const th = new Thread(WORKER_FILE, Thread.#staticHash);
            Thread.#threadPool.set(th.id, th);
        }
    }

    static execute<T=unknown>(methodName: string, ...arg: unknown[]): Promise<T> {
        return new Promise((resolve: (result: T) => void, reject: (reason: Exception) => void) => {
            const task: Task = {
                id: getUuid(),
                method: { name: methodName, arg },
                onSuccess: resolve as (result?: unknown) => void,
                onError: reject,
                attempt: 0
            };
            Thread.#pendingTasksQueue.enqueue(task);

            if (!Thread.#awakenSleepingThread()) {
                Thread.#createNewThread();
            }
        });
    }
    /**************************** Static methods: End ********************************/
}
