/**
 * Modern TypeScript Database Models with ES6+ Features
 * Using Mongoose with TypeScript and modern patterns
 */

import { Schema, model, Document, Types } from 'mongoose';
import type {
  ICookieConfig,
  IConsentLog,
  IUser,
  CookieCategory,
  CookieCategories,
  UIConfig,
  TextConfig,
  CookieSettings,
  ConsentAction,
  UserRole
} from '../types/index.js';

// ============================================================================
// Schema Definitions with Modern TypeScript
// ============================================================================

const cookieCategorySchema = new Schema<CookieCategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
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
    default: 0,
    min: 0
  },
  enabled: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const uiConfigSchema = new Schema<UIConfig>({
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

const textConfigSchema = new Schema<TextConfig>({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 500
  },
  acceptAll: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  rejectAll: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  customize: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  save: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  close: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  moreInfo: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  cookiePolicy: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  },
  privacyPolicy: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50
  }
}, { _id: false });

const cookieSettingsSchema = new Schema<CookieSettings>({
  name: {
    type: String,
    default: 'ns-cookie-consent',
    trim: true,
    minlength: 1,
    maxlength: 50
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
    trim: true,
    maxlength: 100
  },
  path: {
    type: String,
    default: '/',
    trim: true,
    maxlength: 100
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

// ============================================================================
// Main Cookie Configuration Schema
// ============================================================================

const cookieConfigSchema = new Schema<ICookieConfig>({
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
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  versionKey: false
});

// ============================================================================
// Consent Log Schema
// ============================================================================

const consentLogSchema = new Schema<IConsentLog>({
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
    type: Schema.Types.Mixed,
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
}, {
  timestamps: false,
  versionKey: false
});

// ============================================================================
// User Schema
// ============================================================================

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
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
}, {
  timestamps: false,
  versionKey: false
});

// ============================================================================
// Pre-save Middleware
// ============================================================================

cookieConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================================================
// Indexes for Performance
// ============================================================================

cookieConfigSchema.index({ language: 1 });
cookieConfigSchema.index({ country: 1 });
cookieConfigSchema.index({ enabled: 1 });
cookieConfigSchema.index({ createdAt: -1 });

consentLogSchema.index({ sessionId: 1 });
consentLogSchema.index({ language: 1 });
consentLogSchema.index({ action: 1 });
consentLogSchema.index({ timestamp: -1 });

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

// ============================================================================
// Model Creation
// ============================================================================

export const CookieConfig = model<ICookieConfig>('CookieConfig', cookieConfigSchema);
export const ConsentLog = model<IConsentLog>('ConsentLog', consentLogSchema);
export const User = model<IUser>('User', userSchema);

// ============================================================================
// Schema Exports for Validation
// ============================================================================

export {
  cookieCategorySchema,
  uiConfigSchema,
  textConfigSchema,
  cookieSettingsSchema,
  cookieConfigSchema,
  consentLogSchema,
  userSchema
};

// ============================================================================
// Model Utilities
// ============================================================================

export const getModelNames = (): readonly string[] => [
  'CookieConfig',
  'ConsentLog',
  'User'
] as const;

export const getModelCounts = async (): Promise<Record<string, number>> => {
  const [cookieConfigs, consentLogs, users] = await Promise.all([
    CookieConfig.countDocuments(),
    ConsentLog.countDocuments(),
    User.countDocuments()
  ]);

  return {
    cookieConfigs,
    consentLogs,
    users
  };
};

// ============================================================================
// Default Export
// ============================================================================

export default {
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

