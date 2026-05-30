import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games, type Game } from '@/database/schema';
import { eq } from 'drizzle-orm';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ gameData: Game } | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameId = req.query.gameId as string;

  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, gameId),
  });

  if (!gameData) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const { halftimeAt, teamScore, vsTeamScore } = gameData;

  const [result] = await db
    .update(games)
    .set(halftimeAt ? { isComplete: true } : { halftimeAt: teamScore + vsTeamScore })
    .where(eq(games.id, gameId))
    .returning();

  res.status(200).json({ gameData: result });
}
