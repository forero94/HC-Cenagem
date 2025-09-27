export function uid(n = 6) { return Math.random().toString().slice(2, 2 + n); }
export function newId(prefix = "ID") { return `${prefix}-${uid(8)}`; }
