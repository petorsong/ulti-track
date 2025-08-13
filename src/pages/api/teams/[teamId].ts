import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { desc } from 'drizzle-orm';
import { db } from '@/database/drizzle';
import { games, type GameType, type PlayerType, type TeamType } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ teamData: TeamType & { players: PlayerType[]; games: GameType[] } }>
) {
  const teamId = req.query.teamId as string;
  const result = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.id, teamId),
    with: { players: true, games: { orderBy: [desc(games.createdAt)] } },
  });
  res.status(200).json({ teamData: result! });
}
