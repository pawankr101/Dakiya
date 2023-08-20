import { Utility } from "../../../src/app/services/utility.js";

test('Utility.clone', () => {
    const obj = {
        a: "a",
        b: function() {
            console.log('b');
        },
        [Symbol('sym')]: 'sym' 
    }
    Object.defineProperty(obj, 'c', {value: 'c'})
    Object.defineProperty(obj, 'd', {value: 'd', writable: true})
    expect(Utility.clone(obj)).toEqual(obj);
})