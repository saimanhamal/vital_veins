/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

const rateLimit = require('express-rate-limit');

/**
 * General API Rate Limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => req.user && req.user.role === 'admin', // Don't rate limit admins
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many requests, please try again later'
    });
  }
});

/**
 * Strict Rate Limiter for Auth Endpoints
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: false, // Count failed requests
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }
});

/**
 * Registration Rate Limiter
 * 3 registrations per hour per IP
 */
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: 'Too many accounts created from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many registration attempts. Please try again after 1 hour.'
    });
  }
});

/**
 * Create Request Rate Limiter
 * 10 requests per hour per user
 */
const createRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: (req) => req.user?._id || req.ip, // Rate limit by user ID or IP
  message: 'Too many requests created, please try again later.',
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'You have exceeded the maximum number of requests. Please try again later.'
    });
  }
});

/**
 * Password Reset Rate Limiter
 * 3 attempts per hour
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body.email || req.ip,
  message: 'Too many password reset attempts',
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      statusCode: 429,
      message: 'Too many password reset attempts. Please try again after 1 hour.'
    });
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  registrationLimiter,
  createRequestLimiter,
  passwordResetLimiter
};
