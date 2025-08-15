import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { and, eq } from 'drizzle-orm';
import { ApiError } from '@/types';
import { db } from '@/database/drizzle';
import { games, players, teamGroups } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ gameId: string } | ApiError>) {
  const teamId = req.query.teamId as string;
  const parsedBody: typeof games.$inferInsert = JSON.parse(req.body);

  if (!parsedBody.vsTeamName) {
    return res.status(400).json({
      error: 'Opponent team name required',
    });
  }

  const [result] = await db.transaction(async (tx) => {
    const activeTeamGroupPlayerIds = await tx
      .select({ id: players.id })
      .from(players)
      .innerJoin(teamGroups, eq(players.teamGroupId, teamGroups.id))
      .where(and(eq(teamGroups.teamId, teamId), eq(teamGroups.isActive, true)));
    return await tx
      .insert(games)
      .values({
        ...parsedBody,
        teamId,
        activePlayerIds: activeTeamGroupPlayerIds.map(({ id }) => id),
        wasLastScoreUs: !parsedBody.startOnO,
        timeouts: {
          perHalf: 2,
          ourTimeouts: { firstHalf: 2, secondHalf: 2 },
          vsTimeouts: { firstHalf: 2, secondHalf: 2 },
        },
      })
      .returning({ gameId: games.id });
  });

  res.status(200).json(result);
}
