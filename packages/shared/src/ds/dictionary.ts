import { LoopControl } from '../iter/index.js';
import type { ObjectOf } from '../types.js';

type LoopCallback<T, U = void> = (item: T, index: number) => LoopControl | U;

/**
* A generic Mapper class to manage a collection of data items identified by unique string keys.
* Provides methods to get, set, delete, and retrieve all items in the collection.
* @template T - The type of data stored in the collection.
*/
export class Dictionary<T> {
    #data: ObjectOf<T, string> = Object.create(null);
    #size: number = 0;

    /**
    * Constructs a new Mapper instance.
    * @param source - An optional object to initialize the mapper with existing key-value pairs.
    */
    constructor(source?: ObjectOf<T>) {
        if (source) {
            Object.assign(this.#data, source);
            this.#size = Object.keys(source).length;
        }
    }

    /**
    * Retrieves the number of items in the Mapper.
    * @returns The number of items in the Mapper.
    */
    get size(): number {
        return this.#size;
    }

    /**
    * Checks if the Dictionary is empty.
    * @return True if the Dictionary is empty, false otherwise.
    */
    isEmpty(): boolean {
        return this.#size === 0;
    }

    /**
    * Retrieves a data item by its key.
    * @param key - The unique key of the item to retrieve.
    * @returns The data item associated with the given key, or undefined if not found.
    */
    get(key: string): T {
        return this.#data[key];
    }

    /**
    * Adds or updates a data item by its key.
    * @param key - The unique key of the item to add or update.
    * @param val - The data item to associate with the given key.
    * @returns The data item that was added or updated.
    */
    set(key: string, val: T): T {
        if (!(key in this.#data)) this.#size++;
        this.#data[key] = val;
        return val;
    }

    /**
    * Deletes a data item by its key.
    * @param key - The unique key of the item to delete.
    * @returns The data item that was deleted, or undefined if not found.
    * @remarks This method checks if the specified key exists in the collection. If it does, it retrieves the associated value, deletes the key-value pair from the collection, and decrements the size counter. Finally, it returns the deleted value. If the key does not exist, it returns undefined.
    */
    delete(key: string): T {
        const data = this.#data;
        if (key in data) {
            const value = data[key];
            if (delete data[key]) {
                this.#size--;
                return value;
            }
        }
        return undefined;
    }

    /**
    * Deletes all data items in the collection.
    */
    deleteAll(): void {
        this.#data = Object.create(null);
        this.#size = 0;
    }

    /**
    * Retrieves all keys of the data items in the collection.
    * @returns An array of all item keys.
    */
    keys(): string[] {
        return Object.keys(this.#data);
    }

    /**
    * Retrieves all data items in the collection.
    * @returns An array of all data items.
    */
    items(): T[] {
        return Object.values(this.#data);
    }

    /**
    * Iterates over all data items in the collection.
    * @param cb - The callback function to execute for each item.
    */
    loop(cb: LoopCallback<T>): void {
        const data = this.#data, keys = Object.keys(data), len = keys.length;
        let index = 0;
        while(index < len) {
            if(cb(data[keys[index]], index) === LoopControl.break) break;
            index++;
        }
    }

    /**
    * Clones the dictionary.
    * @returns A new dictionary with the same data.
    */
    clone(): Dictionary<T> {
        return new Dictionary<T>(this.#data);
    }
}
