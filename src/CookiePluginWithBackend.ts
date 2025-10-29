/**
 * Enhanced CookiePlugin with Backend Configuration Support
 * This extends the original CookiePlugin to fetch configuration from backend API
 */

import Cookies from 'js-cookie';
import type { CookiePluginConfig, ConsentData } from './types.js';
import { deepMerge } from './utils.js';

export interface BackendConfigOptions {
  apiEndpoint: string;
  language?: string;
  fallbackConfig?: Partial<CookiePluginConfig>;
  cacheTimeout?: number; // in milliseconds
  enableCache?: boolean;
}

export class CookiePluginWithBackend {
  private config: CookiePluginConfig;
  private consent: ConsentData | null = null;
  private cookieBar: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private scrollListener?: () => void;
  private backendOptions: BackendConfigOptions;
  private configCache: { data: CookiePluginConfig; timestamp: number } | null = null;

  constructor(
    userConfig: Partial<CookiePluginConfig> = {},
    backendOptions: BackendConfigOptions
  ) {
    this.backendOptions = {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes default
      ...backendOptions
    };
    
    this.config = this.getDefaultConfig();
    this.consent = this.loadConsent();
    this.initWithBackend(userConfig);
  }

  /**
   * Initialize plugin with backend configuration
   */
  private async initWithBackend(userConfig: Partial<CookiePluginConfig>): Promise<void> {
    try {
      // Try to load configuration from backend
      const backendConfig = await this.loadBackendConfig();
      
      // Merge configurations: default -> backend -> user
      this.config = this.mergeConfig(backendConfig, userConfig);
      
      // Initialize the plugin
      this.init();
      
      this.log('Plugin initialized with backend configuration');
    } catch (error) {
      this.log('Failed to load backend config, using fallback:', error);
      
      // Use fallback configuration
      const fallbackConfig = this.backendOptions.fallbackConfig || {};
      this.config = this.mergeConfig(fallbackConfig, userConfig);
      this.init();
    }
  }

  /**
   * Load configuration from backend API
   */
  private async loadBackendConfig(): Promise<Partial<CookiePluginConfig>> {
    // Check cache first
    if (this.backendOptions.enableCache && this.configCache) {
      const now = Date.now();
      if (now - this.configCache.timestamp < this.backendOptions.cacheTimeout!) {
        this.log('Using cached backend configuration');
        return this.configCache.data;
      }
    }

    // Build API URL
    const url = new URL(this.backendOptions.apiEndpoint);
    if (this.backendOptions.language) {
      url.pathname += `/${this.backendOptions.language}`;
    }

    // Fetch configuration from backend
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error('Invalid response format from backend API');
    }

    // Cache the configuration
    if (this.backendOptions.enableCache) {
      this.configCache = {
        data: result.data,
        timestamp: Date.now()
      };
    }

