import type { ObjectOf } from "../types/index.js";

type LoopCallback<T, U = void> = (item: T, index: number) => LoopControl | U;
type MapLoopCallback<T, U, V = void> = (item: T, index: number) => LoopControl | U | V;
type LoopArguments<T, U = void> = LoopCallback<T, U> | boolean;

type DataArray<T> = {
    [index: number]: T,
    length: number,
    copyWithin(target: number, start: number, end?: number): DataArray<T>,
    slice(start?: number, end?: number): DataArray<T>
};

export type LoopControl = typeof LoopControl[keyof typeof LoopControl];
export const LoopControl = (() => {
    const lc : { break: symbol } = Object.create(null);
    lc.break = Symbol('__BREAK_LOOP');
    return lc;
})();

/**
* A generic List interface.
* * Provides methods to get, set, delete, and manipulate items in the list.
* @template T - The type of data stored in the linked list.
*/
export interface List<T> extends Iterable<T> {

    /** The number of items in the list */
    readonly size: number;

    /**
    * Checks if the list is empty.
    * @returns True if the list is empty, false otherwise.
    */
    isEmpty(): boolean;

    /**
    * Retrieves an item by its index.
    * @param index - The index of the item to retrieve.
    * @return The item at the specified index.
    * @throws {Error} Throws an error if the list is empty.
    * @throws {Error} Throws an error if the index is out of bounds.
    */
    get(index: number): T;

    /**
    * Adds one or more items to the end of the list.
    * @param item - The item(s) to add to the list.
    * @returns void
    * @remarks This method mutates the list by adding the specified item(s) to the end. It does not return a new list.
    */
    add(...item: T[]): void;

    /**
    * Adds a single item to the end of the list.
    * @param item - The item to add to the list.
    * @return void
    * @remarks This method mutates the list by adding the specified item to the end. It does not return a new list.
    */
    addOne(item: T): void;

    /**
    * Inserts one or more items at the specified index in the list.
    * @param index - The index at which to insert the item(s).
    * @param item - The item(s) to insert into the list.
    * @return void
    * @remarks This method mutates the list by inserting the specified item(s) at the given index. It does not return a new list.
    * @throws {Error} Throws an error if the index is out of bounds.
    * @throws {Error} Throws an error if the list is empty.
    */
    insert(index: number, ...item: T[]): void;

    /**
    * Inserts a single item at the specified index in the list.
    * @param index - The index at which to insert the item.
    * @param item - The item to insert into the list.
    * @return void
    * @remarks This method mutates the list by inserting the specified item at the given index. It does not return a new list.
    * @throws {Error} Throws an error if the index is out of bounds.
    * @throws {Error} Throws an error if the list is empty.
    */
    insertOne(index: number, item: T): void;

    /**
    * Updates the item at the specified index in the list.
    * @param index - The index of the item to update. Must be within bounds (0 to size-1).
    * @param item - The new item to place at the specified index.
    * @return The item that was set at the specified index.
    * @remarks This method mutates the list by replacing the item at the given index with the specified item. It returns the item that was set at the index.
    * @throws {Error} Throws an error if the list is empty.
    * @throws {Error} Throws an error if the index is out of bounds.
    */
    update(index: number, item: T): T;

    /**
    * Removes one or more items from the list starting at the specified index.
    * @param index - The index of the first item to remove.
    * @param count - The number of items to remove.
    * @return void
    * @remarks This method mutates the list by removing the specified number of items starting from the given index. It does not return a new list.
    * @throws {Error} Throws an error if the list is empty.
    * @throws {Error} Throws an error if the index is out of bounds.
    */
    delete(index: number, count: number): void;

    /**
    * Removes one item from the list at the specified index.
    * @param index - The index of the item to remove.
    * @return The item that was removed.
    * @remarks This method mutates the list by removing the item at the given index and returns the removed item.
    * @throws {Error} Throws an error if the list is empty.
    * @throws {Error} Throws an error if the index is out of bounds.
    */
    deleteOne(index: number): T;

    /**
    * Deletes all elements from the list.
    * @returns void
    * @remarks This method mutates the list by removing all items, effectively resetting it to an empty state. It does not return a new list.
    */
    deleteAll(): void;

    /**
    * Retrieves all items in the list.
    * @returns An array of all items in the list.
    */
    items(): T[];

