export function zip<T, U>(a: T[], b: U[]): [T|undefined, U|undefined][] {
  return Array(Math.max(b.length, a.length)).fill(undefined).map((_, i) => [a[i], b[i]])
}
