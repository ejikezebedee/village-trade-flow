#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔒 Checking RLS policy coverage...');
  
  try {
    const { data: policyData, error } = await supabase.rpc('check_rls_policy_coverage');
    
    if (error) {
      console.error('❌ Failed to check RLS policies:', error.message);
      process.exit(1);
    }
    
    const tablesWithIssues = policyData.filter(table => table.has_issues);
    
    if (tablesWithIssues.length > 0) {
      console.error(`❌ Found ${tablesWithIssues.length} tables with RLS enabled but no policies:`);
      tablesWithIssues.forEach(table => {
        console.error(`  - ${table.table_name}: RLS enabled but ${table.policy_count} policies`);
      });
      
      console.error('\n💡 Fix: Add RLS policies for each table or disable RLS if not needed');
      process.exit(1);
    }
    
    const enabledTables = policyData.filter(table => table.rls_enabled);
    console.log(`✅ RLS Policy Check: ${enabledTables.length} tables with RLS all have policies`);
    
    return 0;
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  checkRLSPolicies().then(process.exit);
}

module.exports = { checkRLSPolicies };