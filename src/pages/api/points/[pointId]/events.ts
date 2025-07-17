import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { db } from "@/database/drizzle";
import { games, pointEvents } from "@/database/schema";
import { eq } from "drizzle-orm";

export default async function handler(
  req: Req,
  res: Res<{redirectRoute: string}>,
) {
  const parsedBody: typeof pointEvents.$inferInsert[] = JSON.parse(req.body);
  console.log(req.body);
  
  const redirectRoute = await db.transaction(async (tx) => {
    await tx.insert(pointEvents).values(parsedBody);

    const scoreEvent = parsedBody[parsedBody.length-1];
    const point = await db.query.points.findFirst({
      where: (points, { eq }) => eq(points.id, scoreEvent.pointId!),
      with: { game : true },
    });
    const { id: gameId, teamScore, vsTeamScore } = point!.game!;
    if (scoreEvent.type == 'SCORE') {
      const newTeamScore = teamScore! + 1;
      await tx.update(games).set({ teamScore: newTeamScore }).where(eq(games.id, gameId));
      if (newTeamScore >= 15) {
        return `/games/${gameId}/summary`;
      }
    } else if (scoreEvent.type == 'VS_SCORE') {
      const newVsTeamScore = vsTeamScore! + 1;
      await tx.update(games).set({ vsTeamScore: newVsTeamScore }).where(eq(games.id, gameId));
      if (newVsTeamScore >= 15) {
        return `/games/${gameId}/summary`;
      }
    }
    return `/games/${gameId}`;
  });
  
  
  res.status(200).json({ redirectRoute });
}
