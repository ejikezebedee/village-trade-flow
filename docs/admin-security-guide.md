# Admin Security Guide - VillageMarket

## Overview

This guide provides administrators with comprehensive instructions for managing VillageMarket's security features, monitoring systems, and responding to security incidents.

## Security Center Dashboard

### Accessing the Security Center

1. Log in with admin credentials
2. Navigate to **Admin Dashboard** → **Security Center**
3. The dashboard provides real-time security metrics and alerts

### Dashboard Components

#### 1. Security Metrics Overview

**Key Metrics Displayed:**
- Active security alerts (last 24 hours)
- Failed login attempts (last hour)
- Rate limit violations (last hour)
- RLS policy violations (last 24 hours)
- Active user sessions
- Recent privilege escalations

**Status Indicators:**
- 🟢 **Green**: Normal operation
- 🟡 **Yellow**: Warning condition
- 🔴 **Red**: Critical alert requiring immediate attention

#### 2. Real-Time Alerts Panel

**Alert Severity Levels:**
- **Critical**: Security breaches, admin account compromises
- **High**: Multiple failed logins, suspicious activities
- **Medium**: Configuration changes, role modifications
- **Low**: General security events

**Alert Actions:**
- Click alert to view detailed information
- Mark as investigated
- Assign to team member
- Create incident report

## Audit Logs Management

### Accessing Audit Logs

1. In Security Center, click **Audit Logs** tab
2. Use filters to narrow down results:
   - Date range
   - Event type
   - User ID
   - Severity level
   - Table/resource affected

### Audit Log Categories

#### User Authentication Events
- Login attempts (successful/failed)
- Password changes
- 2FA setup/removal
- Session creation/termination

#### Data Access Events
- Table access attempts
- RLS policy violations
- Unauthorized data requests
- Data export activities

#### Administrative Actions
- User role changes
- System configuration updates
- Security policy modifications
- API key management

#### Financial Transactions
- Payment processing events
- Escrow operations
- Withdrawal requests
- Refund processing

### Exporting Audit Logs

1. Select desired date range and filters
2. Click **Export** button
3. Choose format (CSV, JSON, PDF)
4. Download will include:
   - Event timestamp
   - User information
   - Action performed
   - Before/after states
   - IP address and location

## Rate Limiting Monitoring

### Rate Limit Dashboard

**Current Limits:**
- Login attempts: 5 per 10 minutes per IP
- Password reset: 3 per hour per email
- OTP verification: 5 per 10 minutes per user
- API calls: 100 per minute per user

### Managing Rate Limit Violations

#### Viewing Violations

1. Navigate to **Rate Limiting** tab
2. Review current violations:
   - IP address
   - User ID (if authenticated)
   - Action type
   - Violation count
   - Block expiry time

#### Responding to Violations

**For Legitimate Users:**
1. Click **Whitelist IP** for temporary relief
2. Contact user to explain situation
3. Consider increasing limits for verified users

**For Suspicious Activity:**
1. Click **Extend Block** to increase timeout
2. Add to **Suspicious IPs** list
3. Create security incident report

#### Adjusting Rate Limits

1. Go to **Rate Limit Settings**
2. Modify limits per action type:
   - Maximum attempts
   - Time window
   - Block duration
   - Escalation rules

## Suspicious Activity Alerts

### Alert Types and Responses

#### 1. Multiple Failed Logins

**Alert Criteria:**
- 5+ failed attempts in 10 minutes
- Failed attempts from new locations
- Password attempts against admin accounts

**Response Actions:**
1. Review login attempt details
2. Check if user account should be locked
3. Verify user identity if needed
4. Consider IP blocking for persistent attacks

#### 2. Privilege Escalation Attempts

**Alert Criteria:**
- Users attempting admin functions
- Role change requests without approval
- Access to restricted resources

**Response Actions:**
1. Immediately investigate the attempt
2. Review user's recent activity
3. Verify if attempt was legitimate
4. Lock account if necessary

#### 3. Unusual Payment Activities

**Alert Criteria:**
- Large transactions outside normal patterns
- Multiple failed payment attempts
- Suspicious refund requests

**Response Actions:**
1. Review transaction details
2. Contact involved parties
3. Hold funds if necessary
4. Report to financial authorities if required

## Dispute Evidence Management

### Evidence Upload Monitoring

1. Navigate to **Dispute Management** → **Evidence**
2. Review recent uploads:
   - File type and size
   - SHA-256 hash verification
   - Upload timestamp
   - Associated dispute ID

### Evidence Verification

#### Automatic Checks
- File integrity verification
- Malware scanning
- File type validation
- Size limit enforcement

#### Manual Review Process
1. Click on evidence file to review
2. Verify file contents are appropriate
3. Check for sensitive information
4. Approve or reject evidence

### Evidence Security

**Security Measures:**
- All files encrypted at rest
- Access logged and monitored
- Automatic deletion after case closure
- Backup stored securely off-site

## Moderation Queue

### Content Moderation

1. Access **Moderation Queue** from Security Center
2. Review flagged content:
   - Chat messages
   - Product listings
   - User profiles
   - Comments and reviews

### Moderation Actions

