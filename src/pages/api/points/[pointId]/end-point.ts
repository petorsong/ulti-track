import { eq } from 'drizzle-orm';
import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { normalizeScoreAssists } from '@/lib/normalizeScoreAssists';
import { parseJsonBody } from '@/lib/parseJsonBody';
import { games, type InsertPointEvent, pointEvents, points, type TimeoutsJson } from '@/database/schema';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ redirectRoute: string } | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    events,
    nextPlayerIds,
    timeouts,
  } = parseJsonBody<{
    events: InsertPointEvent[];
    nextPlayerIds: string[];
    timeouts: TimeoutsJson;
  }>(req.body);

  const normalizedEvents = normalizeScoreAssists(events);

  const redirectRoute = await db.transaction(async (tx) => {
    const scoreEvent = normalizedEvents[normalizedEvents.length - 1];
    await tx.insert(pointEvents).values(normalizedEvents);
    await tx.update(points).set({ isActive: false }).where(eq(points.id, scoreEvent.pointId));

    const point = await tx.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, scoreEvent.pointId),
      with: { game: true },
    });
    if (!point?.game) {
      return null;
    }

    const { id: gameId, teamScore, vsTeamScore } = point.game;
    if (scoreEvent.type === 'SCORE') {
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
    if (nextPlayerIds.length === 7) {
      const [{ pointId: newPointId }] = await tx
        .insert(points)
        .values({ gameId, playerIds: nextPlayerIds })
        .returning({ pointId: points.id });

      return `/points/${newPointId}`;
    }
    return `/games/${gameId}`; // TODO: consider passing in partially selected line
  });

  if (!redirectRoute) {
    return res.status(404).json({ error: 'Point not found' });
  }

  res.status(200).json({ redirectRoute });
}
