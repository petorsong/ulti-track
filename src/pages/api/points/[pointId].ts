import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { Point, Game, PlayerWithLineCount, TeamGroup } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{
    game: Game;
    playerIds: string[];
    lastPoint: Point;
    teamGroups: TeamGroup[];
    players: PlayerWithLineCount[];
  }>
) {
  const pointId = req.query.pointId as string;

  const { game, playerIds, lastPoint, teamGroups, players } = await db.transaction(async (tx) => {
    const { game, playerIds } = (await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, pointId),
      with: {
        game: {
          with: {
            points: {
              orderBy: (points, { desc }) => [desc(points.createdAt)],
            },
            team: {
              with: {
                teamGroups: {
                  where: (teamGroups, { eq }) => eq(teamGroups.isActive, true),
                },
              },
            },
          },
        },
      },
    }))!;
    const {
      points,
      team: { teamGroups },
    } = game;
    const players: PlayerWithLineCount[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      })
    ).map((player) => ({
      ...player, // TODO: consider aggregating this directly in SQL
      lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));

    return { game, playerIds, lastPoint: points[0], teamGroups, players };
  });

  res.status(200).json({ game, playerIds, lastPoint, teamGroups, players });
}
