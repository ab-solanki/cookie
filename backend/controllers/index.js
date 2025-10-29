/**
 * Cookie Configuration Controllers
 * Business logic for cookie configuration management
 */

const { CookieConfig, ConsentLog } = require('../models');
const { validateCookieConfig } = require('../utils/validation');
const { cacheService } = require('../utils/cache');

class CookieConfigController {
  /**
   * Get cookie configuration by language
   */
  async getConfigByLanguage(req, res) {
    try {
      const { language } = req.params;
      const cacheKey = `cookie-config-${language}`;

      // Try to get from cache first
      if (cacheService.isEnabled()) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            language: language,
            source: 'cache',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Get from database
      const config = await CookieConfig.findOne({ 
        language: language.toLowerCase(),
        enabled: true 
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found for the specified language',
          language: language
        });
      }

      // Cache the result
      if (cacheService.isEnabled()) {
        await cacheService.set(cacheKey, config, 300); // 5 minutes
      }

      res.json({
        success: true,
        data: config,
        language: language,
        source: 'database',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting config by language:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get cookie configuration with auto-detection
   */
  async getConfig(req, res) {
    try {
      // Determine language from query param, header, or default
      let language = req.query.lang || 
                    req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                    'en';

      // Redirect to specific language endpoint
      return res.redirect(`/api/cookie-config/${language}`);
      
    } catch (error) {
      console.error('Error getting config:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all available languages
   */
  async getAvailableLanguages(req, res) {
    try {
      const languages = await CookieConfig.find({ enabled: true })
        .select('language country region')
        .sort({ language: 1 });

      const languageList = languages.map(config => ({
        language: config.language,
        country: config.country,
        region: config.region
      }));

      res.json({
        success: true,
        languages: languageList,
        count: languageList.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting available languages:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Create or update cookie configuration
   */
  async createOrUpdateConfig(req, res) {
    try {
      const { language } = req.params;
      const configData = req.body;

      // Validate the configuration data
      const validation = validateCookieConfig(configData);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration format',
          details: validation.errors
        });
      }

      // Check if configuration exists
      const existingConfig = await CookieConfig.findOne({ 
        language: language.toLowerCase() 
      });

      let config;
      if (existingConfig) {
        // Update existing configuration
        Object.assign(existingConfig, configData);
        existingConfig.updatedBy = req.user?.id;
        config = await existingConfig.save();
      } else {
        // Create new configuration
        config = new CookieConfig({
          ...configData,
          language: language.toLowerCase(),
          createdBy: req.user?.id
        });
        await config.save();
      }

      // Clear cache for this language
      if (cacheService.isEnabled()) {
        await cacheService.delete(`cookie-config-${language}`);
      }

      res.json({
        success: true,
        message: existingConfig ? 'Configuration updated successfully' : 'Configuration created successfully',
        data: config,
        language: language,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error creating/updating config:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete cookie configuration
   */
  async deleteConfig(req, res) {
    try {
      const { language } = req.params;

      const config = await CookieConfig.findOneAndDelete({ 
        language: language.toLowerCase() 
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          error: 'Configuration not found'
        });
      }

      // Clear cache
      if (cacheService.isEnabled()) {
        await cacheService.delete(`cookie-config-${language}`);
      }

      res.json({
        success: true,
        message: 'Configuration deleted successfully',
        language: language,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error deleting config:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get all configurations (admin only)
   */
  async getAllConfigs(req, res) {
    try {
      const { page = 1, limit = 10, enabled } = req.query;
      const skip = (page - 1) * limit;

      const filter = {};
      if (enabled !== undefined) {
        filter.enabled = enabled === 'true';
      }

      const configs = await CookieConfig.find(filter)
        .select('-__v')
        .sort({ language: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await CookieConfig.countDocuments(filter);

      res.json({
        success: true,
        data: configs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting all configs:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

class ConsentLogController {
  /**
   * Log consent action
   */
  async logConsent(req, res) {
    try {
      const logData = {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer,
        pageUrl: req.headers.origin
      };

      const log = new ConsentLog(logData);
      await log.save();

      res.json({
        success: true,
        message: 'Consent logged successfully',
        logId: log._id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error logging consent:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get consent analytics
   */
  async getConsentAnalytics(req, res) {
    try {
      const { startDate, endDate, language } = req.query;
      
      const filter = {};
      if (startDate) filter.timestamp = { $gte: new Date(startDate) };
      if (endDate) filter.timestamp = { ...filter.timestamp, $lte: new Date(endDate) };
      if (language) filter.language = language;

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

      res.json({
        success: true,
        data: analytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error getting consent analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = {
  CookieConfigController,
  ConsentLogController
};

