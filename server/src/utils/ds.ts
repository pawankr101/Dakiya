import { Utils } from "./index.js";

/**
 * A generic Mapper class to manage a collection of data items identified by unique string keys.
 * Provides methods to get, set, delete, and retrieve all items in the collection.
 * @template T - The type of data stored in the collection.
 */
export class Mapper<T> {
    #data: {[id: string]: T} = Object.create(null);
    count = 0;

    /**
     * Constructs a new Mapper instance.
     * @param source - An optional object to initialize the mapper with existing key-value pairs.
     */
    constructor(source?: {[key: string]: T}) {
        if(source) {
            Utils.forLoop(source, (val, key) => {
                this.#data[key] = val;
                this.count++;
            });
        }
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
    set(key: string, val: T) {
        if(!this.#data[key]) this.count++;
        return (this.#data[key] = val);
    }

    /**
     * Deletes a data item by its key.
     * @param key - The unique key of the item to delete.
     * @returns True if the item was deleted, false if it was not found.
     */
    delete(key: string) {
        if(this.#data[key]) {
            delete this.#data[key];
            this.count--;
            return true;
        }
        return false
    }

    /**
     * Deletes all data items in the collection.
     */
    deleteAll() {
        this.#data = Object.create(null);
        this.count = 0;
    }

    /**
     * Retrieves all keys of the data items in the collection.
     * @returns An array of all item keys.
     */
    keys() {
        return Object.keys(this.#data);
    }
    /**
     * Retrieves all data items in the collection.
     * @returns An array of all data items.
     */
    items() {
        return Object.values(this.#data);
    }
}
