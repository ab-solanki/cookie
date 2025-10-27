# 🍪 NS Cookie Plugin

A comprehensive cookie consent management plugin with GDPR/CCPA compliance, website scanning, auto-blocking, geotargeting, and consent logging.

## 📁 **Build Output**

```
dist/
├── cookie.js      # Main JavaScript file (26K)
├── cookie.js.gz   # Gzipped version (7.6K)
└── cookie.js.br   # Brotli compressed version (6.6K)
```

## 🚀 **Compression**

| Format | Size | Reduction |
|--------|------|-----------|
| Original | 26K | - |
| Gzip | 7.6K | 70.8% |
| Brotli | 6.6K | 74.6% |

## 🛠️ **Commands**

```bash
npm run build    # Generate cookie.js + compressed versions
npm run clean    # Clean dist folder
npm run dev      # Development server
```

## 🌐 **Usage**

```html
<script src="dist/cookie.js"></script>
<script>
  const cookiePlugin = new CookiePlugin({
    debug: true,
    texts: {
      title: 'Cookie Consent',
      description: 'We use cookies to enhance your experience.',
      acceptAll: 'Accept All',
      rejectAll: 'Reject All',
      customize: 'Customize'
    }
  });
</script>
```

## 🔧 **Server Configuration**

### Nginx
```nginx
location ~* \.js$ {
    gzip_static on;
    brotli_static on;
    expires 1y;
}
```

### Apache
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/javascript
</IfModule>
<IfModule mod_brotli.c>
    AddOutputFilterByType BROTLI_COMPRESS text/javascript
</IfModule>
```

## ⚡ **Features**

- **GDPR/CCPA Compliance** - Full consent management
- **Website Scanning** - Automatic cookie detection
- **Auto-Blocking** - Prevents tracking until consent
- **Geotargeting** - Location-based consent banners
- **Consent Logging** - Audit trail for compliance
- **Universal Compatibility** - Works in all browsers
- **Maximum Compression** - 74.6% size reduction