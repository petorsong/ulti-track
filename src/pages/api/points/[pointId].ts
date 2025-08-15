import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type Game, type PlayerWithLineCount, points, type TeamGroup } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ point: typeof points.$inferSelect; game: Game; players: PlayerWithLineCount[]; teamGroups: TeamGroup[] }>
) {
  const pointId = req.query.pointId as string;

  // if (typeof gameId !== 'string') {
  //   return res.status(400).json({
  //     error: 'Invalid game ID'
  //   });
  // }

  const { point, game, players, teamGroups } = await db.transaction(async (tx) => {
    const point = (await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, pointId),
      with: { game: true },
    }))!;
    const game = (await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, `${point!.game.id}`),
      with: { points: true },
    }))!;
    const rawPlayers = await tx.query.players.findMany({
      where: (players, { inArray }) => inArray(players.id, game!.activePlayerIds),
    });
    const teamGroups = await tx.query.teamGroups.findMany({
      where: (teamGroups, { and, eq }) => and(eq(teamGroups.teamId, game.teamId), eq(teamGroups.isActive, true)),
    });

    const players: PlayerWithLineCount[] = rawPlayers.map((player) => ({
      ...player,
      lineCount: game.points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));
    return { point, game, players, teamGroups };
  });

  // if (result == null) {
  //   return res.status(400).json({
  //     error: 'Game not found'
  //   });
  // }
  res.status(200).json({ point, game, players, teamGroups });
}
