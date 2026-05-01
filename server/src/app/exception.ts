import { Exception, type ExceptionOptions, Guards, type HttpCode, type Reason } from "@dakiya/shared";

type APIExceptionOptions = ExceptionOptions & { httpCode?: HttpCode };

export class APIException extends Exception {
    readonly httpCode: HttpCode;

    constructor(reason: Reason, options?: APIExceptionOptions) {
        options = options || {};
        super(reason, options);
        this.httpCode = (Guards.isHttpCode(options.httpCode) ? options.httpCode : 500);
    }
}
