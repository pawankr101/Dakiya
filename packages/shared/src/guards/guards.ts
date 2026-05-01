import type { DynamicType, Func, HttpCode, PossibleTypes } from "../types.js";

export interface Guards {
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
    * @returns True if the input is a number and not NaN, false otherwise.
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
     * Checks if the given model is a Date object.
     * @param model The model to check.
     * @returns True if the model is a Date object, false otherwise.
     */
    isDate(model: unknown): model is Date;

    /**
     * check if the given code is a valid HTTP status code
     * @param code The code to be checked.
     * @returns True if the code is a valid HTTP status code, false otherwise.
     */
    isHttpCode(code: unknown): code is HttpCode;
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
    return typeof input === 'number' && !Number.isNaN(input);
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

const isDate = (model: unknown): model is Date => {
    return (model instanceof Date) && !Number.isNaN(model.getTime());
}

const isHttpCode: (code: unknown) => code is HttpCode = (code: unknown): code is HttpCode => {
    return isNumber(code) && (code >= 100 && code <= 599);
}

export const Guards = (() => {
    const Guards: Guards = Object.create(null);

    Guards.isDefined = isDefined;
    Guards.isUndefined = isUndefined;
    Guards.isNull = isNull;
    Guards.isUndefinedOrNull = isUndefinedOrNull;
    Guards.isDefinedAndNotNull = isDefinedAndNotNull;
    Guards.isString = isString;
    Guards.isNumber = isNumber;
    Guards.isBoolean = isBoolean;
    Guards.isFunction = isFunction;
    Guards.isArray = isArray;
    Guards.isArrayOf = isArrayOf;
    Guards.isNotEmptyArray = isNotEmptyArray;
    Guards.isDate = isDate;
    Guards.isHttpCode = isHttpCode;

    return Guards;
})();
