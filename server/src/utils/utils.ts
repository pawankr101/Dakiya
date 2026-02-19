import type { DynamicType, Func, ObjectOf, PossibleTypes } from '../types/index.js';
import { LoopControl } from './ds.js';

type LoopCallback<U = void> = () => LoopControl | U;
type LoopCallbackWithIndex<U = void> = (index: number) => LoopControl | U;
type LoopDataCallback<T, K extends string | number = number, U = void> = (item: T, index: K) => LoopControl | U;
type MapLoopCallback<T, U, V = void> = (item: T, index: number) => LoopControl | U | V;
type LoopFunctionOverloads = {
    (cb: LoopCallback): void;
    (iterationCount: number, cb: LoopCallbackWithIndex): void;
    <T>(model: ObjectOf<T>, cb: LoopDataCallback<T, string>): void;
    <T>(model: Array<T>, cb: LoopDataCallback<T, number>): void;
    <T>(model: Array<T>, reverse: boolean, cb: LoopDataCallback<T, number>): void;
};

type ValueErrorRangeType = { toValue?: number, error?: number, errorPercentage?: number, lowerRange?: number, upperRange?: number, distance?: number };
type NumberComparatorType = number | { toValue: number, error: number } | { toValue: number, errorPercentage: number } | { lowerRange: number, upperRange: number } | { lowerRange: number, distance: number } | { upperRange: number, distance: number };

export interface Utils {
    /**
    * Checks if the input is defined.
    * @param input The input to check.
    * @returns True if the input is defined, false otherwise.
    */
    isDefined<T>(input: T): input is Exclude<typeof input, undefined>;

    /**
    * Checks if the input is undefined.
    * @param input The input to check.
    * @returns True if the input is undefined, false otherwise.
    */
    isUndefined<T>(input: T): input is undefined;

    /**
    * Checks if the input is null.
    * @param input The input to check.
    * @returns True if the input is null, false otherwise.
    */
    isNull<T>(input: T): input is null;

    /**
    * Checks if the input is undefined or null.
    * @param input The input to check.
    * @returns True if the input is undefined or null, false otherwise.
    */
    isUndefinedOrNull<T>(input: T): input is undefined | null;

    /**
    * Checks if the input is defined and not null.
    * @param input The input to check.
    * @returns True if the input is defined and not null, false otherwise.
    */
    isDefinedAndNotNull<T>(input: T): input is Exclude<typeof input, undefined | null>;

    /**
    * Checks if the input is a string.
    * @param input The input to check.
    * @returns True if the input is a string, false otherwise.
    */
    isString(input: unknown): input is string;

    /**
    * Checks if the input is a number.
    * @param input The input to check.
    * @returns True if the input is a number, false otherwise.
    */
    isNumber(input: unknown): input is number;

    /**
    * Checks if the input is a function.
    * @param input The input to check.
    * @returns True if the input is a function, false otherwise.
    */
    isFunction(input: unknown): input is Func;

    /**
    * Checks if the input is a boolean.
    * @param input The input to check.
    * @returns True if the input is a boolean, false otherwise.
    */
    isBoolean(input: unknown): input is boolean;

    /**
    * Checks if the input is an array.
    * @param input The input to check.
    * @returns True if the input is an array, false otherwise.
    */
    isArray<T>(input: unknown): input is Array<T>;

    /**
    * Checks if the input is an array of a specific type.
    * @param type The type to check.
    * @param input The input to check.
    * @returns True if the input is an array of the specified type, false otherwise.
    */
    isArrayOf<AO extends PossibleTypes = never, T extends PossibleTypes = never>(type: T, input: unknown): input is Array<DynamicType<T, AO>>;

    /**
    * Checks if the input is an array that is not empty.
    * @param model The input to check.
    * @returns True if the input is an array that is not empty, false otherwise.
    */
    isNotEmptyArray<T>(model: unknown): model is Array<T>;

