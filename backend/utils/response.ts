import { Response } from 'express';

/**
 * Standard success response format
 */
export const successResponse = (res: Response, data: any = {}, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Standard error response format
 */
export const errorResponse = (res: Response, error: string, code: string = 'SERVER_ERROR', statusCode: number = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code
  });
};
