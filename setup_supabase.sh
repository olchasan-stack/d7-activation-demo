#!/bin/bash

# D7 Demo - Supabase Setup Helper
# This script helps you set up Supabase for PostHog event ingestion

set -e

PROJECT_ID="gnuvhydnjwvuhkceihov"
PROJECT_URL="https://${PROJECT_ID}.supabase.co"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  D7 Demo - Supabase Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Project: ${PROJECT_ID}"
echo "Region: eu-north-1"
echo ""

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found."
    echo "   Install: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Create config file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from env.example..."
    cp env.example .env.local
    echo ""
fi

echo "🔗 Getting Supabase credentials..."
echo ""
echo "Please open these URLs in your browser:"
echo "  1. API Settings: https://supabase.com/dashboard/project/${PROJECT_ID}/settings/api"
echo "  2. Database Settings: https://supabase.com/dashboard/project/${PROJECT_ID}/settings/database"
echo ""
echo "Copy the following values:"
echo "  - Project URL (should be: ${PROJECT_URL})"
echo "  - Service Role Key (anon key won't work)"
echo "  - Database connection string"
echo ""

# Get user input
read -p "Enter Supabase Project URL: " SUPABASE_URL
read -sp "Enter Supabase Service Role Key: " SUPABASE_KEY
echo ""
read -sp "Enter Database Password: " DB_PASSWORD
echo ""

# Update .env.local
echo ""
echo "📝 Updating .env.local..."
sed -i.bak "s|SUPABASE_URL=.*|SUPABASE_URL=${SUPABASE_URL}|g" .env.local
sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}|g" .env.local

echo "✅ Environment variables updated"
echo ""

# Try to link project
echo "🔗 Linking to Supabase project..."
supabase link --project-ref ${PROJECT_ID} --password "${DB_PASSWORD}" 2>&1 || true
echo ""

# Show SQL schema
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next Step: Create Database Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to SQL Editor: https://supabase.com/dashboard/project/${PROJECT_ID}/sql"
echo "2. Paste the SQL from: sql/supabase_schema.sql"
echo "3. Click 'Run'"
echo ""

# Show PostHog setup instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next Step: Configure PostHog Destination"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to PostHog: https://eu.posthog.com/project/..."
echo "2. Settings → Destinations → Add Destination → Postgres"
echo "3. Enter connection string from Supabase Database settings"
echo "4. Map fields as shown in SUPABASE_SETUP.md"
echo ""

echo "✅ Setup initiated! See SUPABASE_SETUP.md for detailed instructions."
echo ""

