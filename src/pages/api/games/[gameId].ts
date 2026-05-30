import { asc } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { playersWithLineCounts } from '@/lib/playerCounts';
import {
  players as playersDb,
  type Game,
  type PlayerWithCounts,
  type Point,
  type TeamWithTeamGroups,
} from '@/database/schema';
import type { ApiError } from '@/types';

export default async function handler(
  req: Req,
  res: Res<{ game: Game; team: TeamWithTeamGroups; lastPoint?: Point; players: PlayerWithCounts[] } | ApiError>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameId = req.query.gameId as string;

  const result = await db.transaction(async (tx) => {
    const game = await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, gameId),
    });
    if (!game) {
      return null;
    }

    const points = await tx.query.points.findMany({
      where: (points, { eq }) => eq(points.gameId, gameId),
      orderBy: (points, { desc }) => [desc(points.createdAt)],
    });
    const team = await tx.query.teams.findFirst({
      where: (teams, { eq }) => eq(teams.id, game.teamId),
      with: { teamGroups: { where: (teamGroups, { eq }) => eq(teamGroups.isActive, true) } },
    });
    if (!team) {
      return null;
    }

    const roster = await tx.query.players.findMany({
      where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      orderBy: [asc(playersDb.order)],
    });
    const players = playersWithLineCounts(roster, points);

    return { game, team, lastPoint: points.length > 0 ? points[0] : undefined, players };
  });

  if (!result) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.status(200).json(result);
}
