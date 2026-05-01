import { Guards } from "../guards/index.js";
import type { ObjectOf } from "../types.js";

type ValueErrorRangeType = { toValue?: number, error?: number, errorPercentage?: number, lowerRange?: number, upperRange?: number, distance?: number };
type NumberComparatorType = number | { toValue: number, error: number } | { toValue: number, errorPercentage: number } | { lowerRange: number, upperRange: number } | { lowerRange: number, distance: number } | { upperRange: number, distance: number };

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
export const getValue = <T=unknown>(model: ObjectOf<T>, key: string | number, defaultValue?: T): T | null => {
    defaultValue = Guards.isDefined(defaultValue) ? defaultValue : null;
    if(Guards.isUndefinedOrNull(model)) return defaultValue;

    if(Guards.isString(key) && key.includes('.')) {
        const keys = key.split('.'), keyCount = keys.length;
        let index = 0, value = model;
        while(index < keyCount) {
            value = value[keys[index]] as ObjectOf<T>;
            if(Guards.isUndefined(value)) return defaultValue;
            if(Guards.isNull(value)) return value;
            index++;
        }
        return value as T;
    }
    return Guards.isDefined(model[key]) ? model[key] as T : defaultValue;
}

/**
* Deep clones an object or array, preserving circular references.
* @param data - The data to clone.
* @param toJson - Whether to clone as JSON (default: false).
* @returns The cloned data.
* @example
* ```ts
* const obj = { a: 1, b: { c: 2 } };
* const cloned = clone(obj);
* console.log(cloned); // { a: 1, b: { c: 2 } }
* ```
* @remarks
* Circular references are preserved by using a WeakMap to track visited objects.
*/
export const clone = (() => {
    const cloneObject = <T>(data: T, toJson: boolean, visited: WeakMap<object, object>): T => {
        if (data instanceof Promise) return data; // Do not clone Promise object

        if (visited.has(data as object)) return visited.get(data as object) as T;

        // Handle special cases for cloning
        if (data instanceof Date) return new Date(data) as T; // Clone Date object
        if (data instanceof RegExp) return new RegExp(data.source, data.flags) as T; // Clone RegExp object

        const copiedData = Guards.isArray(data) ? [] : Object.create(Object.getPrototypeOf(data));
        visited.set(data as object, copiedData);
        const keys = toJson ? Object.keys(data) : [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)];

        for(let i = 0, kl = keys.length; i < kl; i++) {
            const key = keys[i];
            const value = cloneData(data[key], toJson, visited);
            const descriptor = Object.getOwnPropertyDescriptor(data, key);
            if(descriptor) {
                if(Object.hasOwn(descriptor, 'value')) {
                    Object.defineProperty(copiedData, key, {
                        value, writable: true,
                        enumerable: descriptor.enumerable,
                        configurable: descriptor.configurable
                    });
                } else { // This else implicitly means (Object.hasOwn(descriptor, 'get') || Object.hasOwn(descriptor, 'set'))
                    Object.defineProperty(copiedData, key, {
                        get: descriptor.get,
                        set: descriptor.set,
                        enumerable: descriptor.enumerable,
                        configurable: descriptor.configurable
                    });
                }
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
export const compareNumber = (value: number, comparator: NumberComparatorType): boolean => {
    if(Guards.isNumber(comparator)) return value === comparator;
    if (Guards.isDefinedAndNotNull(comparator)) {
        let { toValue, error, errorPercentage, lowerRange, upperRange, distance } = comparator as ValueErrorRangeType;
        if (Guards.isNumber(toValue)) {
            if (Guards.isNumber(errorPercentage)) error = toValue * ((errorPercentage || 0) / 100);
            lowerRange = toValue - error;
            upperRange = toValue + error;
        } else if(Guards.isNumber(distance)) {
            if (Guards.isNumber(lowerRange)) {
                upperRange = lowerRange + distance;
            } else {
                lowerRange = upperRange - distance;
            }
        }
        return value >= lowerRange && value <= upperRange;
    }
    return false;
}

/**
* Capitalize the first letter of the string and make rest of the string lower case.
* @param string string
* @returns string
* @example
*  capitalize('hello world'); // 'Hello world'
*  capitalize('HELLO WORLD'); // 'Hello world'
*/
export const capitalize = (string: string): string => {
    return string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
* Convert Bytes to readable format size.
* @param bytes number
* @returns string
* @example
*  bytesToSize(1024); // '1.00 KB'
*  bytesToSize(1048576); // '1.00 MB'
*/
export const bytesToSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024)),
    sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    return `${(bytes / (1024 ** i)).toFixed(2)} ${sizes[i]}`;
}
