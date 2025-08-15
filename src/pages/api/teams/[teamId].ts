import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { asc, desc } from 'drizzle-orm';
import { db } from '@/database/drizzle';
import { games, teamGroups, type Game, type Team, type TeamGroup } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ teamData: Team & { teamGroups: TeamGroup[]; games: Game[] } }>
) {
  const teamId = req.query.teamId as string;
  const result = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: {
      teamGroups: { orderBy: [asc(teamGroups.isDefault)] },
      games: { orderBy: [desc(games.createdAt)] },
    },
  });
  res.status(200).json({ teamData: result! });
}
