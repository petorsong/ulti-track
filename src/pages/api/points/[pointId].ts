import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { playersWithLineCounts } from '@/lib/playerCounts';
import { type Game, type TeamWithTeamGroups, type PlayerWithCounts, players as playersDb } from '@/database/schema';
import { asc } from 'drizzle-orm';
import type { ApiError } from '@/types';

export default async function handler(
  req: Req,
  res: Res<
    | {
        game: Game;
        team: TeamWithTeamGroups;
        playerIds: string[];
        players: PlayerWithCounts[];
      }
    | ApiError
  >
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const pointId = req.query.pointId as string;

  const result = await db.transaction(async (tx) => {
    const pointRow = await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, pointId),
      with: {
        game: {
          with: {
            points: { orderBy: (points, { desc }) => [desc(points.createdAt)] },
            team: { with: { teamGroups: { where: (teamGroups, { eq }) => eq(teamGroups.isActive, true) } } },
          },
        },
      },
    });
    if (!pointRow?.game?.team) {
      return null;
    }

    const { game, playerIds } = pointRow;
    const { points, team } = game;
    const roster = await tx.query.players.findMany({
      where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      orderBy: [asc(playersDb.order)],
    });
    const players = playersWithLineCounts(roster, points);

    return { game, team, playerIds, players };
  });

  if (!result) {
    return res.status(404).json({ error: 'Point not found' });
  }

  res.status(200).json(result);
}
