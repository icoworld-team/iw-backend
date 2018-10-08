// Round function implementation.
export function round(value: number, decimals: number): Number {
    const val = parseFloat(`${value}e${decimals}`);
    return Number(Math.round(val) + 'e-' + decimals);
}

// Equals function implementation.
export function equals(x: number, y: number): boolean {
    return Math.abs(x - y) < Number.EPSILON * Math.max(Math.abs(x), Math.abs(y));
}

// Truncate function implementation.
export function truncate(val: number): number {
    return Math.trunc(val * 100) / 100;
}

// Truncate with decimals function implementation.
export function truncated(val: number, decimals: number): number {
    const npc = Math.pow(10, decimals);
    return ~~(val * npc) / npc;
}

// Get a pseudo random number in a given range.
export function getRandomInRange(min: number, max: number): number {
    return ~~(Math.random() * (max - min + 1)) + min;
}

// Sleep for a given number of milliseconds.
export function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a given argument is defined and not null.
export function notNull(arg, name: string) {
    if (arg == undefined || null)
        throw new Error(`Argument <${name}> is NULL or UNDEINED!`);
}

// Sort map by values desc method.
export function sortByValuesDesc(b, a) { 
    return a[1] === b[1] ? 0 : a[1] > b[1] ? 1 : -1;
}