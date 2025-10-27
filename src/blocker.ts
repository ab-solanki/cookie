/**
 * Auto Blocker - Prevents tracking scripts until consent is given
 */

export class AutoBlocker {
  private rules: Array<{
    id: string;
    name: string;
    pattern: string;
    type: 'script' | 'iframe' | 'pixel';
    category: string;
    enabled: boolean;
    description: string;
  }> = [];
  private isEnabled: boolean = false;

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default blocking rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        pattern: 'google-analytics.com',
        type: 'script',
        category: 'analytics',
        enabled: true,
        description: 'Blocks Google Analytics tracking'
      },
      {
        id: 'google-tag-manager',
        name: 'Google Tag Manager',
        pattern: 'googletagmanager.com',
        type: 'script',
        category: 'analytics',
        enabled: true,
        description: 'Blocks Google Tag Manager'
      },
      {
        id: 'facebook-pixel',
        name: 'Facebook Pixel',
        pattern: 'connect.facebook.net',
        type: 'script',
        category: 'marketing',
        enabled: true,
        description: 'Blocks Facebook Pixel tracking'
      },
      {
        id: 'hotjar',
        name: 'Hotjar',
        pattern: 'static.hotjar.com',
        type: 'script',
        category: 'analytics',
        enabled: true,
        description: 'Blocks Hotjar tracking'
      }
    ];
  }

  /**
   * Enable auto-blocking
   */
  public enable(): void {
    this.isEnabled = true;
    this.applyBlocking();
  }

  /**
   * Disable auto-blocking
   */
  public disable(): void {
    this.isEnabled = false;
    this.removeBlocking();
  }

  /**
   * Apply blocking to document
   */
  private applyBlocking(): void {
    const originalCreateElement = document.createElement;
    
    document.createElement = function(tagName: string) {
      const element = originalCreateElement.call(this, tagName);
      
      if (tagName.toLowerCase() === 'script') {
        const scriptElement = element as HTMLScriptElement;
        const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        
        Object.defineProperty(scriptElement, 'src', {
          get: function() {
            return originalSrcDescriptor?.get?.call(this) || '';
          },
          set: function(url: string) {
            if (!this.shouldBlockScript || !this.shouldBlockScript(url)) {
              originalSrcDescriptor?.set?.call(this, url);
            }
          }
        });
      }
      
      return element;
    };
  }

  /**
   * Remove blocking
   */
  private removeBlocking(): void {
    // Implementation for removing blocking
  }

  /**
   * Add custom blocking rule
   */
  public addRule(rule: typeof this.rules[0]): void {
    this.rules.push(rule);
  }

  /**
   * Remove blocking rule
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Get all blocking rules
   */
  public getRules(): typeof this.rules {
    return [...this.rules];
  }

  /**
   * Check if rule is enabled
   */
  public isRuleEnabled(ruleId: string): boolean {
    const rule = this.rules.find(rule => rule.id === ruleId);
    return rule?.enabled || false;
  }

  /**
   * Enable/disable specific rule
   */
  public setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(rule => rule.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Check if script should be blocked
   */
  public shouldBlockScript(url: string): boolean {
    return this.isEnabled && this.rules.some(rule => 
      rule.enabled && 
      rule.type === 'script' && 
      url.includes(rule.pattern)
    );
  }

  /**
   * Check if iframe should be blocked
   */
  public shouldBlockIframe(url: string): boolean {
    return this.isEnabled && this.rules.some(rule => 
      rule.enabled && 
      rule.type === 'iframe' && 
      url.includes(rule.pattern)
    );
  }

  /**
   * Check if pixel should be blocked
   */
  public shouldBlockPixel(url: string): boolean {
    return this.isEnabled && this.rules.some(rule => 
      rule.enabled && 
      rule.type === 'pixel' && 
      url.includes(rule.pattern)
    );
  }
}
