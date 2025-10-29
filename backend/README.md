# Cookie Configuration Backend API

A comprehensive backend API for managing cookie consent configurations dynamically. This API allows you to manage cookie consent labels, categories, and settings from a centralized backend system.

## 🚀 Features

- **Multi-language Support**: Manage cookie configurations for different languages
- **Dynamic Configuration**: Update cookie settings without frontend changes
- **Caching**: Built-in caching for improved performance
- **Analytics**: Track consent decisions and user interactions
- **Admin Panel**: Full CRUD operations for configuration management
- **Rate Limiting**: Built-in protection against abuse
- **Validation**: Comprehensive input validation and sanitization
- **Security**: JWT authentication and CORS protection

## 📁 Project Structure

```
backend/
├── src/
│   └── app.js                 # Main application entry point
├── config/
│   └── index.js              # Configuration settings
├── models/
│   └── index.js              # Database models (MongoDB/Mongoose)
├── controllers/
│   └── index.js              # Business logic controllers
├── routes/
│   └── index.js              # API route definitions
├── middleware/
│   └── index.js              # Custom middleware functions
├── utils/
│   └── index.js              # Utility functions and helpers
├── scripts/
│   ├── seed.js               # Database seeding script
│   └── migrate.js            # Database migration script
├── tests/
│   ├── controllers/           # Controller tests
│   ├── models/               # Model tests
│   └── routes/               # Route tests
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## 🛠️ Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if using local instance):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   ```

5. **Run the application**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/cookie-config

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key
BCRYPT_SALT_ROUNDS=10

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300

# CORS Configuration
CORS_ORIGIN=*

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
```

## 📚 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cookie-config/:language` | Get configuration for specific language |
| GET | `/api/cookie-config` | Get configuration with auto-detection |
| GET | `/api/cookie-config/languages` | Get all available languages |
| POST | `/api/consent/log` | Log consent decision |
| GET | `/api/health` | Health check |

### Admin Endpoints (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/cookie-config` | Get all configurations |
| PUT | `/api/admin/cookie-config/:language` | Create/update configuration |
| DELETE | `/api/admin/cookie-config/:language` | Delete configuration |
| GET | `/api/admin/analytics/consent` | Get consent analytics |

## 🔐 Authentication

Admin endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

## 📊 Usage Examples

### Get Configuration for English

```bash
curl -X GET "http://localhost:3000/api/cookie-config/en"
```

Response:
```json
{
  "success": true,
  "data": {
    "language": "en",
    "texts": {
      "title": "Cookie Consent",
      "description": "We use cookies to enhance your browsing experience.",
      "acceptAll": "Accept All",
      "rejectAll": "Reject All",
      "customize": "Customize"
    },
    "categories": {
      "essential": {
        "name": "Essential",
        "description": "These cookies are necessary for the website to function properly.",
        "required": true,
        "cookies": ["session", "csrf", "language"]
      }
    },
    "ui": {
      "primaryColor": "#007bff",
      "secondaryColor": "#6c757d",
      "borderRadius": "8px"
    }
  },
  "language": "en",
  "source": "database",
  "timestamp": "2023-12-07T10:30:00.000Z"
}
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

### Log Consent Decision

```bash
curl -X POST "http://localhost:3000/api/consent/log" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123456",
    "language": "en",
    "action": "accept",
    "consentData": {
      "timestamp": 1701945000000,
      "version": "1.0.0",
      "categories": {
        "essential": true,
        "analytics": true,
        "marketing": false,
        "preferences": true
      }
    },
    "version": "1.0.0"
  }'
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📝 Scripts

### Database Seeding

```bash
npm run seed
```

This will populate the database with default configurations for common languages.

### Database Migration

```bash
npm run migrate
```

## 🔍 Monitoring

The API includes built-in monitoring endpoints:

- **Health Check**: `GET /api/health`
- **Metrics**: Available through logging middleware
- **Error Tracking**: Comprehensive error handling and logging

## 🚀 Deployment

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

1. Set production environment variables
2. Configure MongoDB connection
3. Set up reverse proxy (nginx)
4. Enable SSL/TLS
5. Configure monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review the API examples

## 🔄 Integration with Frontend

This backend is designed to work seamlessly with the CookiePlugin frontend. See the `backend-demo.html` file for integration examples.

The frontend can fetch configurations dynamically:

```javascript
const backendOptions = {
  apiEndpoint: 'http://localhost:3000/api/cookie-config',
  language: 'en',
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000
};

const cookiePlugin = new CookiePluginWithBackend(userConfig, backendOptions);
```

