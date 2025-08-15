import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type Player } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ players: Player[] }>) {
  const teamId = req.query.teamId as string;

  const players = await db.query.players.findMany({
    where: (players, { eq }) => eq(players.teamId, teamId),
  });
  res.status(200).json({ players });
}
