export interface Rng {
  next(): number
  gaussian(mean?: number, std?: number): number
  int(min: number, max: number): number
}

export function createRng(seed = 0xc0ffee): Rng {
  let state = seed >>> 0
  function next(): number {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
  function gaussian(mean = 0, std = 1): number {
    let u = 0
    let v = 0
    while (u === 0) u = next()
    while (v === 0) v = next()
    const mag = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    return mean + std * mag
  }
  function int(min: number, max: number): number {
    return Math.floor(next() * (max - min)) + min
  }
  return { next, gaussian, int }
}
