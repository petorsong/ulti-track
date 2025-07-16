// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { db } from "@/database/drizzle";
import { players } from "@/database/schema";
import type { NextApiRequest as Req, NextApiResponse as Res } from "next";

export default async function handler(
  req: Req,
  res: Res<typeof players.$inferSelect[]>,
) {
  const result = await db.query.players.findMany({
    with: {
      team: true
    }
  });
  res.status(200).json(result);
}
