import { parentPort } from 'node:worker_threads';
import { type Func, Guards, type ObjectOf } from '@dakiya/shared';
import methods from './methods.js';

interface WorkerInput {
    method: string;
    args?: unknown[];
    workerExit?: boolean
}

interface WorkerResult {
    result?: unknown;
    error?: string;
}

const METHOD_REGISTRY: ObjectOf<Func> = methods as ObjectOf<Func>;
const PORT: MessagePort = (() => {
    if(Guards.isNull(parentPort)) {
        throw new Error('This file should be run as a worker thread');
    }
    return parentPort;
})();

const defaultMethod = (errorMessage: string) => {
    return (() => Promise.reject(new Error(errorMessage))) as Func;
};

const sendResult = (data: WorkerResult) => {
    try {
        PORT.postMessage(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Failed to send message to parent thread:', errorMessage);
        try {
            PORT.postMessage({ error: errorMessage });
        } catch (err) {
            console.error('Failed to send error message to parent thread:', err instanceof Error ? err.message : String(err));
            stopWorker();
        }
    }
}

const executeMethod = async(method: Func, args: unknown[] = []): Promise<{result?: unknown, error?: string}>  => {
    try {
        const result = await method(...args);
        return { result };
    } catch (err) {
        return { error: err instanceof Error ? err.message : String(err) };
    }
}

const stopWorker = () => {
    PORT.removeAllListeners('message');
    PORT.close();
    setImmediate(() => process.exit(0));
}

function startWorker() {
    PORT.addListener('message', async (data: WorkerInput) => {
        if (data.workerExit) {
            stopWorker();
        } else {
            const method = METHOD_REGISTRY[data.method] || defaultMethod(`Method "${data.method}" not found in worker`);

            const { result, error } = await executeMethod(method, data.args);

            if (error) sendResult({ error });
            else sendResult({ result });
        }
    });
}

startWorker();
