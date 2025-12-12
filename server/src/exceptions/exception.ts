
/* ***** Type Declarations: Start ***** */

type Message = string;
type Reason = Message|Exception|Error;
type ExceptionOptions = { code?: number, cause?: Exception|Error };
type ExceptionJson = {
    name: string,
    message: string,
    code?: number,
    cause?: ExceptionJson|{ name: string, message: string },
    stack?: string,
};

/* ***** Type Declarations: End ***** */

function isExceptionOrError(error: any) : error is Exception|Error {
    return ((error instanceof Exception) || (error instanceof Error))
}

export class Exception extends Error {

    /**
     * The underlying cause of this exception, allowing for error chaining.
     *
     * This can be another `Exception` or a standard `Error` object that was
     * caught and re-thrown as this exception.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause}
     */
    cause?: Exception|Error;
  
    
    /**
     * An optional numeric code associated with the exception, typically corresponding
     * to an HTTP status code. This can be used to provide more specific error
     * information in API responses.
     *
     * @example 404 // for a "Not Found" error
     * @example 400 // for a "Bad Request" error
     */
    code?: number

    /**
     * Creates an instance of Exception.
     *
     * This constructor is flexible and can be initialized in several ways:
     * 1. With a simple string message.
     * 2. By wrapping an existing `Error` or `Exception` instance. The message and cause are inherited.
     * 3. With a string message and an `options` object to specify a `code` and/or a `cause`.
     *
     * The `code` and `cause` are determined with the following precedence:
     * - `cause`: If the `reason` is an `Error` or `Exception`, it becomes the cause. Otherwise, `options.cause` is used.
     * - `code`: If the determined `cause` has a `code`, that is used. Otherwise, `options.code` is used.
     *
     * @param {Reason} reason The reason for the exception. This can be a string message or another `Error`/`Exception` to be wrapped.
     * @param {ExceptionOptions} [options] Optional configuration for the exception.
     * @param {string} [options.code] A unique error code for this exception.
     * @param {Error | Exception} [options.cause] The underlying error that caused this exception.
     *
     * @example
     * // From a simple message
     * throw new Exception("Something went wrong.");
     *
     * @example
     * // Wrapping another error
     * const originalError = new Error("Connection timed out");
     * throw new Exception(originalError);
     *
     * @example
     * // With a message and a code
     * throw new Exception("User not found", { code: 404 });
     *
     * @example
     * // With a message, code, and a cause
     * const dbError = new Error("DB connection failed");
     * throw new Exception("Could not retrieve user data", { cause: dbError, code: 500 });
     */
    constructor(reason: Reason, options?: ExceptionOptions) {
        const isException = isExceptionOrError(reason);
        const message = isException ? (reason as Exception|Error).message : (reason as Message);
        const cause = isException ? (reason as Exception|Error) : options?.cause;
        const code = cause && (cause as Exception).code ? (cause as Exception).code : options?.code;

        // Call the parent constructor with the message
        super(message);
        
        // Set the prototype explicitly. This is necessary when extending built-in classes like Error.
        Object.setPrototypeOf(this, Exception.prototype);

        // Set the name property to the class name for better identification
        this.name = 'Exception';

        // Assign the code and cause properties if they exist
        if(code) this.code = code;
        if(cause) this.cause = cause;
    }

    /**
     * Converts the Exception instance to a JSON representation.
     *
     * This method serializes the exception's properties into a plain `ExceptionJson` object,
     * making it suitable for logging or transmitting over a network.
     *
     * @returns `ExceptionJson` A JSON representation of the exception, including its name, message, code, cause, and stack trace.
     */
    toJson(): ExceptionJson {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            cause: this.cause ? (this.cause instanceof Exception ? this.cause.toJson() : {
                name: this.cause.name,
                message: this.cause.message,
            }) : undefined,
            stack: this.stack,
        }
    }
}
