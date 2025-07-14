import { Request, Response, NextFunction, Router } from 'express';
import { ApiResponse } from '../types';
import { db } from '../database/drizzle';
import { players } from '../database/schema';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query.players.findMany({
      with: {
        team: true
      }
    });
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
