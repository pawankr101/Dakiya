
/**
 * Parses a JSON string and returns the corresponding JavaScript value. This function is a wrapper around the built-in JSON.parse method and can be used to deserialize data received from a worker thread or stored in a database.
 * @param str - The JSON string to parse.
 * @returns The JavaScript value represented by the input JSON string.
 */
function parse<T = unknown>(str: string): T {
    return JSON.parse(str);
}

/**
 * Converts a JavaScript value to a JSON string. This function is a wrapper around the built-in JSON.stringify method and can be used to serialize data before sending it to a worker thread or storing it in a database.
 * @param data - The JavaScript value to convert to a JSON string.
 * @returns A JSON string representation of the input data.
 */
function stringify<T = unknown>(data: T): string {
    return JSON.stringify(data);
}

/**
 * Adds two non-negative integers represented as strings and returns their sum as a string.
 * The function handles large numbers that may exceed JavaScript's safe integer limit by performing digit-by-digit addition.
 * @param num1 - The first non-negative integer as a string.
 * @param num2 - The second non-negative integer as a string.
 * @returns The sum of the two numbers as a string.
 */
const add = (() => {
    const digits: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    inputPreProcessing = (num: string): string => {
        if(!num) return '0';
        return num.trim();
    },
    addDigit = (digit1: string, digit2: string, carry: number): { sum: string, carry: number } => {
        const sum = `${(digits[digit1] + digits[digit2] + carry)}`;
        if(sum.length === 2) return { sum: sum[1], carry: digits[sum[0]] };
        return { sum: sum, carry: 0 };
    }
    return (num1: string, num2: string): string => {
        num1 = inputPreProcessing(num1);  num2 = inputPreProcessing(num2);
        let result='', num1DigitIndex = num1.length-1, num2DigitIndex = num2.length-1, sumCarry = 0;

        while(num1DigitIndex>=0 && num2DigitIndex>=0) {
            const {sum, carry} = addDigit(num1[num1DigitIndex--], num2[num2DigitIndex--], sumCarry);
            sumCarry = carry;
            result = sum + result;
        }
        while(num1DigitIndex>=0) {
            const {sum, carry} = addDigit(num1[num1DigitIndex--], '0', sumCarry);
            sumCarry = carry;
            result = sum + result;
        }
        while(num2DigitIndex>=0) {
            const {sum, carry} = addDigit('0', num2[num2DigitIndex--], sumCarry);
            sumCarry = carry;
            result = sum + result;
        }
        return sumCarry ? sumCarry + result : result;
    }
})();

export default { parse, stringify, add }
