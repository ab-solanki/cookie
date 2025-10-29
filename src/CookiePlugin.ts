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

    try {
      this.log('Initializing NS Cookie plugin...');

      // Inject CSS styles first
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
      console.error('[NS Cookie] Initialization error:', error);
    }
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
   * Inject CSS styles for cookieBar and modal
   */
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

  /**
   * Get CSS styles for cookieBar and modal
   */
  private getCSSStyles(): string {
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

      .ns-cookie-bar.ns-cookie-show {
        opacity: 1;
        transform: translateY(0);
      }

      .ns-cookie-bar.ns-cookie-hide {
        opacity: 0;
        transform: translateY(100%);
      }

      .ns-cookie-bar.ns-cookie-top {
        top: 0;
        bottom: auto;
        border-top: none;
        border-bottom: 1px solid #e0e0e0;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transform: translateY(-100%);
      }

      .ns-cookie-bar.ns-cookie-top.ns-cookie-show {
        transform: translateY(0);
      }

      .ns-cookie-bar.ns-cookie-top.ns-cookie-hide {
        transform: translateY(-100%);
      }

      .ns-cookie-bar.ns-cookie-bottom {
        bottom: 0;
        top: auto;
      }

      .ns-cookie-bar.ns-cookie-dark {
        background: #2c3e50;
        color: #ffffff;
        border-color: #34495e;
      }

      .ns-cookie-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }

      .ns-cookie-text {
        flex: 1;
        min-width: 0;
      }

      .ns-cookie-title {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: inherit;
      }

      .ns-cookie-description {
        margin: 0;
        line-height: 1.5;
        color: inherit;
        opacity: 0.9;
      }

      .ns-cookie-actions {
        display: flex;
        gap: 12px;
        flex-shrink: 0;
      }

      .ns-cookie-btn {
        padding: 10px 20px;
        border: none;
        border-radius: var(--ns-cookie-border-radius, 8px);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        text-align: center;
        min-width: 100px;
      }

      .ns-cookie-btn-primary {
        background: var(--ns-cookie-primary-color, #007bff);
        color: #ffffff;
      }

      .ns-cookie-btn-primary:hover {
        background: #0056b3;
        transform: translateY(-1px);
      }

      .ns-cookie-btn-secondary {
        background: var(--ns-cookie-secondary-color, #6c757d);
        color: #ffffff;
      }

      .ns-cookie-btn-secondary:hover {
        background: #545b62;
        transform: translateY(-1px);
      }

      .ns-cookie-btn-outline {
        background: transparent;
        color: var(--ns-cookie-primary-color, #007bff);
        border: 2px solid var(--ns-cookie-primary-color, #007bff);
      }

      .ns-cookie-btn-outline:hover {
        background: var(--ns-cookie-primary-color, #007bff);
        color: #ffffff;
        transform: translateY(-1px);
      }

      .ns-cookie-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999998;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .ns-cookie-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }

      .ns-cookie-modal.ns-cookie-modal-show {
        opacity: 1;
        visibility: visible;
      }

      .ns-cookie-modal.ns-cookie-modal-hide {
        opacity: 0;
        visibility: hidden;
      }

      .ns-cookie-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        cursor: pointer;
      }

      .ns-cookie-modal-content {
        background: #ffffff;
        border-radius: var(--ns-cookie-border-radius, 8px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        position: relative;
        z-index: 1;
      }

      .ns-cookie-modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .ns-cookie-modal-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }

      .ns-cookie-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
      }

      .ns-cookie-close:hover {
        background: #f0f0f0;
        color: #333;
      }

      .ns-cookie-modal-body {
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      }

      .ns-cookie-modal-description {
        margin: 0 0 20px 0;
        color: #666;
        line-height: 1.5;
      }

      .ns-cookie-categories {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ns-cookie-category {
        padding: 16px;
        border: 1px solid #e0e0e0;
        border-radius: var(--ns-cookie-border-radius, 8px);
        background: #f9f9f9;
      }

      .ns-cookie-category-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .ns-cookie-switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .ns-cookie-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .ns-cookie-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: 0.3s;
        border-radius: 24px;
      }

      .ns-cookie-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }

      .ns-cookie-switch input:checked + .ns-cookie-slider {
        background-color: var(--ns-cookie-primary-color, #007bff);
      }

      .ns-cookie-switch input:checked + .ns-cookie-slider:before {
        transform: translateX(26px);
      }

      .ns-cookie-switch input:disabled + .ns-cookie-slider {
        background-color: #28a745;
        cursor: not-allowed;
      }

      .ns-cookie-category-info {
        flex: 1;
        min-width: 0;
      }

      .ns-cookie-category-info h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .ns-cookie-category-info p {
        margin: 0;
        color: #666;
        line-height: 1.4;
        font-size: 14px;
      }

      .ns-cookie-required {
        background: #28a745;
        color: white;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 8px;
        display: inline-block;
      }

      .ns-cookie-modal-footer {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .ns-cookie-content {
          flex-direction: column;
          align-items: stretch;
          text-align: center;
        }

        .ns-cookie-actions {
          justify-content: center;
          flex-wrap: wrap;
        }

        .ns-cookie-btn {
          min-width: 80px;
          padding: 8px 16px;
        }

        .ns-cookie-modal-content {
          width: 95%;
          margin: 20px;
        }

        .ns-cookie-category-header {
          flex-direction: column;
          gap: 12px;
        }

        .ns-cookie-switch {
          align-self: flex-start;
        }
      }

      /* Dark theme adjustments */
      .ns-cookie-bar.ns-cookie-dark .ns-cookie-btn-outline {
        color: #ffffff;
        border-color: #ffffff;
      }

      .ns-cookie-bar.ns-cookie-dark .ns-cookie-btn-outline:hover {
        background: #ffffff;
        color: #2c3e50;
      }
    `;
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
    try {
      // Prevent duplicate cookie bars
      if (this.cookieBar || document.querySelector('.ns-cookie-bar')) {
        this.log('Cookie bar already exists, skipping creation');
        return;
      }

      this.createCookieBar();
      this.attachEventListeners();

      if (this.config.ui.animation) {
        requestAnimationFrame(() => {
          this.cookieBar?.classList.add('ns-cookie-show');
        });
      }
    } catch (error) {
      console.error('[NS Cookie] Error showing cookie bar:', error);
    }
  }

  /**
   * Create cookie bar HTML
   */
  private createCookieBar(): void {
    try {
      const bar = document.createElement('div');
      bar.className = `ns-cookie-bar ns-cookie-${this.config.position} ns-cookie-${this.config.theme}`;
      bar.innerHTML = this.getCookieBarHTML();

      // Create backdrop if enabled
      if (this.config.ui.backdrop) {
        const backdrop = document.createElement('div');
        backdrop.className = 'ns-cookie-backdrop';
        backdrop.style.opacity = '1';
        document.body.appendChild(backdrop);
      }

      document.body.appendChild(bar);
      this.cookieBar = bar;
      this.applyCustomStyles();
      
      this.log('Cookie bar created successfully');
    } catch (error) {
      console.error('[NS Cookie] Error creating cookie bar:', error);
    }
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

    try {
      // Use event delegation for better performance and cleanup
      this.cookieBar.addEventListener('click', this.handleCookieBarClick.bind(this));
      this.log('Event listeners attached to cookie bar');
    } catch (error) {
      console.error('[NS Cookie] Error attaching event listeners:', error);
    }
  }

  /**
   * Handle cookie bar click events
   */
  private handleCookieBarClick(event: Event): void {
    try {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (!action) return;

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
    } catch (error) {
      console.error('[NS Cookie] Error handling cookie bar click:', error);
    }
  }

  /**
   * Show customize modal
   */
  private showCustomizeModal(): void {
    try {
      // Prevent duplicate modals
      if (this.modal || document.querySelector('.ns-cookie-modal')) {
        this.log('Modal already exists, skipping creation');
        return;
      }

      this.hideCookieBar();
      this.createModal();
    } catch (error) {
      console.error('[NS Cookie] Error showing customize modal:', error);
    }
  }

  /**
   * Create customize modal
   */
  private createModal(): void {
    try {
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
      this.log('Modal created successfully');
    } catch (error) {
      console.error('[NS Cookie] Error creating modal:', error);
    }
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

    try {
      // Use event delegation for better performance and cleanup
      this.modal.addEventListener('click', this.handleModalClick.bind(this));
      this.log('Event listeners attached to modal');
    } catch (error) {
      console.error('[NS Cookie] Error attaching modal event listeners:', error);
    }
  }

  /**
   * Handle modal click events
   */
  private handleModalClick(event: Event): void {
    try {
      const target = event.target as HTMLElement;
      const action = target.dataset.action;

      if (!action) return;

      switch (action) {
        case 'close':
          this.hideModal();
          break;
        case 'save':
          this.saveCustomPreferences();
          break;
      }
    } catch (error) {
      console.error('[NS Cookie] Error handling modal click:', error);
    }
  }

  /**
   * Accept all cookies
   */
  private acceptAll(): void {
    try {
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

      this.log('All cookies accepted');
    } catch (error) {
      console.error('[NS Cookie] Error accepting all cookies:', error);
    }
  }

  /**
   * Reject all non-essential cookies
   */
  private rejectAll(): void {
    try {
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

      this.log('Non-essential cookies rejected');
    } catch (error) {
      console.error('[NS Cookie] Error rejecting cookies:', error);
    }
  }

  /**
   * Save custom preferences
   */
  private saveCustomPreferences(): void {
    if (!this.modal) return;

    try {
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

      this.log('Custom preferences saved');
    } catch (error) {
      console.error('[NS Cookie] Error saving custom preferences:', error);
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

    try {
      this.cookieBar.classList.remove('ns-cookie-show');
      this.cookieBar.classList.add('ns-cookie-hide');

      setTimeout(() => {
        if (this.cookieBar) {
          this.cookieBar.remove();
          this.cookieBar = null;
        }
      }, 300);

      // Remove backdrop
      const backdrop = document.querySelector('.ns-cookie-backdrop');
      if (backdrop) {
        backdrop.remove();
      }

      this.log('Cookie bar hidden successfully');
    } catch (error) {
      console.error('[NS Cookie] Error hiding cookie bar:', error);
    }
  }

  /**
   * Hide modal
   */
  private hideModal(): void {
    if (!this.modal) return;

    try {
      this.modal.classList.remove('ns-cookie-modal-show');
      this.modal.classList.add('ns-cookie-modal-hide');

      setTimeout(() => {
        if (this.modal) {
          this.modal.remove();
          this.modal = null;
        }
      }, 300);

      this.log('Modal hidden successfully');
    } catch (error) {
      console.error('[NS Cookie] Error hiding modal:', error);
    }
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
    try {
      // Remove scroll listener
      if (this.scrollListener) {
        window.removeEventListener('scroll', this.scrollListener);
        this.scrollListener = undefined;
      }

      // Hide and cleanup UI elements
      this.hideCookieBar();
      this.hideModal();

      // Remove any remaining backdrop elements
      const backdrops = document.querySelectorAll('.ns-cookie-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());

      // Remove any remaining cookie bars or modals
      const cookieBars = document.querySelectorAll('.ns-cookie-bar');
      cookieBars.forEach(bar => bar.remove());

      const modals = document.querySelectorAll('.ns-cookie-modal');
      modals.forEach(modal => modal.remove());

      // Remove injected styles
      const styles = document.getElementById('ns-cookie-styles');
      if (styles) {
        styles.remove();
      }

      // Reset state
      this.cookieBar = null;
      this.modal = null;

      this.log('Cookie plugin destroyed and cleaned up');
    } catch (error) {
      console.error('[NS Cookie] Error during destroy:', error);
    }
  }
}
