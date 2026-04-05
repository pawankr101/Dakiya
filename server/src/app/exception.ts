import { Exception, Guards, type ExceptionOptions } from "@dakiya/shared";

type APIExceptionOptions = ExceptionOptions & { httpCode?: number };

const isHttpCode = (code: number) => {
    return Guards.isNumber(code) && (code >= 100 && code <= 599);
}

export class APIException extends Exception {
    httpCode: number;

    constructor(reason: string | Exception | Error, options?: APIExceptionOptions) {
        options = options || {};
        super(reason, options);
        this.httpCode = (isHttpCode(options.httpCode as number) ? options.httpCode : 500) as number;
    }
}
