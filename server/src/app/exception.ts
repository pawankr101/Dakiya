import { Exception, type ExceptionOptions, Guards, type HttpCode, type Reason } from "@dakiya/shared";

type BulkIssues = Array<{ message: string, [x:string]: string }>
type ApiExceptionOptions = ExceptionOptions & { httpCode?: HttpCode, issues?: BulkIssues };

export class ApiException extends Exception {
    readonly httpCode: HttpCode;
    readonly issues?: BulkIssues;

    constructor(reason: Reason, options?: ApiExceptionOptions) {
        options = options ?? {};
        super(reason, options);
        this.httpCode = (Guards.isHttpCode(options.httpCode) ? options.httpCode : 500);
        if(options.issues) {
            this.issues = options.issues;
        }
    }
}