    /**
    * Extract value on key inside given model object
    * @param model any
    * @param key string | number - key to extract value from model object
    * @param defaultValue any - default value to return if key is not found in model object
    * @returns value of the key in model object or default_value if key is not found
    * @description
    *  - If key is a string and contains dot (.) then it will extract value from nested object.
    *  - If model is not defined or null then it will return default_value.
    *  - If default value is also not available then returns null.
    * @example
    *  const model = {
    *    key1: 'value1',
    *    key2: {
    *      inner_key1 : 'innerValue1',
    *      inner_key2 : 'innerValue2'
    *    },
    *    key3: 'value3'
    *  };
    *  getValue(model, 'key1'); // 'value1'
    *  getValue(model, 'key2.inner_key1'); // 'innerValue1'
    *  getValue(model, 'key2.inner_key3', 'default_value'); // 'default_value'
    *  getValue(model, 'key4', 'default_value'); // 'default_value'
    *  getValue(model, 'key4'); // null
    */
    getValue<T>(model: ObjectOf<T|unknown>, key: string | number, defaultValue?: T): T | null;

    /**
    * Infinite loop until `LoopControl.break` is returned from callback function.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop(() => {
    *    console.log('Hello');
    *    return LoopControl.break;
    *  });
    */
    loop(cb: LoopCallback): void;

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
    loop(iterationCount: number, cb: LoopCallbackWithIndex): void;

    /**
    * Loop through an Array or object.
    * @param model Array or object to loop through.
    * @param cb Callback function to be executed in each iteration.
    * @example
    *  loop([1, 2], (value, index) => {
    *    console.log(`Value: ${value}, Index: ${index}`);
    *    return LoopControl.break;
    *  });
    *  // Value: 1, Index: 0
    *  // Value: 2, Index: 1
    *
    *  loop({ a: 1, b: 2 }, (value, key) => {
    *    console.log(`Value: ${value}, Key: ${key}`);
    *    return LoopControl.break;
    *  });
    *  // Value: 1, Key: a
    *  // Value: 2, Key: b
    */
    loop<T>(model: ObjectOf<T> | Array<T>, cb: LoopDataCallback<T, typeof model extends Array<T> ? number : string>): void;

    /**
    * Loop through an Array or object in reverse order.
    * @param model Array or object to loop through.
    * @param cb Callback function to be executed in each iteration.
    * @param reverse Whether to loop in reverse order.
    * @example
    *  loop([1, 2], (value, index) => {
    *    console.log(`Value: ${value}, Index: ${index}`);
    *    return LoopControl.break;
    *  }, true);
    *  // Value: 2, Index: 1
    *  // Value: 1, Index: 0
    */
    loop<T>(model: Array<T>, reverse: boolean, cb: LoopDataCallback<T, number>): void;

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
    mapLoop<T, U>(array: Array<T>, cb: MapLoopCallback<T, U>): Array<U>;

    clone<T>(data: T, toJson?: boolean): T;

    /**
    * Compare Number with given comparator object.
    * @param value number
    * @param comparator object
    * * It can be one of the following:
    *   - number - exact match
    *   - { toValue: number, error: number } - within error range
    *   - { toValue: number, errorPercentage: number } - within percentage error range
    *   - { lowerRange: number, upperRange: number } - within range
    *   - { lowerRange: number, distance: number } - lower range with distance
    *   - { upperRange: number, distance: number } - upper range with distance
    * @returns boolean - true if value is within the range or matches the comparator, otherwise false.
    * @example
    *  compareNumber(10, 10); // true
    *  compareNumber(10, { toValue: 8, error: 2 }); // true
    *  compareNumber(10, { toValue: 8, errorPercentage: 20 }); // true
    *  compareNumber(10, { lowerRange: 8, upperRange: 12 }); // true
    *  compareNumber(10, { lowerRange: 8, distance: 3 }); // true
    *  compareNumber(10, { upperRange: 12, distance: 3 }); // true
    *  compareNumber(10, { lowerRange: 8, distance: 1 }); // false
    */
    compareNumber(value: number, comparator: NumberComparatorType): boolean;

