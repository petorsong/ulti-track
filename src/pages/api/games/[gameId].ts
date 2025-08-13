import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { GameType, PlayerWithLineCountType } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ gameData: GameType; playersData: PlayerWithLineCountType[] }>
) {
  const gameId = req.query.gameId as string;
  // if (typeof gameId !== 'string') {
  //   return res.status(400).json({
  //     error: 'Invalid game ID'
  //   });
  // }

  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
    with: { points: true },
  });

  const rawPlayers = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, gameData!.activePlayerIds),
  });

  const playersData: PlayerWithLineCountType[] = rawPlayers.map((player) => ({
    ...player,
    lineCount: 0,
  }));
  gameData!.points.forEach((point) => {
    point.playerIds.forEach((playerId) => {
      const foundPlayer = playersData.find((player) => player.id == playerId);
      if (foundPlayer) {
        foundPlayer.lineCount += 1;
      }
    });
  });

  // if (result == null) {
  //   return res.status(400).json({
  //     error: 'Game not found'
  //   });
  // }
  res.status(200).json({ gameData: gameData!, playersData });
}
