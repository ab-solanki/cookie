/**
 * Modern TypeScript Controllers with ES6+ Features
 * Using async/await, destructuring, and modern patterns
 */

import { Request, Response, NextFunction } from 'express';
import { CookieConfig, ConsentLog } from '../models/index.js';
import { cacheService } from '../utils/cache.js';
import { validateCookieConfig } from '../utils/validation.js';
import { ApiError, NotFoundError, ValidationError } from '../types/index.js';
import type {
  ApiResponse,
  PaginatedResponse,
  CreateConfigRequest,
  UpdateConfigRequest,
  ConsentLogRequest,
  AnalyticsQuery,
  AuthenticatedRequest
} from '../types/index.js';

// ============================================================================
// Cookie Configuration Controller
// ============================================================================

export class CookieConfigController {
  /**
   * Get cookie configuration by language with modern async/await
   */
  async getConfigByLanguage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language } = req.params;
      const cacheKey = `cookie-config-${language}`;

      // Try cache first with modern async/await
      if (cacheService.isEnabled()) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          const response: ApiResponse = {
            success: true,
            data: cached,
            language,
            source: 'cache',
            timestamp: new Date().toISOString()
          };
          res.json(response);
          return;
        }
      }

      // Database query with modern syntax
      const config = await CookieConfig.findOne({ 
        language: language.toLowerCase(),
        enabled: true 
      }).lean();

      if (!config) {
        throw new NotFoundError(`Configuration for language '${language}'`);
      }

      // Cache the result
      if (cacheService.isEnabled()) {
        await cacheService.set(cacheKey, config, 300); // 5 minutes
      }

      const response: ApiResponse = {
        success: true,
        data: config,
        language,
        source: 'database',
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get configuration with auto-detection using modern patterns
   */
  async getConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Modern destructuring with defaults
      const { lang } = req.query;
      const acceptLanguage = req.headers['accept-language'];
      
      // Determine language with modern syntax
      const language = lang as string || 
                      acceptLanguage?.split(',')[0]?.split('-')[0] || 
                      'en';

      // Redirect to specific language endpoint
      res.redirect(`/api/cookie-config/${language}`);
      
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available languages with modern array methods
   */
  async getAvailableLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await CookieConfig.find({ enabled: true })
        .select('language country region')
        .sort({ language: 1 })
        .lean();

      // Modern array mapping with destructuring
      const languageList = configs.map(({ language, country, region }) => ({
        language,
        country,
        region
      }));

      const response: ApiResponse = {
        success: true,
        data: languageList,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update configuration with modern validation
   */
  async createOrUpdateConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language } = req.params;
      const configData = req.body as CreateConfigRequest;

      // Modern validation with destructuring
      const { isValid, errors, data } = validateCookieConfig(configData);
      
      if (!isValid) {
        throw new ValidationError('Invalid configuration format', errors);
      }

      // Modern async/await with destructuring
      const existingConfig = await CookieConfig.findOne({ 
        language: language.toLowerCase() 
      });

      let config;
      if (existingConfig) {
        // Update existing with modern object spread
        Object.assign(existingConfig, data);
        existingConfig.updatedBy = req.user?.id;
        config = await existingConfig.save();
      } else {
        // Create new with modern syntax
        config = new CookieConfig({
          ...data,
          language: language.toLowerCase(),
          createdBy: req.user?.id
        });
        await config.save();
      }

      // Clear cache with modern async/await
      if (cacheService.isEnabled()) {
        await cacheService.delete(`cookie-config-${language}`);
      }

      const response: ApiResponse = {
        success: true,
        data: config,
        language,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete configuration with modern error handling
   */
  async deleteConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { language } = req.params;

      const config = await CookieConfig.findOneAndDelete({ 
        language: language.toLowerCase() 
      });

      if (!config) {
        throw new NotFoundError(`Configuration for language '${language}'`);
      }

      // Clear cache
      if (cacheService.isEnabled()) {
        await cacheService.delete(`cookie-config-${language}`);
      }

      const response: ApiResponse = {
        success: true,
        data: { deleted: true },
        language,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all configurations with modern pagination
   */
  async getAllConfigs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Modern destructuring with defaults
      const { 
        page = '1', 
        limit = '10', 
        enabled 
      } = req.query;

      const pageNum = Number.parseInt(page as string, 10);
      const limitNum = Number.parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Modern filter construction
      const filter: Record<string, unknown> = {};
      if (enabled !== undefined) {
        filter.enabled = enabled === 'true';
      }

      // Modern Promise.all for parallel queries
      const [configs, total] = await Promise.all([
        CookieConfig.find(filter)
          .select('-__v')
          .sort({ language: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        CookieConfig.countDocuments(filter)
      ]);

      const response: PaginatedResponse<typeof configs[0]> = {
        success: true,
        data: configs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// Consent Log Controller
// ============================================================================

export class ConsentLogController {
  /**
   * Log consent action with modern request handling
   */
  async logConsent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Modern destructuring with spread operator
      const logData: ConsentLogRequest = {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        pageUrl: req.headers.origin
      };

      const log = new ConsentLog(logData);
      await log.save();

      const response: ApiResponse = {
        success: true,
        data: { logId: log._id },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consent analytics with modern aggregation
   */
  async getConsentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Modern destructuring with type assertion
      const { startDate, endDate, language } = req.query as AnalyticsQuery;
      
      // Modern filter construction
      const filter: Record<string, unknown> = {};
      if (startDate) filter.timestamp = { $gte: new Date(startDate) };
      if (endDate) filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };
      if (language) filter.language = language;

      // Modern MongoDB aggregation pipeline
      const analytics = await ConsentLog.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              action: '$action',
              language: '$language'
            },
            count: { $sum: 1 },
            lastAction: { $max: '$timestamp' }
          }
        },
        {
          $group: {
            _id: '$_id.language',
            actions: {
              $push: {
                action: '$_id.action',
                count: '$count',
                lastAction: '$lastAction'
              }
            },
            totalConsents: { $sum: '$count' }
          }
        }
      ]);

      const response: ApiResponse = {
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }

  /**
   * Get consent statistics with modern date handling
   */
  async getConsentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { days = '30' } = req.query;
      const daysNum = Number.parseInt(days as string, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);

      // Modern aggregation with date filtering
      const stats = await ConsentLog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            uniqueSessions: { $addToSet: '$sessionId' }
          }
        },
        {
          $project: {
            action: '$_id',
            count: 1,
            uniqueSessions: { $size: '$uniqueSessions' }
          }
        }
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          period: `${daysNum} days`,
          stats
        },
        timestamp: new Date().toISOString()
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
}

// ============================================================================
// Controller Factory
// ============================================================================

export const createControllers = () => ({
  cookieConfig: new CookieConfigController(),
  consentLog: new ConsentLogController()
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  CookieConfigController,
  ConsentLogController,
  createControllers
};

