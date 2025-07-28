import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games, players, teams } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{
    teamData: typeof teams.$inferSelect & {
      players: (typeof players.$inferSelect)[];
      games: (typeof games.$inferSelect)[];
    };
  }>
) {
  const teamId = req.query.teamId as string;
  const result = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: { players: true, games: true },
  });
  res.status(200).json({ teamData: result! });
}
