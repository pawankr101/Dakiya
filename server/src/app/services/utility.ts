import { REGEXP } from '../config';

export enum ShortMonth {
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
}
export enum FullMonths {
    'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'
}
export enum ShortWeekDays {
    'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
}
export enum FullWeekDays {
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
}
export type PossibleDTypes='undefined'|'string'|'number'|'boolean'|'array'|'object'|'function';
export type DynamicType<T=PossibleDTypes, AO=any>= T extends 'undefined' ? undefined
    : T extends 'string' ? string : T extends 'number' ? number : T extends 'boolean' ? boolean
    : T extends 'array' ? Array<AO> : T extends 'object' ? Object : T extends 'function' ? Function : any;
export type DateFormats = 'dd-mm-yyyy'|'yyyy-mm-dd'|'dd/mm/yyyy'|'yyyy/mm/dd'|'dd mmm yyyy'|'mmm dd yyyy'|'day mmm dd yyyy'|'mmmm dd|yyyy';
const locals = {
    currentYear: new Date().getFullYear(),
    availableDateFormats: ['dd-mm-yyyy', 'yyyy-mm-dd', 'dd/mm/yyyy', 'yyyy/mm/dd', 'dd mmm yyyy', 'mmm dd yyyy', 'day mmm dd yyyy', 'mmmm dd, yyyy']
};

export class Utility {
    /**
     * #### Check If model is Defined
     * @param model any
     */
    static isDefined(model: any): boolean {
        return typeof(model) !== 'undefined';
    }

    /**
     * #### Check If model is Undefined
     * @param model any
     */
    static isUndefined(model: any): model is undefined {
        return typeof(model) === 'undefined';
    }

    /**
     * #### Check If model is Defined and Not null
     * @param model any
     */
    static isDefinedAndNotNull(model: any): boolean {
        return this.isDefined(model) && model!==null;
    }

    /**
     * #### Check If model is String
     * @param model any
     */
    static isString(model: any): model is string {
        return typeof(model) === 'string';
    }

    /**
     * #### Check If model is Boolean
     * @param model any
     */
    static isBoolean(model: any): model is boolean {
        return typeof(model) === 'boolean';
    }

    /**
     * #### Check If model is Number
     * @param model any
     */
    static isNumber(model: any): model is number {
        return typeof(model) === 'number';
    }

    /**
     * #### Check If model is Array
     * @param model any
     */
    static isArray(model: any): model is Array<any> {
        return (model instanceof Array);
    }

    /**
     * #### Check If model is Date
     * @param model any
     */
    static isDate(model: any): model is Date {
      return ((this.isString(model) ? this.convertToDate(model) : model) instanceof Date);
    }

    /**
     * #### Check If model is Array of provided type
     * @param type 'undefined' | 'string' | 'number' | 'boolean' | 'array' | 'object' | 'function'
     * @param model any
     */
    static isArrayOf<AO=any,T extends string=PossibleDTypes>(type: T, model: any): model is Array<DynamicType<T,AO>> {
        if(this.isArray(model)) {
            for(var i=0,l=model.length; i<l; i++) {if(typeof(model[i]) !== type) return false;}
            return true;
        }
        return false;
    }

    /**
     * #### Extract value on key inside given model object
     * * Will return default value if no value on key or key not available.
     * * if default value is also not available then returns null.
     * @example
     *  const model = {
     *    key1: 'value1',
     *    key2: {
     *       inner_key1 : 'innerValue1',
     *       inner_key2 : 'innerValue2'
     *     }
     *  };
     *  getValue(model, 'key1'); // 'value1'
     *  getValue(model, 'key2.inner_key1'); // 'innerValue1'
     */
    static getValue<T=any>(model: any, key: string|number, default_value?: T): typeof default_value {
        default_value = this.isDefined(default_value) ? default_value : null;
        if(this.isDefinedAndNotNull(model)) {
            if(this.isString(key) && key.includes('.')) {
                let keys = key.split('.'), val = model[keys[0]],l=keys.length,i=1;
                while(i<l) {
                    if(!this.isDefinedAndNotNull(val)) return default_value;
                    val = val[keys[i++]];
                }
                return this.isDefinedAndNotNull(val) ? val : default_value;
            }
            return this.isDefinedAndNotNull(model[key]) ? model[key] : default_value;
        }
        return default_value;
    }

    /**
     * #### Get List of years
     * @param count Provide No. of years in list.
     * * By default it will return last 5 years list from current year.
     */
    static getYearList(count = 5): number[] {
        const years: number[] = [];
        for(var i = 0; i < count; i++) {
            years.push(locals.currentYear - i);
        }
        return years;
    }

    /**
     * #### Get List of Month
     * @param is_short boolean
     */
    static getMonthsList(is_short?: boolean): string[] {
        const monthArr: string[] = [];
        for(var i = 0; i < 12; i++) {
            is_short ? monthArr.push(ShortMonth[i]) : monthArr.push(FullMonths[i]);
        }
        return monthArr;
    }

