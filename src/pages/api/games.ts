import type { NextApiRequest as Req, NextApiResponse as Res } from 'next';
import { db } from '@/database/drizzle';
import { type Game } from '@/database/schema';

export default async function handler(req: Req, res: Res<Game[]>) {
  const result = await db.query.games.findMany();
  res.status(200).json(result);
}
