# 🚀 VillageMarket Production Deployment Guide

## Environment Variables (Required)
Set these in your Vercel dashboard:

```
VITE_SUPABASE_URL=https://zrsdcbqqeyoipzjlasjv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpyc2RjYnFxZXlvaXB6amxhc2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNTQ2ODcsImV4cCI6MjA2ODYzMDY4N30.xvoIQH_agQTUBMT8SDVgWNTzQi7qgnQzZGIq7OVjEuY
VITE_DEFAULT_CURRENCY=NGN
VITE_DEFAULT_LOCALE=en
```

## Supabase Dashboard Configuration

### 1. Authentication → URL Configuration
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add your production domain

### 2. Authentication → Providers
- ✅ Email/Password authentication (enabled)
- ✅ Configure 2FA settings
- ⚠️ Disable "Confirm email" for faster testing (re-enable for production)

### 3. Security Settings
- ✅ Row Level Security enabled on all tables
- ✅ 2FA enforcement for admin roles
- ✅ Rate limiting configured

## Post-Deploy Smoke Tests

### Critical Path Testing

1. **🏠 Homepage Load Test**
   - Visit: `https://your-app.vercel.app`
   - ✅ Marketplace loads without errors
   - ✅ Products display correctly
   - ✅ No console errors

2. **🔐 Authentication Flow**
   - Visit: `https://your-app.vercel.app/auth`
   - ✅ Can sign up with email/password
   - ✅ Can sign in successfully
   - ✅ Can sign out

3. **🛡️ Security Headers Verification**
   - Open DevTools → Network tab
   - ✅ `X-Frame-Options: DENY`
   - ✅ `Content-Security-Policy` present
   - ✅ `Strict-Transport-Security` present

4. **📡 Supabase Connectivity**
   - Check Network tab for Supabase requests
   - ✅ Successful API calls to `*.supabase.co`
   - ✅ Authentication tokens working

5. **🔧 Environment Validation**
   - Check browser console
   - ✅ No environment validation errors
   - ✅ All required variables loaded

### Admin Security Testing

6. **👑 Admin Access Control**
   - Try accessing `/admin` without admin role
   - ✅ Should be blocked/redirected
   - ✅ Only admin-role users can access

7. **🔐 Two-Factor Authentication**
   - Admin users must complete 2FA
   - ✅ 2FA enforced for admin dashboard access
   - ✅ Cannot bypass 2FA requirement

## Performance Checklist

- ✅ JavaScript bundles optimized (vendor chunking)
- ✅ No source maps in production
- ✅ Security headers configured
- ✅ CSP policy allows necessary resources

## Security Verification

Run these checks post-deployment:

```bash
# Check for default admin credentials (should find none)
curl -s https://your-app.vercel.app | grep -i "admin.*admin123" && echo "❌ DEFAULT CREDS FOUND" || echo "✅ No default credentials"

# Verify security headers
curl -I https://your-app.vercel.app | grep -E "(X-Frame-Options|Content-Security-Policy|Strict-Transport-Security)"
```

## Common Issues & Solutions

### 🚨 Environment Variable Errors
**Problem**: "Environment validation failed"
**Solution**: Verify all required VITE_ variables are set in Vercel dashboard

### 🚨 Supabase Connection Issues  
**Problem**: "Failed to connect to Supabase"
**Solution**: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are correct

### 🚨 Authentication Redirect Loops
**Problem**: Auth redirects not working
**Solution**: Add your Vercel domain to Supabase redirect URLs

### 🚨 Admin Access Issues
**Problem**: Cannot access admin dashboard
**Solution**: Ensure user has `user_role = 'admin'` in profiles table and 2FA enabled

## Success Criteria

✅ All smoke tests pass  
✅ No console errors  
✅ Security headers present  
✅ Authentication working  
✅ Admin access properly restricted  
✅ 2FA enforced for admin accounts  

🎉 **Ready for production when all criteria met!**