import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { db } from "@/database/drizzle";
import { games, PlayerWithLineCountType, points } from "@/database/schema";

export default async function handler(
  req: Req,
  res: Res<{
    pointData: typeof points.$inferSelect;
    gameData: typeof games.$inferSelect;
    playersData: PlayerWithLineCountType[]
  }>,
) {
  const { pointId } = req.query;
  // if (typeof gameId !== 'string') {
  //   return res.status(400).json({
  //     error: 'Invalid game ID'
  //   });
  // }

  const pointData = await db.query.points.findFirst({
    where: (points, { eq }) => eq(points.id, `${pointId}`),
    with: { game: true }
  });

  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, `${pointData!.game.id}`),
    with: { points: true },
  });

  const rawPlayers = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, gameData!.activePlayerIds), 
  });

  const playersData: PlayerWithLineCountType[] = rawPlayers.map(player => ({ ...player, lineCount: 0 }));
  gameData!.points.forEach((point) => {
    point.playerIds.forEach((playerId) => {
      const foundPlayer = playersData.find(player => player.id == playerId);
      if (foundPlayer) {
        foundPlayer.lineCount += 1;
      }
    })
  });

  // if (result == null) {
  //   return res.status(400).json({
  //     error: 'Game not found'
  //   });
  // }
  res.status(200).json({ pointData: pointData!, gameData: gameData!, playersData });
}
