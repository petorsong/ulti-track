import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { TeamWithPlayers } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ team: TeamWithPlayers }>) {
  const teamId = req.query.teamId as string;

  const team = (await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: { players: true },
  }))!;

  res.status(200).json({ team });
}
