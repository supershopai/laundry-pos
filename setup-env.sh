#!/bin/bash

echo "🔧 Setting up environment variables for Vercel deployment..."

# Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)

echo "Generated environment variables:"
echo ""
echo "Required Environment Variables:"
echo "================================"
echo "DATABASE_URL=postgresql://username:password@host:port/database"
echo "STORE_CORS=https://your-domain.vercel.app"
echo "ADMIN_CORS=https://your-domain.vercel.app"
echo "AUTH_CORS=https://your-domain.vercel.app"
echo "JWT_SECRET=$JWT_SECRET"
echo "COOKIE_SECRET=$COOKIE_SECRET"
echo ""
echo "Optional Environment Variables:"
echo "==============================="
echo "RAZORPAY_KEY_ID=your-razorpay-key-id"
echo "RAZORPAY_KEY_SECRET=your-razorpay-key-secret"
echo "SENTRY_DSN=your-sentry-dsn-here"
echo ""
echo "📝 Copy these values to your Vercel project's environment variables:"
echo "   1. Go to your Vercel project dashboard"
echo "   2. Navigate to Settings > Environment Variables"
echo "   3. Add each variable with its corresponding value"
echo "   4. Make sure to set them for Production, Preview, and Development"
