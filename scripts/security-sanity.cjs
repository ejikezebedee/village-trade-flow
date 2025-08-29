#!/usr/bin/env node

/**
 * Security Sanity Check Script
 * 
 * Validates critical security configuration before deployment.
 * Fails CI build if critical security misconfigurations are detected.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class SecuritySanityChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  /**
   * Check OTP TTL configuration
   */
  checkOtpTtl() {
    log('\n🔍 Checking OTP TTL Configuration...', 'blue');
    
    const expectedTtl = 300; // 5 minutes
    const otpTtl = process.env.OTP_TTL_SECONDS;
    
    if (!otpTtl) {
      this.warnings.push('OTP_TTL_SECONDS not set - using default. Consider setting to 300 for security.');
      log('  ⚠️  OTP_TTL_SECONDS environment variable not set', 'yellow');
      return;
    }
    
    const ttlValue = parseInt(otpTtl);
    if (isNaN(ttlValue)) {
      this.errors.push(`OTP_TTL_SECONDS must be a number, got: ${otpTtl}`);
      log(`  ❌ Invalid OTP_TTL_SECONDS: ${otpTtl}`, 'red');
      return;
    }
    
    if (ttlValue > expectedTtl) {
      this.errors.push(`OTP_TTL_SECONDS is ${ttlValue}s, must be ≤${expectedTtl}s for security`);
      log(`  ❌ OTP TTL too long: ${ttlValue}s (max: ${expectedTtl}s)`, 'red');
      return;
    }
    
    this.passed.push(`OTP TTL configured correctly: ${ttlValue}s`);
    log(`  ✅ OTP TTL: ${ttlValue}s (≤${expectedTtl}s)`, 'green');
  }

  /**
   * Check HIBP configuration
   */
  checkHibpConfig() {
    log('\n🔍 Checking HIBP Configuration...', 'blue');
    
    const hibpEnabled = process.env.HIBP_ENABLED;
    
    if (hibpEnabled !== 'true') {
      this.warnings.push('HIBP_ENABLED not set to true. Enable leaked password protection in Supabase Dashboard: Authentication > Settings > Password Protection');
      log('  ⚠️  HIBP not enabled via environment variable', 'yellow');
      log('  ℹ️  Enable in Supabase Dashboard: Authentication > Settings > Password Protection', 'blue');
    } else {
      this.passed.push('HIBP environment flag set to true');
      log('  ✅ HIBP environment flag: enabled', 'green');
    }
  }

  /**
   * Check environment file exists and has required security variables
   */
  checkEnvironmentFile() {
    log('\n🔍 Checking Environment Configuration...', 'blue');
    
    const envExamplePath = path.join(process.cwd(), '.env.example');
    if (!fs.existsSync(envExamplePath)) {
      this.errors.push('.env.example file missing');
      log('  ❌ .env.example file not found', 'red');
      return;
    }
    
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    const requiredVars = [
      'SUPABASE_PROJECT_ID',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      this.errors.push(`Missing required environment variables in .env.example: ${missingVars.join(', ')}`);
      log(`  ❌ Missing vars: ${missingVars.join(', ')}`, 'red');
      return;
    }
    
    this.passed.push('All required environment variables present in .env.example');
    log('  ✅ All required environment variables present', 'green');
  }

  /**
   * Check security configuration files exist
   */
  checkSecurityFiles() {
    log('\n🔍 Checking Security Files...', 'blue');
    
    const requiredFiles = [
      'docs/security.md',
      'scripts/check-default-admin.cjs',
      'src/lib/env.ts'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
    
    if (missingFiles.length > 0) {
      this.errors.push(`Missing security files: ${missingFiles.join(', ')}`);
      log(`  ❌ Missing files: ${missingFiles.join(', ')}`, 'red');
      return;
    }
    
    this.passed.push('All required security files present');
    log('  ✅ All security files present', 'green');
  }

  /**
   * Check Supabase configuration
   */
  checkSupabaseConfig() {
    log('\n🔍 Checking Supabase Configuration...', 'blue');
    
    const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
    if (!fs.existsSync(configPath)) {
      this.warnings.push('supabase/config.toml not found - this is okay for client-only apps');
      log('  ⚠️  supabase/config.toml not found', 'yellow');
      return;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Check if security-health function is properly configured
    if (configContent.includes('[functions.security-health]')) {
      this.passed.push('Security health function configured');
      log('  ✅ Security health function configured', 'green');
    } else {
      this.warnings.push('Security health function not found in config.toml');
      log('  ⚠️  Security health function not configured', 'yellow');
    }
  }

  /**
   * Run all security sanity checks
   */
  runChecks() {
    log(`${colors.bold}🛡️  Security Sanity Check${colors.reset}`, 'blue');
    log('Validating critical security configuration...\n');
    
    this.checkOtpTtl();
    this.checkHibpConfig();
    this.checkEnvironmentFile();
    this.checkSecurityFiles();
    this.checkSupabaseConfig();
    
    this.printSummary();
    
    // Exit with appropriate code
    if (this.errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }

  /**
   * Print summary of all checks
   */
  printSummary() {
    log('\n' + '='.repeat(60), 'blue');
    log(`${colors.bold}🔍 Security Sanity Check Results${colors.reset}`, 'blue');
    log('='.repeat(60), 'blue');
    
    log(`\n✅ ${colors.green}${colors.bold}PASSED${colors.reset} (${this.passed.length}):`, 'green');
    this.passed.forEach(item => log(`  • ${item}`, 'green'));
    
    if (this.warnings.length > 0) {
      log(`\n⚠️  ${colors.yellow}${colors.bold}WARNINGS${colors.reset} (${this.warnings.length}):`, 'yellow');
      this.warnings.forEach(item => log(`  • ${item}`, 'yellow'));
    }
    
    if (this.errors.length > 0) {
      log(`\n❌ ${colors.red}${colors.bold}ERRORS${colors.reset} (${this.errors.length}):`, 'red');
      this.errors.forEach(item => log(`  • ${item}`, 'red'));
      
      log(`\n${colors.red}${colors.bold}❌ Security sanity check FAILED!${colors.reset}`, 'red');
      log('Fix the above errors before deploying to production.\n', 'red');
    } else {
      log(`\n${colors.green}${colors.bold}✅ Security sanity check PASSED!${colors.reset}`, 'green');
      if (this.warnings.length > 0) {
        log('Consider addressing warnings for optimal security.\n', 'yellow');
      } else {
        log('All security checks passed successfully.\n', 'green');
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new SecuritySanityChecker();
  checker.runChecks();
}

module.exports = SecuritySanityChecker;