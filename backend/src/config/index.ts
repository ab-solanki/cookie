/**
 * Modern Configuration Management with TypeScript
 * Using ES6+ features and environment-based configuration
 */

import { config } from 'dotenv';
import type { AppConfig } from './types/index.js';

// Load environment variables
config();

// ============================================================================
// Environment Validation
// ============================================================================

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET'
] as const;

const validateEnvironment = (): void => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// ============================================================================
// Configuration Factory
// ============================================================================

const createConfig = (): AppConfig => {
  validateEnvironment();

  return {
    server: {
      port: Number.parseInt(process.env.PORT ?? '3000', 10),
      host: process.env.HOST ?? 'localhost',
      environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') ?? 'development'
    },

    database: {
      mongodb: {
        uri: process.env.MONGODB_URI!,
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      }
    },

    api: {
      version: process.env.API_VERSION ?? 'v1',
      basePath: process.env.API_BASE_PATH ?? '/api',
      cors: {
        origin: process.env.CORS_ORIGIN ?? '*',
        credentials: process.env.CORS_CREDENTIALS === 'true'
      },
      rateLimit: {
        windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 minutes
        max: Number.parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10)
      }
    },

    cache: {
      enabled: process.env.CACHE_ENABLED === 'true',
      ttl: Number.parseInt(process.env.CACHE_TTL ?? '300', 10), // 5 minutes
      redis: process.env.REDIS_HOST ? {
        host: process.env.REDIS_HOST,
        port: Number.parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD
      } : undefined
    },

    security: {
      jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '24h'
      },
      bcrypt: {
        saltRounds: Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10)
      }
    },

    logging: {
      level: (process.env.LOG_LEVEL as 'error' | 'warn' | 'info' | 'debug') ?? 'info',
      format: process.env.LOG_FORMAT ?? 'combined'
    }
  };
};

// ============================================================================
// Configuration Instance
// ============================================================================

export const appConfig = createConfig();

// ============================================================================
// Configuration Utilities
// ============================================================================

export const isDevelopment = (): boolean => appConfig.server.environment === 'development';
export const isProduction = (): boolean => appConfig.server.environment === 'production';
export const isStaging = (): boolean => appConfig.server.environment === 'staging';

export const getDatabaseUri = (): string => appConfig.database.mongodb.uri;
export const getServerPort = (): number => appConfig.server.port;
export const getServerHost = (): string => appConfig.server.host;

export const getJwtSecret = (): string => appConfig.security.jwt.secret;
export const getJwtExpiresIn = (): string => appConfig.security.jwt.expiresIn;

export const isCacheEnabled = (): boolean => appConfig.cache.enabled;
export const getCacheTtl = (): number => appConfig.cache.ttl;

// ============================================================================
// Default Export
// ============================================================================

export default appConfig;

