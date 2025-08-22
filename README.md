# VillageMarket - Secure Marketplace Platform

A comprehensive marketplace platform built with React, TypeScript, and Supabase with enterprise-grade security hardening.

## 🚀 Deploy on Vercel

### Prerequisites
1. Supabase account with project created
2. Vercel account connected to your GitHub repo

### Step 1: Environment Variables
Set these in your Vercel dashboard (Project Settings → Environment Variables):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api-domain.com
VITE_OPENAPI_URL=https://your-api-domain.com/openapi.json
VITE_DEFAULT_CURRENCY=NGN
VITE_DEFAULT_LOCALE=en
```

**⚠️ Important**: Use your actual Supabase project URL and anon key from your Supabase dashboard.

### Step 2: Supabase Configuration
In your Supabase dashboard:

1. **Authentication → URL Configuration**:
   - Site URL: `https://your-vercel-app.vercel.app`
   - Redirect URLs: Add your Vercel domain

2. **Authentication → Providers**:
   - Enable Email/Password authentication
   - Configure any social providers if needed

3. **Authentication → Email Templates**:
   - Customize email templates if needed

### Step 3: Deploy
1. Connect your GitHub repo to Vercel
2. Import project and set environment variables
3. Deploy!

### Step 4: Post-Deploy Verification
Run these smoke tests:

1. **Homepage loads**: Visit your deployed URL
   - ✅ Should load marketplace homepage
   - ✅ No console errors

2. **Authentication flow**: Visit `/auth`
   - ✅ Login/signup forms visible
   - ✅ Can create test account

3. **Security headers**: Check browser dev tools Network tab
   - ✅ Response includes X-Frame-Options: DENY
   - ✅ Content-Security-Policy header present

4. **Supabase connection**: Check Network tab
   - ✅ Successful API calls to Supabase
   - ✅ No authentication errors

5. **Environment validation**: Check browser console
   - ✅ No environment validation errors

## 🛠 Local Development

### Quick Start

```bash
# Setup development environment
npm run dev:setup

# Verify everything works
npm run verify

# Start development server
npm run dev
```

### Development Workflow

#### Type-Safe Database Access

This project maintains perfect sync between Supabase schema and TypeScript types:

```bash
# Generate fresh types from database
npm run db:types

# Check for type drift (CI enforced)
npm run db:types:check
```

#### Security Testing

```bash
# Run security checks
npm run security:check

# Run full verification
npm run verify
```

## 📁 Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth, etc.)
├── hooks/             # Custom React hooks
├── integrations/      # Supabase client & types
├── lib/              # Utilities & environment validation
├── pages/            # Route components
└── types/            # TypeScript type definitions

scripts/              # Build & security scripts
docs/                # Documentation
```

## 🔒 Security Features

- ✅ **No Default Admin Credentials**: Admin access only via Supabase Auth + 2FA
- ✅ **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- ✅ **Environment Validation**: Runtime validation of required env vars
- ✅ **Type Safety**: Strict TypeScript with database type generation
- ✅ **Input Sanitization**: All user inputs sanitized
- ✅ **Rate Limiting**: Built-in rate limiting for API endpoints

## 📚 Documentation

- [Developer Setup](./docs/developer-setup.md) - Complete setup guide
- [Architecture](./docs/architecture.md) - System architecture and patterns
- [Security](./docs/security.md) - Security implementation details
- [Production Readiness](./docs/FINAL_SECURITY_VERIFICATION_COMPLETE.md) - Security audit results

## 🧪 Testing

```bash
# Run all tests
npm test

# Security validation
npm run security:check

# Build verification
npm run build
```

## 🚀 CI/CD Pipeline

- ✅ **Type Drift Detection**: Fails if DB types are out of sync
- ✅ **Security Testing**: Comprehensive security test suite
- ✅ **Build Verification**: TypeScript compilation and build tests
- ✅ **Automated Checks**: Pre-commit hooks validate code quality

## 🔧 Troubleshooting

### Common Issues

1. **Environment validation errors**: Check that all required env vars are set
2. **Supabase connection issues**: Verify URL and anon key are correct
3. **Build failures**: Run `npm run verify` to check for issues
4. **Authentication problems**: Check Supabase redirect URL configuration

### Getting Help

- Check the [Troubleshooting docs](./docs/troubleshooting.md)
- Review browser console for errors
- Verify Supabase configuration matches deployment environment

Built with enterprise security standards and strict type safety.