#!/usr/bin/env node

/**
 * Security Guard: Function Search Path Hardening Check
 * Ensures all database functions have SET search_path = '' for security
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

async function checkSearchPathHardening() {
  console.log('🔍 Checking function search_path hardening...');
  
  try {
    // Updated query to properly detect functions missing SET search_path = ''
    const { data, error } = await supabase
      .from('dummy')  // Using a different approach
      .select('*')
      .limit(0);

    // Use direct SQL query instead
    const hardeningResult = await supabase.rpc('get_function_hardening_status');
    
    if (hardeningResult.error) {
      console.error('❌ Database query failed:', hardeningResult.error.message);
      process.exit(1);
    }

    const status = hardeningResult.data;
    
    if (status.is_fully_hardened) {
      console.log('✅ All functions have proper search_path hardening');
      console.log(`🔒 Security check passed: ${status.hardened_functions}/${status.total_functions} functions hardened (${status.coverage_percentage}%)`);
      process.exit(0);
    }

    console.log(`❌ Found ${status.unhardened_functions} functions missing SET search_path = '':`);
    console.log(`📊 Coverage: ${status.coverage_percentage}% (${status.hardened_functions}/${status.total_functions})`);
    console.log('');
    
    status.unhardened_list.forEach((func, index) => {
      console.log(`${index + 1}. public.${func.name}(${func.args})`);
      console.log(`   Language: ${func.language}`);
      console.log(`   Security: ${func.security_definer ? 'SECURITY DEFINER' : 'SECURITY INVOKER'}`);
      console.log('');
    });

    console.log('🚨 SECURITY VIOLATION: Functions without search_path hardening detected!');
    console.log('📖 See: https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY');
    console.log('');
    console.log('To fix, add SET search_path = \'\' to each function:');
    console.log('CREATE OR REPLACE FUNCTION func_name() ... SET search_path = \'\' AS $$...');
    
    process.exit(1);

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    process.exit(1);
  }
}

async function checkOtherSecurityItems() {
  console.log('🔍 Checking additional security configurations...');
  
  try {
    // Check for tables without RLS
    const { data: rlsCheck } = await supabase
      .rpc('execute', {
        query: `
          SELECT schemaname, tablename
          FROM pg_tables 
          WHERE schemaname = 'public'
            AND NOT EXISTS (
              SELECT 1 FROM pg_class c 
              WHERE c.relname = pg_tables.tablename 
              AND c.relrowsecurity = true
            )
          ORDER BY tablename;
        `
      });

    if (rlsCheck && rlsCheck.length > 0) {
      console.log(`⚠️  Found ${rlsCheck.length} tables without RLS enabled:`);
      rlsCheck.forEach(table => {
        console.log(`   - ${table.schemaname}.${table.tablename}`);
      });
    }

    // Check for admin users
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('id, user_role')
      .eq('user_role', 'admin');

    if (adminCheck && adminCheck.length > 0) {
      console.log(`ℹ️  Found ${adminCheck.length} admin users in the system`);
    }

    console.log('✅ Additional security checks completed');

  } catch (err) {
    console.warn('⚠️  Additional security checks failed:', err.message);
  }
}

async function main() {
  console.log('🛡️  VillageMarket Security Guard - Function Hardening Check');
  console.log('=' .repeat(60));
  
  await checkSearchPathHardening();
  await checkOtherSecurityItems();
}

if (require.main === module) {
  main();
}

module.exports = { checkSearchPathHardening, checkOtherSecurityItems };