export const DEFAULT_LEADERBOARD_LIMIT = 100
export const MAX_LEADERBOARD_LIMIT = 500

export function parseLeaderboardLimit(input?: unknown) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(1, Math.min(MAX_LEADERBOARD_LIMIT, Math.floor(input)))
  }

  if (typeof input === 'string' && input.trim()) {
    const parsed = Number.parseInt(input, 10)
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(MAX_LEADERBOARD_LIMIT, parsed))
    }
  }

  return DEFAULT_LEADERBOARD_LIMIT
}