    /**
    * Capitalize the first letter of the string and make rest of the string lower case.
    * @param string string
    * @returns string
    * @example
    *  capitalize('hello world'); // 'Hello world'
    *  capitalize('HELLO WORLD'); // 'Hello world'
    */
    capitalize(str: string): string;

    /**
    * Convert Bytes to readable format size.
    * @param bytes number
    * @returns string
    * @example
    *  bytesToSize(1024); // '1.00 KB'
    *  bytesToSize(1048576); // '1.00 MB'
    */
    bytesToSize(bytes: number): string;
}

const isDefined = <T>(input: T): input is Exclude<typeof input, undefined> => {
    return input !== undefined;
}

const isUndefined = <T>(input: T): input is undefined => {
    return input === undefined;
}

const isNull = <T>(input: T): input is null => {
    return input === null;
}

const isUndefinedOrNull = <T>(input: T): input is undefined | null => {
    return input === undefined || input === null;
}

const isDefinedAndNotNull = <T>(input: T): input is Exclude<typeof input, undefined | null> => {
    return input !== undefined && input !== null;
}

const isString = (input: unknown): input is string => {
    return typeof input === 'string';
}

const isNumber = (input: unknown): input is number => {
    return typeof input === 'number';
}

const isBoolean = (input: unknown): input is boolean => {
    return typeof input === 'boolean';
}

const isFunction = (input: unknown): input is Func => {
    return typeof input === 'function';
}

const isArray = <T>(input: unknown): input is Array<T> => {
    return Array.isArray(input);
}

const isArrayOf = <AO extends PossibleTypes = never, T extends PossibleTypes = never>(type: T, input: unknown): input is Array<DynamicType<T, AO>> => {
    if (isArray(input)) {
        for(let i = 0, l = input.length; i<l; i++) {
            if(typeof input[i] !== type) return false;
        }
        return true;
    }
    return false;
}

const isNotEmptyArray = <T>(model: unknown): model is Array<T> => {
    if(isArray(model)) {
        return model.length > 0;
    }
    return false;
}

const getValue = <T>(model: ObjectOf<T|unknown>, key: string | number, defaultValue?: T): T | null => {
    defaultValue = isDefined(defaultValue) ? defaultValue : null;
    if(isUndefinedOrNull(model)) return defaultValue;

    if(isString(key) && key.includes('.')) {
        const keys = key.split('.'), keyCount = keys.length;
        let index = 0, value = model;
        while(index < keyCount) {
            value = value[keys[index]] as ObjectOf<T|unknown>;
            if(isUndefined(value)) return defaultValue;
            if(isNull(value)) return value;
            index++;
        }
        return value as T;
    }
    return isDefined(model[key]) ? model[key] as T : defaultValue;
}

const loop = (() => {
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
        if (isArray(modelCountOrCB)) {
            if(isFunction(reverseOrCB)) loopArray(modelCountOrCB, reverseOrCB as LoopDataCallback<T, number>);
            else if (isFunction(cb)) {
                if(reverseOrCB === true) loopArrayReverse(modelCountOrCB, cb);
                else loopArray(modelCountOrCB, cb);
            }
        }
        else if (typeof modelCountOrCB === 'object' && isFunction(reverseOrCB)) loopObject(modelCountOrCB, reverseOrCB as LoopDataCallback<T, number | string>);
        else if (isNumber(modelCountOrCB) && isFunction(reverseOrCB)) repeat(modelCountOrCB, reverseOrCB as LoopCallbackWithIndex);
        else if (isFunction(modelCountOrCB)) infiniteLoop(modelCountOrCB as LoopCallback);
    }) as LoopFunctionOverloads;
})();

