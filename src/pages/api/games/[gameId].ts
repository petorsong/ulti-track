import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { Game, PlayerWithLineCount, Point, TeamGroup } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ game: Game; lastPoint?: Point; teamGroups: TeamGroup[]; players: PlayerWithLineCount[] }>
) {
  const gameId = req.query.gameId as string;

  const { game, lastPoint, teamGroups, players } = await db.transaction(async (tx) => {
    const game = (await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, gameId),
    }))!;
    const points = await tx.query.points.findMany({
      where: (points, { eq }) => eq(points.gameId, gameId),
      orderBy: (points, { desc }) => [desc(points.createdAt)],
    });
    const teamGroups = await tx.query.teamGroups.findMany({
      where: (teamGroups, { and, eq }) => and(eq(teamGroups.teamId, game.teamId), eq(teamGroups.isActive, true)),
    });
    const players: PlayerWithLineCount[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      })
    ).map((player) => ({
      ...player,
      lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));

    return { game, lastPoint: points.length > 0 ? points[0] : undefined, teamGroups, players };
  });

  res.status(200).json({ game, lastPoint, teamGroups, players });
}
