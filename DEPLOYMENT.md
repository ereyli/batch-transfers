# Sendwise Deployment Guide

This guide covers deploying Sendwise as both a web application and Farcaster Mini App.

## 🚀 Quick Deploy

### Option 1: Vercel (Recommended)

1. **Fork/Clone Repository**
```bash
git clone https://github.com/your-username/sendwise.git
cd sendwise
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

3. **Configure Domain**
- Add custom domain in Vercel dashboard
- Update `homeUrl` in `.well-known/farcaster.json`

### Option 2: Netlify

1. **Deploy to Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

2. **Configure Domain**
- Add custom domain in Netlify dashboard
- Update `homeUrl` in `.well-known/farcaster.json`

### Option 3: GitHub Pages

1. **Enable GitHub Pages**
- Go to repository Settings > Pages
- Select source branch (main/master)
- Set custom domain if needed

2. **Update Manifest**
- Update `homeUrl` in `.well-known/farcaster.json`

## 📱 Farcaster Mini App Publishing

### 1. Domain Requirements

- ✅ **HTTPS Required**: Must use HTTPS
- ✅ **Stable Domain**: Choose a domain you can maintain long-term
- ✅ **DNS Setup**: Proper A/CNAME records
- ✅ **Manifest Accessible**: `/.well-known/farcaster.json` must be accessible

### 2. Manifest Verification

Test your manifest is accessible:
```bash
curl https://your-domain.com/.well-known/farcaster.json
```

Expected response:
```json
{
  "miniapp": {
    "version": "1",
    "name": "Sendwise",
    "iconUrl": "...",
    "homeUrl": "https://your-domain.com",
    ...
  }
}
```

### 3. Farcaster Developer Tools

1. **Visit**: https://farcaster.xyz/~/developers/mini-apps/manifest
2. **Create Manifest**: Use hosted manifest or local file
3. **Verify Domain**: Sign message to prove ownership
4. **Submit for Review**: Wait for approval

### 4. Image Requirements

#### App Icon (1024x1024px PNG)
- No alpha channel
- Square aspect ratio
- High quality, recognizable

#### Screenshots (1284x2778px)
- Portrait orientation
- Show key app features
- Max 3 screenshots

#### Hero Image (1200x630px)
- 1.91:1 aspect ratio
- Promotional display image
- PNG format

#### Open Graph Image (1200x630px)
- 1.91:1 aspect ratio
- Social sharing image
- PNG format

## 🔧 Configuration

### Environment Variables

```bash
# Production
NODE_ENV=production
FARCASTER_APP_ID=your_app_id
WEBHOOK_URL=https://your-domain.com/webhook
```

### Network Configuration

Update contract addresses in `js/config.js`:
```javascript
const CONTRACTS = {
  8453: '0x74a2c6466d98253ca932fe6a6ccb811d4d7d5784', // Base
  10: '0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9',   // Optimism
  42161: '0x5e86e9cd50e7f64b692b90fae1487d2f6ed1aba9', // Arbitrum
  // ... other networks
};
```

### CORS Configuration

For Farcaster Mini App, ensure CORS headers:
```javascript
// Server configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

## 🧪 Testing

### Local Testing

1. **Start Development Server**
```bash
python3 -m http.server 8000
```

2. **Test Manifest**
```bash
curl http://localhost:8000/.well-known/farcaster.json
```

3. **Test Farcaster Integration**
- Use Warpcast Developer Tools
- Test wallet connection
- Test batch transfers
- Test sharing features

### Production Testing

1. **Manifest Accessibility**
```bash
curl https://your-domain.com/.well-known/farcaster.json
```

2. **Image Accessibility**
```bash
curl -I https://your-domain.com/logo.png
curl -I https://your-domain.com/screenshot1.png
```

3. **Farcaster Mini App Testing**
- Test in Warpcast
- Verify wallet integration
- Test all features
- Check sharing functionality

## 📊 Monitoring

### Analytics Setup

1. **Google Analytics**
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. **Farcaster Analytics**
- Monitor app usage in Farcaster Developer Tools
- Track user engagement
- Monitor transaction success rates

### Error Monitoring

1. **Sentry Integration**
```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({
    dsn: 'your-sentry-dsn',
    environment: 'production'
  });
</script>
```

2. **Console Logging**
```javascript
// Add to app.js
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to monitoring service
});
```

## 🔒 Security

### HTTPS Configuration

1. **SSL Certificate**
- Use Let's Encrypt (free)
- Auto-renewal setup
- HSTS headers

2. **Security Headers**
```javascript
// Add security headers
app.use((req, res, next) => {
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});
```

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://*.alchemy.com https://*.infura.io;
">
```

## 🚀 Performance Optimization

### Image Optimization

1. **WebP Format**
```html
<picture>
  <source srcset="logo.webp" type="image/webp">
  <img src="logo.png" alt="Sendwise Logo">
</picture>
```

2. **Lazy Loading**
```html
<img src="screenshot1.png" loading="lazy" alt="App Screenshot">
```

### Caching Strategy

1. **Static Assets**
```javascript
// Cache static files for 1 year
app.use('/static', express.static('static', {
  maxAge: '1y',
  immutable: true
}));
```

2. **Manifest Caching**
```javascript
// Cache manifest for 1 hour
app.get('/.well-known/farcaster.json', (req, res) => {
  res.header('Cache-Control', 'public, max-age=3600');
  res.json(manifest);
});
```

## 📈 Post-Launch

### Monitoring Checklist

- [ ] App loads correctly in Farcaster
- [ ] Wallet connection works
- [ ] Batch transfers execute successfully
- [ ] Sharing features work
- [ ] Notifications are sent
- [ ] Analytics are tracking
- [ ] Error monitoring is active

### Maintenance

1. **Regular Updates**
- Monitor for security updates
- Update dependencies
- Test after updates

2. **User Feedback**
- Monitor user reviews
- Address reported issues
- Implement feature requests

3. **Performance Monitoring**
- Monitor load times
- Track error rates
- Optimize based on usage

## 🆘 Troubleshooting

### Common Issues

1. **Manifest Not Found**
- Check file path: `/.well-known/farcaster.json`
- Verify file permissions
- Check server configuration

2. **Images Not Loading**
- Verify image URLs are accessible
- Check image dimensions
- Ensure proper format (PNG)

3. **Wallet Connection Fails**
- Check network configuration
- Verify contract addresses
- Test with different wallets

4. **Transactions Fail**
- Check gas limits
- Verify contract addresses
- Test on testnet first

### Support Resources

- **Farcaster Documentation**: https://docs.farcaster.xyz
- **Developer Tools**: https://farcaster.xyz/~/developers
- **Community**: Farcaster Discord
- **Issues**: GitHub Issues

## 📞 Contact

For deployment support:
- **Email**: support@sendwise.app
- **Farcaster**: @sendwise
- **Discord**: https://discord.gg/sendwise
