import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type Game, type PlayerWithLineCount, type TeamGroup } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ playerIds: string[]; game: Game; players: PlayerWithLineCount[]; teamGroups: TeamGroup[] }>
) {
  const pointId = req.query.pointId as string;

  const { playerIds, game, players, teamGroups } = await db.transaction(async (tx) => {
    const {
      game: { id: gameId },
      playerIds,
    } = (await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, pointId),
      with: { game: true },
    }))!;

    const game = (await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, gameId),
      with: { points: true },
    }))!;
    const teamGroups = await tx.query.teamGroups.findMany({
      where: (teamGroups, { and, eq }) => and(eq(teamGroups.teamId, game.teamId), eq(teamGroups.isActive, true)),
    });
    const players: PlayerWithLineCount[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      })
    ).map((player) => ({
      ...player,
      lineCount: game.points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));
    return { playerIds, game, players, teamGroups };
  });

  res.status(200).json({ playerIds, game, players, teamGroups });
}
