import { LinkedList, type List } from "./list.js";

/**
* A generic Stack class to manage a collection of data items in a LIFO (Last In, First Out) manner.
* Provides methods to push, pop, peek, and manipulate items in the stack.
* @template T - The type of data stored in the stack.
*/
export class Stack<T> {
    readonly #list: List<T> = new LinkedList<T>();

    /**
    * Retrieves the number of items in the stack.
    * @returns The number of items in the stack.
    */
    get size() {
        return this.#list.size;
    }

    /**
    * Adds an item to the top of the stack.
    * @param item - The item to add to the stack.
    */
    push(item: T) {
        this.#list.addOne(item);
    }

    /**
    * Removes and returns the top item from the stack.
    * @returns The top item from the stack.
    * @throws Will throw an error if the stack is empty.
    */
    pop(): T {
        if(this.#list.isEmpty()) throw new Error('Stack is empty');
        return this.#list.deleteOne(this.size - 1);
    }

    /**
    * Retrieves the top item from the stack without removing it.
    * @returns The top item from the stack.
    * @throws Will throw an error if the stack is empty.
    */
    peek(): T {
        if(this.#list.isEmpty()) throw new Error('Stack is empty');
        return this.#list.get(this.size - 1);
    }

    /**
    * Checks if the stack is empty.
    * @returns True if the stack is empty, false otherwise.
    */
    isEmpty(): boolean {
        return this.#list.isEmpty();
    }

    /**
    * Clears all items from the stack.
    */
    clear(): void {
        this.#list.deleteAll();
    }

    /**
    * Retrieves all items in the stack.
    * @returns An array of all items in the stack.
    */
    items(): T[] {
        return this.#list.items();
    }
}
