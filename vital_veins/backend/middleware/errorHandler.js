/**
 * Global Error Handling Middleware
 * Centralized error handling for all routes
 */

// Custom Error Class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Main Error Handler Middleware
 * Catches all errors and returns formatted response
 */
const errorHandler = (err, req, res, next) => {
  // Set default error properties
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error details
  console.error('❌ [ERROR]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    statusCode: err.statusCode,
    message: err.message,
    userId: req.user?._id,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation Error',
      errors
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: 'Token has expired'
    });
  }

  // Cast Error (Invalid MongoDB ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid ID format'
    });
  }

  // Operational Errors (known errors)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message
    });
  }

  // Programming Errors (unknown errors)
  // In production, don't leak error details
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong! Please try again later.' 
    : err.message;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Not Found Middleware
 * Handles 404 errors for undefined routes
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`
  });
};

/**
 * Utility function to throw errors
 */
const throwError = (message, statusCode = 500) => {
  throw new AppError(message, statusCode);
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFoundHandler,
  throwError
};
