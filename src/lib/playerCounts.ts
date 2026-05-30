import type { Player, PlayerWithCounts, Point } from '@/database/schema';

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
