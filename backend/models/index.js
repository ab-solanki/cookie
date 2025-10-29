/**
 * Cookie Configuration Data Models
 * Defines the structure for cookie configurations and related data
 */

const mongoose = require('mongoose');

// Cookie Category Schema
const cookieCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  required: {
    type: Boolean,
    default: false
  },
  cookies: [{
    type: String,
    trim: true
  }],
  order: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// UI Configuration Schema
const uiConfigSchema = new mongoose.Schema({
  primaryColor: {
    type: String,
    default: '#007bff',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  secondaryColor: {
    type: String,
    default: '#6c757d',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  borderRadius: {
    type: String,
    default: '8px'
  },
  fontFamily: {
    type: String,
    default: 'system-ui, sans-serif'
  },
  fontSize: {
    type: String,
    default: '14px'
  },
  animation: {
    type: Boolean,
    default: true
  },
  backdrop: {
    type: Boolean,
    default: true
  }
}, { _id: false });

// Text Configuration Schema
const textConfigSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  acceptAll: {
    type: String,
    required: true,
    trim: true
  },
  rejectAll: {
    type: String,
    required: true,
    trim: true
  },
  customize: {
    type: String,
    required: true,
    trim: true
  },
  save: {
    type: String,
    required: true,
    trim: true
  },
  close: {
    type: String,
    required: true,
    trim: true
  },
  moreInfo: {
    type: String,
    required: true,
    trim: true
  },
  cookiePolicy: {
    type: String,
    required: true,
    trim: true
  },
  privacyPolicy: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Cookie Settings Schema
const cookieSettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'ns-cookie-consent',
    trim: true
  },
  expiry: {
    type: Number,
    default: 365,
    min: 1,
    max: 3650
  },
  domain: {
    type: String,
    default: '',
    trim: true
  },
  path: {
    type: String,
    default: '/',
    trim: true
  },
  secure: {
    type: Boolean,
    default: false
  },
  sameSite: {
    type: String,
    enum: ['Strict', 'Lax', 'None'],
    default: 'Lax'
  }
}, { _id: false });

// Main Cookie Configuration Schema
const cookieConfigSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z]{2}(-[a-z]{2})?$/
  },
  country: {
    type: String,
    trim: true,
    uppercase: true,
    match: /^[A-Z]{2}$/
  },
  region: {
    type: String,
    trim: true
  },
  texts: {
    type: textConfigSchema,
    required: true
  },
  categories: {
    essential: {
      type: cookieCategorySchema,
      required: true
    },
    analytics: {
      type: cookieCategorySchema,
      required: true
    },
    marketing: {
      type: cookieCategorySchema,
      required: true
    },
    preferences: {
      type: cookieCategorySchema,
      required: true
    }
  },
  ui: {
    type: uiConfigSchema,
    required: true
  },
  cookieSettings: {
    type: cookieSettingsSchema,
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Update the updatedAt field before saving
cookieConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
cookieConfigSchema.index({ language: 1 });
cookieConfigSchema.index({ country: 1 });
cookieConfigSchema.index({ enabled: 1 });

// Consent Log Schema
const consentLogSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['accept', 'reject', 'customize', 'save', 'withdraw'],
    required: true
  },
  consentData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  },
  referrer: {
    type: String
  },
  pageUrl: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  version: {
    type: String,
    required: true
  }
});

// User Schema (for admin access)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const CookieConfig = mongoose.model('CookieConfig', cookieConfigSchema);
const ConsentLog = mongoose.model('ConsentLog', consentLogSchema);
const User = mongoose.model('User', userSchema);

module.exports = {
  CookieConfig,
  ConsentLog,
  User,
  schemas: {
    cookieCategorySchema,
    uiConfigSchema,
    textConfigSchema,
    cookieSettingsSchema,
    cookieConfigSchema,
    consentLogSchema,
    userSchema
  }
};

