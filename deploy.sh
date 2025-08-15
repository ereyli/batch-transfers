#!/bin/bash

# Sendwise Production Deployment Script
# Deploy to https://www.sendwise.xyz

echo "🚀 Starting Sendwise Production Deployment..."

# Check if all required files exist
echo "📋 Checking required files..."

required_files=(
  "index.html"
  "share-image.html"
  ".well-known/farcaster.json"
  "js/app.js"
  "js/wallet.js"
  "js/blockchain.js"
  "js/ui.js"
  "js/config.js"
  "styles/main.css"
)

for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing required file: $file"
    exit 1
  fi
done

echo "✅ All required files found"

# Test manifest file
echo "🔍 Testing Farcaster manifest..."
if ! curl -s http://localhost:8010/.well-known/farcaster.json | jq . > /dev/null; then
  echo "❌ Manifest file is not valid JSON"
  exit 1
fi

echo "✅ Manifest file is valid"

# Check domain accessibility
echo "🌐 Checking domain accessibility..."
if ! curl -s -I https://www.sendwise.xyz > /dev/null; then
  echo "⚠️  Domain https://www.sendwise.xyz is not accessible yet"
  echo "   Please ensure DNS is configured and SSL certificate is installed"
fi

echo "✅ Domain check completed"

# Deployment options
echo ""
echo "📦 Choose deployment method:"
echo "1) Vercel (Recommended)"
echo "2) Netlify"
echo "3) GitHub Pages"
echo "4) Manual upload"
echo "5) Test local deployment"

read -p "Enter your choice (1-5): " choice

case $choice in
  1)
    echo "🚀 Deploying to Vercel..."
    if command -v vercel &> /dev/null; then
      vercel --prod
    else
      echo "❌ Vercel CLI not installed. Install with: npm i -g vercel"
      exit 1
    fi
    ;;
  2)
    echo "🚀 Deploying to Netlify..."
    if command -v netlify &> /dev/null; then
      netlify deploy --prod
    else
      echo "❌ Netlify CLI not installed. Install with: npm i -g netlify-cli"
      exit 1
    fi
    ;;
  3)
    echo "🚀 Deploying to GitHub Pages..."
    echo "Please push to GitHub and enable GitHub Pages in repository settings"
    ;;
  4)
    echo "📤 Manual upload instructions:"
    echo "1. Upload all files to your web server"
    echo "2. Ensure .well-known/farcaster.json is accessible"
    echo "3. Test: curl https://www.sendwise.xyz/.well-known/farcaster.json"
    ;;
  5)
    echo "🧪 Starting local test server..."
    python3 -m http.server 8011
    echo "✅ Local server running at http://localhost:8011"
    echo "Test manifest: curl http://localhost:8011/.well-known/farcaster.json"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "✅ [ ] Domain is accessible: https://www.sendwise.xyz"
echo "✅ [ ] Manifest is accessible: https://www.sendwise.xyz/.well-known/farcaster.json"
echo "✅ [ ] SSL certificate is installed"
echo "✅ [ ] All images are loading correctly"
echo "✅ [ ] Wallet connection works"
echo "✅ [ ] Batch transfers work"
echo ""
echo "🔗 Next steps:"
echo "1. Register manifest at: https://farcaster.xyz/~/developers/mini-apps/manifest"
echo "2. Verify domain ownership"
echo "3. Submit for Farcaster Mini App review"
echo "4. Monitor app usage and engagement"
echo ""
echo "📞 Support:"
echo "- Email: support@sendwise.xyz"
echo "- Farcaster: @sendwise"
echo "- Discord: https://discord.gg/sendwise"
