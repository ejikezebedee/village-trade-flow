#!/usr/bin/env node

/**
 * Security Verification Checklist
 * 
 * Runs comprehensive security verification after audit fixes
 * Validates all security implementations are working correctly
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://zrsdcbqqeyoipzjlasjv.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runSecurityVerificationChecklist() {
  console.log('🔐 Security Verification Checklist - Post Audit Fixes');
  console.log('=' .repeat(60));
  
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let warnings = 0;

  const results = [];

  // Helper function to log results
  const logResult = (testName, status, message, details = '') => {
    totalChecks++;
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    
    if (status === 'PASS') passedChecks++;
    else if (status === 'FAIL') failedChecks++;
    else warnings++;
    
    console.log(`${statusIcon} ${testName}: ${message}`);
    if (details) console.log(`   ${details}`);
    
    results.push({ testName, status, message, details });
  };

  try {
    // Test 1: Function Hardening Status
    console.log('\n📊 Function Security Verification');
    console.log('-'.repeat(40));
    
    try {
      const { data: hardeningStats, error: hardeningError } = await supabase.rpc('get_function_hardening_counters');
      
      if (hardeningError) throw hardeningError;
      
      const hardeningPercentage = hardeningStats.total > 0 ? 
        (hardeningStats.hardened / hardeningStats.total * 100).toFixed(2) : 100;
      
      if (hardeningPercentage >= 95) {
        logResult(
          'Function Hardening',
          'PASS',
          `${hardeningPercentage}% of functions hardened`,
          `${hardeningStats.hardened}/${hardeningStats.total} functions secured with SET search_path = ''`
        );
      } else {
        logResult(
          'Function Hardening',
          'FAIL',
          `Only ${hardeningPercentage}% of functions hardened`,
          `${hardeningStats.unhardened} functions need hardening`
        );
      }
    } catch (error) {
      logResult('Function Hardening', 'FAIL', 'Could not verify function hardening', error.message);
    }

    // Test 2: RLS Coverage
    console.log('\n🛡️ Row Level Security Verification');
    console.log('-'.repeat(40));
    
    try {
      const { data: rlsStats, error: rlsError } = await supabase.rpc('get_table_security_status');
      
      if (rlsError) throw rlsError;
      
      const totalTables = rlsStats.length;
      const rlsEnabledTables = rlsStats.filter(table => table.rls_enabled).length;
      const rlsPercentage = totalTables > 0 ? (rlsEnabledTables / totalTables * 100).toFixed(2) : 100;
      
      if (rlsPercentage === '100.00') {
        logResult(
          'RLS Coverage',
          'PASS',
          '100% of tables have RLS enabled',
          `All ${totalTables} tables protected`
        );
      } else {
        const unprotectedTables = rlsStats.filter(table => !table.rls_enabled);
        logResult(
          'RLS Coverage',
          'FAIL',
          `${rlsPercentage}% RLS coverage`,
          `Unprotected tables: ${unprotectedTables.map(t => t.table_name).join(', ')}`
        );
      }
    } catch (error) {
      logResult('RLS Coverage', 'FAIL', 'Could not verify RLS coverage', error.message);
    }

    // Test 3: Admin Table Protection
    console.log('\n🔒 Admin Data Protection Verification');
    console.log('-'.repeat(40));
    
    try {
      // Test with anon role (should fail)
      const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '');
      const { data: adminData, error: adminError } = await anonClient
        .from('admins')
        .select('*')
        .limit(1);
      
      if (adminError && adminError.message.includes('policy')) {
        logResult(
          'Admin Table Protection',
          'PASS',
          'Admin table properly protected from public access',
          'RLS policies blocking unauthorized access'
        );
      } else {
        logResult(
          'Admin Table Protection',
          'FAIL',
          'Admin table may be publicly accessible',
          adminError?.message || 'No RLS protection detected'
        );
      }
    } catch (error) {
      logResult('Admin Table Protection', 'FAIL', 'Could not test admin protection', error.message);
    }

    // Test 4: 2FA System Verification
    console.log('\n🔐 Two-Factor Authentication Verification');
    console.log('-'.repeat(40));
    
    try {
      // Check if 2FA tables exist and have proper structure
      const { data: profilesCheck } = await supabase
        .from('profiles')
        .select('two_factor_enabled, two_factor_secret_encrypted')
        .limit(1);
      
      const { data: backupCodesCheck } = await supabase
        .from('two_factor_backup_codes')
        .select('id')
        .limit(1);
      
      if (profilesCheck !== null && backupCodesCheck !== null) {
        logResult(
          '2FA Schema',
          'PASS',
          '2FA database schema properly implemented',
          'Profiles and backup codes tables configured correctly'
        );
      } else {
        logResult(
          '2FA Schema',
          'FAIL',
          '2FA database schema incomplete',
          'Missing required 2FA tables or columns'
        );
      }
    } catch (error) {
      logResult('2FA Schema', 'FAIL', 'Could not verify 2FA schema', error.message);
    }

    // Test 5: Monitoring Consistency
    console.log('\n📈 Security Monitoring Verification');
    console.log('-'.repeat(40));
    
    try {
      const { data: healthData, error: healthError } = await supabase.rpc('get_security_health_summary');
      const { data: statusData, error: statusError } = await supabase.rpc('get_comprehensive_security_status');
      
      if (!healthError && !statusError && healthData && statusData) {
        const healthPercentage = healthData.functions?.percent || 0;
        const statusPercentage = statusData.function_hardening?.percentage || 0;
        const difference = Math.abs(healthPercentage - statusPercentage);
        
        if (difference < 5) {
          logResult(
            'Monitoring Consistency',
            'PASS',
            'Security monitoring functions report consistent data',
            `Health: ${healthPercentage}%, Status: ${statusPercentage}% (diff: ${difference.toFixed(2)}%)`
          );
        } else {
          logResult(
            'Monitoring Consistency',
            'FAIL',
            'Security monitoring functions report inconsistent data',
            `Health: ${healthPercentage}%, Status: ${statusPercentage}% (diff: ${difference.toFixed(2)}%)`
          );
        }
      } else {
        logResult(
          'Monitoring Consistency',
          'FAIL',
          'Could not verify monitoring functions',
          healthError?.message || statusError?.message || 'Unknown error'
        );
      }
    } catch (error) {
      logResult('Monitoring Consistency', 'FAIL', 'Error testing monitoring functions', error.message);
    }

    // Test 6: Audit Logging
    console.log('\n📝 Audit System Verification');
    console.log('-'.repeat(40));
    
    try {
      const { data: auditCheck } = await supabase
        .from('audit_logs')
        .select('id')
        .limit(1);
      
      if (auditCheck !== null) {
        logResult(
          'Audit System',
          'PASS',
          'Audit logging system accessible',
          'Audit logs table configured and accessible'
        );
      } else {
        logResult(
          'Audit System',
          'FAIL',
          'Audit logging system not accessible',
          'Could not access audit_logs table'
        );
      }
    } catch (error) {
      logResult('Audit System', 'FAIL', 'Could not verify audit system', error.message);
    }

    // Test 7: Helper Functions
    console.log('\n🔧 Security Helper Functions Verification');
    console.log('-'.repeat(40));
    
    try {
      const { data: authData, error: authError } = await supabase.rpc('auth_user_id');
      const { data: roleData, error: roleError } = await supabase.rpc('get_current_user_role');
      
      if (!authError && !roleError) {
        logResult(
          'Helper Functions',
          'PASS',
          'Security helper functions working correctly',
          'auth_user_id() and get_current_user_role() accessible'
        );
      } else {
        logResult(
          'Helper Functions',
          'FAIL',
          'Security helper functions not working',
          authError?.message || roleError?.message || 'Function call failed'
        );
      }
    } catch (error) {
      logResult('Helper Functions', 'FAIL', 'Could not test helper functions', error.message);
    }

    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎯 SECURITY VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalChecks}`);
    console.log(`✅ Passed: ${passedChecks}`);
    console.log(`❌ Failed: ${failedChecks}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    
    const successRate = totalChecks > 0 ? (passedChecks / totalChecks * 100).toFixed(1) : 0;
    console.log(`📊 Success Rate: ${successRate}%`);
    
    if (failedChecks === 0) {
      console.log('\n🏆 EXCELLENT! All security verifications passed.');
      console.log('🛡️ Your application is properly secured.');
      console.log('\n📋 Recommended next steps:');
      console.log('  1. Enable Supabase password breach protection');
      console.log('  2. Set OTP expiry to 5 minutes');
      console.log('  3. Schedule regular security reviews');
      console.log('  4. Monitor audit logs regularly');
    } else {
      console.log('\n⚠️  Some security checks failed. Please review and address the issues above.');
      console.log('🔧 Run the security fixes migration and retry this checklist.');
    }
    
    const exitCode = failedChecks === 0 ? 0 : 1;
    console.log('\n🏁 Security verification complete.');
    return exitCode;

  } catch (error) {
    console.error('\n❌ Fatal error during security verification:', error.message);
    return 1;
  }
}

// Run verification if called directly
if (require.main === module) {
  runSecurityVerificationChecklist()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { runSecurityVerificationChecklist };