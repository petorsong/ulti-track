import { Request, Response, NextFunction, Router } from 'express';
import { ApiResponse } from './types';
import { db } from './database/drizzle';
import { players } from './database/schema';

const router = Router();

// GET  /teams/:id/players
// POST /teams/:id/game
// POST /games/:id/point
// GET  /games/:id/players-for-line
// POST /points/:id/event

// clear this/current point

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
