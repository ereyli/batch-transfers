# Farcaster Mini App Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 22.11.0 or higher (LTS version recommended)
- A package manager (npm, pnpm, or yarn)
- Farcaster account

### 1. Enable Developer Mode
1. Make sure you're logged in to Farcaster on either mobile or desktop
2. Visit: https://farcaster.xyz/~/settings/developer-tools
3. Toggle on "Developer Mode"
4. A developer section will appear on the left side of your desktop display

### 2. Check Node.js Version
```bash
node --version
```
If you're using Node.js < 22.11.0, update to the latest LTS version:
```bash
# Using nvm
nvm install --lts
nvm use --lts

# Or download from nodejs.org
```

### 3. Project Setup
This project is already configured for Farcaster Mini App development. The key files are:

- `farcaster-manifest.json` - App metadata and configuration
- `index.html` - Main app with SDK integration
- `js/farcaster.js` - Farcaster SDK wrapper
- `js/wallet.js` - Wallet integration with Wagmi

### 4. Development
1. Start your local development server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

2. Access your app at: `http://localhost:8000`

### 5. Testing in Farcaster
1. Open Farcaster desktop app
2. Go to Developer Tools (left sidebar)
3. Click "Preview Mini App"
4. Enter your local URL: `http://localhost:8000`
5. Test your app functionality

## 📁 Key Files

### farcaster-manifest.json
```json
{
  "name": "Sendwise",
  "description": "Smart Batch Transfers for ETH & ERC20 Tokens",
  "icon": "https://www.sendwise.xyz/.well-known/logo.png",
  "url": "https://www.sendwise.xyz",
  "permissions": ["user", "wallet", "notifications"],
  "supportedNetworks": ["base", "optimism", "arbitrum", "ethereum"]
}
```

### SDK Integration
The app uses the official Farcaster Mini App SDK via CDN:
```html
<script type="module">
  import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk'
  window.farcasterSDK = sdk;
</script>
```

### Wallet Integration
Uses Wagmi with Farcaster connector:
```javascript
const config = createConfig({
  chains: [base, optimism, arbitrum, mainnet],
  connectors: [farcasterMiniApp()]
});
```

## 🔧 Troubleshooting

### Common Issues

1. **Infinite Loading Screen**
   - Make sure `sdk.actions.ready()` is called after app loads
   - Check console for errors

2. **Node.js Version Issues**
   - Ensure you're using Node.js 22.11.0+
   - Update with: `nvm install --lts && nvm use --lts`

3. **SDK Not Loading**
   - Check network connectivity
   - Verify CDN URLs are accessible
   - Try alternative CDN: `https://unpkg.com/@farcaster/miniapp-sdk`

4. **Wallet Connection Issues**
   - Ensure Developer Mode is enabled
   - Check Wagmi configuration
   - Verify connector setup

### Debug Mode
Enable debug logging:
```javascript
// In browser console
localStorage.setItem('farcaster-debug', 'true');
```

## 📱 Publishing

### 1. Prepare Assets
- Logo: 120x120px PNG
- Screenshots: 3-5 app screenshots
- Description: Clear, compelling app description

### 2. Update Manifest
- Verify all URLs are HTTPS
- Add proper developer information
- Include relevant tags and categories

### 3. Submit for Review
1. Go to Developer Tools
2. Click "Submit Mini App"
3. Fill out submission form
4. Wait for approval (usually 1-3 days)

## 🔗 Resources

- [Official Documentation](https://docs.farcaster.xyz/mini-apps)
- [SDK Reference](https://docs.farcaster.xyz/mini-apps/sdk)
- [Developer Tools](https://farcaster.xyz/~/settings/developer-tools)
- [Community Discord](https://discord.gg/farcaster)

## 🎯 Best Practices

1. **Always call `sdk.actions.ready()`** after app loads
2. **Handle wallet connection gracefully** - users may not have wallets
3. **Use proper error handling** for all SDK calls
4. **Test on both mobile and desktop** Farcaster clients
5. **Follow Farcaster design guidelines** for consistent UX
6. **Optimize for mobile** - most users are on mobile
7. **Use HTTPS** for all external resources
8. **Implement proper loading states** for better UX

## 🚨 Important Notes

- Mini Apps must be served over HTTPS in production
- Always test in Farcaster environment before publishing
- Keep app size reasonable for mobile users
- Follow Farcaster's content policies
- Monitor app performance and user feedback
