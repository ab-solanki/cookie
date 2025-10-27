/**
 * Utility functions for NS Cookie Plugin
 */

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {} as any, source[key] as any);
    } else if (source[key] !== undefined) {
      result[key] = source[key] as any;
    }
  }
  
  return result;
}

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format date
 */
export function formatDate(date: Date | number, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'iso':
      return d.toISOString();
    default:
      return d.toString();
  }
}

/**
 * Create DOM element with attributes and content
 */
export function createElement(
  tagName: string,
  attributes: Record<string, string> = {},
  content?: string | HTMLElement[]
): HTMLElement {
  const element = document.createElement(tagName);
  
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof HTMLElement) {
          element.appendChild(child);
        }
      });
    }
  }
  
  return element;
}

/**
 * Add event listener with cleanup function
 */
export function addEventListenerWithCleanup(
  element: EventTarget,
  event: string,
  handler: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): () => void {
  element.addEventListener(event, handler, options);
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Enhanced cookie storage utilities
 */
export const cookieStorage = {
  setCookie(name: string, value: string, options: any = {}): void {
    let cookieString = `${name}=${encodeURIComponent(value)}`;
    
    if (options.expires) {
      const date = new Date();
      date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
      cookieString += `; expires=${date.toUTCString()}`;
    }
    
    if (options.path) cookieString += `; path=${options.path}`;
    if (options.domain) cookieString += `; domain=${options.domain}`;
    if (options.secure) cookieString += '; secure';
    if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
    
    document.cookie = cookieString;
  },
  
  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    
    return null;
  },
  
  removeCookie(name: string, path: string = '/', domain?: string): void {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
    if (domain) cookieString += `; domain=${domain}`;
    document.cookie = cookieString;
  }
};

/**
 * Enhanced localStorage with expiration
 */
export const storage = {
  setItem(key: string, data: any, expiry?: number): void {
    const item = {
      data,
      timestamp: Date.now(),
      expiry: expiry ? Date.now() + expiry : undefined
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },
  
  getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
  
  clear(): void {
    localStorage.clear();
  }
};
