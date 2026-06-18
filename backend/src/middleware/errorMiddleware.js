import ApiError from '../utils/apiError.js';

export function notFound(_req, _res, next) {
  next(new ApiError(404, 'Route not found'));
}

export function errorHandler(error, _req, res, _next) {
  if (error?.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : error.message || 'Upload failed';

    return res.status(413).json({
      success: false,
      message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });
}