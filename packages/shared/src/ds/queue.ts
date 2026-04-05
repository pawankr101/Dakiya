import { LinkedList, type List } from "./list.js";

/**
* A generic Queue class to manage a collection of data items in a FIFO (First In, First Out) manner.
* Provides methods to enqueue, dequeue, peek, and manipulate items in the queue.
* @template T - The type of data stored in the queue.
*/
export class Queue<T> {
    #list: List<T> = new LinkedList<T>();

    /**
    * Retrieves the number of items in the queue.
    * @returns The number of items in the queue.
    */
    get size() {
        return this.#list.size;
    }

    /**
    * Adds an item to the end of the queue.
    * @param item - The item to add to the queue.
    */
    enqueue(item: T) {
        this.#list.addOne(item);
    }

    /**
    * Removes and returns the first item in the queue.
    * @returns The first item in the queue.
    * @throws Will throw an error if the queue is empty.
    */
    dequeue(): T {
        if(this.#list.isEmpty()) throw new Error('Queue is empty');
        return this.#list.deleteOne(0);
    }

    /**
    * Retrieves the first item in the queue without removing it.
    * @returns The first item in the queue.
    * @throws Will throw an error if the queue is empty.
    */
    peek(): T {
        if(this.#list.isEmpty()) throw new Error('Queue is empty');
        return this.#list.get(0);
    }

    /**
    * Checks if the queue is empty.
    * @returns True if the queue is empty, false otherwise.
    */
    isEmpty(): boolean {
        return this.#list.isEmpty();
    }

    /**
    * Clears all items from the queue.
    */
    clear(): void {
        this.#list.deleteAll();
    }

    /**
    * Retrieves all items in the queue.
    * @returns An array of all items in the queue.
    */
    items(): T[] {
        return this.#list.items();
    }
}
