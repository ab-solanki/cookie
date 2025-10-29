/**
 * Modern TypeScript Database Seeding Script
 * Using ES6+ features and modern async/await patterns
 */

import mongoose from 'mongoose';
import { appConfig } from '../src/config/index.js';
import { CookieConfig } from '../src/models/index.js';
import { getDefaultConfig } from '../src/utils/index.js';

// ============================================================================
// Modern TypeScript Seeding Class
// ============================================================================

class DatabaseSeeder {
  private readonly defaultConfigurations = {
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
  } as const;

  /**
   * Connect to database with modern async/await
   */
  async connectDatabase(): Promise<void> {
    try {
      await mongoose.connect(appConfig.database.mongodb.uri, appConfig.database.mongodb.options);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Seed configurations with modern async/await and parallel processing
   */
  async seedConfigurations(): Promise<void> {
    try {
      console.log('🌱 Starting database seeding...');
      
      // Check if we should clear existing data
      const clearExisting = process.argv.includes('--clear');
      if (clearExisting) {
        await CookieConfig.deleteMany({});
        console.log('🗑️ Cleared existing configurations');
      }
      
      // Get existing count
      const existingCount = await CookieConfig.countDocuments();
      console.log(`📊 Found ${existingCount} existing configurations`);
      
      // Modern parallel processing with Promise.all
      const results = await Promise.allSettled(
        Object.entries(this.defaultConfigurations).map(async ([language, configData]) => {
          try {
            const existing = await CookieConfig.findOne({ language });
            
            if (existing) {
              // Modern object assignment
              Object.assign(existing, configData);
              existing.updatedAt = new Date();
              await existing.save();
              return { language, action: 'updated' };
            } else {
              // Modern object creation
              await CookieConfig.create({
                language,
                ...configData,
                enabled: true,
                version: '2.0.0'
              });
              return { language, action: 'created' };
            }
          } catch (error) {
            console.error(`❌ Error processing ${language}:`, error);
            throw error;
          }
        })
      );
      
      // Process results with modern array methods
      const successful = results
        .filter((result): result is PromiseFulfilledResult<{ language: string; action: string }> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        )
        .map(result => result.reason);
      
      // Modern destructuring and logging
      const createdCount = successful.filter(({ action }) => action === 'created').length;
      const updatedCount = successful.filter(({ action }) => action === 'updated').length;
      
      console.log('─'.repeat(50));
      console.log(`🎉 Seeding completed!`);
      console.log(`📝 Created: ${createdCount} configurations`);
      console.log(`🔄 Updated: ${updatedCount} configurations`);
      console.log(`❌ Failed: ${failed.length} configurations`);
      console.log(`📊 Total: ${await CookieConfig.countDocuments()} configurations`);
      
      if (failed.length > 0) {
        console.log('Failed languages:', failed.map(error => error.message));
      }
      
    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  /**
   * Close database connection with modern async/await
   */
  async closeConnection(): Promise<void> {
    try {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    } catch (error) {
      console.error('❌ Error closing connection:', error);
      throw error;
    }
  }

  /**
   * Run the complete seeding process
   */
  async run(): Promise<void> {
    try {
      await this.connectDatabase();
      await this.seedConfigurations();
    } catch (error) {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    } finally {
      await this.closeConnection();
      process.exit(0);
    }
  }
}

// ============================================================================
// Modern CLI Interface
// ============================================================================

const showHelp = (): void => {
  console.log(`
🌱 Cookie Configuration Database Seeder

Usage:
  npm run seed                    # Seed with default configurations
  npm run seed -- --clear        # Clear existing data and seed
  npm run seed -- --help         # Show this help message

Options:
  --clear    Clear existing configurations before seeding
  --help     Show this help message

Examples:
  npm run seed
  npm run seed -- --clear
  `);
};

// ============================================================================
// Main Execution
// ============================================================================

const main = async (): Promise<void> => {
  // Modern argument parsing
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  const seeder = new DatabaseSeeder();
  await seeder.run();
};

// ============================================================================
// Error Handling
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// ============================================================================
// Start Seeding
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default DatabaseSeeder;

