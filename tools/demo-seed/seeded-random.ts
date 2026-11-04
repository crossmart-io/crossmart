/** Fixed seed, so every run builds the same demo catalog. */
export const DEMO_SEED = 20261102;

const UINT32_RANGE = 4_294_967_296;
const MULBERRY_INCREMENT = 0x6d2b79f5;
const SHIFT_15 = 15;
const SHIFT_7 = 7;
const SHIFT_14 = 14;
const ONE = 1;
const SIXTY_ONE = 61;

/** Mulberry32: a small, well-known deterministic generator. Demo data only, never security. */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** A float in [0, 1). */
  next(): number {
    this.state = (this.state + MULBERRY_INCREMENT) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> SHIFT_15), value | ONE);
    value ^= value + Math.imul(value ^ (value >>> SHIFT_7), value | SIXTY_ONE);
    return ((value ^ (value >>> SHIFT_14)) >>> 0) / UINT32_RANGE;
  }

  /** An integer in [min, max]. */
  integer(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with the given probability. */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<Item>(items: readonly Item[]): Item {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) throw new Error('Cannot pick from an empty list');
    return item;
  }
}
