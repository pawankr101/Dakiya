function parse(str: string): any {
    return JSON.parse(str);
}

function stringify(data: any): string {
    return JSON.stringify(data);
}

export default { parse, stringify }