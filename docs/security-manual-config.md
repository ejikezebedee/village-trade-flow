# Security Manual Configuration Guide

This document outlines manual security configurations that must be enabled in the Supabase Dashboard and other external services.

## Table of Contents

1. [Password Leak Protection](#password-leak-protection)
2. [OTP Configuration](#otp-configuration)  
3. [Authentication Settings](#authentication-settings)
4. [Database Security](#database-security)
5. [Verification Checklist](#verification-checklist)

## Password Leak Protection

### Configuration Steps

1. **Navigate to Supabase Dashboard**
   - Go to `https://supabase.com/dashboard/project/{project_id}/auth/providers`
   - Click on "Settings" in the Auth section

2. **Enable Breach Detection**
   - Find "Password Protection" section
   - Enable "Check against breached passwords"
   - This uses the HaveIBeenPwned database to prevent compromised passwords

3. **Verification**
   ```sql
   -- Check if password protection is enabled (manual verification required)
   -- This setting is not exposed via SQL, must be verified in dashboard
   ```

### Health Check Implementation

```typescript
// Add to your security health check component
const checkPasswordProtection = async () => {
  // This must be manually verified as Supabase doesn't expose this setting via API
  const lastVerified = localStorage.getItem('password_protection_verified');
  const needsVerification = !lastVerified || 
    new Date(lastVerified) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
  
  return {
    enabled: true, // Update manually after verification
    lastChecked: lastVerified,
    needsManualVerification: needsVerification
  };
};
```

## OTP Configuration

### Email/SMS OTP Settings

1. **Navigate to Authentication Settings**
   - Go to `https://supabase.com/dashboard/project/{project_id}/auth/users`
   - Click on "Settings" tab

2. **Configure OTP Expiry**
   - Find "Email/SMS OTP" section
   - Set "OTP expiration" to **5 minutes** (300 seconds)
   - This ensures codes expire quickly for security

3. **Rate Limiting**
   - Set "Rate limit" to 5 requests per hour per user
   - This prevents abuse of the OTP system

### Server-Side OTP Validation

Our application enforces additional OTP security:

```sql
-- OTP validation with 5-minute maximum TTL
CREATE OR REPLACE FUNCTION public.validate_otp_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure OTP expires within 5 minutes
  IF NEW.expires_at > now() + INTERVAL '5 minutes' THEN
    NEW.expires_at := now() + INTERVAL '5 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_otp_expiry
  BEFORE INSERT OR UPDATE ON public.otp_verifications
  FOR EACH ROW EXECUTE FUNCTION public.validate_otp_expiry();
```

## Authentication Settings

### Session Configuration

1. **JWT Settings**
   - Navigate to `https://supabase.com/dashboard/project/{project_id}/settings/auth`
   - Set "JWT expiry" to 1 hour (3600 seconds)
   - Enable "Refresh token rotation"

2. **Security Settings**
   - Enable "Confirm email" for new signups
   - Set "Password minimum length" to 8 characters
   - Enable "Password complexity" requirements

### Two-Factor Authentication

1. **TOTP Setup**
   - Enable "Time-based One-Time Password (TOTP)"
   - Set factor type to "totp"
   - Configure issuer name: "VillageMarket"

## Database Security

### Row Level Security (RLS)

Verify all tables have RLS enabled:

```sql
-- Query to check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'DISABLED' END AS status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Function Security

Check function search_path hardening:

```bash
# Run the automated check
npm run security:check
```

Expected output: `✅ All functions have proper search_path hardening`

## Verification Checklist

Use this checklist to verify all manual configurations:

### Authentication & Passwords
- [ ] Password breach protection enabled
- [ ] OTP expiry set to 5 minutes
- [ ] JWT expiry set to 1 hour
- [ ] Email confirmation enabled
- [ ] Password complexity enabled

### Database Security
- [ ] All tables have RLS enabled
- [ ] All functions have `SET search_path = ''`
- [ ] No SECURITY DEFINER functions without proper restrictions
- [ ] Audit logging enabled

### Monitoring & Alerts
- [ ] Security dashboard accessible to admins
- [ ] Failed login alerts configured
- [ ] Rate limiting monitors active
- [ ] OTP abuse detection enabled

### CI/CD Security
- [ ] Security checks in CI pipeline
- [ ] Function hardening verification
- [ ] Migration discipline checks
- [ ] Automated security scans

## Health Check Queries

Add these queries to your security monitoring:

```sql
-- Check for unhardened functions
SELECT COUNT(*) as unhardened_functions
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind IN ('f','p')
  AND NOT EXISTS (
    SELECT 1 FROM pg_options_to_table(p.proconfig) t
    WHERE t.key = 'search_path' AND t.value = ''
  );

-- Check RLS status
SELECT COUNT(*) as tables_without_rls
FROM pg_tables 
WHERE schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_class c 
    WHERE c.relname = pg_tables.tablename 
    AND c.relrowsecurity = true
  );

-- Check recent security events
SELECT event_type, COUNT(*) as count, MAX(created_at) as latest
FROM public.security_audit 
WHERE created_at > now() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY count DESC;
```

## Screenshots and Visual Verification

### Password Protection Dashboard
![Password Protection Settings](https://via.placeholder.com/800x400?text=Supabase+Password+Protection+Settings)

**Location**: Supabase Dashboard → Auth → Settings → Password Protection
**Setting**: ✅ Check against breached passwords (HaveIBeenPwned)

### OTP Configuration
![OTP Settings](https://via.placeholder.com/800x400?text=Supabase+OTP+Configuration)

**Location**: Supabase Dashboard → Auth → Settings → Email/SMS OTP
**Settings**: 
- Expiration: 5 minutes
- Rate limit: 5 per hour

### JWT Configuration
![JWT Settings](https://via.placeholder.com/800x400?text=Supabase+JWT+Settings)

**Location**: Supabase Dashboard → Settings → Auth
**Settings**:
- JWT expiry: 1 hour
- Refresh token rotation: Enabled

## Troubleshooting

### Common Issues

1. **Password protection not working**
   - Verify setting is enabled in Supabase Dashboard
   - Check if HaveIBeenPwned service is accessible
   - Ensure no client-side password validation bypass

2. **OTP codes expiring too quickly/slowly**
   - Check both dashboard and server-side validation
   - Verify trigger is properly configured
   - Review OTP generation logic

3. **Security checks failing in CI**
   - Ensure service role key is configured
   - Check network connectivity to Supabase
   - Verify migration scripts are up to date

### Support Contacts

- **Security Team**: security@villagemarket.com
- **Platform Team**: platform@villagemarket.com
- **Emergency**: security-emergency@villagemarket.com

---

**Last Updated**: 2025-01-20
**Review Schedule**: Monthly
**Next Review**: 2025-02-20