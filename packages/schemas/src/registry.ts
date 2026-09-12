import { Compile } from "typebox/schema";

const scm = {}

export type RegistryIds = keyof typeof scm;
export type Registry<R extends Array<RegistryIds> | ReadonlyArray<RegistryIds>> = {
    [key in R[number]]?: typeof scm[key];
};

const getDefaultRegistry = <R extends Array<RegistryIds> | ReadonlyArray<RegistryIds>>(): Registry<R> => {
    const registry: Registry<R> = {};
    const ids = Object.keys(scm) as RegistryIds[];
    ids.forEach((id) => {
        if (scm[id]) {
            registry[id] = scm[id];
        }
    });
    return registry;
}

export const getRegistry = <R extends Array<RegistryIds> | ReadonlyArray<RegistryIds> = Array<RegistryIds>>(ids?: R): Registry<R> => {
    if(!ids || !Array.isArray(ids) || ids.length === 0) {
        return getDefaultRegistry<R>();
    }
    const registry: Registry<R> = {};
    ids.forEach((id) => {
        if (scm[id]) {
            registry[id] = scm[id];
        }
    });
    return registry;
}
