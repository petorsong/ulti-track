import { Request as Req, Response as Res, NextFunction as Next, Router } from 'express';
import { ApiResponse } from './types';
import { db } from './database/drizzle';
import { games, players } from './database/schema';

const router = Router();

router.post('/teams/:teamId/game', async (req: Req, res: Res, next: Next) => {
  try {
    const { vsTeamName }: typeof games.$inferInsert = req.body;

    if (!vsTeamName) {
      return res.status(400).json({
        success: false,
        error: 'Opponent team name required'
      });
    }

    const [result] = await db.insert(games).values(req.body).returning({gameId: games.id});
    const response: ApiResponse<String> = {
      success: true,
      data: result.gameId
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

// GET  /teams/:id/players
// POST /teams/:id/game
// POST /games/:id/point
// GET  /games/:id/players-for-line
// POST /points/:id/event

// clear this/current point

router.get('/', async (req: Req, res: Res, next: Next) => {
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

// export const createUser = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { name, email }: CreateUserRequest = req.body;
    
//     if (!name || !email) {
//       return res.status(400).json({
//         success: false,
//         error: 'Name and email are required'
//       });
//     }

//     const result = await pool.query(
//       'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
//       [name, email]
//     );
    
//     const response: ApiResponse<User> = {
//       success: true,
//       data: result.rows[0]
//     };
//     res.status(201).json(response);
//   } catch (error) {
//     next(error);
//   }
// };

// export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { id } = req.params;
//     const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
//     if (result.rows.length === 0) {
//       return res.status(404).json({
//         success: false,
//         error: 'User not found'
//       });
//     }

//     const response: ApiResponse<User> = {
//       success: true,
//       data: result.rows[0]
//     };
//     res.json(response);
//   } catch (error) {
//     next(error);
//   }
// };


// router.post('/', createUser);
// router.get('/:id', getUserById);

export default router;
