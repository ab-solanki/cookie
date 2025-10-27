/**
 * TypeScript type definitions for NS Cookie Plugin
 */

export interface CookieCategory {
  name: string;
  description: string;
  required: boolean;
  cookies: string[];
}

export interface CookieCategories {
  essential: CookieCategory;
  analytics: CookieCategory;
  marketing: CookieCategory;
  preferences: CookieCategory;
}

export interface UIConfig {
  primaryColor: string;
  secondaryColor: string;
  borderRadius: string;
  fontFamily: string;
  fontSize: string;
  animation: boolean;
  backdrop: boolean;
}

export interface TextConfig {
  title: string;
  description: string;
  acceptAll: string;
  rejectAll: string;
  customize: string;
  save: string;
  close: string;
  moreInfo: string;
  cookiePolicy: string;
  privacyPolicy: string;
}

export interface CookieSettings {
  name: string;
  expiry: number;
  domain: string;
  path: string;
  secure: boolean;
  sameSite: string;
}

export interface ConsentData {
  timestamp: number;
  version: string;
  categories: Record<string, boolean>;
}

export type ConsentCallback = (consent: ConsentData) => void;

export interface CookiePluginConfig {
  enabled: boolean;
  theme: 'light' | 'dark';
  position: 'top' | 'bottom';
  autoShow: boolean;
  showOnScroll: boolean;
  scrollThreshold: number;
  categories: CookieCategories;
  ui: UIConfig;
  texts: TextConfig;
  cookieSettings: CookieSettings;
  debug: boolean;
  version: string;
  onAccept?: ConsentCallback;
  onReject?: ConsentCallback;
  onSave?: ConsentCallback;
}
