/**
 * Consent Logger - Audit trail for compliance
 */

export interface ConsentLoggerConfig {
  enabled: boolean;
  storageType: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'server';
  serverEndpoint?: string;
  anonymizeData: boolean;
}

export interface ConsentLogEntry {
  id: string;
  timestamp: number;
  action: 'accept' | 'reject' | 'customize' | 'save' | 'withdraw';
  consentData: any;
  userAgent: string;
  ipAddress: string;
  referrer: string;
  pageUrl: string;
  sessionId: string;
  version: string;
}

export class ConsentLogger {
  private config: ConsentLoggerConfig;

  constructor(config: Partial<ConsentLoggerConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storageType: config.storageType ?? 'localStorage',
      serverEndpoint: config.serverEndpoint,
      anonymizeData: config.anonymizeData ?? true
    };
  }

  /**
   * Log consent action
   */
  public async logConsent(action: ConsentLogEntry['action'], consentData: any): Promise<void> {
    if (!this.config.enabled) return;

    const logEntry: ConsentLogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      action,
      consentData,
      userAgent: navigator.userAgent,
      ipAddress: await this.getIPAddress(),
      referrer: document.referrer,
      pageUrl: window.location.href,
      sessionId: this.getSessionId(),
      version: '1.0.0'
    };

    if (this.config.anonymizeData) {
      logEntry.ipAddress = this.anonymizeIP(logEntry.ipAddress);
    }

    await this.storeLogEntry(logEntry);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user IP address
   */
  private async getIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('ns-cookie-session-id');
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('ns-cookie-session-id', sessionId);
    }
    return sessionId;
  }

  /**
   * Anonymize IP address
   */
  private anonymizeIP(ip: string): string {
    if (ip === 'unknown') return ip;
    
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    
    return ip;
  }

  /**
   * Store log entry based on storage type
   */
  private async storeLogEntry(logEntry: ConsentLogEntry): Promise<void> {
    switch (this.config.storageType) {
      case 'localStorage':
        this.storeInLocalStorage(logEntry);
        break;
      case 'sessionStorage':
        this.storeInSessionStorage(logEntry);
        break;
      case 'indexedDB':
        await this.storeInIndexedDB(logEntry);
        break;
      case 'server':
        await this.storeOnServer(logEntry);
        break;
    }
  }

  /**
   * Store in localStorage
   */
  private storeInLocalStorage(logEntry: ConsentLogEntry): void {
    try {
      const logs = this.getLogsFromStorage('localStorage');
      logs.push(logEntry);
      localStorage.setItem('ns-cookie-logs', JSON.stringify(logs));
    } catch (error) {
      // Handle storage quota exceeded
    }
  }

  /**
   * Store in sessionStorage
   */
  private storeInSessionStorage(logEntry: ConsentLogEntry): void {
    try {
      const logs = this.getLogsFromStorage('sessionStorage');
      logs.push(logEntry);
      sessionStorage.setItem('ns-cookie-logs', JSON.stringify(logs));
    } catch (error) {
      // Handle storage quota exceeded
    }
  }

  /**
   * Store in IndexedDB
   */
  private async storeInIndexedDB(logEntry: ConsentLogEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NSCookieLogs', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction(['logs'], 'readwrite');
        const store = transaction.objectStore('logs');
        const addRequest = store.add(logEntry);
        
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('logs')) {
          const store = db.createObjectStore('logs', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  /**
   * Store on server
   */
  private async storeOnServer(logEntry: ConsentLogEntry): Promise<void> {
    if (!this.config.serverEndpoint) return;

    try {
      await fetch(this.config.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Handle server errors
    }
  }

  /**
   * Get logs from storage
   */
  private getLogsFromStorage(storageType: 'localStorage' | 'sessionStorage'): ConsentLogEntry[] {
    try {
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      const logs = storage.getItem('ns-cookie-logs');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all consent logs
   */
  public getConsentLogs(): ConsentLogEntry[] {
    switch (this.config.storageType) {
      case 'localStorage':
        return this.getLogsFromStorage('localStorage');
      case 'sessionStorage':
        return this.getLogsFromStorage('sessionStorage');
      default:
        return [];
    }
  }

  /**
   * Generate audit report
   */
  public async generateAuditReport(startDate?: number, endDate?: number): Promise<{
    totalConsents: number;
    consentBreakdown: Record<string, number>;
    geographicDistribution: Record<string, number>;
    timeRange: { start: number; end: number };
    complianceStatus: string;
    entries: ConsentLogEntry[];
  }> {
    const logs = this.getConsentLogs().filter(log => {
      if (startDate && log.timestamp < startDate) return false;
      if (endDate && log.timestamp > endDate) return false;
      return true;
    });

    const consentBreakdown: Record<string, number> = {
      accept: 0,
      reject: 0,
      customize: 0,
      save: 0,
      withdraw: 0
    };

    const geographicDistribution: Record<string, number> = {};

    logs.forEach(log => {
      consentBreakdown[log.action]++;
      const country = this.getCountryFromIP(log.ipAddress);
      geographicDistribution[country] = (geographicDistribution[country] || 0) + 1;
    });

    return {
      totalConsents: logs.length,
      consentBreakdown,
      geographicDistribution,
      timeRange: {
        start: startDate || Math.min(...logs.map(log => log.timestamp)),
        end: endDate || Math.max(...logs.map(log => log.timestamp))
      },
      complianceStatus: this.determineComplianceStatus(consentBreakdown),
      entries: logs
    };
  }

  /**
   * Get country from IP (simplified)
   */
  private getCountryFromIP(ip: string): string {
    if (ip.includes('192.168') || ip.includes('127.0.0')) {
      return 'Local';
    }
    return 'Unknown';
  }

  /**
   * Determine compliance status
   */
  private determineComplianceStatus(breakdown: Record<string, number>): string {
    const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) return 'non-compliant';
    
    const rejectionRate = breakdown.reject / total;
    
    if (rejectionRate > 0.1) return 'compliant';
    if (rejectionRate > 0.05) return 'partial';
    return 'non-compliant';
  }

  /**
   * Clear old logs
   */
  public clearOldLogs(daysToKeep: number = 365): void {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

    switch (this.config.storageType) {
      case 'localStorage':
        this.clearOldLogsFromStorage('localStorage', cutoffTime);
        break;
      case 'sessionStorage':
        this.clearOldLogsFromStorage('sessionStorage', cutoffTime);
        break;
    }
  }

  /**
   * Clear old logs from storage
   */
  private clearOldLogsFromStorage(storageType: 'localStorage' | 'sessionStorage', cutoffTime: number): void {
    try {
      const logs = this.getLogsFromStorage(storageType).filter(log => log.timestamp > cutoffTime);
      const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
      storage.setItem('ns-cookie-logs', JSON.stringify(logs));
    } catch (error) {
      // Handle errors
    }
  }

  /**
   * Export logs as JSON
   */
  public exportLogs(): string {
    const logs = this.getConsentLogs();
    return JSON.stringify(logs, null, 2);
  }
}
