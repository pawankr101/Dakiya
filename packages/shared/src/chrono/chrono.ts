import { Guards } from '../guards/index.js';
import { ArrayList, type List } from '../ds/index.js';
import { loop } from '../iter/index.js';

type DateOrTimestamp = string | number | Date;

const SHORT_MONTHS: string[] = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const FULL_MONTHS: string[] = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const SHORT_WEEK_DAYS: string[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const FULL_WEEK_DAYS: string[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface Chrono {
    /**
     * Gets the last n years.
     * @param n The number of years to get.
     * @returns A list of the last n years.
     */
    getLastNYears(n: number): List<number>;
    /**
     * Gets the month list.
     * @param isShort Whether to get the short month names.
     * @returns A list of the month names.
     */
    getMonthList(isShort?: boolean): List<string>;
    /**
     * Gets the week day list.
     * @param isShort Whether to get the short week day names.
     * @returns A list of the week day names.
     */
    getWeekDayList(isShort?: boolean): List<string>;
    /**
     * Converts the given date to a Date object.
     * @param date The date to convert.
     * @returns The converted Date object.
     * @throws Error if invalid date provided.
     */
    convertToDate(date: DateOrTimestamp): Date;
    /**
     * Converts the given date to a timestamp.
     * @param date The date to convert.
     * @returns The converted timestamp.
     */
    convertToTimeStamp(date: DateOrTimestamp): number;
    /**
     * Checks if the given dates are the same.
     * @param firstDate The first date to compare.
     * @param secondDate The second date to compare.
     * @returns True if the dates are the same, false otherwise.
     */
    isSameDate(firstDate: DateOrTimestamp, secondDate: DateOrTimestamp): boolean;
    /**
     * Checks if the given date is today.
     * @param date The date to check.
     * @returns True if the date is today, false otherwise.
     */
    isToday(date: DateOrTimestamp): boolean;
}

const getLastNYears = (n: number): List<number> => {
    const cy = new Date().getFullYear();
    const years = new ArrayList<number>(n);
    loop(n, (i) => {
        years.addOne(cy - i);
    });
    return years;
}

const getMonthList = (isShort?: boolean): List<string> => {
    const months = isShort ? SHORT_MONTHS : FULL_MONTHS;
    return new ArrayList(months);
}

const getWeekDayList = (isShort?: boolean): List<string> => {
    const weekDays = isShort ? SHORT_WEEK_DAYS : FULL_WEEK_DAYS;
    return new ArrayList(weekDays);
}

const convertToDate = (date: DateOrTimestamp): Date => {
    if(Guards.isDate(date)) return date;
    if (date) {
        const d = new Date(date);
        if(Number.isNaN(d.getDate())) throw new Error('Invalid date');
        return d;
    }
    throw new Error('Invalid date');
}

const convertToTimeStamp = (date: DateOrTimestamp): number => {
    if(Guards.isNumber(date)) return date;
    date = convertToDate(date);
    return date ? date.getTime() : 0;
}

const isSameDate = (firstDate: DateOrTimestamp, secondDate: DateOrTimestamp): boolean => {
    const fd = convertToDate(firstDate), sd = convertToDate(secondDate);
    if (fd && sd) {
        return (fd.getFullYear() === sd.getFullYear()) && (fd.getMonth() === sd.getMonth()) && (fd.getDate() === sd.getDate());
    }
    return false;
}

const isToday = (date: DateOrTimestamp): boolean => {
    return isSameDate(date, new Date());
}

export const Chrono = (() => {
    const Chrono: Chrono = Object.create(null);
    Chrono.getLastNYears = getLastNYears;
    Chrono.getMonthList = getMonthList;
    Chrono.getWeekDayList = getWeekDayList;
    Chrono.convertToDate = convertToDate;
    Chrono.convertToTimeStamp = convertToTimeStamp;
    Chrono.isSameDate = isSameDate;
    Chrono.isToday = isToday;
    return Chrono;
})();
