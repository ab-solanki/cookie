/**
 * Website Scanner - Automatic cookie and tracker detection
 */

export interface DetectedCookie {
  name: string;
  domain: string;
  path: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string;
  category: string;
  purpose: string;
  source: string;
}

export interface DetectedTracker {
  name: string;
  type: 'script' | 'iframe' | 'pixel';
  url: string;
  domain: string;
  category: string;
  description: string;
  blocked: boolean;
}

export class WebsiteScanner {
  private cookies: DetectedCookie[] = [];
  private trackers: DetectedTracker[] = [];

  constructor() {
    this.scanCookies();
    this.scanTrackers();
  }

  /**
   * Scan existing cookies
   */
  private scanCookies(): void {
    const cookieString = document.cookie;
    if (!cookieString) return;

    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        this.cookies.push({
          name: decodeURIComponent(name),
          domain: window.location.hostname,
          path: '/',
          value: decodeURIComponent(value),
          httpOnly: false,
          secure: window.location.protocol === 'https:',
          sameSite: 'Lax',
          category: this.categorizeCookie(name),
          purpose: this.getCookiePurpose(name),
          source: 'document.cookie'
        });
      }
    });
  }

  /**
   * Scan tracking scripts and pixels
   */
  private scanTrackers(): void {
    // Check for common tracking scripts
    if ((window as any).gtag) {
      this.trackers.push({
        name: 'Google Analytics',
        type: 'script',
        url: 'https://www.google-analytics.com/analytics.js',
        domain: 'google-analytics.com',
        category: 'analytics',
        description: 'Google Analytics tracking script',
        blocked: false
      });
    }

    if ((window as any).dataLayer) {
      this.trackers.push({
        name: 'Google Tag Manager',
        type: 'script',
        url: 'https://www.googletagmanager.com/gtm.js',
        domain: 'googletagmanager.com',
        category: 'analytics',
        description: 'Google Tag Manager tracking script',
        blocked: false
      });
    }

    if ((window as any).fbq) {
      this.trackers.push({
        name: 'Facebook Pixel',
        type: 'script',
        url: 'https://connect.facebook.net/en_US/fbevents.js',
        domain: 'connect.facebook.net',
        category: 'marketing',
        description: 'Facebook Pixel tracking script',
        blocked: false
      });
    }

    // Scan script tags
    document.querySelectorAll('script[src]').forEach(script => {
      const src = script.getAttribute('src');
      if (src) {
        const tracker = this.identifyTracker(src);
        if (tracker) {
          this.trackers.push(tracker);
        }
      }
    });
  }

  /**
   * Categorize cookie based on name patterns
   */
  private categorizeCookie(name: string): string {
    // Analytics cookies
    if (['_ga', '_gid', '_gat', '_gcl_au', '_gcl_dc'].some(pattern => name.includes(pattern))) {
      return 'analytics';
    }

    // Marketing cookies
    if (['_fbp', 'fr', '_gcl_aw', '_gcl_dc'].some(pattern => name.includes(pattern))) {
      return 'marketing';
    }

    // Preference cookies
    if (['theme', 'language', 'timezone', 'currency'].some(pattern => name.includes(pattern))) {
      return 'preferences';
    }

    // Essential cookies
    if (['session', 'csrf', 'auth', 'cart'].some(pattern => name.includes(pattern))) {
      return 'essential';
    }

    return 'unknown';
  }

  /**
   * Get cookie purpose description
   */
  private getCookiePurpose(name: string): string {
    const purposes: Record<string, string> = {
      '_ga': 'Google Analytics - distinguishes users',
      '_gid': 'Google Analytics - distinguishes users',
      '_gat': 'Google Analytics - throttles request rate',
      '_fbp': 'Facebook Pixel - tracks visitors',
      'fr': 'Facebook Pixel - tracks visitors',
      'session': 'Essential - maintains user session',
      'csrf': 'Essential - prevents cross-site request forgery',
      'theme': 'Preferences - stores user theme preference',
      'language': 'Preferences - stores user language preference'
    };

    return purposes[name] || 'Unknown purpose';
  }

  /**
   * Identify tracker from URL
   */
  private identifyTracker(url: string): DetectedTracker | null {
    const patterns = [
      {
        pattern: /google-analytics\.com|googletagmanager\.com/,
        name: 'Google Analytics',
        category: 'analytics'
      },
      {
        pattern: /facebook\.net|connect\.facebook\.net/,
        name: 'Facebook Pixel',
        category: 'marketing'
      },
      {
        pattern: /hotjar\.com|static\.hotjar\.com/,
        name: 'Hotjar',
        category: 'analytics'
      },
      {
        pattern: /mixpanel\.com|cdn\.mxpnl\.com/,
        name: 'Mixpanel',
        category: 'analytics'
      }
    ];

    for (const pattern of patterns) {
      if (pattern.pattern.test(url)) {
        try {
          const urlObj = new URL(url);
          return {
            name: pattern.name,
            type: 'script',
            url: url,
            domain: urlObj.hostname,
            category: pattern.category,
            description: `${pattern.name} tracking script`,
            blocked: false
          };
        } catch (error) {
          // Invalid URL
        }
      }
    }

    return null;
  }

  /**
   * Perform comprehensive website scan
   */
  public async scanWebsite(): Promise<{
    cookies: DetectedCookie[];
    trackers: DetectedTracker[];
    scanTimestamp: number;
    scanDuration: number;
    totalCookies: number;
    totalTrackers: number;
  }> {
    const startTime = Date.now();
    
    // Reset arrays
    this.cookies = [];
    this.trackers = [];
    
    // Perform scans
    this.scanCookies();
    this.scanTrackers();
    
    const endTime = Date.now();
    
    return {
      cookies: this.cookies,
      trackers: this.trackers,
      scanTimestamp: endTime,
      scanDuration: endTime - startTime,
      totalCookies: this.cookies.length,
      totalTrackers: this.trackers.length
    };
  }

  /**
   * Get cookies by category
   */
  public getCookiesByCategory(category: string): DetectedCookie[] {
    return this.cookies.filter(cookie => cookie.category === category);
  }

  /**
   * Get trackers by category
   */
  public getTrackersByCategory(category: string): DetectedTracker[] {
    return this.trackers.filter(tracker => tracker.category === category);
  }

  /**
   * Get all detected cookies
   */
  public getAllCookies(): DetectedCookie[] {
    return [...this.cookies];
  }

  /**
   * Get all detected trackers
   */
  public getAllTrackers(): DetectedTracker[] {
    return [...this.trackers];
  }
}
