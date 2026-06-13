import type { Player, PlayerWithCounts, Point } from '@/database/schema';

export type CurrentPointForCounts = {
  playerIds: string[];
};

export function playersWithLineCounts(players: Player[], points: Point[]): PlayerWithCounts[] {
  return players.map((player) => {
    const lastPlayedPointIndex = points.findIndex((p) => p.playerIds.includes(player.id));
    return {
      ...player,
      lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
      sitCount: lastPlayedPointIndex === -1 ? points.length : lastPlayedPointIndex,
    };
  });
}

/** Applies in-progress point credit: rostered players get +1 line; everyone else sits one more. */
export function playersWithLiveCounts(
  players: Player[],
  completedPoints: Point[],
  currentPoint?: CurrentPointForCounts | null
): PlayerWithCounts[] {
  const base = playersWithLineCounts(players, completedPoints);
  if (!currentPoint) {
    return base;
  }

  const currentPointRoster = new Set(currentPoint.playerIds);
  return base.map((player) => {
    if (currentPointRoster.has(player.id)) {
      return {
        ...player,
        lineCount: player.lineCount + 1,
        sitCount: 0,
      };
    }
    return {
      ...player,
      sitCount: player.sitCount + 1,
    };
  });
}
