import { eq } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { games, type InsertPointEvent, pointEvents, points, type TimeoutsJson } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ redirectRoute: string }>) {
  const {
    events,
    nextPlayerIds,
    timeouts,
  }: { events: InsertPointEvent[]; nextPlayerIds: string[]; timeouts: TimeoutsJson } = JSON.parse(req.body);

  const redirectRoute = await db.transaction(async (tx) => {
    const scoreEvent = events[events.length - 1];
    if (scoreEvent.type == 'SCORE') {
      const secondLastEvent = events[events.length - 2];
      if (secondLastEvent && secondLastEvent.type == 'PASS') {
        secondLastEvent.eventJson = {
          assistType: 'ASSIST',
        };
        const thirdLastEvent = events[events.length - 3];
        if (thirdLastEvent && thirdLastEvent.type == 'PASS') {
          thirdLastEvent.eventJson = {
            assistType: 'HOCKEY_ASSIST',
          };
        }
      }
    }
    await tx.insert(pointEvents).values(events);

    const point = await db.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, scoreEvent.pointId),
      with: { game: true },
    });
    const { id: gameId, teamScore, vsTeamScore } = point!.game;
    if (scoreEvent.type == 'SCORE') {
      const newTeamScore = teamScore + 1;
      await tx
        .update(games)
        .set({ teamScore: newTeamScore, wasLastScoreUs: true, timeouts })
        .where(eq(games.id, gameId));
      if (newTeamScore >= 15) {
        return `/games/${gameId}/summary`;
      }
    } else {
      const newVsTeamScore = vsTeamScore + 1;
      await tx
        .update(games)
        .set({ vsTeamScore: newVsTeamScore, wasLastScoreUs: false, timeouts })
        .where(eq(games.id, gameId));
      if (newVsTeamScore >= 15) {
        return `/games/${gameId}/summary`;
      }
    }
    if (nextPlayerIds.length == 7) {
      const [{ pointId: newPointId }] = await db
        .insert(points)
        .values({ gameId, playerIds: nextPlayerIds })
        .returning({ pointId: points.id });

      return `/points/${newPointId}`;
    }
    return `/games/${gameId}`; // TODO: consider passing in partially selected line
  });

  res.status(200).json({ redirectRoute });
}
