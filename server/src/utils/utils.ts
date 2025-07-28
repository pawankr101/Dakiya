type PossibleDTypes='undefined'|'string'|'number'|'boolean'|'array'|'object'|'function';
type DynamicType<T=PossibleDTypes, AO=any>= T extends 'undefined' ? undefined
    : T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean
    : T extends 'array' ? Array<AO> : T extends 'object' ? Object : T extends 'function' ? Function : any;
type ValueErrorType = { toValue: number, error?: number, errorPercentage?: number };
type RangeType = { lowerRange: number, upperRange: number, distance: number };
type DeepCopyOptions = { toJson: boolean, cloneFunction: boolean };

export enum LoopControl {
    break='__BREAK_LOOP'
}

export class Utils {
    /**
     * #### Check If model is Defined
     * @param model any
     */
    static isDefined(model: any): boolean {
        return typeof(model) !== 'undefined';
    }

    /**
     * #### Check If model is Defined and Not null
     * @param model any
     */
    static isDefinedAndNotNull(model: any): boolean {
        return this.isDefined(model) && model!==null;
    }

    /**
     * #### Check If model is String
     * @param model any
     */
    static isString(model: any): model is string {
        return typeof(model) === 'string';
    }

    /**
     * #### Check If model is Boolean
     * @param model any
     */
    static isBoolean(model: any): model is boolean {
        return typeof(model) === 'boolean';
    }

    /**
     * #### Check If model is Number
     * @param model any
     */
    static isNumber(model: any): model is number {
        return typeof(model) === 'number';
    }

    /**
     * #### Check If model is Array
     * @param model any
     */
    static isArray = Array.isArray;

    /**
     * #### Check If model is Array of provided type
     * @param type 'undefined' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function'
     * @param model any
     */
    static isArrayOf<AO=any,T extends string=PossibleDTypes>(type: T, model: any): model is Array<DynamicType<T,AO>> {
        if(this.isArray(model)) {
            for(var i=0,l=model.length; i<l; i++) {if(typeof(model[i]) !== type) return false;}
            return true;
        }
        return false;
    }

    /**
     * #### Check if model is not empty Array
     * @param model any
     */
    static isNotEmptyArray<T=any>(model: any): model is Array<T> {
        return this.isArray(model) && model.length > 0;
    }

    /**
     * #### Extract value on key inside given model object
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
    static getValue<T=any>(model: any, key: string|number, defaultValue?: T): typeof defaultValue {
        defaultValue = this.isDefined(defaultValue) ? defaultValue : null;
        if(this.isDefinedAndNotNull(model)) {
            if(this.isString(key) && key.includes('.')) {
                let keys = key.split('.'), val = model[keys[0]],l=keys.length,i=1;
                while(i<l) {
                    if(!this.isDefinedAndNotNull(val)) return defaultValue;
                    val = val[keys[i++]];
                }
                return this.isDefinedAndNotNull(val) ? val : defaultValue;
            }
            return this.isDefinedAndNotNull(model[key]) ? model[key] : defaultValue;
        }
        return defaultValue;
    }

    /**
     * #### Loop through an Array or object.
     * @param model Array or object
     * @param callback function that define specific task with each element while iteration.
     * @description user can return `LoopControl.break` enum from callback function to break the whole loop at any point of time while iteration.
     * @example
     *  const model = {
     *   key1: 'value1',
     *   key2: {
     *      inner_key1 : 'innerValue1',
     *     inner_key2 : 'innerValue2'
     *   },
     *   key3: 'value3'
     *  };
     *  forLoop(model, (value, key) => {
     *   console.log(key, value);
     *   if(key === 'key2') return LoopControl.break; // break the loop when key is 'key2'
     *  });
     *  // Output:
     *  // key1 value1
     *  // key2 { inner_key1: 'innerValue1', inner_key2: 'innerValue2' }
     */
    static forLoop<T>(model: { [x: string]: T } | T[], callback: (value: T, key?: any) => void | LoopControl) {
        if(this.isArray(model)) {
            let index = 0, len = model.length;
            while(index<len) {
                if(callback(model[index], index) === LoopControl.break) break;
                index++;
            }
        } else if(model instanceof Object) {
            const keys = Object.keys(model);
            let index = 0, len = keys.length, key: string;
            while(index<len) {
                key = keys[index];
                if(callback(model[key], key) === LoopControl.break) break;
                index++;
            }
        }
    }

