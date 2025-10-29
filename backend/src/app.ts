/**
 * Modern TypeScript Application Entry Point
 * Using ES6+ features, async/await, and modern patterns
 */

import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { appConfig } from './config/index.js';
import { createControllers } from './controllers/index.js';
import {
  corsMiddleware,
  loggingMiddleware,
  errorHandlingMiddleware,
  requestIdMiddleware,
  securityHeadersMiddleware,
  createRateLimit
} from './middleware/index.js';
import { ApiError } from './types/index.js';

// ============================================================================
// Modern Application Class with ES6+ Features
// ============================================================================

class CookieConfigAPI {
  private readonly app: Application;
  private readonly controllers = createControllers();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware with modern composition
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      }
    }));

    // Compression middleware
    this.app.use(compression());

    // Trust proxy for rate limiting
    this.app.set('trust proxy', 1);

    // Request ID middleware
    this.app.use(requestIdMiddleware);

    // Security headers
    this.app.use(securityHeadersMiddleware);

    // CORS middleware
    this.app.use(corsMiddleware);

    // Body parsing middleware with modern limits
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Modern buffer verification
        try {
          JSON.parse(buf.toString());
        } catch (error) {
          throw new ApiError(400, 'Invalid JSON');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Logging middleware
    this.app.use(loggingMiddleware);

    // Rate limiting
    this.app.use(createRateLimit({
      windowMs: appConfig.api.rateLimit.windowMs,
      max: appConfig.api.rateLimit.max
    }));
  }

  /**
   * Setup routes with modern async/await patterns
   */
  private setupRoutes(): void {
    const { cookieConfig, consentLog } = this.controllers;

    // Health check endpoint
    this.app.get('/api/health', this.healthCheck.bind(this));

    // Public API routes
    this.app.get('/api/cookie-config/languages', 
      cookieConfig.getAvailableLanguages.bind(cookieConfig)
    );

    this.app.get('/api/cookie-config/:language', 
      cookieConfig.getConfigByLanguage.bind(cookieConfig)
    );

    this.app.get('/api/cookie-config', 
      cookieConfig.getConfig.bind(cookieConfig)
    );

    // Consent logging
    this.app.post('/api/consent/log', 
      consentLog.logConsent.bind(consentLog)
    );

    // Analytics endpoints
    this.app.get('/api/analytics/consent', 
      consentLog.getConsentAnalytics.bind(consentLog)
    );

    this.app.get('/api/analytics/stats', 
      consentLog.getConsentStats.bind(consentLog)
    );

    // Root endpoint with modern response
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Cookie Configuration API',
        version: '2.0.0',
        documentation: '/api/docs',
        health: '/api/health',
        timestamp: new Date().toISOString(),
        environment: appConfig.server.environment
      });
    });

    // 404 handler with modern error
    this.app.use('*', (req: Request, res: Response, next: NextFunction) => {
      next(new ApiError(404, 'Endpoint not found', [
        `Path: ${req.originalUrl}`,
        `Method: ${req.method}`
      ]));
    });
  }

  /**
   * Setup error handling with modern patterns
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandlingMiddleware);
  }

  /**
   * Health check endpoint with modern async/await
   */
  private async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Modern Promise.all for parallel checks
      const [dbStatus, memoryUsage] = await Promise.all([
        this.checkDatabaseHealth(),
        this.getMemoryUsage()
      ]);

      const health = {
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: appConfig.server.environment,
        checks: {
          database: dbStatus,
          memory: memoryUsage
        }
      };

      res.json(health);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Database health check with modern async/await
   */
  private async checkDatabaseHealth(): Promise<{ status: string; responseTime: number }> {
    const start = Date.now();
    
    try {
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * Memory usage check with modern process API
   */
  private getMemoryUsage(): Promise<{ used: number; total: number; percentage: number }> {
    return Promise.resolve({
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    });
  }

  /**
   * Connect to database with modern async/await
   */
  async connectDatabase(): Promise<void> {
    try {
      const mongoUri = appConfig.database.mongodb.uri;
      
      await mongoose.connect(mongoUri, appConfig.database.mongodb.options);
      
      console.log('✅ Connected to MongoDB');
      
      // Modern event listeners with arrow functions
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Initialize default data with modern async/await
   */
  async initializeDefaultData(): Promise<void> {
    try {
      const { CookieConfig } = await import('./models/index.js');
      const { getDefaultConfig } = await import('./utils/index.js');
      
      const count = await CookieConfig.countDocuments();
      
      if (count === 0) {
        console.log('📝 Initializing default configurations...');
        
        // Modern array with async operations
        const languages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'da', 'no'];
        
        // Modern Promise.all for parallel operations
        await Promise.all(
          languages.map(async (language) => {
            const defaultConfig = getDefaultConfig(language);
            if (defaultConfig) {
              await CookieConfig.create({
                language,
                ...defaultConfig,
                enabled: true
              });
              console.log(`✅ Created default configuration for ${language}`);
            }
          })
        );
        
        console.log('🎉 Default configurations initialized');
      } else {
        console.log(`📊 Found ${count} existing configurations`);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize default data:', error);
      throw error;
    }
  }

  /**
   * Start the server with modern async/await
   */
  async start(): Promise<void> {
    try {
      // Modern sequential async operations
      await this.connectDatabase();
      await this.initializeDefaultData();
      
      // Start server with modern Promise
      await new Promise<void>((resolve, reject) => {
        const server = this.app.listen(appConfig.server.port, appConfig.server.host, () => {
          console.log('🚀 Cookie Configuration API Server Started');
          console.log(`📍 Server running on http://${appConfig.server.host}:${appConfig.server.port}`);
          console.log(`🌍 Environment: ${appConfig.server.environment}`);
          console.log(`📚 API Documentation: http://${appConfig.server.host}:${appConfig.server.port}/api/docs`);
          console.log(`❤️ Health Check: http://${appConfig.server.host}:${appConfig.server.port}/api/health`);
          console.log('─'.repeat(50));
          resolve();
        });

        server.on('error', reject);
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown with modern async/await
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down server...');
    
    try {
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// ============================================================================
// Modern Process Event Handlers
// ============================================================================

const setupProcessHandlers = (app: CookieConfigAPI): void => {
  // Modern event handlers with arrow functions
  const gracefulShutdown = () => {
    console.log('Received shutdown signal');
    app.shutdown();
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Modern error handlers
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

// ============================================================================
// Application Bootstrap
// ============================================================================

const bootstrap = async (): Promise<void> => {
  try {
    const app = new CookieConfigAPI();
    setupProcessHandlers(app);
    await app.start();
  } catch (error) {
    console.error('❌ Failed to bootstrap application:', error);
    process.exit(1);
  }
};

// ============================================================================
// Start Application
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrap();
}

export default CookieConfigAPI;

