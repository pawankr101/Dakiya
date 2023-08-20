type Message = string;
type Reason = Message|Exception|Error;
type ExceptionOptions = {code?: number, cause?: Exception}

function isExceptionOrError(error: any) : error is Exception|Error {
    return ((error instanceof Exception) || (error instanceof Error))
}

export class Exception extends Error {
    cause?: Exception|Error; code?: number=0;
    constructor(reason?: Reason, options?: ExceptionOptions) {
        super(isExceptionOrError(reason) ? reason.message : reason);
        if(isExceptionOrError(reason)){
            this.cause = reason;
            if(reason['code']) this.code = reason['code'];
        }
        if(options) {
            if(options.cause) this.cause = options.cause;
            if(options.code) this.code = options.code;
        }
    }
}