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
    // Query to find functions missing SET search_path = ''
    const { data, error } = await supabase
      .rpc('execute', {
        query: `
          SELECT n.nspname AS schema_name,
                 p.proname AS function_name,
                 pg_get_function_identity_arguments(p.oid) AS args,
                 l.lanname AS language,
                 CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END AS security_mode
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          JOIN pg_language l ON l.oid = p.prolang
          WHERE n.nspname NOT IN ('pg_catalog','information_schema')
            AND p.prokind IN ('f','p')
            AND NOT EXISTS (
              SELECT 1
              FROM pg_options_to_table(p.proconfig) t
              WHERE t.key = 'search_path' AND t.value = ''
            )
          ORDER BY p.proname;
        `
      });

    if (error) {
      console.error('❌ Database query failed:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('✅ All functions have proper search_path hardening');
      console.log('🔒 Security check passed');
      process.exit(0);
    }

    console.log(`❌ Found ${data.length} functions missing SET search_path = '':`);
    console.log('');
    
    data.forEach((func, index) => {
      console.log(`${index + 1}. ${func.schema_name}.${func.function_name}(${func.args})`);
      console.log(`   Language: ${func.language}`);
      console.log(`   Security: ${func.security_mode}`);
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