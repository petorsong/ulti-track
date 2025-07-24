import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { points } from '@/database/schema';

export default async function handler(req: Req, res: Res<{ pointId: string }>) {
  const parsedBody: typeof points.$inferInsert = JSON.parse(req.body);

  const [result] = await db.insert(points).values(parsedBody).returning({ pointId: points.id });
  res.status(200).json(result);
}
