#!/bin/bash

echo "🔍 Checking Cloudflare API Token..."

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN not set"
    exit 1
fi

echo "✅ API Token found"
echo ""
echo "🚀 Testing wrangler authentication..."
npx wrangler whoami

echo ""
echo "📦 Deploying to Cloudflare Pages..."
npx wrangler pages deploy dist --project-name webapp

echo ""
echo "✅ Deployment complete!"
echo "🌐 Production URL: https://webapp-6m6.pages.dev"
