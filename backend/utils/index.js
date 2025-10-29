/**
 * Utility Functions for Cookie Configuration Backend
 * Validation, caching, and helper functions
 */

const Joi = require('joi');

/**
 * Validation schemas
 */
const cookieCategorySchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().required().trim().min(1).max(500),
  required: Joi.boolean().default(false),
  cookies: Joi.array().items(Joi.string().trim()).default([]),
  order: Joi.number().integer().min(0).default(0),
  enabled: Joi.boolean().default(true)
});

const uiConfigSchema = Joi.object({
  primaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#007bff'),
  secondaryColor: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#6c757d'),
  borderRadius: Joi.string().default('8px'),
  fontFamily: Joi.string().default('system-ui, sans-serif'),
  fontSize: Joi.string().default('14px'),
  animation: Joi.boolean().default(true),
  backdrop: Joi.boolean().default(true)
});

const textConfigSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().required().trim().min(1).max(500),
  acceptAll: Joi.string().required().trim().min(1).max(50),
  rejectAll: Joi.string().required().trim().min(1).max(50),
  customize: Joi.string().required().trim().min(1).max(50),
  save: Joi.string().required().trim().min(1).max(50),
  close: Joi.string().required().trim().min(1).max(50),
  moreInfo: Joi.string().required().trim().min(1).max(50),
  cookiePolicy: Joi.string().required().trim().min(1).max(50),
  privacyPolicy: Joi.string().required().trim().min(1).max(50)
});

const cookieSettingsSchema = Joi.object({
  name: Joi.string().default('ns-cookie-consent').trim().min(1).max(50),
  expiry: Joi.number().integer().min(1).max(3650).default(365),
  domain: Joi.string().allow('').trim().max(100),
  path: Joi.string().default('/').trim().max(100),
  secure: Joi.boolean().default(false),
  sameSite: Joi.string().valid('Strict', 'Lax', 'None').default('Lax')
});

const cookieConfigSchema = Joi.object({
  language: Joi.string().pattern(/^[a-z]{2}(-[a-z]{2})?$/).required(),
  country: Joi.string().pattern(/^[A-Z]{2}$/).optional(),
  region: Joi.string().trim().optional(),
  texts: textConfigSchema.required(),
  categories: Joi.object({
    essential: cookieCategorySchema.required(),
    analytics: cookieCategorySchema.required(),
    marketing: cookieCategorySchema.required(),
    preferences: cookieCategorySchema.required()
  }).required(),
  ui: uiConfigSchema.required(),
  cookieSettings: cookieSettingsSchema.required(),
  enabled: Joi.boolean().default(true),
  version: Joi.string().default('1.0.0')
});

/**
 * Validate cookie configuration
 */
const validateCookieConfig = (config) => {
  const { error, value } = cookieConfigSchema.validate(config, { 
    abortEarly: false,
    stripUnknown: true 
  });
  
  return {
    isValid: !error,
    errors: error ? error.details.map(detail => detail.message) : [],
    data: value
  };
};

/**
 * Cache service
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.config = require('../config').cache;
  }

  isEnabled() {
    return this.config.enabled;
  }

  async get(key) {
    if (!this.isEnabled()) return null;
    
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  async set(key, data, ttl = this.config.ttl) {
    if (!this.isEnabled()) return;
    
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async delete(key) {
    if (!this.isEnabled()) return;
    this.cache.delete(key);
  }

  async clear() {
    if (!this.isEnabled()) return;
    this.cache.clear();
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }
}

const cacheService = new CacheService();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

/**
 * Default configurations for different languages
 */
const defaultConfigurations = {
  en: {
    texts: {
      title: 'Cookie Consent',
      description: 'We use cookies to enhance your browsing experience.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize',
      save: 'Save Preferences',
      close: 'Close',
      moreInfo: 'More Information',
      cookiePolicy: 'Cookie Policy',
      privacyPolicy: 'Privacy Policy'
    },
    categories: {
      essential: {
        name: 'Essential',
        description: 'These cookies are necessary for the website to function properly.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analytics',
        description: 'These cookies help us understand how visitors interact with our website.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'These cookies are used to deliver personalized advertisements.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Preferences',
        description: 'These cookies remember your preferences and settings.',
        required: false,
        cookies: ['theme', 'language', 'timezone']
      }
    },
    ui: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      borderRadius: '8px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      animation: true,
      backdrop: true
    },
    cookieSettings: {
      name: 'ns-cookie-consent',
      expiry: 365,
      domain: '',
      path: '/',
      secure: false,
      sameSite: 'Lax'
    }
  },
  de: {
    texts: {
      title: 'Cookie-Einstellungen',
      description: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.',
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      customize: 'Anpassen',
      save: 'Einstellungen speichern',
      close: 'Schließen',
      moreInfo: 'Weitere Informationen',
      cookiePolicy: 'Cookie-Richtlinie',
      privacyPolicy: 'Datenschutzrichtlinie'
    },
    categories: {
      essential: {
        name: 'Notwendig',
        description: 'Diese Cookies sind für das ordnungsgemäße Funktionieren der Website erforderlich.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analytisch',
        description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'Diese Cookies werden zur Bereitstellung personalisierter Werbung verwendet.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Einstellungen',
        description: 'Diese Cookies speichern Ihre Präferenzen und Einstellungen.',
        required: false,
        cookies: ['theme', 'language', 'timezone']
      }
    },
    ui: {
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
      borderRadius: '8px',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      animation: true,
      backdrop: true
    },
    cookieSettings: {
      name: 'ns-cookie-consent',
      expiry: 365,
      domain: '',
      path: '/',
      secure: false,
      sameSite: 'Lax'
    }
  }
};

/**
 * Get default configuration for a language
 */
const getDefaultConfig = (language) => {
  return defaultConfigurations[language] || defaultConfigurations.en;
};

/**
 * Generate API response
 */
const generateResponse = (success, data = null, error = null, meta = {}) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (success) {
    if (data !== null) response.data = data;
  } else {
    response.error = error;
  }

  return response;
};

/**
 * Sanitize input data
 */
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

module.exports = {
  validateCookieConfig,
  cacheService,
  defaultConfigurations,
  getDefaultConfig,
  generateResponse,
  sanitizeInput,
  schemas: {
    cookieCategorySchema,
    uiConfigSchema,
    textConfigSchema,
    cookieSettingsSchema,
    cookieConfigSchema
  }
};

