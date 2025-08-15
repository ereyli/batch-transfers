# Vercel Deployment Guide

## 🚀 Quick Deploy

### 1. Automatic Deployment (GitHub Integration)
- Connect your GitHub repository to Vercel
- Vercel will automatically deploy on every push to `main` branch
- Build settings are configured in `vercel.json`

### 2. Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

## ⚙️ Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*",
      "use": "@vercel/static"
    }
  ],
  "outputDirectory": "public",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### package.json Build Scripts
```json
{
  "scripts": {
    "build": "echo 'Static HTML app - no build required' && mkdir -p public && cp -r index.html js styles .well-known package.json vercel.json public/",
    "vercel-build": "echo 'Static HTML app - no build required' && mkdir -p public && cp -r index.html js styles .well-known package.json vercel.json public/"
  }
}
```

## 🔧 Build Process

### What Happens During Build:
1. **Install Dependencies**: `npm install`
2. **Run Build Script**: `npm run build`
3. **Create Public Directory**: `mkdir -p public`
4. **Copy Files**: Copy specific files to `public/`
5. **Deploy**: Vercel deploys `public/` directory

### Files Copied to Public:
- ✅ `index.html` - Main application
- ✅ `js/` - JavaScript files
- ✅ `styles/` - CSS files
- ✅ `.well-known/` - Farcaster manifest
- ✅ `package.json` - Project metadata
- ✅ `vercel.json` - Vercel configuration

## 🐛 Troubleshooting

### Issue: "No Output Directory named 'public' found"
**Solution**: 
- Ensure `outputDirectory: "public"` is set in `vercel.json`
- Verify build script creates `public/` directory
- Check that files are copied to `public/`

### Issue: Build Script Not Running
**Solution**:
- Verify `package.json` has correct build scripts
- Check Vercel is using latest commit
- Force redeploy by updating version

### Issue: Old Version Being Deployed
**Solution**:
- Update version in `package.json`
- Commit and push changes
- Check Vercel dashboard for latest deployment

### Issue: Infinite Build Loop
**Solution**:
- Don't copy entire directory with `cp -r . public/`
- Copy specific files only
- Use `cp -r [specific-files] public/`

## 📊 Monitoring

### Vercel Dashboard
- Check build logs for errors
- Monitor deployment status
- View function logs

### Build Logs
Look for:
- ✅ "Static HTML app - no build required"
- ✅ "mkdir -p public"
- ✅ Successful file copying
- ✅ "Deploying public/ directory"

## 🔄 Force Redeploy

If Vercel is using an old version:

1. **Update Version**:
```bash
# Edit package.json
"version": "1.0.2"
```

2. **Commit and Push**:
```bash
git add package.json
git commit -m "Force redeploy"
git push origin main
```

3. **Check Vercel Dashboard**:
- Verify new deployment is triggered
- Check build logs for latest commit

## 📱 Farcaster Mini App

### Requirements:
- ✅ HTTPS domain
- ✅ Accessible manifest at `/.well-known/farcaster.json`
- ✅ Proper CORS headers
- ✅ Working wallet integration

### Testing:
1. Deploy to Vercel
2. Test manifest accessibility
3. Test in Farcaster environment
4. Verify wallet connection

## 🆘 Support

### Vercel Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Build Configuration](https://vercel.com/docs/build-step)
- [Static Site Deployment](https://vercel.com/docs/static-sites)

### Common Issues:
- Build script not found
- Output directory missing
- Old version deployed
- Infinite build loops
- CORS issues

## 📞 Contact

For deployment issues:
- Check Vercel dashboard logs
- Verify GitHub integration
- Test build script locally
- Update version to force redeploy
