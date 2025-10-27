/**
 * GeoTargeting - Location-based consent management
 */

export interface GeoTargetingConfig {
  enabled: boolean;
  fallbackRegion: Region;
  regions: Map<string, Region>;
}

export interface Region {
  code: string;
  name: string;
  laws: string[];
  requiresConsent: boolean;
  consentType: 'opt-in' | 'opt-out';
  cookieCategories: string[];
  bannerStyle: 'minimal' | 'comprehensive' | 'detailed';
  language: string;
}

export class GeoTargeting {
  private config: GeoTargetingConfig;

  constructor(config: Partial<GeoTargetingConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      fallbackRegion: this.getDefaultRegion(),
      regions: this.initializeRegions()
    };
  }

  /**
   * Get default region configuration
   */
  private getDefaultRegion(): Region {
    return {
      code: 'US',
      name: 'United States',
      laws: ['CCPA'],
      requiresConsent: false,
      consentType: 'opt-out',
      cookieCategories: ['essential', 'analytics', 'marketing', 'preferences'],
      bannerStyle: 'minimal',
      language: 'en'
    };
  }

  /**
   * Initialize region configurations
   */
  private initializeRegions(): Map<string, Region> {
    const regions = new Map<string, Region>();

    // European Union
    regions.set('EU', {
      code: 'EU',
      name: 'European Union',
      laws: ['GDPR'],
      requiresConsent: true,
      consentType: 'opt-in',
      cookieCategories: ['essential', 'analytics', 'marketing', 'preferences'],
      bannerStyle: 'comprehensive',
      language: 'en'
    });

    // United Kingdom
    regions.set('GB', {
      code: 'GB',
      name: 'United Kingdom',
      laws: ['UK GDPR', 'PECR'],
      requiresConsent: true,
      consentType: 'opt-in',
      cookieCategories: ['essential', 'analytics', 'marketing', 'preferences'],
      bannerStyle: 'detailed',
      language: 'en'
    });

    // California
    regions.set('CA', {
      code: 'CA',
      name: 'California',
      laws: ['CCPA'],
      requiresConsent: false,
      consentType: 'opt-out',
      cookieCategories: ['essential', 'analytics', 'marketing', 'preferences'],
      bannerStyle: 'minimal',
      language: 'en'
    });

    return regions;
  }

  /**
   * Get current user location
   */
  public async getCurrentLocation(): Promise<{
    country: string;
    countryCode: string;
    region: string;
    city: string;
    timezone: string;
    ip: string;
  } | null> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        ip: data.ip
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get compliance region for current user
   */
  public async getComplianceRegion(): Promise<Region> {
    if (!this.config.enabled) {
      return this.config.fallbackRegion;
    }

    const location = await this.getCurrentLocation();
    if (!location) {
      return this.config.fallbackRegion;
    }

    // EU countries
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
    ];

    if (euCountries.includes(location.countryCode)) {
      return this.config.regions.get('EU') || this.config.fallbackRegion;
    }

    const region = this.config.regions.get(location.countryCode);
    return region || this.config.fallbackRegion;
  }

  /**
   * Get region configuration
   */
  public async getRegionConfig(): Promise<Region> {
    return this.getComplianceRegion();
  }

  /**
   * Get region-specific texts
   */
  public async getRegionTexts(): Promise<Record<string, string>> {
    const region = await this.getComplianceRegion();
    
    const texts: Record<string, Record<string, string>> = {
      EU: {
        title: 'Cookie-Einstellungen',
        description: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.',
        acceptAll: 'Alle akzeptieren',
        rejectAll: 'Alle ablehnen',
        customize: 'Anpassen'
      },
      GB: {
        title: 'Cookie Preferences',
        description: 'We use cookies to enhance your browsing experience.',
        acceptAll: 'Accept All',
        rejectAll: 'Reject All',
        customize: 'Customize'
      },
      CA: {
        title: 'Cookie Settings',
        description: 'We use cookies to improve your experience.',
        acceptAll: 'Accept All',
        rejectAll: 'Opt Out',
        customize: 'Manage Preferences'
      }
    };

    return texts[region.code] || texts.CA;
  }

  /**
   * Check if consent is required for current region
   */
  public async isConsentRequired(): Promise<boolean> {
    const region = await this.getComplianceRegion();
    return region.requiresConsent;
  }

  /**
   * Get consent type for current region
   */
  public async getConsentType(): Promise<'opt-in' | 'opt-out'> {
    const region = await this.getComplianceRegion();
    return region.consentType === 'opt-in' ? 'opt-in' : 'opt-out';
  }

  /**
   * Get banner style for current region
   */
  public async getBannerStyle(): Promise<string> {
    const region = await this.getComplianceRegion();
    return region.bannerStyle;
  }

  /**
   * Get applicable laws for current region
   */
  public async getApplicableLaws(): Promise<string[]> {
    const region = await this.getComplianceRegion();
    return region.laws;
  }
}
