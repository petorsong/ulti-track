import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { GameSummary, PlayerStats, PlayerWithStats, StatsMap } from '@/types';
import { type EventType } from '@/database/schema';

const eventTypeToStatMap = new Map<EventType, keyof PlayerStats>([
  ['SCORE', 'scores'],
  ['BLOCK', 'blocks'],
  ['TA', 'throwAways'],
  ['DROP', 'drops'],
  ['PASS', 'totalPasses'],
]);

export default async function handler(req: Req, res: Res<{ summaryData: GameSummary }>) {
  const gameId = req.query.gameId as string;

  const pointsData = await db.query.points.findMany({
    where: (points, { eq }) => eq(points.gameId, gameId),
    with: {
      events: true,
      game: true,
    },
    orderBy: (points, { desc }) => [desc(points.createdAt)],
  });

  const { activePlayerIds } = pointsData[0].game;
  const activePlayersData = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, activePlayerIds),
    with: { team: true },
  });

  const playersStatsMap = new Map(
    activePlayersData.map((player) => [
      player.id,
      {
        player,
        stats: new StatsMap(),
      },
    ])
  );

  function incrementStat(playerId: string, stat: keyof PlayerStats) {
    playersStatsMap.get(playerId)!.stats.increment(stat);
  }

  pointsData.forEach((point) => {
    point.playerIds.forEach((playerId) => incrementStat(playerId, 'pointsPlayed'));
    point.events.forEach((event) => {
      if (eventTypeToStatMap.has(event.type)) {
        incrementStat(event.playerOneId!, eventTypeToStatMap.get(event.type)!);
      }
      if (event.type == 'PASS') {
        incrementStat(
          event.playerOneId!,
          playersStatsMap.get(event.playerTwoId!)!.player.isFMP ? 'passesToF' : 'passesToO'
        );
      }
      if (event.eventJson?.assistType) {
        incrementStat(event.playerOneId!, event.eventJson?.assistType == 'ASSIST' ? 'assists' : 'hockeyAssists');
      }
    });
  });

  const summaryData: GameSummary = {
    team: activePlayersData[0].team,
    game: pointsData[0].game,
    players: playersStatsMap
      .values()
      .map(
        (playerStats) =>
          ({
            player: playerStats.player,
            stats: playerStats.stats.getAllStats(),
          }) as PlayerWithStats
      )
      .toArray(),
  };

  res.status(200).json({ summaryData });
}