    /**
     * #### Loop through an Array or object in reverse order.
     * @param model Array or object
     * @param callback function that define specific task with each element while iteration.
     * @description user can return `LoopControl.break` enum from callback function to break the whole loop at any point of time while iteration.
     * @example
     *   const model = [ 1, 2, 3, 4, 5 ];
     *   forLoopReverse(model, (value, index) => {
     *     console.log(index, value);
     *     if(value === 3) return LoopControl.break; // break the loop when value is 3
     *   });
     *   // Output:
     *   // 4 5
     *   // 3 4
     *   // 2 3
     * */
    static forLoopReverse<T>(model: { [x: string]: T } | T[], callback: (value: T, key?: any) => void | LoopControl) {
        if(this.isArray(model)) {
            let index = model.length-1;
            while(index>=0) {
                if(callback(model[index], index) === LoopControl.break) break;
                index--;
            }
        } else if(model instanceof Object) {
            const keys = Object.keys(model);
            let index = keys.length-1, key: string;
            while(index>=0) {
                key = keys[index];
                if(callback(model[key], key) === LoopControl.break) break;
                index--;
            }
        }
    }

    /**
     * #### Map through an Array and return a new Array with the results.
     * @param array Array
     * @param callback function that define specific task with each element while iteration.
     * @returns Array of results of callback function.
     * @description
     *  - If callback returns `undefined` then that element will not be included in the result array.
     *  - If array is not defined or null then it will return an empty array.
     * @example
     *  const array = [1, 2, 3, 4, 5];
     *  const result = mapLoop(array, (value) => {
     *    return value % 2 === 0 ? value * 2 : undefined; // double the even numbers
     *  }); // result will be [4, 8]
     */
    static mapLoop<T, C>(array: Array<T>, callback: (value: T, index?: number) => C): Array<C> {
        const result: Array<C> = [];
        if(this.isArray(array)) {
            for(var index = 0, len = array.length; index < len; index++) {
                const cb_ret = callback(array[index], index);
                if(this.isDefined(cb_ret)) result.push(cb_ret);
            }
        }
        return result;
    }

    /**
     * #### Remove empty elements from an Array.
     * @param array Array
     * @returns Array with empty elements removed.
     * @description
     *  - It will remove `null` and `undefined` elements from the array.
     *  - If array is not defined or null then it will return an empty array.
     * @example
     *  const array = [1, null, 2, undefined, 3];
     *  const result = removeEmptyElements(array); // [1, 2, 3]
     */
    static removeEmptyElements<T>(array: T[]): T[] {
        return this.mapLoop(array, el => el===null ? void 0 : el);
    }

    /**
     * #### Capitalize the first letter of the string and make rest of the string lower case.
     * @param string string
     * @returns string
     * @example
     *  capitalize('hello world'); // 'Hello world'
     *  capitalize('HELLO WORLD'); // 'Hello world'
     */    
    static capitalize(string='') {
        return string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    /**
     * #### Extracts the first number from a given string.
     * @param string - The input string from which to extract the number. Defaults to an empty string.
     * @returns The first number found in the string as a number, or NaN if no number is present.
     * @description
     *  - Extracts the first number (integer or floating point) from a given string and returns it as a number.
     *  - If the string contains multiple numbers, only the first one is extracted.
     *  - If the string does not contain any numbers, the function returns NaN.
     * @example
     *  getNumberFromString("The price is 42.50 dollars"); // 42.5
     *  getNumberFromString("No numbers here!"); // NaN
     *  getNumberFromString("123 apples and 456 oranges"); // 123
     *  getNumberFromString("Temperature: -5.5 degrees"); // -5.5
     */
    static getNumberFromString(string='') {
        return parseFloat(string && (string.match(/-?(\d*\.\d+|\d+)/)||{})[0]);
    }

    /**
     * #### Convert Bytes to Readable Format.
     * @param bytes number
     * @returns string
     * @example
     *  bytesToReadable(1024); // '1.00 KB'
     *  bytesToReadable(1048576); // '1.00 MB'
     */
    static bytesToReadable(bytes=0) {
        var i = Math.floor(Math.log(bytes) / Math.log(1024)),
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    
    /**
     * #### Deep Clone an object or array.
     * @template T - The type of the object to clone.
     * @param data - The object to be cloned.
     * @param options - Options to control the deep copy behavior.
     * @param visited - A WeakMap used to track already cloned objects for circular reference handling.
     * @returns A deep clone of the input object.
     * @description
     * - If `toJson` option is true, it will generate JSON Object with only enumerable properties.
     * - If `cloneFunction` option is true, it will clone functions as well.
     */
    static #cloneObjects<T>(data: T, options: DeepCopyOptions, visited: WeakMap<Object, Object>): T {
        // Handle special cases for cloning
        if(data instanceof Promise) return data; // Do not clone Promise object
        if(data instanceof Date) return new Date(data.getTime()) as T; // Clone Date object
        if(data instanceof RegExp) return new RegExp(data.source, data.flags) as T; // Clone RegExp object

        if(visited.has(data)) return visited.get(data) as T;
        const copiedData = this.isArray(data) ? [] : Object.create(Object.getPrototypeOf(data));
        const keys = options.toJson ? Object.keys(data) : [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)];
        this.forLoop(keys, (key) => {
            const value = this.clone(data[key], options);
            const descriptor = Object.getOwnPropertyDescriptor(data, key);
            if(descriptor.hasOwnProperty('value')) {
                Object.defineProperty(copiedData, key, { value, writable: true, enumerable: descriptor.enumerable, configurable: descriptor.configurable });
            } else { // This else implicitly means (descriptor.hasOwnProperty('get') || descriptor.hasOwnProperty('set'))
                Object.defineProperty(copiedData, key, { get: descriptor.get, set: descriptor.set, enumerable: descriptor.enumerable, configurable: descriptor.configurable });
            } 
        });
        visited.set(data, copiedData);
        return copiedData as T;
    }

