#!/bin/bash

echo "🚀 Deploying Laundry POS to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Build the project
echo "🔨 Building the project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "📝 Don't forget to:"
echo "   1. Set up your database (Neon, Supabase, or Railway)"
echo "   2. Configure environment variables in Vercel dashboard"
echo "   3. Test the admin interface at your-domain.vercel.app/admin"
echo "   4. Set up Razorpay payment credentials"