    /**
    * Loops through each item in the list, executing the provided callback function.
    * Can loop in normal or reverse order based on the parameters.
    * @param cb - The callback function to execute for each item.
    * @remarks This method iterates over the items in the list and executes the provided callback function for each item. The iteration can be done in normal order (from first to last) or in reverse order (from last to first) based on the parameters. If the callback returns LoopControl.break, the iteration will be terminated early.
    */
    loop(cb: LoopCallback<T>): void;

    /**
    * Loops through each item in the list, executing the provided callback function.
    * Can loop in normal or reverse order based on the parameters.
    * @param reverse - If true, loops in reverse order. If false or omitted, loops in normal order.
    * @param cb - The callback function to execute for each item.
    * @remarks This method iterates over the items in the list and executes the provided callback function for each item. The iteration can be done in normal order (from first to last) or in reverse order (from last to first) based on the parameters. If the callback returns LoopControl.break, the iteration will be terminated early.
    */
    loop(reverse: boolean, cb: LoopCallback<T>): void;

    /**
    * Maps each item in the list to a new value using the provided callback function.
    * If the callback returns LoopControl.break, the mapping process is terminated early.
    * @param cb - The callback function to apply to each item.
    * @return A new List containing the mapped values.
    * @remarks This method creates a new list by applying the provided callback function to each item in the original list. If the callback returns LoopControl.break, the mapping process will be terminated early, and the resulting list will contain only the mapped values up to that point. If the callback returns undefined for an item, that item will be skipped in the resulting list.
    */
    map<U>(cb: MapLoopCallback<T, U>): List<U>;

    /**
    * Reduces the list to a single value by applying the provided callback function to each item.
    * @param cb - The callback function to apply, which takes an accumulator and the current item.
    * @param initialValue - The initial value for the accumulator.
    * @return The final accumulated value.
    * @remarks This method processes each item in the list using the provided callback function, which takes an accumulator and the current item as arguments. The callback function is applied sequentially to each item, with the result of each call being passed as the accumulator to the next call. The final result after processing all items is returned as the accumulated value.
    */
    reduce<U>(cb: (accumulator: U, item: T, index: number) => U, initialValue: U): U;

    /**
    * Filters the list based on the provided callback function.
    * @param cb - The callback function that determines whether an item should be included in the new list.
    * @return A new List containing only the items that satisfy the condition defined in the callback.
    * @remarks This method creates a new list containing only the items from the original list that satisfy the condition defined in the provided callback function. The callback function should return true for items that should be included in the resulting list and false for items that should be excluded.
    */
    filter(cb: (item: T, index: number) => boolean): List<T>;

    /**
    * Finds the first item in the list that satisfies the provided callback function.
    * @param cb - The callback function that tests each item.
    * @return The first item that satisfies the condition, or undefined if no such item is found.
    * @remarks This method iterates through the list and applies the provided callback function to each item. It returns the first item for which the callback function returns true. If no items satisfy the condition, it returns undefined.
    */
    find(cb: (item: T, index: number) => boolean): T | undefined;

    /**
    * Finds the index of the first item in the list that satisfies the provided callback function.
    * @param cb - The callback function that tests each item.
    * @return The index of the first item that satisfies the condition, or -1 if no such item is found.
    * @remarks This method iterates through the list and applies the provided callback function to each item. It returns the index of the first item for which the callback function returns true. If no items satisfy the condition, it returns -1.
    */
    findIndex(cb: (item: T, index: number) => boolean): number;

    /**
    * Creates a shallow copy of the List.
    * @return A new List instance containing the same items as the original.
    * @remarks This method creates a new list that is a shallow copy of the original list. The new list will contain the same items in the same order, but it will be a separate instance. Changes to the new list will not affect the original list, and vice versa.
    */
    clone(): List<T>;

    /**
    * Creates a shallow copy of the List.
    * @param start - The starting index for the slice.
    * @param end - The ending index for the slice.
    * @return A new List instance containing the sliced items.
    * @remarks This method creates a new list that is a shallow copy of the original list, starting from the specified start index and ending at the specified end index. The new list will contain the same items in the same order, but it will be a separate instance. Changes to the new list will not affect the original list, and vice versa.
    */
    slice(start: number, end?: number): List<T>;

    /**
    * Returns a string representation of the List.
    * @return A string representing the List.
    * @remarks This method returns a string that represents the contents of the List. The exact format of the string is implementation-dependent, but it typically includes the items in the list in a readable format. This can be useful for debugging or logging purposes.
    */
    toString(): string;
}

