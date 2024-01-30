function parse(str: string): any {
    return JSON.parse(str);
}

function stringify(data: any): string {
    return JSON.stringify(data);
}

const digits = [0,1,2,3,4,5,6,7,8,9];

/**
 * 
 * @param {string} num 
 * @returns {string}
 */
function inputPreProcessing(num) {
    if(!num) return '0';
    return num.trim();
  }
  
  /**
   * 
   * @param {string} digit1 
   * @param {string} digit2 
   * @param {number} carry 
   * @returns {{sum: sum, carry: number}}
   */
  function addDigit(digit1, digit2, carry) {
    const sum = '' + (digits[digit1] + digits[digit2] + carry);
    if(sum.length === 2) return { sum: sum[1], carry: digits[sum[0]] };
    return { sum: sum, carry: 0 };
  }
  
  /**
   * long number Adder
   * @param {string} num1 
   * @param {string} num2 
   * @returns {string}
   */
  function add(num1='', num2='') {
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

export default { parse, stringify, add }

