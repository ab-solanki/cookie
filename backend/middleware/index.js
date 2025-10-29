/**
 * Middleware for Cookie Configuration API
 * Authentication, validation, and error handling middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Authentication middleware
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, config.security.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid token.'
    });
  }
};

/**
 * Language validation middleware
 */
const validateLanguage = (req, res, next) => {
  const { language } = req.params;
  
  // Validate language format (ISO 639-1)
  const languageRegex = /^[a-z]{2}(-[a-z]{2})?$/;
  
  if (!languageRegex.test(language)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid language format. Use ISO 639-1 format (e.g., en, de, en-US)'
    });
  }
  
  next();
};

/**
 * Rate limiting middleware
 */
const rateLimitMiddleware = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const clientIp = req.ip;
  const now = Date.now();
  const windowMs = config.api.rateLimit.windowMs;
  const maxRequests = config.api.rateLimit.max;

  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const clientData = global.rateLimitStore.get(clientIp) || { count: 0, resetTime: now + windowMs };

  // Reset if window has passed
  if (now > clientData.resetTime) {
    clientData.count = 0;
    clientData.resetTime = now + windowMs;
  }

  // Check if limit exceeded
  if (clientData.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }

  // Increment counter
  clientData.count++;
  global.rateLimitStore.set(clientIp, clientData);

  next();
};

/**
 * CORS middleware
 */
const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = config.api.cors.origin === '*' ? ['*'] : config.api.cors.origin.split(',');

  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', config.api.cors.credentials);
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

/**
 * Request logging middleware
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandlingMiddleware = (error, req, res, next) => {
  console.error('Middleware error:', error);
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: `${field} already exists`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

/**
 * Request body validation middleware
 */
const validateRequestBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: error.details.map(detail => detail.message)
      });
    }
    
    next();
  };
};

module.exports = {
  authMiddleware,
  validateLanguage,
  rateLimitMiddleware,
  corsMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  validateRequestBody
};

