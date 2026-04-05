import { Guards } from "../guards/guards.js";
import type { ObjectOf } from "../types.js";

export type LoopControl = typeof LoopControl[keyof typeof LoopControl];
export const LoopControl = (() => {
    const lc : { break: symbol } = Object.create(null);
    lc.break = Symbol('__BREAK_LOOP');
    return lc;
})();

type LoopCallback<U = void> = () => LoopControl | U;
type LoopCallbackWithIndex<U = void> = (index: number) => LoopControl | U;
type LoopDataCallback<T, K extends string | number = number, U = void> = (item: T, index: K) => LoopControl | U;
type MapLoopCallback<T, U, V = void> = (item: T, index: number) => LoopControl | U | V;
type LoopFunctionOverloads = {
    /**
    * Infinite loop until `LoopControl.break` is returned from callback function.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop(() => {
    *    console.log('Hello');
    *    return LoopControl.break;
    *  });
    */
    (cb: LoopCallback): void;

    /**
    * Loop for a specified number of iterations.
    * @param iterationCount Number of iterations to loop.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop(5, (index) => {
    *    console.log(`Iteration ${index}`);
    *    return LoopControl.break;
    *  });
    */
    (iterationCount: number, cb: LoopCallbackWithIndex): void;

    /**
    * Loop through an object.
    * @param model object to loop through.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop({ a: 1, b: 2 }, (value, key) => {
    *    console.log(`Value: ${value}, Key: ${key}`);
    *    return LoopControl.break;
    *  });
    *  // Value: 1, Key: a
    *  // Value: 2, Key: b
    */
    <T>(model: ObjectOf<T>, cb: LoopDataCallback<T, string>): void;

    /**
    * Loop through an Array.
    * @param model Array to loop through.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop([1, 2], (value, index) => {
    *    console.log(`Value: ${value}, Index: ${index}`);
    *    return LoopControl.break;
    *  }, true);
    *  // Value: 1, Index: 1
    *  // Value: 2, Index: 0
    */
    <T>(model: Array<T>, cb: LoopDataCallback<T, number>): void;

    /**
    * Loop through an Array in reverse order.
    * @param model Array to loop through.
    * @param reverse Whether to loop in reverse order.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop([1, 2], true, (value, index) => {
    *    console.log(`Value: ${value}, Index: ${index}`);
    *    return LoopControl.break;
    *  });
    *  // Value: 2, Index: 1
    *  // Value: 1, Index: 0
    */
    <T>(model: Array<T>, reverse: boolean, cb: LoopDataCallback<T, number>): void;
};

export const loop: LoopFunctionOverloads = (() => {
    const infiniteLoop = (cb: LoopCallback) => {
        while (true) {
            if(cb() === LoopControl.break) break;
        }
    };
    const repeat = (iterationCount: number, cb: LoopCallbackWithIndex) => {
        let index = 0;
        while (index < iterationCount) {
            if (cb(index) === LoopControl.break) break;
            index++;
        }
    };
    const loopObject = <T>(model: ObjectOf<T>, cb: LoopDataCallback<T, string>) => {
        const keys = Object.keys(model);
        let index = 0, len = keys.length, key: string;
        while(index < len) {
            key = keys[index];
            if(cb(model[key], key) === LoopControl.break) break;
            index++;
        }
    };
    const loopArray = <T>(model: Array<T>, cb: LoopDataCallback<T, number>) => {
        let index = 0, len = model.length;
        while(index < len) {
            if(cb(model[index], index) === LoopControl.break) break;
            index++;
        }
    };
    const loopArrayReverse = <T>(model: Array<T>, cb: LoopDataCallback<T, number>) => {
        let index = model.length-1;
        while(index>=0) {
            if(cb(model[index], index) === LoopControl.break) break;
            index--;
        }
    };
    return (<T>(modelCountOrCB: LoopCallback<T> | number | ObjectOf<T> | Array<T>, reverseOrCB: LoopCallbackWithIndex | LoopDataCallback<T, number | string> | boolean, cb: LoopDataCallback<T, number>) => {
        if (Guards.isArray(modelCountOrCB)) {
            if(Guards.isFunction(reverseOrCB)) loopArray(modelCountOrCB, reverseOrCB as LoopDataCallback<T, number>);
            else if (Guards.isFunction(cb)) {
                if(reverseOrCB === true) loopArrayReverse(modelCountOrCB, cb);
                else loopArray(modelCountOrCB, cb);
            }
        }
        else if (typeof modelCountOrCB === 'object' && Guards.isFunction(reverseOrCB)) loopObject(modelCountOrCB, reverseOrCB as LoopDataCallback<T, number | string>);
        else if (Guards.isNumber(modelCountOrCB) && Guards.isFunction(reverseOrCB)) repeat(modelCountOrCB, reverseOrCB as LoopCallbackWithIndex);
        else if (Guards.isFunction(modelCountOrCB)) infiniteLoop(modelCountOrCB as LoopCallback);
    }) as LoopFunctionOverloads;
})();

/**
* Map each element of an Array to returned value from callback function and create a new Array from returned values.
* @param array Array to map.
* @param callback Callback function to be executed in each iteration.
* @example
*  mapLoop([1, 2], (value, index) => {
*    console.log(`Value: ${value}, Index: ${index}`);
*    return value * 2;
*  });
*  // Value: 1, Index: 0
*  // Value: 2, Index: 1
*  // [2, 4]
*/
export const mapLoop = <T, U>(array: Array<T>, cb: MapLoopCallback<T, U>): Array<U> => {
    const result: Array<U> = [], len = array.length;
    let index = 0;

    while (index < len) {
        const cbr = cb(array[index], index);
        if (cbr === LoopControl.break) break;
        else if (cbr !== undefined) {
            result.push(cbr as U);
        }
        index++;
    }

    return result;
};
