import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { db } from "@/database/drizzle";
import { games } from "@/database/schema";
import { ApiErrorType } from "@/types";

export default async function handler(
  req: Req,
  res: Res<typeof games.$inferSelect | ApiErrorType>,
) {
  const { gameId } = req.query;
  if (typeof gameId !== 'string') {
    return res.status(400).json({
      error: 'Invalid game ID'
    });
  }

  const result = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (result == null) {
    return res.status(400).json({
      error: 'Game not found'
    });
  }
  res.status(200).json(result);
}
