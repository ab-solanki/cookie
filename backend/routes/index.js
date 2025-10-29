/**
 * API Routes for Cookie Configuration Management
 * Defines all the endpoints for the cookie configuration API
 */

const express = require('express');
const { CookieConfigController, ConsentLogController } = require('../controllers');
const { authMiddleware, validateLanguage, rateLimitMiddleware } = require('../middleware');

const router = express.Router();

// Initialize controllers
const cookieConfigController = new CookieConfigController();
const consentLogController = new ConsentLogController();

// Public routes (no authentication required)
router.get('/cookie-config/languages', 
  rateLimitMiddleware,
  cookieConfigController.getAvailableLanguages.bind(cookieConfigController)
);

router.get('/cookie-config/:language', 
  rateLimitMiddleware,
  validateLanguage,
  cookieConfigController.getConfigByLanguage.bind(cookieConfigController)
);

router.get('/cookie-config', 
  rateLimitMiddleware,
  cookieConfigController.getConfig.bind(cookieConfigController)
);

// Consent logging (public)
router.post('/consent/log', 
  rateLimitMiddleware,
  consentLogController.logConsent.bind(consentLogController)
);

// Protected routes (require authentication)
router.use(authMiddleware);

// Admin routes for configuration management
router.get('/admin/cookie-config', 
  cookieConfigController.getAllConfigs.bind(cookieConfigController)
);

router.put('/admin/cookie-config/:language', 
  cookieConfigController.createOrUpdateConfig.bind(cookieConfigController)
);

router.delete('/admin/cookie-config/:language', 
  cookieConfigController.deleteConfig.bind(cookieConfigController)
);

// Analytics routes
router.get('/admin/analytics/consent', 
  consentLogController.getConsentAnalytics.bind(consentLogController)
);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cookie Configuration API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Route error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;

