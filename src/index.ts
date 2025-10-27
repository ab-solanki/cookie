/**
 * NS Cookie - Main Entry Point
 * Comprehensive cookie consent management plugin
 */

// Core exports
export { CookiePlugin } from './CookiePlugin.js';
export type {
  ConsentCallback,
  ConsentData,
  CookieCategories,
  CookieCategory,
  CookiePluginConfig,
  CookieSettings,
  TextConfig,
  UIConfig
} from './types.js';

// Feature exports
export { AutoBlocker } from './blocker.js';
export { GeoTargeting } from './geotargeting.js';
export { ConsentLogger } from './logger.js';
export { WebsiteScanner } from './scanner.js';

// Utility exports
export * from './utils.js';

// Default export
export { CookiePlugin as default } from './CookiePlugin.js';
