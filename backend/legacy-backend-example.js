/**
 * Backend API Example - Cookie Configuration Management
 * This shows how to create a backend API for dynamic cookie configuration
 */

// Example: Express.js + Node.js Backend
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Database/Storage for configurations (could be MySQL, MongoDB, etc.)
const cookieConfigs = {
  'en': {
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
    }
  },
  'de': {
    texts: {
      title: 'Cookie-Einstellungen',
      description: 'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern.',
      acceptAll: 'Alle akzeptieren',
      rejectAll: 'Alle ablehnen',
      customize: 'Anpassen',
      save: 'Einstellungen speichern',
      close: 'Schließen',
      moreInfo: 'Weitere Informationen',
      cookiePolicy: 'Cookie-Richtlinie',
      privacyPolicy: 'Datenschutzrichtlinie'
    },
    categories: {
      essential: {
        name: 'Notwendig',
        description: 'Diese Cookies sind für das ordnungsgemäße Funktionieren der Website erforderlich.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analytisch',
        description: 'Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'Diese Cookies werden zur Bereitstellung personalisierter Werbung verwendet.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Einstellungen',
        description: 'Diese Cookies speichern Ihre Präferenzen und Einstellungen.',
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
    }
  }
};

// API Endpoints
app.get('/api/cookie-config/:language', (req, res) => {
  const { language } = req.params;
  const config = cookieConfigs[language] || cookieConfigs['en'];
  
  res.json({
    success: true,
    data: config,
    language: language,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/cookie-config', (req, res) => {
  const language = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
  const config = cookieConfigs[language] || cookieConfigs['en'];
  
  res.json({
    success: true,
    data: config,
    language: language,
    timestamp: new Date().toISOString()
  });
});

// Admin endpoint to update configurations
app.put('/api/admin/cookie-config/:language', (req, res) => {
  const { language } = req.params;
  const newConfig = req.body;
  
  // Validate configuration
  if (!newConfig.texts || !newConfig.categories) {
    return res.status(400).json({
      success: false,
      error: 'Invalid configuration format'
    });
  }
  
  // Update configuration
  cookieConfigs[language] = newConfig;
  
  res.json({
    success: true,
    message: `Configuration updated for language: ${language}`,
    timestamp: new Date().toISOString()
  });
});

// Get all available languages
app.get('/api/cookie-config/languages', (req, res) => {
  res.json({
    success: true,
    languages: Object.keys(cookieConfigs),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Cookie Config API running on port ${PORT}`);
});

module.exports = app;