    /**
     * #### Get List of Week days
     * @param is_short boolean
     */
    static getWeekDaysList(is_short?: boolean): string[] {
        const week: string[] = [];
        for(var i = 0; i < 7; i++) {
            is_short ? week.push(ShortWeekDays[i]) : week.push(FullWeekDays[i]);
        }
        return week;
    }

    /**
     * #### Converts date in to date object.
     * @param date it should ether date type or timestamp or date string.
     * * all format is accepted except 'mm-dd-yyyy' and 'mm/dd/yyyy'.
     */
    static convertToDate(date: string | number | Date): Date {
        if(!date) return null;
        if(this.isString(date)) {
            if (REGEXP.time.test(date)) {
              const time = new Date('2010-01-01 ' + date);
              return isNaN(time.getDate()) ? null : time;
            }
            date = date.replace(/(^\d{2})(\/|-)(0\d|1[0-2])(\/|-)(\d{4})/, "$5$4$3$2$1");
        }
        date = new Date(date);
        return isNaN(date.getDate()) ? null : date;
    }

    /**
     * #### Converts date in to Time Stamp.
     * @param date it should ether date type or timestamp or date string.
     * * all format is accepted except 'mm-dd-yyyy' and 'mm/dd/yyyy'.
     */
    static convertToTimeStamp(date: string | number | Date): number {
        date = this.convertToDate(date);
        return date ? date.getTime() : 0;
    }

    /**
     * #### Converts date in to specified date string formats.
     * @param date it should ether date type or timestamp or date string
     * @param format
     *  * it should be one of ('dd-mm-yyyy', 'yyyy-mm-dd', 'dd/mm/yyyy', 'yyyy/mm/dd',
     *    'dd mmm yyyy', 'mmm dd yyyy', 'day mmm dd yyyy', 'mmmm dd, yyyy')
     *  * format is optional and default format will be 'dd-mm-yyyy' in case of no format or wrong format.
     *  @example Example For format use
     *  * 'dd-mm-yyyy'      => '25-12-2020'
     *  * 'yyyy-mm-dd'      => '2020-12-25'
     *  * 'dd/mm/yyyy'      => '25/12/2020'
     *  * 'yyyy/mm/dd'      => '2020/12/25'
     *  * 'dd mmm yyyy'     => '25 Dec 2020'
     *  * 'mmm dd yyyy'     => 'Dec 25 2020'
     *  * 'day mmm dd yyyy' => 'Fri Dec 25 2020'
     *  * 'mmmm dd, yyyy'   => 'December 25, 2020'
     */
    static convertToDateString(date: Date | number | string, format?: DateFormats): string {
        date = this.convertToDate(date);
        if(!date) return '';
        let dd = date.getDate(), mm = date.getMonth(),
            dateObj = {
            day: ShortWeekDays[date.getDay()],
            dd: dd<10 ? `0${dd}` : `${dd}`,
            mm: mm<9 ? `0${mm+1}` : `${mm+1}`,
            yyyy: `${date.getFullYear()}`,
            mmm: ShortMonth[mm],
            mmmm: FullMonths[mm]
        };
        format = this.isString(format) ? format.toLowerCase() as DateFormats : 'dd-mm-yyyy';
        if(!locals.availableDateFormats.includes(format)) format = 'dd-mm-yyyy';
        return format.replace(/(day|dd|yyyy|mmmm|mmm|mm)/g, (match: keyof typeof dateObj)=>dateObj[match]);
    }

    /**
     * #### Check if two dates are same.
     * @param firstDate it should ether date type or timestamp or date string.
     * @param secondDate it should ether date type or timestamp or date string.
     */
    static isSameDate(firstDate: Date | number | string, secondDate: Date | number | string): boolean {
        if(!(firstDate instanceof Date)) firstDate = this.convertToDate(firstDate);
        if(!(secondDate instanceof Date)) secondDate = this.convertToDate(secondDate);
        return firstDate && secondDate && firstDate.getFullYear()===secondDate.getFullYear() && firstDate.getMonth()===secondDate.getMonth() && firstDate.getDate()===secondDate.getDate();
    }

    /**
     * #### Check given date is today.
     * @param date it should ether date type or timestamp or date string.
     */
    static isToday(date: Date | number | string): boolean {
        return this.isSameDate(date, new Date());
    }

