# Production Smoke Test Checklist

## Pre-Launch Verification (5-minute test)

### 1. Authentication Security Test ✅
- [ ] **Login with valid credentials** → Success
- [ ] **Change password** → Global logout occurs (all sessions invalidated)
- [ ] **Login again with new password** → Success
- [ ] **Try old password** → Failure (password history works)

### 2. OTP Security Test ✅
- [ ] **Request OTP code** → Delivered within 30 seconds
- [ ] **Enter correct OTP** → Verification succeeds
- [ ] **Request new OTP** → Previous code invalidated
- [ ] **Enter expired OTP** (wait 6 minutes) → Verification fails
- [ ] **Enter wrong OTP 3 times** → Account temporarily locked
- [ ] **Check cooldown period** → Rate limiting active

### 3. Escrow & Payment Test ✅
- [ ] **Create product listing** → Product appears in marketplace
- [ ] **Create delivery request** → Posted successfully
- [ ] **Receive driver bid** → Bid notification received
- [ ] **Accept lowest bid** → Escrow calculation correct
- [ ] **Fund escrow** → Payment processed, funds held
- [ ] **Mark "ready for handover"** → OTP sent to buyer
- [ ] **Enter correct OTP** → Escrow releases to seller + driver
- [ ] **Check transaction split** → Verify amounts in user wallets

### 4. Admin Security Test ✅
- [ ] **Login as admin** → Admin dashboard accessible
- [ ] **Change user role** → Role updated successfully
- [ ] **Check audit log** → Event recorded with IP, timestamp
- [ ] **View security alerts** → Recent activity visible
- [ ] **Export security report** → CSV download works

### 5. Security Center Verification ✅
- [ ] **Function Hardening Dashboard** → Shows 100% (74+/74+ functions)
- [ ] **OTP Metrics Dashboard** → Real-time data updating
- [ ] **Rate Limiting Monitor** → Shows current thresholds
- [ ] **Security Events Log** → Recent events visible
- [ ] **Export functionality** → Reports generate correctly

### 6. Rate Limiting Test ✅
- [ ] **Try 6 login attempts rapidly** → Rate limited after 5 attempts
- [ ] **Wait 15 minutes** → Rate limit resets
- [ ] **API calls** → Rate limiting enforced per endpoint
- [ ] **OTP requests** → Limited to 5 per hour per user

## Automated Test Commands

```bash
# Run security validation
npm run security:check

# Verify all functions hardened
node scripts/check-search-path.cjs

# Check migration discipline
npm run db:migrations:check

# Full test suite
npm test -- --runInBand
```

## Expected Results ✅

### Security Metrics
```
✅ Function Hardening: 100% (74+/74+ functions secured)
✅ RLS Coverage: 100% (all tables protected)
✅ Rate Limiting: Active on all endpoints
✅ OTP Security: 5-minute expiry enforced
✅ Admin Security: Session validation active
✅ Audit Logging: All events captured
```

### Performance Benchmarks
```
✅ Page Load Time: < 2 seconds
✅ OTP Delivery: < 30 seconds  
✅ Payment Processing: < 5 seconds
✅ Dashboard Response: < 1 second
✅ Database Queries: < 100ms average
```

## Day-1 Operations Checklist

### Monitoring Setup ✅
- [ ] **Supabase Dashboard**: Bookmark project dashboard
- [ ] **Database Backup**: Verify daily backups enabled
- [ ] **Edge Function Logs**: Monitor function performance
- [ ] **Auth Metrics**: Track login success/failure rates
- [ ] **Security Alerts**: Configure email notifications

### Security Operations ✅
- [ ] **Service Role Key**: Stored securely (never in client code)
- [ ] **API Key Rotation**: Quarterly schedule planned
- [ ] **Security Reviews**: Monthly security audits scheduled
- [ ] **Incident Response**: Emergency contacts documented
- [ ] **Compliance Reports**: Quarterly compliance reviews

### User Communication ✅
- [ ] **Privacy Policy**: Updated with current practices
- [ ] **Terms of Service**: Reflect escrow and delivery rules
- [ ] **User Notifications**: Security feature announcements
- [ ] **Support Documentation**: Updated help guides
- [ ] **Emergency Contacts**: Security team contact info

## Growth Readiness Checklist

### Payment Integration ✅
- [ ] **PayPal Integration**: Tested and functional
- [ ] **Paystack Setup**: Ready for Nigeria market
- [ ] **Flutterwave Setup**: Ready for Africa expansion
- [ ] **Multi-currency**: NGN as primary, USD as secondary
- [ ] **Fee Calculation**: Transparent fee structure

### Compliance & Privacy ✅
- [ ] **Data Export**: User data export functionality
- [ ] **Account Deletion**: Complete data removal process
- [ ] **GDPR Compliance**: Data protection measures
- [ ] **Audit Trail**: Complete transaction history
- [ ] **Regulatory Compliance**: Local marketplace regulations

### Scalability Preparation ✅
- [ ] **Database Performance**: Query optimization completed
- [ ] **CDN Setup**: Static asset delivery optimized
- [ ] **Caching Strategy**: Redis/edge caching planned
- [ ] **Load Balancing**: Auto-scaling configuration
- [ ] **Monitoring**: APM and error tracking setup

## Emergency Procedures

### Security Incident Response
1. **Immediate**: Disable affected user accounts
2. **Within 1 hour**: Notify security team
3. **Within 4 hours**: Assess impact and containment
4. **Within 24 hours**: User communication if needed
5. **Within 1 week**: Post-incident review and fixes

### System Recovery
1. **Database Issues**: Point-in-time recovery available
2. **Auth Failures**: Service role key rotation procedure
3. **Payment Issues**: Manual escrow release process
4. **Rate Limit Issues**: Emergency threshold adjustment
5. **Security Breaches**: Incident response playbook

## Contact Information

### Emergency Contacts
- **Security Team**: security@villagemarket.com
- **Platform Emergency**: security-emergency@villagemarket.com  
- **Technical Support**: platform@villagemarket.com
- **Business Critical**: admin@villagemarket.com

### External Services
- **Supabase Support**: Dashboard → Support
- **PayPal Technical**: Developer support portal
- **Domain/DNS Issues**: Domain registrar support
- **SSL Certificate**: Lovable support for custom domains

---

**Smoke Test Version**: 2.0  
**Last Updated**: 2025-01-20  
**Test Duration**: ~5 minutes  
**Pass Criteria**: All checkboxes ✅