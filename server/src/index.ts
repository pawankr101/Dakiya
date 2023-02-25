
import { isMainThread } from 'worker_threads';
import { App } from './app';

if(isMainThread) new App().start();