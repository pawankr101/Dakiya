import { Guards } from "../guards/index.js";

/****** Type Declarations: Start ******/
export interface Message extends String {
    readonly ___brand?: 'Message';
}
export type Reason = Message|Exception|Error;
export type ExceptionOptions = { code?: string, cause?: Exception|Error };
export type ExceptionJson = {
    name: string,
    message: string,
    code?: string,
    cause?: ExceptionJson|{ name: string, message: string },
    stack?: string,
};
/****** Type Declarations: End ******/

/**
 * Checks if the given error is an instance of `Exception` or `Error`.
 * @param error The error to check.
 * @returns `true` if the error is an `Exception` or `Error`, otherwise `false`.
 */
function isExceptionOrError(error: unknown) : error is Exception|Error {
    return ((error instanceof Exception) || (error instanceof Error));
}

/**
 * Builds the components of an `Exception` based on the provided reason and options.
 * This function determines the message, cause, and code for the exception based on the input parameters.
 * It handles various scenarios, such as when the reason is a string message or when it is an existing `Error` or `Exception`.
 * @param reason The reason for the exception, which can be a string message or an existing error object.
 * @param [options] Optional configuration for the exception, including a code and/or cause.
 * @returns An array containing the message, code, and cause for the exception, which will be used to construct the `Exception` instance.
 */
function buildException(reason: Reason, options?: ExceptionOptions) {
    options = options || {};
    options.code = Guards.isDefinedAndNotNull(options.code) ? `${options.code}` : 'INTERNAL_ERROR';
    const ex = new Array(3) as [Message, string, Exception | Error | undefined];
    if(isExceptionOrError(reason)) {
        ex[0] = reason.message;
        ex[1] = Guards.isDefinedAndNotNull((<Exception>reason).code) ? `${(<Exception>reason).code}` : options.code;
        ex[2] = reason;
        return ex;
    }
    ex[0] = reason;
    ex[1] = options.code;
    ex[2] = options.cause || undefined;
    return ex;
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
     * A unique error code that identifies the type of exception.
     * This code can be used for programmatic error handling and categorization.
     * The code is determined based on the following precedence:
     * 1. If the `reason` is an `Exception` and has a `code`, that code is used.
     * 2. If the `reason` is an `Error` and has a `code`, that code is used.
     * 3. If the `options` object has a `code`, that code is used.
     * 4. If none of the above provide a code, it defaults to 'INTERNAL_ERROR'.
     */
    readonly #code: string;

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
     * throw new Exception("User not found", { code: 'NOT_FOUND' });
     *
     * @example
     * // With a message, code and a cause
     * const dbError = new Error("DB connection failed");
     * throw new Exception("Could not retrieve user data", { cause: dbError, code: 'DB_ERROR' });
     */
    constructor(reason: Reason, options?: ExceptionOptions) {
        const [ message, code, cause ] = buildException(reason, options);

        // Call the parent constructor with the message.
        super(message as string);

        // Set the prototype explicitly. This is necessary when extending built-in classes like Error.
        Object.setPrototypeOf(this, Exception.prototype);

        // Set the name property to the class name for better identification.
        this.name = 'Exception';
        // Assign the code to the private field.
        this.#code = code;
        // Assign the cause if it exists.
        if (Guards.isDefined(cause)) {
            this.cause = cause;
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }
    }

    get code(): string {
        return this.#code;
    }

    /**
     * Converts the Exception instance to a JSON representation.
     *
     * This method serializes the exception's properties into a plain `ExceptionJson` object,
     * making it suitable for logging or transmitting over a network.
     * @returns `ExceptionJson` A JSON representation of the exception, including its name, message, code, cause, and stack trace.
     */
    toJson(): ExceptionJson {
        let cause: ExceptionJson | {
            name: string;
            message: string;
        };
        if (this.cause) {
            if (this.cause instanceof Exception) {
                cause = this.cause.toJson();
            } else {
                cause = {
                    name: this.cause.name,
                    message: this.cause.message
                };
            }
        }
        return {
            name: this.name,
            message: this.message,
            code: this.#code,
            stack: this.stack,
            cause
        }
    }

    static from(error: Error | Exception, options?: ExceptionOptions): Exception {
        if (error instanceof Exception) return error;
        return new Exception(error.message, { ...options, cause: error });
    }
}
