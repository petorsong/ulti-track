import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { Point, Game, PlayerWithLineCount, TeamWithTeamGroups } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{
    game: Game;
    team: TeamWithTeamGroups;
    playerIds: string[];
    lastPoint: Point;
    players: PlayerWithLineCount[];
  }>
) {
  const pointId = req.query.pointId as string;

  const { game, team, playerIds, lastPoint, players } = await db.transaction(async (tx) => {
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
    const players: PlayerWithLineCount[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      })
    ).map((player) => ({
      ...player, // TODO: consider aggregating this directly in SQL
      lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));

    return { game, team, playerIds, lastPoint: points[0], players };
  });

  res.status(200).json({ game, team, playerIds, lastPoint, players });
}