    /**
     * #### Converts date object in to time string.
     * @param time it should ether date type or timestamp or time string
     * @param options object(optional)
     * @param seconds_required set true if seconds required in output time string.
     *    Default value for seconds_required is false.
     * @param format_12Hour set true if output time string need to be in 12 Hour Format.
     *    Default value for format_12Hour is false.
     */
    static convertToTimeString(time: Date | number | string, options ? : {
        seconds_required ? : boolean,
        format_12Hour ? : boolean
    }): string {
        time = (this.isString(time) && REGEXP.time.test(time)) ? new Date(`2010-01-01 ${time}`) :  new Date(time);
        let hh = time.getHours(), tt: string;
        if(!isNaN(hh)) {
            const mm = time.getMinutes();
            if(this.getValue(options, 'format_12Hour')) {
                if(hh > 11) {
                    tt = 'PM';
                    hh = (hh === 12) ? hh : hh - 12;
                } else {
                    tt = 'AM';
                    hh = (hh === 0) ? 12 : hh;
                }
            }
            let timeStr = `${hh>9 ? hh : `0${hh}`}:${mm>9 ? mm : `0${mm}`}`;
            if (this.getValue(options, 'seconds_required')) {
                const ss = time.getSeconds();
                timeStr += `:${(ss > 9) ? ss : ('0' + ss)}`;
            }
            return tt ? `${timeStr} ${tt}` : timeStr;
        }
        return '';
    }

    /**
     * #### Loop through an Array or object.
     * @param model Array or object
     * @param callback function that define specific task with each element while iteration.
     * user can return __CONTINUE_LOOP or __BREAK_LOOP keyword string from callback function to
     * skip the current iteration or break the whole loop at any point of time while iteration.
     */
    static forLoop<T>(model: { [x: string]: T } | T[], callback: (value: T, key?: any) => void | '__CONTINUE_LOOP' | '__BREAK_LOOP') {
        if(this.isArray(model)) {
            let index = 0, len = model.length;
            while(index<len) {
                if(callback(model[index], index) === '__BREAK_LOOP') break;
                index++;
            }
        } else if(model instanceof Object) {
            const keys = Object.keys(model);
            let index = 0, len = keys.length, key: string;
            while(index<len) {
                key = keys[index];
                if(callback(model[key], key) === '__BREAK_LOOP') break;
                index++;
            }
        }
    }

    /**
     * #### Loop through an Array or object in reverse order.
     * @param model Array or object
     * @param callback function that define specific task with each element while iteration.
     * user can return __CONTINUE_LOOP or __BREAK_LOOP keyword string from callback function to
     * skip the current iteration or break the whole loop at any point of time while iteration.
     */
    static forLoopReverse<T>(model: { [x: string]: T } | T[], callback: (value: T, key?: any) => void | '__CONTINUE_LOOP' | '__BREAK_LOOP') {
        if(this.isArray(model)) {
            let index = model.length-1;
            while(index>=0) {
                if(callback(model[index], index) === '__BREAK_LOOP') break;
                index--;
            }
        } else if(model instanceof Object) {
            const keys = Object.keys(model);
            let index = keys.length-1, key: string;
            while(index>=0) {
                key = keys[index];
                if(callback(model[key], key) === '__BREAK_LOOP') break;
                index--;
            }
        }
    }

    /**
     * #### Loop through an Array
     * @param array Array
     * @param callback function that define specific task with each element while iteration and return the element that has to be in resulting Array.
     * @callback return undefined from the callback function if that particular element has to be removed for resulting Array.
     */
    static mapLoop<T, C>(array: Array<T>, callback: (value: T, index?: number) => C): Array<C> {
        const result: Array<C> = [];
        if(this.isArray(array)) {
            for(var index = 0, len = array.length; index < len; index++) {
                const cb_ret = callback(array[index], index);
                if(this.isDefined(cb_ret)) result.push(cb_ret);
            }
        }
        return result;
    }

    /**
     * #### Remove all null or undefined elements from Array
     * @param array Array
     */
    static removeEmptyElements<T>(array: T[]): T[] {
        return this.mapLoop(array, el => el===null ? void 0 : el);
    }

    /**
     * #### Capitalize the Given String.
     * @param string String
     */
    static capitalize(string='') {
        return string && string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    static getNumberFromString(string='') {
        return parseFloat(string && (string.match(/-?(\d*\.\d+|\d+)/)||{})[0]);
    }

    static getMonthAndYearFromString(string='') {
        const month = string.match(REGEXP.month), year = string.match(REGEXP.year);
        return (month && year) ? `${month[0]} ${year[0]}` : '';
    }

    /**
     * 
     * @param value 
     * @param comparator 
     */
    static compareNumber(value: number, comparator: {toValue: number}|{toValue: number, error: number}|{toValue: number, errorPercentage: number}|{lowerRange: number, upperRange: number}|{lowerRange: number, distance: number}|{upperRange: number, distance: number}) {
        if(!comparator) return false;
        let comp:any = {...comparator};
        if(comp.toValue) {
            comp.error = comp.error || (comp.toValue*(comp.errorPercentage||0))/100;
            return comp.error ? value>=(comp.toValue-comp.error) && value<=(comp.toValue+comp.error) : value===comp.toValue;
        }
        if(comp.distance) {
            comp.lowerRange ? (comp.upperRange = comp.lowerRange+comp.distance) : (comp.lowerRange = comp.upperRange-comp.distance);
        }
        return value>=comp.lowerRange && value<=comp.upperRange;
    }

    static bytesToReadable(bytes=0) {
        var i = Math.floor(Math.log(bytes) / Math.log(1024)),
        sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}