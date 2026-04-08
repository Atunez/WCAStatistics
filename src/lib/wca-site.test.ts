import { describe, expect, it } from 'vitest'
import { parseLeaderboardLimit } from './leaderboard-limit'

describe('parseLeaderboardLimit', () => {
  it('defaults to 100 when input is missing or invalid', () => {
    expect(parseLeaderboardLimit()).toBe(100)
    expect(parseLeaderboardLimit('')).toBe(100)
    expect(parseLeaderboardLimit('invalid')).toBe(100)
  })

  it('clamps to the supported range', () => {
    expect(parseLeaderboardLimit('0')).toBe(1)
    expect(parseLeaderboardLimit(-8)).toBe(1)
    expect(parseLeaderboardLimit('501')).toBe(500)
    expect(parseLeaderboardLimit(999)).toBe(500)
  })

  it('accepts valid values in range', () => {
    expect(parseLeaderboardLimit('25')).toBe(25)
    expect(parseLeaderboardLimit(250)).toBe(250)
  })
})
