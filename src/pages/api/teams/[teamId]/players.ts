import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { players, type TeamWithPlayers } from '@/database/schema';
import { asc } from 'drizzle-orm';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ team: TeamWithPlayers } | ApiError>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const teamId = req.query.teamId as string;

  const team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: { players: { orderBy: [asc(players.order)] } },
  });

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  res.status(200).json({ team });
}
