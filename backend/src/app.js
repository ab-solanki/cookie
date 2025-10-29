/**
 * Main Backend Application Entry Point
 * Cookie Configuration API Server
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const config = require('./config');
const routes = require('./routes');
const { corsMiddleware, loggingMiddleware, errorHandlingMiddleware } = require('./middleware');

class CookieConfigAPI {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // Compression middleware
    this.app.use(compression());
    
    // CORS middleware
    this.app.use(corsMiddleware);
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Logging middleware
    this.app.use(loggingMiddleware);
    
    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // API routes
    this.app.use(config.api.basePath, routes);
    
    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Cookie Configuration API',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/api/health',
        timestamp: new Date().toISOString()
      });
    });
    
    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.app.use(errorHandlingMiddleware);
  }

  /**
   * Connect to database
   */
  async connectDatabase() {
    try {
      const mongoUri = config.database.mongodb.uri;
      await mongoose.connect(mongoUri, config.database.mongodb.options);
      
      console.log('✅ Connected to MongoDB');
      
      // Handle connection events
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
   * Initialize default data
   */
  async initializeDefaultData() {
    try {
      const { CookieConfig } = require('./models');
      const { getDefaultConfig } = require('./utils');
      
      // Check if we have any configurations
      const count = await CookieConfig.countDocuments();
      
      if (count === 0) {
        console.log('📝 Initializing default configurations...');
        
        // Create default configurations for common languages
        const languages = ['en', 'de', 'fr', 'es', 'it', 'pt', 'nl', 'sv', 'da', 'no'];
        
        for (const language of languages) {
          const defaultConfig = getDefaultConfig(language);
          if (defaultConfig) {
            await CookieConfig.create({
              language,
              ...defaultConfig,
              enabled: true
            });
            console.log(`✅ Created default configuration for ${language}`);
          }
        }
        
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
   * Start the server
   */
  async start() {
    try {
      // Connect to database
      await this.connectDatabase();
      
      // Initialize default data
      await this.initializeDefaultData();
      
      // Start server
      const port = config.server.port;
      const host = config.server.host;
      
      this.app.listen(port, host, () => {
        console.log('🚀 Cookie Configuration API Server Started');
        console.log(`📍 Server running on http://${host}:${port}`);
        console.log(`🌍 Environment: ${config.server.environment}`);
        console.log(`📚 API Documentation: http://${host}:${port}/api/docs`);
        console.log(`❤️ Health Check: http://${host}:${port}/api/health`);
        console.log('─'.repeat(50));
      });
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down server...');
    
    try {
      // Close database connection
      await mongoose.connection.close();
      console.log('✅ Database connection closed');
      
      // Close server
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  app.shutdown();
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  app.shutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Create and start the application
const app = new CookieConfigAPI();
app.start();

module.exports = app;

