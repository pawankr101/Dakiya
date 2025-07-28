import { Utils } from "./utils.js";

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

enum DateFormats {
    'dd-mm-yyyy' = 'dd-mm-yyyy',
    'yyyy-mm-dd' = 'yyyy-mm-dd',
    'dd/mm/yyyy' = 'dd/mm/yyyy',
    'yyyy/mm/dd' = 'yyyy/mm/dd',
    'dd mmm yyyy' = 'dd mmm yyyy',
    'mmm dd yyyy' = 'mmm dd yyyy',
    'day mmm dd yyyy' = 'day mmm dd yyyy',
    'mmmm dd, yyyy' = 'mmmm dd, yyyy'
}

export class Temporals {
    static #timeRegex: RegExp = /(^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$)|(^(0?\d|1[0-2]):([0-5]\d)(:[0-5]\d)?( [AaPp][Mm])$)/;
    static #monthRegex: RegExp = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(Nov|Dec)(?:ember)?)/i;
    static #yearRegex: RegExp = /(19|2\d)\d{2}/;
    static #ddmmyyyyRegex: RegExp = /(^\d{2})(\/|-)(0\d|1[0-2])(\/|-)(\d{4})/;

    static isDate(model: any): model is Date {
        return (model instanceof Date) // || (this.convertToDate(model) instanceof Date);
    }

    static getYearList(count = 5): number[] {
        const currentYear = new Date().getFullYear();
        const years: number[] = [];
        for (var i = 0; i < count; i++) {
            years.push(currentYear - i);
        }
        return years;
    }

    static getMonthList(isShort?: boolean): string[] {
        const months = isShort ? Object.values(ShortMonth) : Object.values(FullMonths);
        return Utils.mapLoop(months, (month: string | ShortMonth | FullMonths) => month.toString());
    }

    static getWeekDayList(isShort?: boolean): string[] {
        const weekDays = isShort ? Object.values(ShortWeekDays) : Object.values(FullWeekDays);
        return Utils.mapLoop(weekDays, (day: string | ShortWeekDays | FullWeekDays) => day.toString());
    }

    static convertToDate(date: string | number | Date): Date {
        if(!date) return null;
        if(Utils.isString(date)) {
            if (this.#timeRegex.test(date)) {
                const time = new Date('2010-01-01 ' + date);
                return isNaN(time.getDate()) ? null : time;
            }
            date = date.replace(this.#ddmmyyyyRegex, "$5$4$3$2$1");
        }
        date = new Date(date);
        return isNaN(date.getDate()) ? null : date;
    }

    static convertToDateString(date: Date | number | string, format: DateFormats = DateFormats["dd-mm-yyyy"]): string {
        date = this.convertToDate(date);
        if(!date) return '';
        const dd = date.getDate(), mm = date.getMonth();
        const dateObj = {
            day: ShortWeekDays[date.getDay()],
            dd: dd<10 ? `0${dd}` : `${dd}`,
            mm: mm<9 ? `0${mm+1}` : `${mm+1}`,
            yyyy: `${date.getFullYear()}`,
            mmm: ShortMonth[mm],
            mmmm: FullMonths[mm]
        };
        return format.replace(/(day|dd|yyyy|mmmm|mmm|mm)/g, (match: keyof typeof dateObj) => dateObj[match]);
    }

    static convertToTimeStamp(date: string | number | Date): number {
        date = this.convertToDate(date);
        return date ? date.getTime() : 0;
    }

    static isSameDate(firstDate: Date | number | string, secondDate: Date | number | string): boolean {
        if(!(firstDate instanceof Date)) firstDate = this.convertToDate(firstDate);
        if(!(secondDate instanceof Date)) secondDate = this.convertToDate(secondDate);
        return firstDate && secondDate && firstDate.getFullYear()===secondDate.getFullYear() && firstDate.getMonth()===secondDate.getMonth() && firstDate.getDate()===secondDate.getDate();
    }

    static isToday(date: Date | number | string): boolean {
        return this.isSameDate(date, new Date());
    }

    static convertToTimeString(time: Date | number | string, options ? : {
            seconds_required ? : boolean,
            format_12Hour ? : boolean
    }): string {
        time = (Utils.isString(time) && this.#timeRegex.test(time)) ? new Date(`2010-01-01 ${time}`) :  new Date(time);
        let hh = time.getHours(), tt: string;
        if(!isNaN(hh)) {
            const mm = time.getMinutes();
            if(Utils.getValue(options, 'format_12Hour')) {
                if(hh > 11) {
                    tt = 'PM';
                    hh = (hh === 12) ? hh : hh - 12;
                } else {
                    tt = 'AM';
                    hh = (hh === 0) ? 12 : hh;
                }
            }
            let timeStr = `${hh>9 ? hh : `0${hh}`}:${mm>9 ? mm : `0${mm}`}`;
            if (Utils.getValue(options, 'seconds_required')) {
                const ss = time.getSeconds();
                timeStr += `:${(ss > 9) ? ss : ('0' + ss)}`;
            }
            return tt ? `${timeStr} ${tt}` : timeStr;
        }
        return '';
    }

    static getMonthAndYearFromString(string='') {
        const month = string.match(this.#monthRegex), year = string.match(this.#yearRegex);
        return (month && year) ? `${month[0]} ${year[0]}` : '';
    }
}