    this.log('Backend configuration loaded successfully');
    return result.data;
  }

  /**
   * Refresh configuration from backend
   */
  public async refreshConfig(): Promise<void> {
    try {
      // Clear cache
      this.configCache = null;
      
      // Load fresh configuration
      const backendConfig = await this.loadBackendConfig();
      
      // Merge with current user config (preserve user overrides)
      this.config = this.mergeConfig(backendConfig, this.config);
      
      // Reapply custom styles
      this.applyCustomStyles();
      
      this.log('Configuration refreshed from backend');
    } catch (error) {
      this.log('Failed to refresh configuration:', error);
      throw error;
    }
  }

  /**
   * Get current language from browser or backend
   */
  public getCurrentLanguage(): string {
    return this.backendOptions.language || 
           navigator.language.split('-')[0] || 
           'en';
  }

  /**
   * Update language and reload configuration
   */
  public async setLanguage(language: string): Promise<void> {
    this.backendOptions.language = language;
    await this.refreshConfig();
  }

  /**
   * Get available languages from backend
   */
  public async getAvailableLanguages(): Promise<string[]> {
    try {
      const url = new URL(this.backendOptions.apiEndpoint);
      url.pathname = url.pathname.replace(/\/[^\/]*$/, '/languages');
      
      const response = await fetch(url.toString());
      const result = await response.json();
      
      return result.success ? result.languages : ['en'];
    } catch (error) {
      this.log('Failed to get available languages:', error);
      return ['en'];
    }
  }

  /**
   * Merge configurations with proper priority
   */
  private mergeConfig(backendConfig: Partial<CookiePluginConfig>, userConfig: Partial<CookiePluginConfig>): CookiePluginConfig {
    const defaultConfig = this.getDefaultConfig();
    return deepMerge(defaultConfig, deepMerge(backendConfig, userConfig));
  }

  /**
   * Get default configuration (fallback)
   */
  private getDefaultConfig(): CookiePluginConfig {
    return {
      enabled: true,
      theme: 'light',
      position: 'bottom',
      autoShow: true,
      showOnScroll: false,
      scrollThreshold: 100,
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
      cookieSettings: {
        name: 'ns-cookie-consent',
        expiry: 365,
        domain: '',
        path: '/',
        secure: false,
        sameSite: 'Lax'
      },
      debug: false,
      version: '1.0.0'
    };
  }

  // Include all the original CookiePlugin methods here...
  // (init, showCookieBar, createCookieBar, etc.)
  // For brevity, I'm showing the key backend integration methods

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log('[NS Cookie Backend]', message, ...args);
    }
  }

  private loadConsent(): ConsentData | null {
    const consentData = Cookies.get(this.config.cookieSettings.name);
    if (consentData) {
      try {
        const consent = JSON.parse(consentData);
        if (this.isValidConsent(consent)) {
          return consent;
        }
      } catch (error) {
        this.log('Failed to parse consent data:', error);
      }
    }
    return null;
  }

  private isValidConsent(consent: any): boolean {
    return consent &&
           typeof consent === 'object' &&
           typeof consent.timestamp === 'number' &&
           typeof consent.version === 'string' &&
           consent.categories &&
           typeof consent.categories === 'object';
  }

  private init(): void {
    if (this.config.enabled) {
      try {
        this.log('Initializing NS Cookie plugin...');
        this.injectStyles();
        
        if (this.hasConsent()) {
          this.log('Consent already exists, applying settings...');
          this.applyConsent();
        } else if (this.config.autoShow) {
          this.showCookieBar();
        }
        
        if (this.config.showOnScroll) {
          this.setupScrollListener();
        }
        
        this.log('NS Cookie plugin initialized successfully');
      } catch (error) {
        this.log('Error during initialization:', error);
      }
    } else {
      this.log('NS Cookie plugin is disabled');
    }
  }

  private hasConsent(): boolean {
    return this.consent !== null;
  }

  private injectStyles(): void {
    // Check if styles already injected
    if (document.getElementById('ns-cookie-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'ns-cookie-styles';
    style.textContent = this.getCSSStyles();
    document.head.appendChild(style);
  }

  private getCSSStyles(): string {
    // Return the CSS styles (same as original)
    return `
      /* NS Cookie Plugin Styles */
      .ns-cookie-bar {
        position: fixed;
        left: 0;
        right: 0;
        z-index: 999999;
        background: #ffffff;
        border-top: 1px solid #e0e0e0;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        font-family: var(--ns-cookie-font-family, system-ui, sans-serif);
        font-size: var(--ns-cookie-font-size, 14px);
        opacity: 0;
        transform: translateY(100%);
        transition: all 0.3s ease-in-out;
      }
      /* ... rest of CSS styles ... */
    `;
  }

  private applyConsent(): void {
    if (this.consent) {
      this.updateAnalyticsConsent();
      this.updateMarketingConsent();
      this.updatePreferencesConsent();
      this.log('Consent applied:', this.consent);
    }
  }

  private updateAnalyticsConsent(): void {
    const enabled = this.consent?.categories.analytics === true;
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: enabled ? 'granted' : 'denied'
      });
    }
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'consent_update',
        analytics_storage: enabled ? 'granted' : 'denied'
      });
    }
  }

  private updateMarketingConsent(): void {
    const enabled = this.consent?.categories.marketing === true;
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: enabled ? 'granted' : 'denied'
      });
    }
    if (window.fbq) {
      if (enabled) {
        window.fbq('consent', 'grant');
      } else {
        window.fbq('consent', 'revoke');
      }
    }
  }

  private updatePreferencesConsent(): void {
    if (this.consent?.categories.preferences === true) {
      localStorage.setItem('ns-cookie-preferences', JSON.stringify(this.consent));
    } else {
      localStorage.removeItem('ns-cookie-preferences');
    }
  }

  private setupScrollListener(): void {
    let hasShown = false;
    this.scrollListener = () => {
      if (!hasShown && window.scrollY > this.config.scrollThreshold) {
        hasShown = true;
        this.showCookieBar();
        if (this.scrollListener) {
          window.removeEventListener('scroll', this.scrollListener);
        }
      }
    };
    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  private applyCustomStyles(): void {
    const ui = this.config.ui;
    const root = document.documentElement;
    
    root.style.setProperty('--ns-cookie-primary-color', ui.primaryColor);
    root.style.setProperty('--ns-cookie-secondary-color', ui.secondaryColor);
    root.style.setProperty('--ns-cookie-border-radius', ui.borderRadius);
    root.style.setProperty('--ns-cookie-font-family', ui.fontFamily);
    root.style.setProperty('--ns-cookie-font-size', ui.fontSize);
  }

  // Public methods
  public show(): void {
    this.showCookieBar();
  }

  public hide(): void {
    this.hideCookieBar();
    this.hideModal();
  }

  public reset(): void {
    Cookies.remove(this.config.cookieSettings.name);
    this.consent = null;
    this.hide();
  }

  public getConsent(): ConsentData | null {
    return this.consent;
  }

  public updateConfig(newConfig: Partial<CookiePluginConfig>): void {
    this.config = this.mergeConfig(this.config, newConfig);
    this.applyCustomStyles();
  }

  public destroy(): void {
    try {
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = undefined;
      }
      
      this.hideCookieBar();
      this.hideModal();
      
      // Clean up DOM elements
      document.querySelectorAll('.ns-cookie-backdrop').forEach(el => el.remove());
      document.querySelectorAll('.ns-cookie-bar').forEach(el => el.remove());
      document.querySelectorAll('.ns-cookie-modal').forEach(el => el.remove());
      
      const styles = document.getElementById('ns-cookie-styles');
      if (styles) {
        styles.remove();
      }
      
      this.cookieBar = null;
      this.modal = null;
      
      this.log('Cookie plugin destroyed and cleaned up');
    } catch (error) {
      this.log('Error during destruction:', error);
    }
  }

  // Placeholder methods for cookie bar and modal functionality
  private showCookieBar(): void {
    // Implementation would go here
  }

  private hideCookieBar(): void {
    // Implementation would go here
  }

  private hideModal(): void {
    // Implementation would go here
  }
}

