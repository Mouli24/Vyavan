/**
 * Standard success response format
 */
export const successResponse = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Standard error response format
 */
export const errorResponse = (res, error, code = 'SERVER_ERROR', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error,
    code
  });
};
