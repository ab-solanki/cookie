/**
 * Modern TypeScript Middleware with ES6+ Features
 * Using modern patterns and TypeScript decorators
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ApiError, UnauthorizedError, ForbiddenError } from '../types/index.js';
import { appConfig } from '../config/index.js';
import type { AuthenticatedRequest, UserRole } from '../types/index.js';

// ============================================================================
// Authentication Middleware with Modern Patterns
// ============================================================================

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Modern destructuring with optional chaining
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('Access denied. No token provided.');
    }

    // Modern JWT verification with type assertion
    const decoded = jwt.verify(token, appConfig.security.jwt.secret) as {
      id: string;
      username: string;
      role: UserRole;
    };

    // Modern object assignment
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token.'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired.'));
    } else {
      next(error);
    }
  }
};

// ============================================================================
// Role-based Authorization Middleware
// ============================================================================

export const requireRole = (allowedRoles: readonly UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions.'));
      return;
    }

    next();
  };
};

// ============================================================================
// Language Validation Middleware
// ============================================================================

export const validateLanguage = (req: Request, res: Response, next: NextFunction): void => {
  const { language } = req.params;
  
  // Modern regex validation
  const languageRegex = /^[a-z]{2}(-[a-z]{2})?$/;
  
  if (!languageRegex.test(language)) {
    next(new ApiError(400, 'Invalid language format. Use ISO 639-1 format (e.g., en, de, en-US)'));
    return;
  }
  
  next();
};

// ============================================================================
// Modern Rate Limiting Middleware
// ============================================================================

export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  const {
    windowMs = appConfig.api.rateLimit.windowMs,
    max = appConfig.api.rateLimit.max,
    message = 'Too many requests. Please try again later.',
    skipSuccessfulRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    // Modern key generator
    keyGenerator: (req: Request) => {
      return req.ip ?? 'unknown';
    },
    // Modern skip function
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health';
    }
  });
};

// ============================================================================
// CORS Middleware with Modern Configuration
// ============================================================================

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  const allowedOrigins = appConfig.api.cors.origin === '*' 
    ? ['*'] 
    : appConfig.api.cors.origin.split(',');

  // Modern array includes check
  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin ?? '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', appConfig.api.cors.credentials.toString());
  }

  // Modern method check
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// ============================================================================
// Request Logging Middleware with Modern Features
// ============================================================================

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Modern event listener with arrow function
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;
    
    // Modern template literal with conditional logging
    const logMessage = `${method} ${path} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 400) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });
  
  next();
};

// ============================================================================
// Error Handling Middleware with Modern Patterns
// ============================================================================

export const errorHandlingMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Middleware error:', error);
  
  // Modern error type checking
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: error.details,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Mongoose validation error handling
  if (error.name === 'ValidationError') {
    const errors = Object.values((error as any).errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: errors,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    res.status(400).json({
      success: false,
      error: `${field} already exists`,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// ============================================================================
// Request Body Validation Middleware
// ============================================================================

export const validateRequestBody = <T>(validator: (data: unknown) => { isValid: boolean; errors?: string[] }) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { isValid, errors } = validator(req.body);
    
    if (!isValid) {
      res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: errors,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  };
};

// ============================================================================
// Request ID Middleware
// ============================================================================

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Modern UUID generation (simplified)
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// ============================================================================
// Security Headers Middleware
// ============================================================================

export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Modern security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Modern CSP header
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  next();
};

// ============================================================================
// Request Size Limiting Middleware
// ============================================================================

export const requestSizeLimitMiddleware = (limit: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const size = Number.parseInt(contentLength, 10);
      const limitBytes = parseSizeLimit(limit);
      
      if (size > limitBytes) {
        res.status(413).json({
          success: false,
          error: 'Request entity too large',
          timestamp: new Date().toISOString()
        });
        return;
      }
    }
    
    next();
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

const parseSizeLimit = (limit: string): number => {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = limit.match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/i);
  if (!match) return 10 * 1024 * 1024; // Default 10MB
  
  const [, size, unit] = match;
  return Number.parseFloat(size) * units[unit.toLowerCase()];
};

// ============================================================================
// Middleware Composition
// ============================================================================

export const composeMiddleware = (...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    let index = 0;
    
    const runNext = (): void => {
      if (index < middlewares.length) {
        middlewares[index++](req, res, runNext);
      } else {
        next();
      }
    };
    
    runNext();
  };
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  authMiddleware,
  requireRole,
  validateLanguage,
  createRateLimit,
  corsMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  validateRequestBody,
  requestIdMiddleware,
  securityHeadersMiddleware,
  requestSizeLimitMiddleware,
  composeMiddleware
};

