import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games } from '@/database/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: Req, res: Res<{ gameData: typeof games.$inferSelect }>) {
  const { gameId } = req.query;

  const gameData = await db.query.games.findFirst({
    where: (games, { eq }) => eq(games.id, `${gameId}`),
  });

  const { halftimeAt, teamScore, vsTeamScore } = gameData!;

  const [result] = await db
    .update(games)
    .set(
      halftimeAt
        ? {
            isComplete: true,
          }
        : {
            halftimeAt: teamScore + vsTeamScore,
          }
    )
    .where(eq(games.id, `${gameId}`))
    .returning();

  res.status(200).json({ gameData: result });
}
