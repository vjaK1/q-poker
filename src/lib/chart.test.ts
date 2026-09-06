import { describe, expect, it } from 'vitest'
import { labelIndices, moneyTicks } from './chart'

describe('moneyTicks', () => {
  it('covers the data, includes $0 and lands on whole-dollar steps', () => {
    // -$12 .. +$8 with room for 3 steps: $10 steps, floored and ceiled
    expect(moneyTicks(-1200, 800, 3)).toEqual([-2000, -1000, 0, 1000])
  })

  it('an all-positive bankroll still starts its axis at $0', () => {
    expect(moneyTicks(0, 21240, 4)).toEqual([0, 10000, 20000, 30000])
  })

  it('an all-negative bankroll still ends its axis at $0', () => {
    // -$45 .. -$1: $20 steps are the finest that fit in 4 intervals
    expect(moneyTicks(-4500, -100, 4)).toEqual([-6000, -4000, -2000, 0])
  })

  it('a flat $0 line gets a two-tick axis rather than a zero-height one', () => {
    expect(moneyTicks(0, 0)).toEqual([0, 500])
  })

  it('fewer allowed intervals means coarser steps', () => {
    expect(moneyTicks(-1200, 800, 2)).toEqual([-2000, -1000, 0, 1000])
    expect(moneyTicks(-1200, 800, 6)).toEqual([-1500, -1000, -500, 0, 500, 1000])
  })
})

describe('labelIndices', () => {
  it('labels every game when they fit', () => {
    expect(labelIndices(4, 6)).toEqual([1, 2, 3])
  })

  it('spreads labels evenly and always keeps the latest game', () => {
    expect(labelIndices(31, 4)).toEqual([1, 11, 20, 30])
  })

  it('never labels the $0 start line, and handles no games', () => {
    expect(labelIndices(1, 4)).toEqual([])
    expect(labelIndices(2, 4)).toEqual([1])
  })

  it('with room for one label, keeps the latest game', () => {
    expect(labelIndices(10, 1)).toEqual([9])
  })
})
