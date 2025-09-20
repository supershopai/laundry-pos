#!/bin/bash

echo "🔧 Setting up environment variables for Vercel..."

# Your Neon database URL
DATABASE_URL="postgresql://neondb_owner:npg_VPw2q8kBecjM@ep-icy-flower-ad7kmae2-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)

# Your Vercel project URL (update this with your actual domain)
VERCEL_URL="https://laundry-9x2v6vlad-supershop.vercel.app"

echo "Setting up environment variables for Vercel project: laundry-pos"
echo ""

# Set environment variables using Vercel CLI
echo "Setting DATABASE_URL..."
vercel env add DATABASE_URL production <<< "$DATABASE_URL"

echo "Setting STORE_CORS..."
vercel env add STORE_CORS production <<< "$VERCEL_URL"

echo "Setting ADMIN_CORS..."
vercel env add ADMIN_CORS production <<< "$VERCEL_URL"

echo "Setting AUTH_CORS..."
vercel env add AUTH_CORS production <<< "$VERCEL_URL"

echo "Setting JWT_SECRET..."
vercel env add JWT_SECRET production <<< "$JWT_SECRET"

echo "Setting COOKIE_SECRET..."
vercel env add COOKIE_SECRET production <<< "$COOKIE_SECRET"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📝 Optional: Set up Razorpay credentials:"
echo "   vercel env add RAZORPAY_KEY_ID production"
echo "   vercel env add RAZORPAY_KEY_SECRET production"
echo ""
echo "🚀 Now redeploy your project:"
echo "   vercel --prod"
