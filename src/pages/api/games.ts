import type { NextApiRequest as Req, NextApiResponse as Res } from "next";
import { db } from "@/database/drizzle";
import { games } from "@/database/schema";

export default async function handler(
  req: Req,
  res: Res<typeof games.$inferSelect[]>,
) {
  const result = await db.query.games.findMany();
  res.status(200).json(result);
}