const mapLoop = <T, U>(array: Array<T>, cb: MapLoopCallback<T, U>): Array<U> => {
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

const clone = (() => {
    const cloneObject = <T>(data: T, toJson: boolean, visited: WeakMap<object, object>): T => {
        if (data instanceof Promise) return data; // Do not clone Promise object

        if (visited.has(data as object)) return visited.get(data as object) as T;

        // Handle special cases for cloning
        if (data instanceof Date) return new Date(data.getTime()) as T; // Clone Date object
        if (data instanceof RegExp) return new RegExp(data.source, data.flags) as T; // Clone RegExp object

        const copiedData = isArray(data) ? [] : Object.create(Object.getPrototypeOf(data));
        visited.set(data as object, copiedData);
        const keys = toJson ? Object.keys(data) : [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)];

        for (let i = 0, kl = keys.length; i < kl; i++) {
            const key = keys[i];
            const value = cloneData(data[key], toJson, visited);
            const descriptor = Object.getOwnPropertyDescriptor(data, key);
            if (Object.hasOwn(descriptor, 'value')) {
                Object.defineProperty(copiedData, key, { value, writable: true, enumerable: descriptor.enumerable, configurable: descriptor.configurable });
            } else { // This else implicitly means (Object.hasOwn(descriptor, 'get') || Object.hasOwn(descriptor, 'set'))
                Object.defineProperty(copiedData, key, { get: descriptor.get, set: descriptor.set, enumerable: descriptor.enumerable, configurable: descriptor.configurable });
            }
        }
        return copiedData as T;
    };
    const cloneData = <T>(data: T, toJson: boolean, visited: WeakMap<object, object>): T => {
        if(typeof(data) === 'object' && data !== null) {
            return cloneObject(data, toJson, visited);
        }
        if(typeof(data) === 'function' && !toJson) {
            return data as T;
        }
        return data;
    }
    return <T>(data: T, toJson: boolean = false): T => {
        const visited = new WeakMap<object, object>();
        return cloneData(data, toJson, visited);
    }
})();

const compareNumber = (value: number, comparator: NumberComparatorType): boolean => {
    if(isNumber(comparator)) return value === comparator;
    if (isDefinedAndNotNull(comparator)) {
        let { toValue, error, errorPercentage, lowerRange, upperRange, distance } = comparator as ValueErrorRangeType;
        if (isNumber(toValue)) {
            if (isNumber(errorPercentage)) error = toValue * ((errorPercentage || 0) / 100);
            lowerRange = toValue - error;
            upperRange = toValue + error;
        } else if(isNumber(distance)) {
            if (isNumber(lowerRange)) {
                upperRange = lowerRange + distance;
            } else {
                lowerRange = upperRange - distance;
            }
        }
        return value >= lowerRange && value <= upperRange;
    }
    return false;
}

const capitalize = (string: string): string => {
    return string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

const bytesToSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}

export const Utils = (() => {
    const Utils: Utils = Object.create(null);

    Utils.isDefined = isDefined;
    Utils.isUndefined = isUndefined;
    Utils.isNull = isNull;
    Utils.isUndefinedOrNull = isUndefinedOrNull;
    Utils.isDefinedAndNotNull = isDefinedAndNotNull;
    Utils.isString = isString;
    Utils.isNumber = isNumber;
    Utils.isBoolean = isBoolean;
    Utils.isFunction = isFunction;
    Utils.isArray = isArray;
    Utils.isArrayOf = isArrayOf;
    Utils.isNotEmptyArray = isNotEmptyArray;
    Utils.getValue = getValue;
    Utils.loop = loop;
    Utils.mapLoop = mapLoop;
    Utils.clone = clone;
    Utils.compareNumber = compareNumber;
    Utils.capitalize = capitalize;
    Utils.bytesToSize = bytesToSize;

    return Utils;
})();