    /**
     * #### Clone a function.
     * @param data Function - function to clone
     * @param visited WeakMap<Object, Object> - used to track already cloned functions for circular reference handling
     * @returns Function - cloned function
     * @description
     * - It will clone the function by extracting its arguments and body.
     * - It will preserve the prototype chain of the original function.
     */
    static #cloneFunction(data: Function, visited: WeakMap<Object, Object>): Function {
        if(visited.has(data)) return visited.get(data) as Function;

        const fnStr = data.toString();
        let fnBody: string, fnArgs: string[];
        if(fnStr.includes('=>')) { // Arrow function
            let argPart: string;
            [argPart, fnBody] = fnStr.split('=>').map(part => part.trim());
            fnArgs = argPart.startsWith('(') ? argPart.substring(1, argPart.length - 1).split(',').map(arg => arg.trim()) : [argPart];
            if (fnBody.startsWith('{') && fnBody.endsWith('}')) {
                fnBody = fnBody.substring(1, fnBody.length - 1);
            }
        } else { // Regular function
            fnBody = fnStr.substring(fnStr.indexOf('{') + 1, fnStr.lastIndexOf('}'));
            fnArgs = fnStr.substring(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).split(',').map(arg => arg.trim());
        }
        const clonedFn = new Function(...fnArgs, fnBody);
        Object.setPrototypeOf(clonedFn, Object.getPrototypeOf(data)); // Preserve prototype chain

        visited.set(data, clonedFn);
        return clonedFn;
    }

    /**
     * #### Deep Clone an object or array.
     * @param data any - object or array to clone
     * @param options DeepCopyOptions - options for deep cloning
     * @returns cloned object or array
     * @description
     * - It will clone the object or array deeply, including nested objects and arrays.
     * - If `toJson` option is true, it will generate JSON Object with only enumerable properties.
     * - If `cloneFunction` option is true along with `toJson`, it will clone functions as well.
     * @example
     *  const obj = { a: 1, b: { c: 2, d: [4, 5] }, e: () => console.log('Hello') };
     *  Utils.clone(obj, { toJson: false, cloneFunction: true }); // { a: 1, b: { c: 2, d: [4, 5] }, e: [Function] }
     *  Utils.clone(obj, { toJson: false, cloneFunction: false }); // { a: 1, b: { c: 2, d: [4, 5] } }
     */
    static clone = (() => {
        const visited = new WeakMap<Object, Object>();
        return <T>(data: T, options: DeepCopyOptions): T => {
            if(typeof(data) === 'object' && data !== null) {
                return this.#cloneObjects(data, options, visited) as T;
            }
            if(typeof(data) === 'function' && options.cloneFunction && !options.toJson) {
                return this.#cloneFunction(data, visited) as T;
            }
            return data;
        }
    })();

    /**
     * #### Compare Number with given comparator object.
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
    static compareNumber(value: number, comparator: number | { toValue: number, error: number } | { toValue: number, errorPercentage: number } | { lowerRange: number, upperRange: number } | { lowerRange: number, distance: number } | { upperRange: number, distance: number } ): boolean {
        if(this.isNumber(comparator)) return value === comparator;
        if(this.isDefinedAndNotNull(comparator) ) {
            const comp = {...comparator} as ValueErrorType | RangeType;
            if(this.isNumber((comp as ValueErrorType).toValue)) {
                if(this.isNumber((comp as ValueErrorType).errorPercentage)) {
                    (comp as ValueErrorType).error = (comp as ValueErrorType).toValue * ((comp as ValueErrorType).errorPercentage || 0) / 100;
                }
                (comp as RangeType).lowerRange = (comp as ValueErrorType).toValue - (comp as ValueErrorType).error;
                (comp as RangeType).upperRange = (comp as ValueErrorType).toValue + (comp as ValueErrorType).error;
            } else if((comp as RangeType).distance) {
                (comp as RangeType).lowerRange ? ((comp as RangeType).upperRange = (comp as RangeType).lowerRange + (comp as RangeType).distance) : ((comp as RangeType).lowerRange = (comp as RangeType).upperRange - (comp as RangeType).distance);
            }
            return (value >= (comp as RangeType).lowerRange) && (value <= (comp as RangeType).upperRange);
        }
        return false;
    }
}
