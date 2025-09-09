import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import type { Game, PlayerWithLineCount, Point, TeamWithTeamGroups } from '@/database/schema';

export default async function handler(
  req: Req,
  res: Res<{ game: Game; team: TeamWithTeamGroups; lastPoint?: Point; players: PlayerWithLineCount[] }>
) {
  const gameId = req.query.gameId as string;

  const { game, team, lastPoint, players } = await db.transaction(async (tx) => {
    const game = (await tx.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, gameId),
    }))!;
    const points = await tx.query.points.findMany({
      where: (points, { eq }) => eq(points.gameId, gameId),
      orderBy: (points, { desc }) => [desc(points.createdAt)],
    });
    const team = (await tx.query.teams.findFirst({
      where: (teams, { eq }) => eq(teams.id, game.teamId),
      with: { teamGroups: { where: (teamGroups, { eq }) => eq(teamGroups.isActive, true) } }, // TODO: consider removing isActive?
    }))!;
    const players: PlayerWithLineCount[] = (
      await tx.query.players.findMany({
        where: (players, { inArray }) => inArray(players.id, game.activePlayerIds),
      })
    ).map((player) => ({
      ...player,
      lineCount: points.reduce((count, point) => count + (point.playerIds.includes(player.id) ? 1 : 0), 0),
    }));

    return { game, team, lastPoint: points.length > 0 ? points[0] : undefined, players };
  });

  res.status(200).json({ game, team, lastPoint, players });
}
