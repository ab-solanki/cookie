/**
 * Modern TypeScript Utilities with ES6+ Features
 * Using modern JavaScript patterns and TypeScript
 */

import { z } from 'zod';
import type {
  ValidationResult,
  ValidationError,
  CacheService,
  DefaultConfigurations,
  CookieCategory,
  CookieCategories,
  UIConfig,
  TextConfig,
  CookieSettings,
  Language
} from '../types/index.js';

// ============================================================================
// Modern Validation with Zod
// ============================================================================

// Zod schemas for runtime validation
const cookieCategorySchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
  required: z.boolean().default(false),
  cookies: z.array(z.string().trim()).default([]),
  order: z.number().int().min(0).default(0),
  enabled: z.boolean().default(true)
});

const uiConfigSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#007bff'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6c757d'),
  borderRadius: z.string().default('8px'),
  fontFamily: z.string().default('system-ui, sans-serif'),
  fontSize: z.string().default('14px'),
  animation: z.boolean().default(true),
  backdrop: z.boolean().default(true)
});

const textConfigSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
  acceptAll: z.string().min(1).max(50).trim(),
  rejectAll: z.string().min(1).max(50).trim(),
  customize: z.string().min(1).max(50).trim(),
  save: z.string().min(1).max(50).trim(),
  close: z.string().min(1).max(50).trim(),
  moreInfo: z.string().min(1).max(50).trim(),
  cookiePolicy: z.string().min(1).max(50).trim(),
  privacyPolicy: z.string().min(1).max(50).trim()
});

const cookieSettingsSchema = z.object({
  name: z.string().min(1).max(50).trim().default('ns-cookie-consent'),
  expiry: z.number().int().min(1).max(3650).default(365),
  domain: z.string().max(100).trim().default(''),
  path: z.string().max(100).trim().default('/'),
  secure: z.boolean().default(false),
  sameSite: z.enum(['Strict', 'Lax', 'None']).default('Lax')
});

const cookieConfigSchema = z.object({
  language: z.string().regex(/^[a-z]{2}(-[a-z]{2})?$/),
  country: z.string().regex(/^[A-Z]{2}$/).optional(),
  region: z.string().trim().optional(),
  texts: textConfigSchema,
  categories: z.object({
    essential: cookieCategorySchema,
    analytics: cookieCategorySchema,
    marketing: cookieCategorySchema,
    preferences: cookieCategorySchema
  }),
  ui: uiConfigSchema,
  cookieSettings: cookieSettingsSchema,
  enabled: z.boolean().default(true),
  version: z.string().default('1.0.0')
});

// ============================================================================
// Validation Service
// ============================================================================

export class ValidationService {
  /**
   * Validate cookie configuration with modern error handling
   */
  static validateConfig(config: unknown): ValidationResult {
    try {
      const result = cookieConfigSchema.safeParse(config);
      
      if (result.success) {
        return {
          isValid: true,
          errors: [],
          data: result.data
        };
      }

      // Modern error mapping with destructuring
      const errors: ValidationError[] = result.error.errors.map(({ path, message, received }) => ({
        field: path.join('.'),
        message,
        value: received
      }));

      return {
        isValid: false,
        errors
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }]
      };
    }
  }

  /**
   * Validate language format with modern regex
   */
  static validateLanguage(language: string): boolean {
    return /^[a-z]{2}(-[a-z]{2})?$/.test(language);
  }

  /**
   * Sanitize input with modern recursive approach
   */
  static sanitizeInput<T>(data: T): T {
    if (typeof data === 'string') {
      return data.trim().replace(/[<>]/g, '') as T;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item)) as T;
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {} as T;
      for (const [key, value] of Object.entries(data)) {
        (sanitized as Record<string, unknown>)[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }
}

// ============================================================================
// Modern Cache Service with ES6+ Features
// ============================================================================

class ModernCacheService implements CacheService {
  private readonly cache = new Map<string, { data: unknown; expires: number }>();
  private readonly config = {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: Number.parseInt(process.env.CACHE_TTL ?? '300', 10)
  };

  isEnabled(): boolean {
    return this.config.enabled;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;
    
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  async set<T>(key: string, data: T, ttl = this.config.ttl): Promise<void> {
    if (!this.isEnabled()) return;
    
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async delete(key: string): Promise<void> {
    if (!this.isEnabled()) return;
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    if (!this.isEnabled()) return;
    this.cache.clear();
  }

  // Modern cleanup with private method
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Start cleanup interval
  constructor() {
    if (this.isEnabled()) {
      setInterval(() => this.cleanup(), 5 * 60 * 1000); // 5 minutes
    }
  }
}

export const cacheService = new ModernCacheService();

// ============================================================================
// Default Configurations with Modern Syntax
// ============================================================================

export const defaultConfigurations: DefaultConfigurations = {
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
} as const;

// ============================================================================
// Utility Functions with Modern ES6+ Features
// ============================================================================

/**
 * Get default configuration for a language with modern syntax
 */
export const getDefaultConfig = (language: Language) => {
  return defaultConfigurations[language] ?? defaultConfigurations.en;
};

/**
 * Generate API response with modern template literals
 */
export const generateResponse = <T>(
  success: boolean,
  data?: T,
  error?: string,
  meta: Record<string, unknown> = {}
) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...meta
  };

  if (success) {
    if (data !== undefined) (response as Record<string, unknown>).data = data;
  } else {
    (response as Record<string, unknown>).error = error;
  }

  return response;
};

/**
 * Modern array utilities
 */
export const arrayUtils = {
  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(array: readonly T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Remove duplicates from array
   */
  unique: <T>(array: readonly T[]): T[] => [...new Set(array)],

  /**
   * Group array by key
   */
  groupBy: <T, K extends string | number | symbol>(
    array: readonly T[],
    key: (item: T) => K
  ): Record<K, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = key(item);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }
};

/**
 * Modern object utilities
 */
export const objectUtils = {
  /**
   * Deep merge objects with modern recursion
   */
  deepMerge: <T extends Record<string, unknown>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key as keyof T] = this.deepMerge(
          (result[key as keyof T] as Record<string, unknown>) ?? {},
          value as Record<string, unknown>
        ) as T[keyof T];
      } else {
        result[key as keyof T] = value as T[keyof T];
      }
    }
    
    return result;
  },

  /**
   * Pick specific keys from object
   */
  pick: <T, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  },

  /**
   * Omit specific keys from object
   */
  omit: <T, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> => {
    const result = { ...obj };
    for (const key of keys) {
      delete result[key];
    }
    return result;
  }
};

/**
 * Modern string utilities
 */
export const stringUtils = {
  /**
   * Convert string to kebab-case
   */
  kebabCase: (str: string): string => 
    str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),

  /**
   * Convert string to camelCase
   */
  camelCase: (str: string): string => 
    str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()),

  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => 
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  ValidationService,
  cacheService,
  defaultConfigurations,
  getDefaultConfig,
  generateResponse,
  arrayUtils,
  objectUtils,
  stringUtils
};

