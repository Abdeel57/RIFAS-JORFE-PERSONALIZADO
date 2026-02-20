import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ [ERROR HANDLER]', {
    path: req.path,
    method: req.method,
    errorType: err.constructor.name,
    errorMessage: err.message,
    isZodError: err instanceof ZodError,
    isAppError: err instanceof AppError,
    statusCode: err instanceof AppError ? err.statusCode : undefined,
  });

  if (err instanceof ZodError) {
    console.error('📋 [VALIDATION ERROR]', err.errors);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  console.error('💥 [UNEXPECTED ERROR]', err);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};


