export type PossibleTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'array' | 'function';
export type Func<A=unknown, V=unknown> = (...args: A[]) => V;
export type DynamicType<T extends PossibleTypes=never, AO extends PossibleTypes=never> = T extends 'string' ? string
    : T extends 'number' ? number
    : T extends 'bigint' ? bigint
    : T extends 'boolean' ? boolean
    : T extends 'symbol' ? symbol
    : T extends 'undefined' ? undefined
    : T extends 'object' ? object
    : T extends 'array' ? Array<AO extends 'array' ? Array<unknown> : DynamicType<AO>>
    : T extends 'function' ? Func : unknown;

export type ObjectOf<T = unknown, K extends string | number | symbol = string> = { [x in K]: T };
