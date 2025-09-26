import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { players, type TeamWithPlayers } from '@/database/schema';
import { asc } from 'drizzle-orm';

export default async function handler(req: Req, res: Res<{ team: TeamWithPlayers }>) {
  const teamId = req.query.teamId as string;

  const team = (await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: { players: { orderBy: [asc(players.order)] } },
  }))!;

  res.status(200).json({ team });
}
