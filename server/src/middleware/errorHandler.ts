import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error.message);
  
  // Database errors
  if (error.message.includes('duplicate key')) {
    return res.status(400).json({
      success: false,
      error: 'Email already exists'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
