/**
 * NS Cookie Plugin - Main Class
 * Comprehensive cookie consent management with GDPR/CCPA compliance
 */

import Cookies from 'js-cookie';
import type { CookiePluginConfig, ConsentData } from './types.js';
import { deepMerge } from './utils.js';

export class CookiePlugin {
  private config: CookiePluginConfig;
  private consent: ConsentData | null = null;
  private cookieBar: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private scrollListener?: () => void;

  constructor(config: Partial<CookiePluginConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.consent = this.loadConsent();
    this.init();
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig: Partial<CookiePluginConfig>): CookiePluginConfig {
    const defaultConfig = this.getDefaultConfig();
    return deepMerge(defaultConfig, userConfig);
  }

  /**
   * Get default configuration
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

  /**
   * Initialize the plugin
   */
  private async init(): Promise<void> {
    if (!this.config.enabled) {
      this.log('NS Cookie plugin is disabled');
      return;
    }

    this.log('Initializing NS Cookie plugin...');

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
  }

  /**
   * Log messages in debug mode
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[NS Cookie] ${message}`, ...args);
    }
  }

  /**
   * Check if user has given consent
   */
  private hasConsent(): boolean {
    return this.consent !== null;
  }

  /**
   * Load consent from cookie
   */
  private loadConsent(): ConsentData | null {
    const consentCookie = Cookies.get(this.config.cookieSettings.name);
    
    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie);
        if (this.isValidConsent(consent)) {
          return consent;
        }
      } catch (error) {
        this.log('Failed to parse consent data:', error);
      }
    }
    
    return null;
  }

  /**
   * Validate consent data structure
   */
  private isValidConsent(consent: any): consent is ConsentData {
    return consent &&
           typeof consent === 'object' &&
           typeof consent.timestamp === 'number' &&
           typeof consent.version === 'string' &&
           consent.categories &&
           typeof consent.categories === 'object';
  }

  /**
   * Show cookie consent bar
   */
  private showCookieBar(): void {
    if (this.cookieBar) return;

    this.createCookieBar();
    this.attachEventListeners();

    if (this.config.ui.animation) {
      requestAnimationFrame(() => {
        this.cookieBar?.classList.add('ns-cookie-show');
      });
    }
  }

  /**
   * Create cookie bar HTML
   */
  private createCookieBar(): void {
    const bar = document.createElement('div');
    bar.className = `ns-cookie-bar ns-cookie-${this.config.position} ns-cookie-${this.config.theme}`;
    bar.innerHTML = this.getCookieBarHTML();

    if (this.config.ui.backdrop) {
      const backdrop = document.createElement('div');
      backdrop.className = 'ns-cookie-backdrop';
      document.body.appendChild(backdrop);
    }

    document.body.appendChild(bar);
    this.cookieBar = bar;
    this.applyCustomStyles();
  }

  /**
   * Get cookie bar HTML template
   */
  private getCookieBarHTML(): string {
    return `
      <div class="ns-cookie-content">
        <div class="ns-cookie-text">
          <h3 class="ns-cookie-title">${this.config.texts.title}</h3>
          <p class="ns-cookie-description">${this.config.texts.description}</p>
        </div>
        <div class="ns-cookie-actions">
          <button class="ns-cookie-btn ns-cookie-btn-outline" data-action="customize">
            ${this.config.texts.customize}
          </button>
          <button class="ns-cookie-btn ns-cookie-btn-secondary" data-action="reject">
            ${this.config.texts.rejectAll}
          </button>
          <button class="ns-cookie-btn ns-cookie-btn-primary" data-action="accept">
            ${this.config.texts.acceptAll}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners to cookie bar
   */
  private attachEventListeners(): void {
    if (!this.cookieBar) return;

    this.cookieBar.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'accept':
          this.acceptAll();
          break;
        case 'reject':
          this.rejectAll();
          break;
        case 'customize':
          this.showCustomizeModal();
          break;
      }
    });
  }

  /**
   * Show customize modal
   */
  private showCustomizeModal(): void {
    if (this.modal) return;

    this.hideCookieBar();
    this.createModal();
  }

  /**
   * Create customize modal
   */
  private createModal(): void {
    const modal = document.createElement('div');
    modal.className = 'ns-cookie-modal';
    modal.innerHTML = this.getModalHTML();
    
    document.body.appendChild(modal);
    this.modal = modal;

    if (this.config.ui.animation) {
      requestAnimationFrame(() => {
        modal.classList.add('ns-cookie-modal-show');
      });
    }

    this.attachModalEventListeners();
  }

  /**
   * Get modal HTML template
   */
  private getModalHTML(): string {
    const categoriesHTML = Object.entries(this.config.categories)
      .map(([key, category]) => `
        <div class="ns-cookie-category">
          ${category.required ? '<span class="ns-cookie-required">Required</span>' : ''}
          <div class="ns-cookie-category-header">
            <label class="ns-cookie-switch" for="category-${key}">
              <input
                type="checkbox"
                id="category-${key}"
                data-category="${key}"
                ${category.required ? 'checked disabled' : ''}
                ${this.consent?.categories[key] ? 'checked' : ''}
              >
              <span class="ns-cookie-slider"></span>
            </label>
            <div class="ns-cookie-category-info">
              <h4>${category.name}</h4>
              <p>${category.description}</p>
            </div>
          </div>
        </div>
      `).join('');

    return `
      <div class="ns-cookie-modal-backdrop"></div>
      <div class="ns-cookie-modal-content">
        <div class="ns-cookie-modal-header">
          <h2>${this.config.texts.title}</h2>
          <button class="ns-cookie-close" data-action="close">&times;</button>
        </div>
        <div class="ns-cookie-modal-body">
          <p class="ns-cookie-modal-description">${this.config.texts.description}</p>
          <div class="ns-cookie-categories">
            ${categoriesHTML}
          </div>
        </div>
        <div class="ns-cookie-modal-footer">
          <button class="ns-cookie-btn ns-cookie-btn-outline" data-action="close">
            ${this.config.texts.close}
          </button>
          <button class="ns-cookie-btn ns-cookie-btn-primary" data-action="save">
            ${this.config.texts.save}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach modal event listeners
   */
  private attachModalEventListeners(): void {
    if (!this.modal) return;

    this.modal.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      switch (action) {
        case 'close':
          this.hideModal();
          break;
        case 'save':
          this.saveCustomPreferences();
          break;
      }
    });
  }

  /**
   * Accept all cookies
   */
  private acceptAll(): void {
    const consent: ConsentData = {
      timestamp: Date.now(),
      version: this.config.version,
      categories: {
        essential: true,
        analytics: true,
        marketing: true,
        preferences: true
      }
    };

    this.saveConsent(consent);
    this.applyConsent();
    this.hideCookieBar();
    this.hideModal();

    if (this.config.onAccept) {
      this.config.onAccept(consent);
    }
  }

  /**
   * Reject all non-essential cookies
   */
  private rejectAll(): void {
    const consent: ConsentData = {
      timestamp: Date.now(),
      version: this.config.version,
      categories: {
        essential: true,
        analytics: false,
        marketing: false,
        preferences: false
      }
    };

    this.saveConsent(consent);
    this.applyConsent();
    this.hideCookieBar();
    this.hideModal();

    if (this.config.onReject) {
      this.config.onReject(consent);
    }
  }

  /**
   * Save custom preferences
   */
  private saveCustomPreferences(): void {
    if (!this.modal) return;

    const categories: Record<string, boolean> = {};
    this.modal.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      const category = htmlInput.dataset.category;
      if (category) {
        categories[category] = htmlInput.checked;
      }
    });

    const consent: ConsentData = {
      timestamp: Date.now(),
      version: this.config.version,
      categories
    };

    this.saveConsent(consent);
    this.applyConsent();
    this.hideModal();

    if (this.config.onSave) {
      this.config.onSave(consent);
    }
  }

  /**
   * Save consent to cookie
   */
  private saveConsent(consent: ConsentData): void {
    this.consent = consent;
    
    Cookies.set(this.config.cookieSettings.name, JSON.stringify(consent), {
      expires: this.config.cookieSettings.expiry,
      path: this.config.cookieSettings.path,
      domain: this.config.cookieSettings.domain,
      secure: this.config.cookieSettings.secure,
      sameSite: this.config.cookieSettings.sameSite.toLowerCase() as any
    });

    this.log('Consent saved:', consent);
  }

  /**
   * Apply consent settings
   */
  private applyConsent(): void {
    if (!this.consent) return;

    this.updateAnalyticsConsent();
    this.updateMarketingConsent();
    this.updatePreferencesConsent();

    this.log('Consent applied:', this.consent);
  }

  /**
   * Update analytics consent
   */
  private updateAnalyticsConsent(): void {
    const analyticsEnabled = this.consent?.categories.analytics === true;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: analyticsEnabled ? 'granted' : 'denied'
      });
    }

    // Google Tag Manager
    if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'consent_update',
        analytics_storage: analyticsEnabled ? 'granted' : 'denied'
      });
    }
  }

  /**
   * Update marketing consent
   */
  private updateMarketingConsent(): void {
    const marketingEnabled = this.consent?.categories.marketing === true;

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: marketingEnabled ? 'granted' : 'denied'
      });
    }

    // Facebook Pixel
    if ((window as any).fbq) {
      if (marketingEnabled) {
        (window as any).fbq('consent', 'grant');
      } else {
        (window as any).fbq('consent', 'revoke');
      }
    }
  }

  /**
   * Update preferences consent
   */
  private updatePreferencesConsent(): void {
    const preferencesEnabled = this.consent?.categories.preferences === true;

    if (preferencesEnabled) {
      localStorage.setItem('ns-cookie-preferences', JSON.stringify(this.consent));
    } else {
      localStorage.removeItem('ns-cookie-preferences');
    }
  }

  /**
   * Hide cookie bar
   */
  private hideCookieBar(): void {
    if (!this.cookieBar) return;

    this.cookieBar.classList.remove('ns-cookie-show');
    this.cookieBar.classList.add('ns-cookie-hide');

    setTimeout(() => {
      this.cookieBar?.remove();
      this.cookieBar = null;
    }, 300);
  }

  /**
   * Hide modal
   */
  private hideModal(): void {
    if (!this.modal) return;

    this.modal.classList.remove('ns-cookie-modal-show');
    this.modal.classList.add('ns-cookie-modal-hide');

    setTimeout(() => {
      this.modal?.remove();
      this.modal = null;
    }, 300);
  }

  /**
   * Setup scroll listener
   */
  private setupScrollListener(): void {
    let hasScrolled = false;

    this.scrollListener = () => {
      if (!hasScrolled && window.scrollY > this.config.scrollThreshold) {
        hasScrolled = true;
        this.showCookieBar();
        
        if (this.scrollListener) {
          window.removeEventListener('scroll', this.scrollListener);
        }
      }
    };

    window.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  /**
   * Apply custom styles
   */
  private applyCustomStyles(): void {
    const ui = this.config.ui;
    const root = document.documentElement;

    root.style.setProperty('--ns-cookie-primary-color', ui.primaryColor);
    root.style.setProperty('--ns-cookie-secondary-color', ui.secondaryColor);
    root.style.setProperty('--ns-cookie-border-radius', ui.borderRadius);
    root.style.setProperty('--ns-cookie-font-family', ui.fontFamily);
    root.style.setProperty('--ns-cookie-font-size', ui.fontSize);
  }

  // Public API methods

  /**
   * Show cookie bar manually
   */
  public show(): void {
    this.showCookieBar();
  }

  /**
   * Hide cookie bar and modal
   */
  public hide(): void {
    this.hideCookieBar();
    this.hideModal();
  }

  /**
   * Reset consent and hide UI
   */
  public reset(): void {
    Cookies.remove(this.config.cookieSettings.name);
    this.consent = null;
    this.hide();
  }

  /**
   * Get current consent data
   */
  public getConsent(): ConsentData | null {
    return this.consent;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<CookiePluginConfig>): void {
    this.config = this.mergeConfig(newConfig);
    this.applyCustomStyles();
  }

  /**
   * Destroy plugin and cleanup
   */
  public destroy(): void {
    if (this.scrollListener) {
      window.removeEventListener('scroll', this.scrollListener);
    }

    this.hideCookieBar();
    this.hideModal();

    const backdrop = document.querySelector('.ns-cookie-backdrop');
    backdrop?.remove();

    this.log('Cookie plugin destroyed');
  }
}
