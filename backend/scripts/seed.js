/**
 * Database Seeding Script
 * Populates the database with default cookie configurations
 */

const mongoose = require('mongoose');
const { CookieConfig } = require('../models');
const { getDefaultConfig } = require('../utils');
const config = require('../config');

// Default configurations for different languages
const defaultConfigurations = {
  en: {
    country: 'US',
    region: 'North America',
    ...getDefaultConfig('en')
  },
  de: {
    country: 'DE',
    region: 'Europe',
    ...getDefaultConfig('de')
  },
  fr: {
    country: 'FR',
    region: 'Europe',
    texts: {
      title: 'Consentement aux Cookies',
      description: 'Nous utilisons des cookies pour améliorer votre expérience de navigation.',
      acceptAll: 'Tout Accepter',
      rejectAll: 'Tout Rejeter',
      customize: 'Personnaliser',
      save: 'Enregistrer les Préférences',
      close: 'Fermer',
      moreInfo: 'Plus d\'Informations',
      cookiePolicy: 'Politique des Cookies',
      privacyPolicy: 'Politique de Confidentialité'
    },
    categories: {
      essential: {
        name: 'Essentiel',
        description: 'Ces cookies sont nécessaires au bon fonctionnement du site web.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analytique',
        description: 'Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site web.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'Ces cookies sont utilisés pour diffuser des publicités personnalisées.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Préférences',
        description: 'Ces cookies mémorisent vos préférences et paramètres.',
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
    cookieSettings: {
      name: 'ns-cookie-consent',
      expiry: 365,
      domain: '',
      path: '/',
      secure: false,
      sameSite: 'Lax'
    }
  },
  es: {
    country: 'ES',
    region: 'Europe',
    texts: {
      title: 'Consentimiento de Cookies',
      description: 'Utilizamos cookies para mejorar su experiencia de navegación.',
      acceptAll: 'Aceptar Todo',
      rejectAll: 'Rechazar Todo',
      customize: 'Personalizar',
      save: 'Guardar Preferencias',
      close: 'Cerrar',
      moreInfo: 'Más Información',
      cookiePolicy: 'Política de Cookies',
      privacyPolicy: 'Política de Privacidad'
    },
    categories: {
      essential: {
        name: 'Esencial',
        description: 'Estas cookies son necesarias para el funcionamiento adecuado del sitio web.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analíticas',
        description: 'Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'Estas cookies se utilizan para entregar anuncios personalizados.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Preferencias',
        description: 'Estas cookies recuerdan sus preferencias y configuraciones.',
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
    cookieSettings: {
      name: 'ns-cookie-consent',
      expiry: 365,
      domain: '',
      path: '/',
      secure: false,
      sameSite: 'Lax'
    }
  },
  it: {
    country: 'IT',
    region: 'Europe',
    texts: {
      title: 'Consenso sui Cookie',
      description: 'Utilizziamo i cookie per migliorare la tua esperienza di navigazione.',
      acceptAll: 'Accetta Tutto',
      rejectAll: 'Rifiuta Tutto',
      customize: 'Personalizza',
      save: 'Salva Preferenze',
      close: 'Chiudi',
      moreInfo: 'Maggiori Informazioni',
      cookiePolicy: 'Politica sui Cookie',
      privacyPolicy: 'Politica sulla Privacy'
    },
    categories: {
      essential: {
        name: 'Essenziale',
        description: 'Questi cookie sono necessari per il corretto funzionamento del sito web.',
        required: true,
        cookies: ['session', 'csrf', 'language']
      },
      analytics: {
        name: 'Analitici',
        description: 'Questi cookie ci aiutano a capire come i visitatori interagiscono con il nostro sito web.',
        required: false,
        cookies: ['_ga', '_gid', '_gat']
      },
      marketing: {
        name: 'Marketing',
        description: 'Questi cookie vengono utilizzati per fornire annunci personalizzati.',
        required: false,
        cookies: ['_fbp', 'fr']
      },
      preferences: {
        name: 'Preferenze',
        description: 'Questi cookie ricordano le tue preferenze e impostazioni.',
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
    cookieSettings: {
      name: 'ns-cookie-consent',
      expiry: 365,
      domain: '',
      path: '/',
      secure: false,
      sameSite: 'Lax'
    }
  }
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing configurations (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      await CookieConfig.deleteMany({});
      console.log('🗑️ Cleared existing configurations');
    }
    
    // Check existing configurations
    const existingCount = await CookieConfig.countDocuments();
    console.log(`📊 Found ${existingCount} existing configurations`);
    
    // Seed configurations
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const [language, configData] of Object.entries(defaultConfigurations)) {
      try {
        const existing = await CookieConfig.findOne({ language });
        
        if (existing) {
          // Update existing configuration
          Object.assign(existing, configData);
          existing.updatedAt = new Date();
          await existing.save();
          updatedCount++;
          console.log(`🔄 Updated configuration for ${language}`);
        } else {
          // Create new configuration
          await CookieConfig.create({
            language,
            ...configData,
            enabled: true,
            version: '1.0.0'
          });
          createdCount++;
          console.log(`✅ Created configuration for ${language}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${language}:`, error.message);
      }
    }
    
    console.log('─'.repeat(50));
    console.log(`🎉 Seeding completed!`);
    console.log(`📝 Created: ${createdCount} configurations`);
    console.log(`🔄 Updated: ${updatedCount} configurations`);
    console.log(`📊 Total: ${await CookieConfig.countDocuments()} configurations`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, defaultConfigurations };

