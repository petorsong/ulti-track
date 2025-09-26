import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type Game, type TeamWithTeamGroups, type PlayerWithCounts, players as playersDb } from '@/database/schema';
import { asc } from 'drizzle-orm';

export default async function handler(
  req: Req,
  res: Res<{
    game: Game;
    team: TeamWithTeamGroups;
    playerIds: string[];
    players: PlayerWithCounts[];
  }>
) {
  const pointId = req.query.pointId as string;

  const { game, team, playerIds, players } = await db.transaction(async (tx) => {
    const { game, playerIds } = (await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, pointId),
      with: {
        game: {
          with: {
            points: { orderBy: (points, { desc }) => [desc(points.createdAt)] },
            team: { with: { teamGroups: { where: (teamGroups, { eq }) => eq(teamGroups.isActive, true) } } },
          },
        },
      },
    }))!;
    const { points, team } = game;
    const players: PlayerWithCounts[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
        orderBy: [asc(playersDb.order)],
      })
    ).map((player) => {
      const lastPlayedPointIndex = points.findIndex((p) => p.playerIds.includes(player.id));
      return {
        ...player, // TODO: consider aggregating this directly in SQL
        lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
        sitCount: lastPlayedPointIndex === -1 ? points.length : lastPlayedPointIndex,
      };
    });

    return { game, team, playerIds, players };
  });

  res.status(200).json({ game, team, playerIds, players });
}
