import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { db } from "@/database/drizzle";
import { games, players } from "@/database/schema";

export default async function handler(
  req: Req,
  res: Res<{ gameData: typeof games.$inferSelect; playersData: typeof players.$inferSelect[] }>,
) {
  const { gameId } = req.query;
  // if (typeof gameId !== 'string') {
  //   return res.status(400).json({
  //     error: 'Invalid game ID'
  //   });
  // }

  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, `${gameId}`),
  });

  const playersData = await db.query.players.findMany({
    where: (players, { inArray }) => inArray(players.id, gameData!.activePlayerIds), 
  });

  // if (result == null) {
  //   return res.status(400).json({
  //     error: 'Game not found'
  //   });
  // }
  res.status(200).json({ gameData: gameData!, playersData });
}