/**
 * Constructs a new ArrayList instance.
 * @template T - The type of elements in the list.
 * @example
 * ```ts
 * const list = new ArrayList<number>();
 * list.add(1, 2, 3);
 * console.log(list.items()); // [1, 2, 3]
 * ```
 */
export class ArrayList<T> implements List<T> {
    #data: DataArray<T>;
    #capacity: number = 10;
    #size: number;

    /**
     * Creates a new ArrayList instance.
     */
    constructor();
    /**
     * Creates a new ArrayList instance.
     * @param initialCapacity - The initial capacity of the ArrayList.
     */
    constructor(initialCapacity: number);
    /**
     * Creates a new ArrayList instance.
     * @param source - An array of items to initialize the ArrayList with.
     */
    constructor(source: T[]);
    constructor(input?: number | T[]) {
        if (Number.isInteger(input)) {
            this.#capacity = input as number;
            this.#data = this.#createDataArray(this.#capacity);
            this.#size = 0;
        } else if(Array.isArray(input)) {
            const len = input.length;

            // capacity calculation and DataArray initialization
            this.#capacity = Math.max(this.#capacity, len);
            const data = new Array(this.#capacity) as DataArray<T>;
            Object.assign(data, input);

            this.#data = data;
            this.#size = len;
        } else {
            this.#data = this.#createDataArray(this.#capacity);
            this.#size = 0;
        }
    }

    #createDataArray(capacity: number): DataArray<T> {
        return new Array(capacity).fill(undefined) as DataArray<T>;
    }

    #inceaseCapacity(delta: number): void {
        const size = this.#size;

        // capacity calculation
        let capacity = this.#capacity, targetSize = size + delta;
        do {
            capacity *= 2;
        } while (targetSize >= capacity);

        // data migration
        const newData = new Array(capacity) as DataArray<T>, data = this.#data;
        for (let i = 0; i < size; i++) {
            newData[i] = data[i];
        }