#### Individual Actions
- **Approve**: Content is appropriate
- **Edit**: Modify content to remove violations
- **Hide**: Hide from public but keep record
- **Delete**: Permanently remove content
- **Ban User**: Suspend user account

#### Batch Operations
1. Select multiple items using checkboxes
2. Choose batch action:
   - Bulk approve
   - Bulk delete
   - Mass user suspension
3. Confirm action with admin password

### Moderation Guidelines

#### Content Violations
- Spam or promotional content
- Inappropriate language
- Misleading product descriptions
- Privacy violations
- Copyright infringement

#### User Behavior Violations
- Harassment or bullying
- Fraudulent activities
- Multiple account abuse
- System manipulation attempts

## User Account Management

### Account Security Review

#### Regular Reviews
1. Navigate to **User Management**
2. Filter by account status:
   - Recently created accounts
   - Accounts with multiple violations
   - High-value transaction accounts
   - Admin and moderator accounts

#### Security Flags
- 🔴 **High Risk**: Multiple violations, suspicious patterns
- 🟡 **Medium Risk**: Some concerns, needs monitoring
- 🟢 **Low Risk**: Normal, trusted user

### Account Actions

#### Temporary Restrictions
- **Messaging Ban**: Prevent sending messages
- **Listing Ban**: Prevent creating new listings
- **Payment Hold**: Hold payments pending review
- **Login Suspension**: Temporary account lock

#### Permanent Actions
- **Account Termination**: Permanent ban
- **Data Purge**: Remove all user data
- **Blacklist**: Prevent re-registration

## Security Configuration

### Access Control Settings

1. Navigate to **Security Settings**
2. Configure system-wide settings:
   - Session timeout duration
   - Password complexity requirements
   - 2FA enforcement policies
   - API rate limits

### Security Policies

#### Password Policies
- Minimum length: 8 characters
- Complexity requirements: Upper, lower, number, symbol
- Password history: Block last 3 passwords
- Breach checking: HaveIBeenPwned integration

#### Session Policies
- Idle timeout: 30 minutes
- Maximum lifetime: 24 hours
- Concurrent session limit: 3 per user
- Force logout on password change

## Incident Response

### Creating Security Incidents

1. Click **Create Incident** in Security Center
2. Fill in incident details:
   - Incident type and severity
   - Affected users/systems
   - Initial assessment
   - Actions taken

### Incident Workflow

#### 1. Initial Response (0-1 hour)
- Assess incident scope
- Contain immediate threats
- Notify relevant stakeholders
- Begin evidence collection

#### 2. Investigation (1-24 hours)
- Conduct thorough investigation
- Document findings
- Identify root cause
- Develop remediation plan

#### 3. Resolution (24-72 hours)
- Implement fixes
- Verify resolution
- Update security measures
- Communicate with affected users

#### 4. Post-Incident (1-2 weeks)
- Complete incident report
- Update procedures
- Conduct lessons learned
- Implement preventive measures

### Communication Templates

#### User Notification Templates
- Security incident notification
- Password reset required
- Account suspension notice
- Data breach notification

#### Internal Communication
- Incident escalation alerts
- Status update reports
- Resolution summaries
- Lessons learned reports

## Backup and Recovery

### Security Backup Verification

1. Check **Backup Status** in Security Center
2. Verify backup integrity:
   - Last backup timestamp
   - Backup size and completeness
   - Encryption status
   - Test restore capability

### Recovery Procedures

#### Data Recovery
1. Identify affected data/systems
2. Verify backup availability
3. Initiate recovery process
4. Validate data integrity

#### System Recovery
1. Assess system damage
2. Plan recovery sequence
3. Execute recovery steps
4. Verify system functionality

## Compliance Monitoring

### Regular Security Checks

#### Weekly Tasks
- Review security alerts
- Check failed login reports
- Verify backup completion
- Update security patches

#### Monthly Tasks
- Audit user permissions
- Review API key usage
- Check for orphaned accounts
- Update security policies

#### Quarterly Tasks
- Conduct security assessment
- Review incident responses
- Update threat models
- Plan security training

### Compliance Reports

1. Navigate to **Compliance** tab
2. Generate reports for:
   - GDPR compliance
   - Security incident summary
   - Audit trail reports
   - Risk assessment updates

## Training and Documentation

### Security Training Resources

- **New Admin Onboarding**: Security fundamentals
- **Incident Response Training**: Hands-on scenarios
- **Compliance Updates**: Regular training sessions
- **Technical Security**: Advanced threat detection

### Documentation Updates

- Keep security procedures current
- Update contact information
- Review emergency procedures
- Maintain vendor contact lists

## Contact Information

### Emergency Contacts
- **Security Team Lead**: security-lead@villagemarket.com
- **Incident Response**: incident@villagemarket.com
- **Technical Support**: support@villagemarket.com
- **Legal/Compliance**: legal@villagemarket.com

### Escalation Procedures
1. **Level 1**: Security team member
2. **Level 2**: Security team lead
3. **Level 3**: CTO/Security officer
4. **Level 4**: CEO/Executive team

---

*This guide is updated regularly with new features and procedures.*
*Last updated: [Current Date]*