import { ApiErrorType } from '@/types';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ gameId: string } | ApiErrorType>) {
  const parsedBody: typeof games.$inferInsert = JSON.parse(req.body);

  if (!parsedBody.vsTeamName) {
    return res.status(400).json({
      error: 'Opponent team name required',
    });
  }

  const [result] = await db
    .insert(games)
    .values({
      ...parsedBody,
      wasLastScoreUs: !parsedBody.startOnO,
    })
    .returning({ gameId: games.id });
  res.status(200).json(result);
}