        // update reference
        this.#data = newData;
        this.#capacity = capacity;
    }

    #readuceCapacity(): void {
        const size = this.#size;

        // capacity calculation
        let capacity = this.#capacity;
        do {
            capacity = Math.max(10, Math.floor(capacity / 2));
        } while (size <= Math.floor(capacity / 4) && (capacity > 10));

        // data migration
        const newData = new Array(capacity) as DataArray<T>, data = this.#data;
        for (let i = 0; i < size; i++) {
            newData[i] = data[i];
        }

        // update reference
        this.#data = newData;
        this.#capacity = capacity;
    }

    #needToIncrease(size: number, capacity: number): boolean {
        return size >= capacity;
    }

    #needToDecerease(size: number, capacity: number): boolean {
        return size <= Math.floor(capacity / 4) && (capacity > 10);
    }

    get size(): number {
        return this.#size;
    }

    isEmpty(): boolean {
        return this.#size === 0;
    }

    get(index: number): T {
        if(this.#size === 0) throw new Error('List is empty');
        if(index < 0 || index >= this.#size) throw new Error('Index out of bounds');

        return this.#data[index];
    }

    add(...item: T[]): void {
        const ilen = item.length, size = this.#size;
        if (this.#needToIncrease(size + ilen, this.#capacity)) {
            this.#inceaseCapacity(ilen);
        }
        let i = 0;
        while (i < ilen) {
            this.#data[size + i] = item[i];
            i++;
        }
        this.#size = size + ilen;
    }

    addOne(item: T): void {
        const size = this.#size;
        if (this.#needToIncrease(size + 1, this.#capacity)) {
            this.#inceaseCapacity(1);
        }
        this.#data[size] = item;
        this.#size = size + 1;
    }

    insert(index: number, ...item: T[]): void {
        const size = this.#size;
        if(index < 0 || index > size) throw new Error('Index out of bounds');

        const ilen = item.length;
        if (this.#needToIncrease(size + ilen, this.#capacity)) {
            this.#inceaseCapacity(ilen);
        }
        const data = this.#data;
        if (index < size) data.copyWithin(index + ilen, index, size);

        let i = 0;
        while (i < ilen) {
            data[index + i] = item[i];
            i++;
        }
        this.#size = size + ilen;
    }

    insertOne(index: number, item: T): void {
        const size = this.#size;
        if (index < 0 || index > size) throw new Error('Index out of bounds');
        if (this.#needToIncrease(size + 1, this.#capacity)) {
            this.#inceaseCapacity(1);
        }
        const data = this.#data;
        if (index < size) data.copyWithin(index + 1, index, size);
        data[index] = item;
        this.#size = size + 1;
    }

    update(index: number, item: T): T {
        if(this.#size === 0) throw new Error('List is empty');
        if(index < 0 || index >= this.#size) throw new Error('Index out of bounds');

        this.#data[index] = item;
        return item;
    }

    delete(index: number, count: number): void {
        const size = this.#size;
        if(size === 0) throw new Error('List is empty');
        if (index < 0 || index >= size) throw new Error('Index out of bounds');
        if (count < 1) throw new Error('Count must be greater than 0');

        const data = this.#data;
        let deleteTill = index + count;
        if (deleteTill > size) deleteTill = size;
        if (deleteTill < size) {
            data.copyWithin(index, deleteTill, size);
        }
        this.#size = size + index - deleteTill;
        let i = this.#size
        while(i < size) {
            data[i] = undefined;
            i++;
        }
        if (this.#needToDecerease(this.#size, this.#capacity)) {
            this.#readuceCapacity();
        }
    }

    deleteOne(index: number): T {
        if(this.#size === 0) throw new Error('List is empty');
        if(index < 0 || index >= this.#size) throw new Error('Index out of bounds');

        const data = this.#data, size = this.#size, deletedItem = data[index];
        if (index + 1 < size) {
            data.copyWithin(index, index + 1, size);
        }
        data[size - 1] = undefined;
        this.#size = size - 1;

        if (this.#needToDecerease(this.#size, this.#capacity)) {
            this.#readuceCapacity();
        }
        return deletedItem;
    }

    deleteAll(): void {
        this.#capacity = 10;
        this.#size = 0;
        this.#data = this.#createDataArray(this.#capacity);
    }

    items(): Array<T> {
        return this.#data.slice(0, this.#size) as Array<T>;
    }

    #loopList(cb: LoopCallback<T>): void {
        const data = this.#data;
        const len = this.#size
        let index = 0;
        while(index<len) {
            if(cb(data[index], index) === LoopControl.break) break;
            index++;
        }
    }

    #loopListReverse(cb: LoopCallback<T>): void {
        const data = this.#data;
        let index = this.#size - 1;
        while(index>=0) {
            if(cb(data[index], index) === LoopControl.break) break;
            index--;
        }
    }

    loop(cb: LoopCallback<T>): void;
    loop(reverse: true, cb: LoopCallback<T>): void;
    loop(larg: LoopArguments<T>, lcb?: LoopCallback<T>): void {
        const cb = lcb || (larg as LoopCallback<T>);
        if (larg === true) this.#loopListReverse(cb);
        else this.#loopList(cb);
    }

    map<U>(cb: MapLoopCallback<T, U>): List<U> {
        const data = this.#data, size = this.#size;
        const result: ArrayList<U> = new ArrayList<U>(size);

        let index = 0;
        while(index < size) {
            const cbRetun = cb(data[index], index);
            if(cbRetun === LoopControl.break) break;
            else if(cbRetun !== undefined) {
                result.addOne(cbRetun as U);
            }
            index++;
        }
        return result;
    }

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

    filter(cb: (item: T, index: number) => boolean): List<T> {
        const data = this.#data, size = this.#size;
        const result: ArrayList<T> = new ArrayList<T>(size);

        let index = 0;
        while (index < size) {
            if (cb(data[index], index)) {
                result.addOne(data[index]);
            }
            index++;
        }
        return result;
    }

    find(cb: (item: T, index: number) => boolean): T | undefined {
        const data = this.#data, size = this.#size;

        let index = 0;
        while (index < size) {
            if (cb(data[index], index)) {
                return data[index];
            }
            index++;
        }
        return undefined;
    }

    findIndex(cb: (item: T, index: number) => boolean): number {
        const data = this.#data, size = this.#size;

        let index = 0;
        while (index < size) {
            if (cb(data[index], index)) {
                return index;
            }
            index++;
        }
        return -1;
    }

    clone(): List<T> {
        return new ArrayList<T>(this.items());
    }

    slice(start: number, end?: number): List<T> {
        const size = this.#size;
        if(start < 0 || start >= size) {
            throw new Error('Invalid slice parameters');
        }
        end = end === undefined ? size : end;
        if(end <= start || end > size) {
            throw new Error('Invalid slice parameters');
        }
        return new ArrayList<T>(this.#data.slice(start, end) as Array<T>);
    }

    toString(): string {
        let str = '[';
        for (let i = 0, size = this.#size, data = this.#data; i < size; i++) {
            str += data[i];
            if (i < size - 1) {
                str += ', ';
            }
        }
        str += ']';
        return str;
    }

    *[Symbol.iterator](): Iterator<T> {
        const data = this.#data, size = this.#size
        let index = 0;
        while(index < size) {
            yield data[index];
            index++;
        }
    }
}

/**
* Represents a node in a doubly linked list.
* @template T The type of value stored in the node.
* @example
* ```ts
* const node = new Node<number>(42);
* console.log(node.value); // 42
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
* Constructs a new LinkedList instance.
* @template T - The type of elements in the list.
* @example
* ```ts
* const list = new LinkedList<number>();
* list.add(1, 2, 3);
* console.log(list.items()); // [1, 2, 3]
* ```
*/
export class LinkedList<T> implements List<T> {
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

    get size(): number {
        return this.#size;
    }

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
    #getNode(index: number): Node<T> {
        const size = this.#size;
        if(size === 0) throw new Error('List is empty');
        if(index < 0 || index >= size) throw new Error('Index out of bounds');

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

    get(index: number): T {
        const node = this.#getNode(index);
        return node.value;
    }

    #buildTempList(...items: T[]): { head: Node<T>, tail: Node<T>, length: number } {
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

    add(...items: T[]): void {
        const { head: tHead, tail: tTail, length: tLen } = this.#buildTempList(...items);
        if(this.isEmpty()) {
            this.#head = tHead;
            this.#tail = tTail;
            this.#size = tLen;
        } else {
            this.#tail.setNext(tHead);
            tHead.setPrev(this.#tail);
            this.#tail = tTail;
            this.#size += tLen;
        }
    }

    addOne(item: T): void {
        const node = new Node(item);
        if (this.isEmpty()) {
            this.#head = this.#tail = node;
            this.#size = 1;
        } else {
            this.#tail.setNext(node);
            node.setPrev(this.#tail);
            this.#tail = node;
            this.#size++;
        }
    }

    insert(index: number, ...items: T[]): void {
        if(index>=0 && index === this.#size) {
            this.add(...items);
            return;
        }

        const currNode = this.#getNode(index), prevNode = currNode.prev;
        const { head: tHead, tail: tTail, length: tLen } = this.#buildTempList(...items);

        if(prevNode) {
            prevNode.setNext(tHead);
            tHead.setPrev(prevNode);
        } else {
            this.#head = tHead;
        }
        tTail.setNext(currNode);
        currNode.setPrev(tTail);
        this.#size += tLen;
    }

    insertOne(index: number, item: T): void {
        if(index>=0 && index === this.#size) {
            this.addOne(item);
            return;
        }

        const currNode = this.#getNode(index), prevNode = currNode.prev;
        const newNode = new Node(item);

        if(prevNode) {
            prevNode.setNext(newNode);
            newNode.setPrev(prevNode);
        } else {
            this.#head = newNode;
        }
        currNode.setPrev(newNode);
        newNode.setNext(currNode);
        this.#size++;
    }

    update(index: number, item: T): T {
        const node = this.#getNode(index);
        node.setValue(item);
        return item;
    }

    delete(index: number, count: number): void {
        let node = this.#getNode(index), prev = node.prev;
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

    deleteOne(index: number): T {
        const node = this.#getNode(index), prev = node.prev, next = node.next;

        if(prev) prev.setNext(next);
        else this.#head = next;

        if(next) next.setPrev(prev);
        else this.#tail = prev;

        this.#size -= 1;
        return node.value;
    }

    deleteAll(): void {
        this.#head = undefined;
        this.#tail = undefined;
        this.#size = 0;
    }

    items(): T[] {
        const items = [];
        let node = this.#head;

        while(node) {
            items.push(node.value);
            node = node.next;
        }

        return items;
    }

    /**
    * Loops through the list and calls the provided callback function for each item.
    * @param cb - The callback function to call for each item.
    */
    #loopList(cb: LoopCallback<T>): void {
        let node = this.#head, index = 0;
        while(node) {
            if(cb(node.value, index) === LoopControl.break) break;
            node = node.next
            index++;
        }
    }

    /**
    * Loops through the list in reverse order and calls the provided callback function for each item.
    * @param cb - The callback function to call for each item.
    */
    #loopListReverse(cb: LoopCallback<T>): void {
        let node = this.#tail, index = this.#size - 1;
        while(node) {
            if(cb(node.value, index) === LoopControl.break) break;
            node = node.prev;
            index--;
        }
    }

    loop(cb: LoopCallback<T>): void;
    loop(reverse: true, cb: LoopCallback<T>): void;
    loop(larg: LoopArguments<T>, lcb?: LoopCallback<T>): void {
        if(this.#size === 0) return;
        const cb = lcb || (larg as LoopCallback<T>);
        if (larg === true) this.#loopListReverse(cb);
        else this.#loopList(cb);
    }

    map<U>(cb: MapLoopCallback<T, U>): LinkedList<U> {
        const result: LinkedList<U> = new LinkedList<U>();
        if (this.#size === 0) return result;

        let node = this.#head, index = 0;
        while(node) {
            const cbRetun = cb(node.value, index);
            if(cbRetun === LoopControl.break) break;
            else if(cbRetun !== undefined) {
                result.addOne(cbRetun as U);
            }
            node = node.next;
            index++;
        }

        return result;
    }

    reduce<U>(cb: (accumulator: U, item: T, index: number) => U, initialValue: U): U {
        if (this.#size === 0) return initialValue;

        let acc: U = initialValue, node = this.#head, index = 0;
        while(node) {
            acc = cb(acc, node.value, index);
            node = node.next
            index++;
        }
        return acc;
    }

    filter(cb: (item: T, index: number) => boolean): List<T> {
        const result: LinkedList<T> = new LinkedList<T>();
        if (this.#size === 0) return result;

        let node = this.#head, index = 0;
        while(node) {
            if(cb(node.value, index)) {
                result.addOne(node.value);
            }
            node = node.next;
            index++;
        }
        return result;
    }

    find(cb: (item: T, index: number) => boolean): T | undefined {
        if (this.#size === 0) return undefined;

        let node = this.#head, index = 0;
        while(node) {
            if(cb(node.value, index)) {
                return node.value;
            }
            node = node.next;
            index++;
        }
        return undefined;
    }

    findIndex(cb: (item: T, index: number) => boolean): number {
        if (this.#size === 0) return -1;

        let node = this.#head, index = 0;
        while(node) {
            if(cb(node.value, index)) {
                return index;
            }
            node = node.next;
            index++;
        }
        return -1;
    }

    clone(): List<T> {
        const newList = new LinkedList<T>();
        let node = this.#head;

        while(node) {
            newList.addOne(node.value);
            node = node.next;
        }

        return newList;
    }

    slice(start: number, end?: number): List<T> {
        const size = this.#size;
        if(start < 0 || start >= size) {
            throw new Error('Invalid slice parameters');
        }
        end = end === undefined ? size : end;
        if(end <= start || end > size) {
            throw new Error('Invalid slice parameters');
        }
        const newList = new LinkedList<T>();
        let node = this.#head, index = 0;

        while(node && index < start) {
            node = node.next;
            index++;
        }

        while(node && index < end) {
            newList.addOne(node.value);
            node = node.next;
            index++;
        }

        return newList;
    }

    toString(): string {
        let result = '', node = this.#head;

        while(node) {
            result += `${node.value.toString()}, `;
            node = node.next;
        }

        return result.trim().slice(0, -1);
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

/**
* A generic Stack class to manage a collection of data items in a LIFO (Last In, First Out) manner.
* Provides methods to push, pop, peek, and manipulate items in the stack.
* @template T - The type of data stored in the stack.
*/
export class Stack<T> {
    #list: LinkedList<T> = new LinkedList<T>();

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
            const keys = Object.keys(source);
            let index = keys.length-1, key: string;
            while(index>=0) {
                key = keys[index];
                this.#data[key] = source[key];
                this.#size++;
                index--;
            }
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
    * @returns True if the item was deleted, false if it was not found.
    */
    delete(key: string): boolean {
        if(this.#data[key]) {
            delete this.#data[key];
            this.#size--;
            return true;
        }
        return false;
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
