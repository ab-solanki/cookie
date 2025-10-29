# 🚀 Cookie Configuration Backend Setup Guide

This guide will help you set up the backend API for managing cookie configurations dynamically.

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🛠️ Quick Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the environment template
cp env.example .env

# Edit the .env file with your settings
nano .env
```

**Required Environment Variables:**
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cookie-config
JWT_SECRET=your-super-secret-jwt-key
CACHE_ENABLED=true
```

### 4. Start MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: Local Installation**
- Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
- Start the MongoDB service

### 5. Seed the Database

```bash
npm run seed
```

This will populate your database with default configurations for multiple languages.

### 6. Start the Server

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Get English Configuration
```bash
curl http://localhost:3000/api/cookie-config/en
```

### Get Available Languages
```bash
curl http://localhost:3000/api/cookie-config/languages
```

## 🔗 Frontend Integration

### 1. Update Your Frontend

Use the enhanced `CookiePluginWithBackend` class:

```javascript
// Load the enhanced plugin
import { CookiePluginWithBackend } from './src/CookiePluginWithBackend.js';

// Backend configuration
const backendOptions = {
  apiEndpoint: 'http://localhost:3000/api/cookie-config',
  language: 'en',
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  fallbackConfig: {
    // Fallback configuration if backend is unavailable
    texts: {
      title: 'Cookie Consent (Fallback)',
      description: 'We use cookies to enhance your browsing experience.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize'
    }
  }
};

// User configuration
const userConfig = {
  debug: true,
  autoShow: false,
  onAccept: (consent) => console.log('Accepted:', consent),
  onReject: (consent) => console.log('Rejected:', consent),
  onSave: (consent) => console.log('Saved:', consent)
};

// Initialize the plugin
const cookiePlugin = new CookiePluginWithBackend(userConfig, backendOptions);
```

### 2. Dynamic Language Switching

```javascript
// Switch to German
await cookiePlugin.setLanguage('de');

// Switch to French
await cookiePlugin.setLanguage('fr');

// Get available languages
const languages = await cookiePlugin.getAvailableLanguages();
console.log('Available languages:', languages);
```

### 3. Configuration Refresh

```javascript
// Refresh configuration from backend
await cookiePlugin.refreshConfig();
```

## 📊 Admin Features

### Authentication Setup

For admin features, you'll need to implement user authentication. The API expects JWT tokens in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Update Configuration

```bash
curl -X PUT "http://localhost:3000/api/admin/cookie-config/en" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": {
      "title": "Updated Cookie Consent",
      "description": "We use cookies to improve your experience.",
      "acceptAll": "Accept All",
      "rejectAll": "Reject All",
      "customize": "Customize",
      "save": "Save Preferences",
      "close": "Close",
      "moreInfo": "More Information",
      "cookiePolicy": "Cookie Policy",
      "privacyPolicy": "Privacy Policy"
    },
    "categories": {
      "essential": {
        "name": "Essential",
        "description": "These cookies are necessary for the website to function properly.",
        "required": true,
        "cookies": ["session", "csrf", "language"]
      },
      "analytics": {
        "name": "Analytics",
        "description": "These cookies help us understand how visitors interact with our website.",
        "required": false,
        "cookies": ["_ga", "_gid", "_gat"]
      },
      "marketing": {
        "name": "Marketing",
        "description": "These cookies are used to deliver personalized advertisements.",
        "required": false,
        "cookies": ["_fbp", "fr"]
      },
      "preferences": {
        "name": "Preferences",
        "description": "These cookies remember your preferences and settings.",
        "required": false,
        "cookies": ["theme", "language", "timezone"]
      }
    },
    "ui": {
      "primaryColor": "#28a745",
      "secondaryColor": "#6c757d",
      "borderRadius": "8px",
      "fontFamily": "system-ui, sans-serif",
      "fontSize": "14px",
      "animation": true,
      "backdrop": true
    },
    "cookieSettings": {
      "name": "ns-cookie-consent",
      "expiry": 365,
      "domain": "",
      "path": "/",
      "secure": false,
      "sameSite": "Lax"
    }
  }'
```

## 🔧 Configuration Management

### Adding New Languages

1. **Create Configuration via API:**
```bash
curl -X PUT "http://localhost:3000/api/admin/cookie-config/pt" \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": {
      "title": "Consentimento de Cookies",
      "description": "Usamos cookies para melhorar sua experiência de navegação.",
      "acceptAll": "Aceitar Tudo",
      "rejectAll": "Rejeitar Tudo",
      "customize": "Personalizar",
      "save": "Salvar Preferências",
      "close": "Fechar",
      "moreInfo": "Mais Informações",
      "cookiePolicy": "Política de Cookies",
      "privacyPolicy": "Política de Privacidade"
    }
  }'
```

2. **Or add to seed script and run:**
```bash
npm run seed
```

### Caching Configuration

The API includes built-in caching. Configure cache settings in your `.env`:

```env
CACHE_ENABLED=true
CACHE_TTL=300
```

### Rate Limiting

Protect your API with rate limiting:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🚀 Production Deployment

### 1. Environment Setup

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
CACHE_ENABLED=true
CORS_ORIGIN=https://yourdomain.com
```

### 2. Using PM2

```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start src/app.js --name "cookie-config-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 3. Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t cookie-config-api .
docker run -d -p 3000:3000 --name cookie-api cookie-config-api
```

## 🔍 Monitoring & Logging

### Health Monitoring

```bash
# Health check endpoint
curl http://localhost:3000/api/health
```

### Log Analysis

The API includes comprehensive logging. Check logs for:
- Request/response times
- Error rates
- Cache hit/miss ratios
- Database query performance

## 🆘 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB is running
   - Verify connection string in `.env`
   - Check network connectivity

2. **CORS Errors**
   - Update `CORS_ORIGIN` in `.env`
   - Check frontend domain matches

3. **Authentication Errors**
   - Verify JWT secret is set
   - Check token format in Authorization header

4. **Cache Issues**
   - Clear cache: `npm run seed -- --clear`
   - Check cache configuration

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

## 📚 API Documentation

### Available Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/cookie-config/:language` | No | Get config by language |
| GET | `/api/cookie-config` | No | Get config with auto-detection |
| GET | `/api/cookie-config/languages` | No | Get available languages |
| POST | `/api/consent/log` | No | Log consent decision |
| GET | `/api/admin/cookie-config` | Yes | Get all configurations |
| PUT | `/api/admin/cookie-config/:language` | Yes | Create/update configuration |
| DELETE | `/api/admin/cookie-config/:language` | Yes | Delete configuration |
| GET | `/api/admin/analytics/consent` | Yes | Get consent analytics |

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2023-12-07T10:30:00.000Z",
  "language": "en",
  "source": "database"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ]
}
```

## 🎯 Next Steps

1. **Set up monitoring** (Prometheus, Grafana)
2. **Implement authentication** (JWT, OAuth)
3. **Add admin dashboard** (React, Vue, Angular)
4. **Set up CI/CD** (GitHub Actions, GitLab CI)
5. **Add comprehensive testing** (Unit, Integration, E2E)

## 📞 Support

- Check the main README.md for detailed documentation
- Review API examples in the codebase
- Create issues for bugs or feature requests
- Check logs for debugging information

---

**Happy coding! 🚀**

