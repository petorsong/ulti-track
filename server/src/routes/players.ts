import { Request, Response, NextFunction, Router } from 'express';
import { ApiResponse } from '../types';
import { db } from '../database/drizzle';
import { players } from '../database/schema';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(process.env.DATABASE_URL)
    const result = await db.query.players.findMany();
    console.log(result);
    const response: ApiResponse<typeof players.$inferSelect[]> = {
      success: true,
      data: result
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
