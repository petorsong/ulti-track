import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { points } from '@/database/schema';
import { parseJsonBody } from '@/lib/parseJsonBody';
import type { ApiError } from '@/types';

export default async function handler(req: Req, res: Res<{ pointId: string } | ApiError>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsedBody = parseJsonBody<typeof points.$inferInsert>(req.body);

  // TODO: save oOrD, side, ratio to points (maybe also score + vsScore?)
  const [result] = await db.insert(points).values(parsedBody).returning({ pointId: points.id });
  res.status(200).json(result);
}
