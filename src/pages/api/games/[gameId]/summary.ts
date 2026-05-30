import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { GameSummary, PlayerStats, PlayerWithStats, StatsMap, type ApiError } from '@/types';
import { type EventType } from '@/database/schema';

const eventTypeToStatMap = new Map<EventType, keyof PlayerStats>([
  ['SCORE', 'scores'],
  ['BLOCK', 'blocks'],
  ['TA', 'throwAways'],
  ['DROP', 'drops'],
  ['PASS', 'totalPasses'],
]);

export default async function handler(req: Req, res: Res<{ summaryData: GameSummary } | ApiError>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameId = req.query.gameId as string;

  const game = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
    with: { team: true },
  });

  if (!game?.team) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const pointsData = await db.query.points.findMany({
    where: (points, { eq }) => eq(points.gameId, gameId),
    with: { events: true },
    orderBy: (points, { desc }) => [desc(points.createdAt)],
  });

  const activePlayersData = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
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
    const entry = playersStatsMap.get(playerId);
    if (entry) {
      entry.stats.increment(stat);
    }
  }

  pointsData.forEach((point) => {
    point.playerIds.forEach((playerId) => incrementStat(playerId, 'pointsPlayed'));
    point.events.forEach((event) => {
      if (eventTypeToStatMap.has(event.type) && event.playerOneId) {
        incrementStat(event.playerOneId, eventTypeToStatMap.get(event.type)!);
      }
      if (event.type === 'PASS' && event.playerOneId && event.playerTwoId) {
        const receiver = playersStatsMap.get(event.playerTwoId);
        if (receiver) {
          incrementStat(event.playerOneId, receiver.player.isFMP ? 'passesToF' : 'passesToO');
        }
      }
      if (event.eventJson?.assistType && event.playerOneId) {
        incrementStat(event.playerOneId, event.eventJson.assistType === 'ASSIST' ? 'assists' : 'hockeyAssists');
      }
    });
  });

  const summaryData: GameSummary = {
    team: game.team,
    game,
    players: Array.from(playersStatsMap.values()).map(
      (playerStats) =>
        ({
          player: playerStats.player,
          stats: playerStats.stats.getAllStats(),
        }) as PlayerWithStats
    ),
  };

  res.status(200).json({ summaryData });
}
