#!/usr/bin/env node

/**
 * Final Security Verification Suite
 * Comprehensive security checks for VillageMarket platform
 */

const { createClient } = require('@supabase/supabase-js');
const process = require('process');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://zrsdcbqqeyoipzjlasjv.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runComprehensiveSecurityCheck() {
  console.log('🛡️  VillageMarket Final Security Verification Suite');
  console.log('=' .repeat(60));
  
  let overallScore = 100;
  let issues = [];
  let passed = 0;
  let failed = 0;

  try {
    // 1. Function Hardening Check
    console.log('\n🔍 1. Function Search Path Hardening...');
    const hardeningResult = await supabase.rpc('get_function_hardening_status');
    
    if (hardeningResult.data?.is_fully_hardened) {
      console.log(`✅ All ${hardeningResult.data.total_functions} functions hardened (100%)`);
      passed++;
    } else {
      console.log(`❌ ${hardeningResult.data?.unhardened_functions || 'Unknown'} functions need hardening`);
      overallScore -= 25;
      issues.push('Function search path hardening incomplete');
      failed++;
    }

    // 2. Security Health Check
    console.log('\n🏥 2. Overall Security Health...');
    const healthResult = await supabase.rpc('get_security_health_summary');
    
    if (healthResult.data?.security_status === 'excellent') {
      console.log(`✅ Security health: ${healthResult.data.security_status.toUpperCase()}`);
      console.log(`   - RLS Coverage: ${healthResult.data.rls_coverage}%`);
      console.log(`   - Function Hardening: ${healthResult.data.function_hardening_coverage}%`);
      passed++;
    } else {
      console.log(`⚠️  Security health: ${healthResult.data?.security_status || 'unknown'}`);
      console.log(`   - RLS Coverage: ${healthResult.data?.rls_coverage || 'unknown'}%`);
      console.log(`   - Function Hardening: ${healthResult.data?.function_hardening_coverage || 'unknown'}%`);
      overallScore -= 15;
      issues.push('Security health below excellent');
      failed++;
    }

    // 3. Comprehensive Security Status
    console.log('\n📊 3. Comprehensive Security Review...');
    const compResult = await supabase.rpc('get_comprehensive_security_status');
    
    if (compResult.data?.security_score >= 95) {
      console.log(`✅ Comprehensive security score: ${compResult.data.security_score}/100`);
      passed++;
    } else {
      console.log(`⚠️  Comprehensive security score: ${compResult.data?.security_score || 'unknown'}/100`);
      if (compResult.data?.tables_without_policies > 0) {
        console.log(`   - Tables without RLS policies: ${compResult.data.tables_without_policies}`);
      }
      if (compResult.data?.security_definer_views > 0) {
        console.log(`   - Security definer views: ${compResult.data.security_definer_views}`);
      }
      overallScore -= 10;
      issues.push('Comprehensive security score below 95');
      failed++;
    }

    // 4. RLS Policy Coverage Check
    console.log('\n🔐 4. Row Level Security Coverage...');
    const { data: tables } = await supabase.rpc('get_table_security_status');
    
    if (tables) {
      const tablesWithoutRLS = tables.filter(t => !t.rls_enabled);
      const tablesWithoutPolicies = tables.filter(t => t.rls_enabled && t.policy_count === 0);
      
      if (tablesWithoutRLS.length === 0 && tablesWithoutPolicies.length === 0) {
        console.log(`✅ All ${tables.length} tables properly secured with RLS`);
        passed++;
      } else {
        console.log(`❌ RLS issues found:`);
        if (tablesWithoutRLS.length > 0) {
          console.log(`   - ${tablesWithoutRLS.length} tables without RLS enabled`);
        }
        if (tablesWithoutPolicies.length > 0) {
          console.log(`   - ${tablesWithoutPolicies.length} tables with RLS but no policies`);
        }
        overallScore -= 20;
        issues.push('RLS coverage incomplete');
        failed++;
      }
    }

    // 5. Admin Security Check
    console.log('\n👑 5. Admin Security Configuration...');
    const { data: adminConfig } = await supabase
      .from('security_configurations')
      .select('*')
      .eq('is_active', true);
    
    if (adminConfig && adminConfig.length > 0) {
      console.log(`✅ ${adminConfig.length} security configurations active`);
      passed++;
    } else {
      console.log('⚠️  No active security configurations found');
      overallScore -= 5;
      issues.push('Security configurations missing');
      failed++;
    }

  } catch (error) {
    console.error('❌ Security check failed:', error.message);
    overallScore = 0;
    issues.push(`Critical error: ${error.message}`);
    failed++;
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 FINAL SECURITY VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Overall Security Score: ${overallScore}/100`);
  console.log(`Tests Passed: ${passed}`);
  console.log(`Tests Failed: ${failed}`);
  
  if (issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (overallScore >= 95) {
    console.log('\n🎉 EXCELLENT! Security hardening is complete.');
    console.log('✅ VillageMarket is production-ready from a security perspective.');
  } else if (overallScore >= 80) {
    console.log('\n⚠️  GOOD security level, but some improvements recommended.');
  } else {
    console.log('\n❌ SECURITY ISSUES must be addressed before production.');
  }

  console.log('\n🔗 Next Steps:');
  console.log('   1. Review any failing checks above');
  console.log('   2. Run: npm run security:check');
  console.log('   3. Monitor security dashboard regularly');
  console.log('   4. Keep security configurations updated');

  return overallScore >= 95 ? 0 : 1;
}

async function main() {
  const exitCode = await runComprehensiveSecurityCheck();
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { runComprehensiveSecurityCheck };