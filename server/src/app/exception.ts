import { Exception, type ExceptionOptions, Guards, type HttpCode } from "@dakiya/shared";

type APIExceptionOptions = ExceptionOptions & { httpCode?: HttpCode };

export class APIException extends Exception {
    readonly httpCode: HttpCode;

    constructor(reason: string | Exception | Error, options?: APIExceptionOptions) {
        options = options || {};
        super(reason, options);
        this.httpCode = (Guards.isHttpCode(options.httpCode) ? options.httpCode : 500);
    }
}
