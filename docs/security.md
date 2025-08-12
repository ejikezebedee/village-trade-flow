# VillageMarket Security Documentation

## Overview

VillageMarket implements comprehensive security hardening across all layers of the application, from database-level protections to frontend security measures. This document covers all security features implemented in Phase 1-3.

## Security Architecture

### Phase 1: Foundation Security
- **AES-256-GCM Encryption**: All sensitive data encrypted at rest
- **2FA Secret Encryption**: TOTP secrets protected with AES-256-GCM
- **Google OAuth Integration**: Secure social authentication
- **PayPal Integration**: Secure payment processing
- **API Key Management**: Encrypted storage and rotation
- **Security Center**: Centralized security monitoring

### Phase 2: Database & Application Hardening
- **Function Search Path Protection**: All SQL functions use `SET search_path = '';`
- **Row-Level Security (RLS)**: Comprehensive RLS policies on all tables
- **Input Validation**: Server-side validation with XSS/injection protection
- **Rate Limiting**: Supabase Edge Function middleware with exponential backoff
- **Enhanced Password Security**: HaveIBeenPwned integration, password history

### Phase 3: Advanced Security & Monitoring
- **Session Security**: Token replay detection, secure cookies
- **HTTP Security Headers**: HSTS, CSP, X-Frame-Options, CSRF protection
- **Enhanced Monitoring**: Real-time alerts, audit logging, dispute evidence
- **Automated Testing**: Comprehensive security test suite

## Supabase-Specific Security Hardening

### Database Security

#### 1. Function Search Path Hardening
All SQL functions include `SET search_path = '';` to prevent function hijacking:

```sql
CREATE OR REPLACE FUNCTION example_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Function body
END;
$$;
```

#### 2. Row-Level Security (RLS) Policies

**Critical Tables with RLS:**
- `profiles`: Users can only access their own profile
- `products`: Sellers can manage their products, all can read active listings
- `orders`: Buyers/sellers/drivers can access their orders only
- `messages`: Participants can access their conversations only
- `payments`: Transaction participants only

