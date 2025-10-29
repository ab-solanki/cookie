/**
 * Modern TypeScript Type Definitions for Cookie Configuration API
 * Using ES6+ features and modern TypeScript patterns
 */

import { Document, Types } from 'mongoose';

// ============================================================================
// Core Configuration Types
// ============================================================================

export interface CookieCategory {
  readonly name: string;
  readonly description: string;
  readonly required: boolean;
  readonly cookies: readonly string[];
  readonly order?: number;
  readonly enabled?: boolean;
}

export interface CookieCategories {
  readonly essential: CookieCategory;
  readonly analytics: CookieCategory;
  readonly marketing: CookieCategory;
  readonly preferences: CookieCategory;
}

export interface UIConfig {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly borderRadius: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly animation: boolean;
  readonly backdrop: boolean;
}

export interface TextConfig {
  readonly title: string;
  readonly description: string;
  readonly acceptAll: string;
  readonly rejectAll: string;
  readonly customize: string;
  readonly save: string;
  readonly close: string;
  readonly moreInfo: string;
  readonly cookiePolicy: string;
  readonly privacyPolicy: string;
}

export interface CookieSettings {
  readonly name: string;
  readonly expiry: number;
  readonly domain: string;
  readonly path: string;
  readonly secure: boolean;
  readonly sameSite: 'Strict' | 'Lax' | 'None';
}

export interface ConsentData {
  readonly timestamp: number;
  readonly version: string;
  readonly categories: Record<string, boolean>;
}

// ============================================================================
// Database Document Types
// ============================================================================

export interface ICookieConfig extends Document {
  readonly _id: Types.ObjectId;
  readonly language: string;
  readonly country?: string;
  readonly region?: string;
  readonly texts: TextConfig;
  readonly categories: CookieCategories;
  readonly ui: UIConfig;
  readonly cookieSettings: CookieSettings;
  readonly enabled: boolean;
  readonly version: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly createdBy?: Types.ObjectId;
  readonly updatedBy?: Types.ObjectId;
}

export interface IConsentLog extends Document {
  readonly _id: Types.ObjectId;
  readonly sessionId: string;
  readonly language: string;
  readonly action: ConsentAction;
  readonly consentData: ConsentData;
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly referrer?: string;
  readonly pageUrl?: string;
  readonly timestamp: Date;
  readonly version: string;
}

export interface IUser extends Document {
  readonly _id: Types.ObjectId;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly isActive: boolean;
  readonly lastLogin?: Date;
  readonly createdAt: Date;
}

// ============================================================================
// Enums and Union Types
// ============================================================================

export type ConsentAction = 'accept' | 'reject' | 'customize' | 'save' | 'withdraw';
export type UserRole = 'admin' | 'editor' | 'viewer';
export type Theme = 'light' | 'dark';
export type Position = 'top' | 'bottom';
export type Language = string; // ISO 639-1 format
export type Country = string; // ISO 3166-1 alpha-2 format

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly details?: readonly string[];
  readonly timestamp: string;
  readonly language?: string;
  readonly source?: 'cache' | 'database';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly pages: number;
  };
}

export interface CreateConfigRequest {
  readonly language: Language;
  readonly country?: Country;
  readonly region?: string;
  readonly texts: TextConfig;
  readonly categories: CookieCategories;
  readonly ui: UIConfig;
  readonly cookieSettings: CookieSettings;
  readonly enabled?: boolean;
  readonly version?: string;
}

export interface UpdateConfigRequest extends Partial<CreateConfigRequest> {
  readonly language: Language;
}

export interface ConsentLogRequest {
  readonly sessionId: string;
  readonly language: Language;
  readonly action: ConsentAction;
  readonly consentData: ConsentData;
  readonly version: string;
}

export interface AnalyticsQuery {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly language?: Language;
  readonly action?: ConsentAction;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ServerConfig {
  readonly port: number;
  readonly host: string;
  readonly environment: 'development' | 'staging' | 'production';
}

export interface DatabaseConfig {
  readonly mongodb: {
    readonly uri: string;
    readonly options: {
      readonly useNewUrlParser: boolean;
      readonly useUnifiedTopology: boolean;
    };
  };
}

export interface ApiConfig {
  readonly version: string;
  readonly basePath: string;
  readonly cors: {
    readonly origin: string;
    readonly credentials: boolean;
  };
  readonly rateLimit: {
    readonly windowMs: number;
    readonly max: number;
  };
}

export interface CacheConfig {
  readonly enabled: boolean;
  readonly ttl: number;
  readonly redis?: {
    readonly host: string;
    readonly port: number;
    readonly password?: string;
  };
}

export interface SecurityConfig {
  readonly jwt: {
    readonly secret: string;
    readonly expiresIn: string;
  };
  readonly bcrypt: {
    readonly saltRounds: number;
  };
}

export interface LoggingConfig {
  readonly level: 'error' | 'warn' | 'info' | 'debug';
  readonly format: string;
}

export interface AppConfig {
  readonly server: ServerConfig;
  readonly database: DatabaseConfig;
  readonly api: ApiConfig;
  readonly cache: CacheConfig;
  readonly security: SecurityConfig;
  readonly logging: LoggingConfig;
}

// ============================================================================
// Middleware Types
// ============================================================================

export interface AuthenticatedRequest extends Request {
  readonly user?: {
    readonly id: string;
    readonly username: string;
    readonly role: UserRole;
  };
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly value?: unknown;
}

// ============================================================================
// Service Types
// ============================================================================

export interface CacheService {
  readonly isEnabled: () => boolean;
  readonly get: <T>(key: string) => Promise<T | null>;
  readonly set: <T>(key: string, data: T, ttl?: number) => Promise<void>;
  readonly delete: (key: string) => Promise<void>;
  readonly clear: () => Promise<void>;
}

export interface ValidationService {
  readonly validateConfig: (config: unknown) => ValidationResult;
  readonly validateLanguage: (language: string) => boolean;
  readonly sanitizeInput: <T>(data: T) => T;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
  readonly data?: unknown;
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type NonEmptyArray<T> = [T, ...T[]];
export type EmptyObject = Record<string, never>;

// ============================================================================
// Error Types
// ============================================================================

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: readonly string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: readonly string[]) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
    this.name = 'ForbiddenError';
  }
}

// ============================================================================
// Default Configuration Types
// ============================================================================

export interface DefaultConfigurations {
  readonly [language: string]: {
    readonly texts: TextConfig;
    readonly categories: CookieCategories;
    readonly ui: UIConfig;
    readonly cookieSettings: CookieSettings;
  };
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  Document,
  Types
} from 'mongoose';

