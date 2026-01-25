import { LoopControl, Utils } from "./index.js";

/**
 * A generic Mapper class to manage a collection of data items identified by unique string keys.
 * Provides methods to get, set, delete, and retrieve all items in the collection.
 * @template T - The type of data stored in the collection.
 */
export class Mapper<T> {
    #data: {[id: string]: T} = Object.create(null);
    #size = 0;

    /**
     * Constructs a new Mapper instance.
     * @param source - An optional object to initialize the mapper with existing key-value pairs.
     */
    constructor(source?: {[key: string]: T}) {
        if(source) {
            Utils.loop(source, (val, key) => {
                this.#data[key] = val;
                this.#size++;
            });
        }
    }

    /**
     * Retrieves the number of items in the Mapper.
     */
    get size(): number {
        return this.#size;
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
        if (!this.#data[key]) this.#size++;
        this.#data[key] = val
        return val;
    }

    /**
     * Deletes a data item by its key.
     * @param key - The unique key of the item to delete.
     * @returns True if the item was deleted, false if it was not found.
     */
    delete(key: string) {
        if(this.#data[key]) {
            delete this.#data[key];
            this.#size--;
            return true;
        }
        return false
    }

    /**
     * Deletes all data items in the collection.
     */
    deleteAll() {
        this.#data = Object.create(null);
        this.#size = 0;
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

    loop(cb: LoopCallback<T>): void {
        const data = this.#data, keys = Object.keys(data), len = keys.length;
        let index = 0;
        while(index < len) {
            if(cb(data[keys[index]], index) === LoopControl.break) break;
            index++;
        }
    }
}

type LoopCallback<T> = (item: T, index: number) => LoopControl;
type LoopArguments<T> = LoopCallback<T> | boolean;

/**
 * A generic List class to manage an ordered collection of data items.
 * Provides methods to get, set, delete, and manipulate items in the list.
 * @template T - The type of data stored in the list.
 */
export class List<T> {
    #data: T[] = [];
    #size = 0;

    /**
     * Constructs a new List instance.
     * @param source - An optional array to initialize the list with existing items.
     */
    constructor(source?: T[]) {
        if(source) {
            this.#data = source.slice();
            this.#size = this.#data.length;
        }
    }

    /**
     * Retrieves the number of items in the list.
     */
    get size(): number {
        return this.#size;
    }

    /**
     * Checks if the list is empty.
     * @returns True if the list is empty, false otherwise.
     */
    isEmpty(): boolean {
        return this.#size === 0;
    }

    /**
     * Retrieves an item by its index.
     * @param index - The index of the item to retrieve.
     * @returns The item at the specified index.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    get(index: number): T {
        if(this.#size === 0) throw new Error("List is empty");
        if(index < 0 || index >= this.#size) throw new Error("Index out of bounds");

        return this.#data[index];
    }

    /**
     * Adds one or more items to the end of the list.
     * @param item - The item(s) to add to the list.
     */
    add(...item: T[]) {
        this.#data.push(...item);
        this.#size = this.#data.length;
    }

    /**
     * Inserts one or more items at the specified index in the list.
     * @param index - The index at which to insert the item(s).
     * @param item - The item(s) to insert into the list.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    insert(index: number, ...item: T[]) {
        if(index < 0 || index > this.#size) throw new Error("Index out of bounds");

        this.#data.splice(index, 0, ...item);
        this.#size = this.#data.length;
    }

    /**
     * Updates the item at the specified index in the list.
     * @param index - The index of the item to update. Must be within bounds (0 to size-1).
     * @param item - The new item to place at the specified index.
     * @returns The item that was set at the specified index.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    update(index: number, item: T): T {
        if(this.#size === 0) throw new Error("List is empty");
        if(index < 0 || index >= this.#size) throw new Error("Index out of bounds");

        this.#data[index] = item;
        return item;
    }

    /**
     * Removes one or more items from the list starting at the specified index.
     * @param index - The index of the first item to remove.
     * @param count - The number of items to remove. Defaults to 1.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    delete(index: number, count: number = 1): void {
        if(this.#size === 0) throw new Error("List is empty");
        if(index < 0 || index >= this.#size) throw new Error("Index out of bounds");

        this.#data.splice(index, count);
        this.#size = this.#data.length;
    }

    /**
     * Removes one item from the list at the specified index.
     * @param index - The index of the item to remove.
     * @returns The item that was removed.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     *
     */
    deleteOne(index: number): T {
        if(this.#size === 0) throw new Error("List is empty");
        if(index < 0 || index >= this.#size) throw new Error("Index out of bounds");

        const item = this.#data[index];
        this.#data.splice(index, 1);
        this.#size--;
        return item
    }

    /**
     * Deletes all elements from the list.
     */
    deleteAll(): void {
        this.#data.length = 0;
        this.#size = 0;
    }

    /**
     * Retrieves all items in the list.
     * @returns An array of all items in the list.
     */
    items(): T[] {
        return this.#data.slice();
    }

    /**
     * Internal method to loop through the array in normal or reverse order.
     * @param cb - The callback function to execute for each item.
     * @param reverse - If true, loops in reverse order; otherwise, loops in normal order.
     */
    #loopArray(cb: LoopCallback<T>, reverse: boolean): void {
        const data = this.#data;
        if(reverse) {
            let index = this.#size - 1;
            while(index>=0) {
                if(cb(data[index], index) === LoopControl.break) break;
                index--;
            }
        } else {
            const len = this.#size
            let index = 0;
            while(index<len) {
                if(cb(data[index], index) === LoopControl.break) break;
                index++;
            }
        }
    }

    /**
     * Loops through each item in the list, executing the provided callback function.
     * Can loop in normal or reverse order based on the parameters.
     * @param reverse - If true, loops in reverse order. If false or omitted, loops in normal order.
     * @param cb - The callback function to execute for each item.
     */
    loop(reverse: boolean, cb: LoopCallback<T>): void;
    loop(cb: LoopCallback<T>): void;
    loop(...args: LoopArguments<T>[]): void {
        if(args.length === 1) {
            this.#loopArray(args[0] as LoopCallback<T> , false);
        } else if(args.length === 2) {
            this.#loopArray(args[1] as LoopCallback<T>, args[0] as boolean);
        }
    }

    /**
     * Maps each item in the list to a new value using the provided callback function.
     * If the callback returns LoopControl.break, the mapping process is terminated early.
     * @param cb - The callback function to apply to each item.
     * @returns A new List containing the mapped values.
     */
    map<U>(cb: (item: T, index: number) => U | LoopControl): List<U> {
        const result: List<U> = new List<U>();
        const data = this.#data, len = this.#size;

        let index = 0;
        while(index < len) {
            const cbRetun = cb(data[index], index);
            if(Utils.isDefined(cbRetun)) {
                if(cbRetun === LoopControl.break) break;
                result.add(cbRetun as U);
            }
            index++;
        }

        return result;
    }

    /**
     * Reduces the list to a single value by applying the provided callback function to each item.
     * @param cb - The callback function to apply, which takes an accumulator and the current item.
     * @param initialValue - The initial value for the accumulator.
     * @returns The final accumulated value.
     */
    reduce<U>(cb: (accumulator: U, item: T, index: number) => U, initialValue: U): U {
        let accumulator: U = initialValue;
        const data = this.#data, len = this.#size;
        let index = 0;
        while(index < len) {
            accumulator = cb(accumulator, data[index], index);
            index++;
        }
        return accumulator;
    }

    /**
     * Filters the list based on the provided callback function.
     * @param cb - The callback function that determines whether an item should be included in the new list.
     * @returns A new List containing only the items that satisfy the condition defined in the callback.
     */
    filter(cb: (item: T, index: number) => boolean): List<T> {
        return this.map((item, index) => {
            if(cb(item, index)) {
                return item;
            }
            return undefined;
        });
    }

    /**
     * Finds the first item in the list that satisfies the provided callback function.
     * @param cb - The callback function that tests each item.
     * @returns The first item that satisfies the condition, or undefined if no such item is found.
     */
    find(cb: (item: T, index: number) => boolean): T | undefined {
        let foundItem: T | undefined = undefined;
        this.loop((item, index) => {
            if(cb(item, index)) {
                foundItem = item;
                return LoopControl.break;
            }
        });
        return foundItem;
    }

    /**
     * Finds the index of the first item in the list that satisfies the provided callback function.
     * @param cb - The callback function that tests each item.
     * @returns The index of the first item that satisfies the condition, or -1 if no such item is found.
     */
    findIndex(cb: (item: T, index: number) => boolean): number {
        let foundIndex: number = -1;
        this.loop((item, index) => {
            if(cb(item, index)) {
                foundIndex = index;
                return LoopControl.break;
            }
        });
        return foundIndex;
    }

    /**
     * Sorts the List in place.
     *
     * @param compareFn Function used to determine the order of the elements. It is expected to return
     * a negative value if the first argument is less than the second argument, zero if they're equal, and a positive
     * value otherwise. If omitted, the elements are sorted in ascending, UTF-16 code unit order.
     * @returns void
     *
     * @remarks
     * The default sort order is according to string Unicode code points. If you need a different sort order, you should provide a compare function.
     * This method mutates the List and does not create a new sorted List.
     *
     * @example
     * ```ts
     * const list = new List([11,2,22,1]);
     * list.sort((a, b) => a - b);
     * console.log(list.items()); // Output: [1,2,11,22]
     * ```
     */
    sort(compareFn?: (a: T, b: T) => number): void {
        this.#data.sort(compareFn);
    }

    /**
     * Returns a string representation of the list.
     * @returns string representation of the list.
     */
    toString(): string {
        return this.#data.toString();
    }

    *[Symbol.iterator](): Iterator<T> {
        const len = this.#size
        let index = 0;
        while(index<len) {
            yield this.#data[index++];
        }
    }
}


/**
 * Represents a node in a doubly linked list.
 * @template T The type of value stored in the node.
 * @example
 * ```ts
 * const node = new Node<number>(42);
 * ```
 */
class Node<T> {
    #value: T;
    #next: Node<T>;
    #prev: Node<T>;

    constructor(value: T, next?: Node<T>, prev?: Node<T>) {
        this.#value = value;
        this.#next = next;
        this.#prev = prev;
    }

    get value(): T {
        return this.#value;
    }

    get next(): Node<T> {
        return this.#next;
    }

    get prev(): Node<T> {
        return this.#prev;
    }

    setValue(value: T): void {
        this.#value = value;
    }

    setNext(node: Node<T>): void {
        this.#next = node;
    }

    setPrev(node: Node<T>): void {
        this.#prev = node;
    }
}

/**
 * A generic LinkedList class to manage an ordered collection of data items using a doubly linked list structure.
 * Provides methods to get, set, delete, and manipulate items in the list.
 * @template T - The type of data stored in the linked list.
 */
export class LinkedList<T> {
    #head: Node<T>;
    #tail: Node<T>;
    #size: number = 0;

    /**
     * Constructs a new LinkedList instance.
     * @param source - An optional array to initialize the list with existing items.
     */
    constructor(source?: T[]) {
        if(source) {
            this.add(...source);
        }
    }

    /**
     * Retrieves the number of items in the list.
     */
    get size(): number {
        return this.#size;
    }

    /**
     * Checks if the list is empty.
     * @returns True if the list is empty, false otherwise.
     */
    isEmpty(): boolean {
        return this.#size === 0;
    }

    /**
     * Retrieves a node at the specified index in the doubly linked list.
     *
     * Uses an optimization strategy that searches from the nearest end:
     * - Searches from head if index is in the first half
     * - Searches from tail if index is in the second half
     *
     * @param index - The zero-based index of the node to retrieve
     * @returns The node at the specified index
     * @throws {Error} If the list is empty
     * @throws {Error} If the index is out of bounds (negative or >= size)
     */
    #getNode(index: number) {
        const size = this.size;
        if(size === 0) throw new Error("List is empty");
        if(index < 0 || index >= size) throw new Error("Index out of bounds");

        if(index > size/2) {
            let node = this.#tail, currentPosition = size -1;
            while(currentPosition > index) {
                node = node.prev;
                currentPosition--;
            }
            return node;
        }

        let node = this.#head, currentPosition = 0;
        while(currentPosition < index) {
            node = node.next;
            currentPosition++;
        }

        return node;
    }

    /**
     * Retrieves an item by its index.
     * @param index - The index of the item to retrieve.
     * @returns The item at the specified index.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    get(index: number): T {
        const node = this.#getNode(index);
        return node.value;
    }

    #buildTempList(...items: T[]) {
        const res: { head: Node<T>, tail: Node<T>, length: number } = {
            head: undefined, tail: undefined, length: 0
        };
        const len = items.length;
        let i = 0, node: Node<T>;

        while(i<len) {
            node = new Node(items[i++]);
            if(res.tail) {
                res.tail.setNext(node);
                node.setPrev(res.tail);
                res.tail = res.tail.next;
            } else res.head = res.tail = node;
            res.length++;
        }
        return res;
    }

    /**
     * Adds one or more items to the end of the list.
     * @param items - The item(s) to add to the list.
     */
    add(...items: T[]) {
        const tempList = this.#buildTempList(...items);
        if(this.isEmpty()) {
            this.#head = tempList.head;
            this.#tail = tempList.tail;
            this.#size = tempList.length;
        } else {
            this.#tail.setNext(tempList.head);
            tempList.head.setPrev(this.#tail);
            this.#tail = tempList.tail;
            this.#size += tempList.length;
        }
    }

    /**
     * Inserts one or more items at the specified index in the list.
     * @param index - The index at which to insert the item(s).
     * @param items - The item(s) to insert into the list.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    insert(index: number, ...items: T[]) {
        if(index < 0 || index > this.size) throw new Error("Index out of bounds");

        if(this.isEmpty() || index === this.size) return this.add(...items);

        const tempList = this.#buildTempList(...items);
        const currentNode = this.#getNode(index);
        const prevNode = currentNode.prev;

        if(prevNode) {
            prevNode.setNext(tempList.head);
            tempList.head.setPrev(prevNode);
        } else {
            this.#head = tempList.head;
        }
        tempList.tail.setNext(currentNode);
        currentNode.setPrev(tempList.tail);
        this.#size += tempList.length;
    }

    /**
     * Updates the item at the specified index in the list.
     * @param index - The index of the item to update. Must be within bounds (0 to size-1).
     * @param item - The new item to place at the specified index.
     * @returns The item that was set at the specified index.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    update(index: number, item: T): T {
        const node = this.#getNode(index);
        node.setValue(item);
        return item;
    }

    #deleteNodes(node: Node<T>, count: number = 1): void {
        const prev = node.prev; // undefined
        let deletedCount = 0;

        while(deletedCount < count && node) {
            node = node.next;
            deletedCount++;
        }

        if(prev) prev.setNext(node);
        else this.#head = node;

        if(node) node.setPrev(prev);
        else this.#tail = prev;

        this.#size -= deletedCount;
    }

    /**
     * Removes one or more items from the list starting at the specified index.
     * @param index - The index of the first item to remove.
     * @param count - The number of items to remove. Defaults to 1.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     */
    delete(index: number, count: number = 1): void {
        const node = this.#getNode(index);
        this.#deleteNodes(node, count);
    }

    /**
     * Removes one item from the list at the specified index.
     * @param index - The index of the item to remove.
     * @returns The item that was removed.
     * @throws {Error} Throws an error if the list is empty.
     * @throws {Error} Throws an error if the index is out of bounds.
     *
     */
    deleteOne(index: number): T {
        if(this.#size === 0) throw new Error("List is empty");
        if(index < 0 || index >= this.#size) throw new Error("Index out of bounds");

        const node = this.#getNode(index);
        this.#deleteNodes(node, 1);
        return node.value
    }

    /**
     * Deletes all elements from the list.
     */
    deleteAll(): void {
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
    }

    /**
     * Retrieves all items in the list.
     * @returns An array of all items in the list.
     */
    items(): T[] {
        const items = [];

        this.loop((item) => {
            items.push(item);
            return undefined
        })

        return items;
    }

    /**
     * Internal method to loop through the array in normal or reverse order.
     * @param cb - The callback function to execute for each item.
     * @param reverse - If true, loops in reverse order; otherwise, loops in normal order.
     */
    #loopArray(cb: LoopCallback<T>, reverse: boolean): void {
        if(this.size > 0) {
            let node: Node<T>, index: number;
            if(reverse) {
                node = this.#tail; index = this.size - 1;
                while(node) {
                    if(cb(node.value, index) === LoopControl.break) break;
                    node = node.prev;
                    index--;
                }
            } else {
                node = this.#head; index = 0;
                while(node) {
                    if(cb(node.value, index) === LoopControl.break) break;
                    node = node.next
                    index++;
                }
            }
        }
    }

    /**
     * Loops through each item in the list, executing the provided callback function.
     * Can loop in normal or reverse order based on the parameters.
     * @param reverse - If true, loops in reverse order. If false or omitted, loops in normal order.
     * @param cb - The callback function to execute for each item.
     */
    loop(reverse: boolean, cb: LoopCallback<T>): void;
    loop(cb: LoopCallback<T>): void;
    loop(...args: LoopArguments<T>[]): void {
        if(args.length === 1) {
            this.#loopArray(args[0] as LoopCallback<T> , false);
        } else if(args.length === 2) {
            this.#loopArray(args[1] as LoopCallback<T>, args[0] as boolean);
        }
    }

    /**
     * Maps each item in the list to a new value using the provided callback function.
     * If the callback returns LoopControl.break, the mapping process is terminated early.
     * @param cb - The callback function to apply to each item.
     * @returns A new LinkedList containing the mapped values.
     */
    map<U>(cb: (item: T, index: number) => U | LoopControl): LinkedList<U> {
        const result: LinkedList<U> = new LinkedList<U>();

        if(this.size > 0) {
            let index = 0, node = this.#head;
            while(node) {
                const cbRetun = cb(node.value, index);
                if(Utils.isDefined(cbRetun)) {
                    if(cbRetun === LoopControl.break) break;
                    result.add(cbRetun as U);
                }
                node = node.next
                index++;
            }
        }

        return result;
    }

    /**
     * Reduces the list to a single value by applying the provided callback function to each item.
     * @param cb - The callback function to apply, which takes an accumulator and the current item.
     * @param initialValue - The initial value for the accumulator.
     * @returns The final accumulated value.
     */
    reduce<U>(cb: (accumulator: U, item: T, index: number) => U, initialValue: U): U {
        let accumulator: U = initialValue;

        if(this.size > 0) {
            let index = 0, node = this.#head;
            while(node) {
                accumulator = cb(accumulator, node.value, index);
                node = node.next
                index++;
            }
        }

        return accumulator;
    }

    /**
     * Filters the list based on the provided callback function.
     * @param cb - The callback function that determines whether an item should be included in the new list.
     * @returns A new LinkedList containing only the items that satisfy the condition defined in the callback.
     */
    filter(cb: (item: T, index: number) => boolean): LinkedList<T> {
        return this.map((item, index) => {
            if(cb(item, index)) {
                return item;
            }
            return undefined;
        });
    }

    /**
     * Finds the first item in the list that satisfies the provided callback function.
     * @param cb - The callback function that tests each item.
     * @returns The first item that satisfies the condition, or undefined if no such item is found.
     */
    find(cb: (item: T, index: number) => boolean): T | undefined {
        let foundItem: T | undefined = undefined;
        this.loop((item, index) => {
            if(cb(item, index)) {
                foundItem = item;
                return LoopControl.break;
            }
        });
        return foundItem;
    }

    /**
     * Finds the index of the first item in the list that satisfies the provided callback function.
     * @param cb - The callback function that tests each item.
     * @returns The index of the first item that satisfies the condition, or -1 if no such item is found.
     */
    findIndex(cb: (item: T, index: number) => boolean): number {
        let foundIndex: number = -1;
        this.loop((item, index) => {
            if(cb(item, index)) {
                foundIndex = index;
                return LoopControl.break;
            }
        });
        return foundIndex;
    }

    /**
     * Returns a string representation of the list by converting its items to a string.
     * @returns string representation of the list.
     */
    toString(): string {
        return this.items().toString();
    }

    *[Symbol.iterator](): Iterator<T> {
        let node: Node<T> = this.#head;
        while(node) {
            yield node.value
            node = node.next
        }
    }
}

/**
 * A generic Queue class to manage a collection of data items in a FIFO (First In, First Out) manner.
 * Provides methods to enqueue, dequeue, peek, and manipulate items in the queue.
 * @template T - The type of data stored in the queue.
 */
export class Queue<T> {
    #list: LinkedList<T> = new LinkedList<T>();

    get size() {
        return this.#list.size;
    }

    /**
     * Adds an item to the end of the queue.
     * @param item - The item to add to the queue.
     */
    enqueue(item: T) {
        this.#list.add(item);
    }

    /**
     * Removes and returns the first item in the queue.
     * @returns The first item in the queue.
     * @throws Will throw an error if the queue is empty.
     */
    dequeue(): T {
        if(this.#list.isEmpty()) throw new Error("Queue is empty");

        return this.#list.deleteOne(0);
    }

    /**
     * Retrieves the first item in the queue without removing it.
     * @returns The first item in the queue.
     * @throws Will throw an error if the queue is empty.
     */
    peek(): T {
        if(this.#list.isEmpty()) throw new Error("Queue is empty");

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

/**
 * A generic Stack class to manage a collection of data items in a LIFO (Last In, First Out) manner.
 * Provides methods to push, pop, peek, and manipulate items in the stack.
 * @template T - The type of data stored in the stack.
 */
export class Stack<T> {
    #list: LinkedList<T> = new LinkedList<T>();
    get size() {
        return this.#list.size;
    }

    /**
     * Adds an item to the top of the stack.
     * @param item - The item to add to the stack.
     */
    push(item: T) {
        this.#list.add(item);
    }

    /**
     * Removes and returns the top item from the stack.
     * @returns The top item from the stack.
     * @throws Will throw an error if the stack is empty.
     */
    pop(): T {
        if(this.#list.isEmpty()) throw new Error("Stack is empty");

        return this.#list.deleteOne(this.size - 1);
    }

    /**
     * Retrieves the top item from the stack without removing it.
     * @returns The top item from the stack.
     * @throws Will throw an error if the stack is empty.
     */
    peek(): T {
        if(this.#list.isEmpty()) throw new Error("Stack is empty");

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