**Example RLS Policy:**
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (user_id = auth.uid());
```

#### 3. Security Functions

**Password Validation:**
```sql
SELECT validate_password_strength('password123');
-- Returns: {"is_valid": false, "errors": ["Password must contain uppercase letter"]}
```

**Rate Limiting:**
```sql
SELECT check_rate_limit_enhanced('user_id', 'login_attempt', 5, 10);
-- Returns: {"allowed": true, "attempts_remaining": 4}
```

**Input Sanitization:**
```sql
SELECT sanitize_input('<script>alert("xss")</script>');
-- Returns: sanitized text
```

### Application Security

#### 1. Input Validation

**Server-Side Validation (Zod Schemas):**
```typescript
const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  price: z.number().positive(),
  category: z.string().min(1)
});
```

**XSS Protection:**
- HTML sanitization on all user inputs
- Content Security Policy headers
- Input validation on all forms

#### 2. Rate Limiting

**Edge Function Middleware:**
- Login attempts: 5 per 10 minutes
- Password reset: 3 per hour
- OTP verification: 5 per 10 minutes
- Exponential backoff on repeated failures

#### 3. Session Security

**Configuration:**
- Idle timeout: 30 minutes
- Maximum session lifetime: 24 hours
- Secure cookies: HttpOnly, Secure, SameSite=Strict
- Token replay detection

## Security Monitoring

### Security Center Features

1. **Real-Time Alerts**
   - Failed login attempts
   - Rate limit violations
   - RLS policy violations
   - Suspicious payment activities

2. **Audit Logging**
   - All security events logged
   - Before/after state tracking
   - Searchable and filterable logs
   - Export capabilities

3. **Dispute Management**
   - Secure evidence upload with SHA-256 hashing
   - File integrity verification
   - Moderation queue with batch operations

### Alert Types

- **Critical**: Security breaches, admin privilege escalation
- **High**: Multiple failed logins, rate limit violations
- **Medium**: Password changes, role modifications
- **Low**: General security events

## Secure Coding Guidelines

### 1. Database Operations

**✅ DO:**
```typescript
// Use parameterized queries through Supabase client
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('seller_id', userId);
```

**❌ DON'T:**
```typescript
// Never use raw SQL or string concatenation
const query = `SELECT * FROM products WHERE seller_id = '${userId}'`;
```

### 2. Input Handling

**✅ DO:**
```typescript
// Validate and sanitize all inputs
const validatedInput = productSchema.parse(userInput);
const sanitizedDescription = sanitizeHtml(validatedInput.description);
```

**❌ DON'T:**
```typescript
// Never trust user input directly
const product = await createProduct(userInput); // Dangerous
```

### 3. Authentication

**✅ DO:**
```typescript
// Check authentication on all protected routes
if (!user) {
  return redirect('/auth');
}
```

**❌ DON'T:**
```typescript
// Never rely on client-side auth checks only
if (localStorage.getItem('user')) { // Insecure
```

### 4. API Security

**✅ DO:**
```typescript
// Use rate limiting on all endpoints
const rateLimitResult = await checkRateLimit(userId, 'api_call');
if (!rateLimitResult.allowed) {
  throw new Error('Rate limit exceeded');
}
```

## Adding New Tables with Security

When creating new tables, always follow this checklist:

1. **Enable RLS:**
```sql
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

2. **Create Policies:**
```sql
-- Read policy
CREATE POLICY "Users can read their data" ON new_table
FOR SELECT USING (user_id = auth.uid());

-- Write policy
CREATE POLICY "Users can manage their data" ON new_table
FOR ALL USING (user_id = auth.uid());
```

3. **Add Audit Trigger:**
```sql
CREATE TRIGGER audit_new_table
  AFTER INSERT OR UPDATE OR DELETE ON new_table
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

4. **Test Policies:**
```typescript
// Test unauthorized access is blocked
const { error } = await supabase
  .from('new_table')
  .select('*')
  .eq('user_id', 'other_user_id');
expect(error).toBeDefined();
```

## Breach Response Playbook

### Immediate Response (0-1 hour)

1. **Assess Scope**
   - Check Security Center alerts
   - Review audit logs for timeline
   - Identify affected users/data

2. **Contain Breach**
   - Disable compromised accounts
   - Rotate API keys if exposed
   - Block suspicious IP addresses

3. **Secure Systems**
   - Force password resets for affected users
   - Invalidate all active sessions
   - Enable additional monitoring

### Investigation (1-24 hours)

1. **Gather Evidence**
   - Export audit logs
   - Document attack vectors
   - Collect system snapshots

2. **Root Cause Analysis**
   - Review code changes
   - Check configuration changes
   - Analyze access patterns

### Recovery (24-72 hours)

1. **Fix Vulnerabilities**
   - Apply security patches
   - Update configurations
   - Strengthen affected systems

2. **Restore Services**
   - Verify system integrity
   - Resume normal operations
   - Monitor for anomalies

### Post-Incident (1-2 weeks)

1. **User Communication**
   - Notify affected users
   - Provide security recommendations
   - Offer support resources

2. **Security Improvements**
   - Update security policies
   - Enhance monitoring
   - Conduct security training

## Security Testing

### Automated Test Suite

Run the security test suite regularly:

```bash
npm run test:security
```

**Test Categories:**
- Database security (RLS policies)
- Input validation (XSS/injection)
- Authentication security
- Rate limiting
- Session management

### Manual Security Checks

**Monthly:**
- Review user permissions
- Check for orphaned accounts
- Audit API key usage
- Test backup/restore procedures

**Quarterly:**
- Penetration testing
- Security architecture review
- Update threat models
- Review incident response plan

## Compliance & Standards

### Standards Followed

- **OWASP Top 10**: Protection against common vulnerabilities
- **NIST Cybersecurity Framework**: Comprehensive security approach
- **ISO 27001**: Information security management
- **GDPR**: Data protection and privacy

### Security Certifications

- Regular security audits
- Penetration testing reports
- Compliance assessments
- Third-party security reviews

## Contact Information

- **Security Team**: security@villagemarket.com
- **Incident Response**: incident@villagemarket.com
- **Emergency Hotline**: +1-XXX-XXX-XXXX

---

*This document is updated regularly. Last updated: [Current Date]*
*For the latest security updates, check the Security Changelog.*