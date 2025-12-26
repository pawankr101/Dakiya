export const REGEXP = {
    time: /(^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$)|(^(0?\d|1[0-2]):([0-5]\d)(:[0-5]\d)?( [AaPp][Mm])$)/,
    time12: /^(0?\d|1[0-2]):([0-5]\d)(:[0-5]\d)?( [AaPp][Mm])$/,
    time24: /^([01]?\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
    email: /^\S+@\S+\.[\S]{2,4}$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*-_.])[A-Za-z\d#?!@$%^&*-_.]{8,64}$/,
    mobile_no: /^[0-9]{10,10}$/,
    mobile_no_starting_9876: /^[9,8,7,6][0-9]{10,10}$/,
    ip: /(\d{1,3}(\.\d{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/,
    month: /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(Nov|Dec)(?:ember)?)/i,
    year: /(19|2\d)\d{2}/,
    monthYear: /^(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|(Nov|Dec)(?:ember)?) (19|2\d)\d{2}$/i,
    url: /((https?|ftp|smtp):\/\/)?(www.)?[a-z0-9]+(\.[a-z]{2,}){1,3}(#?\/?[a-zA-Z0-9#]+)*\/?(\?[a-zA-Z0-9-_]+=[a-zA-Z0-9-%]+&?)?/i,
    attachmentUrlInHtml: /href="(https?:\/\/[^ ]*)"/i,
    currencyOrNumber: /-?.?(\d{1,3},(\d{3},)*\d{3}|\d*)(.\d+)?/
};