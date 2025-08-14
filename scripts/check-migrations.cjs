#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function main() {
  console.log('🔍 Checking migration discipline...');
  
  const migrationsDir = 'supabase/migrations';
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('ℹ️  No migrations directory found, skipping checks');
    return;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('ℹ️  No migration files found, skipping checks');
    return;
  }

  console.log(`📋 Found ${migrationFiles.length} migration files`);

  let hasErrors = false;

  // Check each migration file
  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`🔍 Checking ${file}...`);

    // Check for functions without search_path protection
    const functionMatches = content.match(/CREATE(?:\s+OR\s+REPLACE)?\s+FUNCTION\s+[^(]+\([^)]*\)/gi);
    if (functionMatches) {
      for (const func of functionMatches) {
        // Look for search_path in the function definition context
        const funcStart = content.indexOf(func);
        const funcEnd = content.indexOf('$function$', funcStart + func.length);
        if (funcEnd > -1) {
          const funcBlock = content.substring(funcStart, funcEnd);
          if (!funcBlock.includes("SET search_path") && !funcBlock.includes("SECURITY DEFINER")) {
            console.warn(`⚠️  Function in ${file} may be missing search_path protection`);
          }
        }
      }
    }

    // Check for new tables without RLS policies
    const tableMatches = content.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+\.)?(\w+)/gi);
    if (tableMatches) {
      for (const table of tableMatches) {
        const tableName = table.split(/\s+/).pop().replace(/[`"]/g, '');
        if (!content.includes(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY`) && 
            !content.includes(`CREATE POLICY`)) {
          console.warn(`⚠️  New table ${tableName} in ${file} may be missing RLS policies`);
        }
      }
    }

    // Check for potentially dangerous operations
    if (content.includes('DROP TABLE') || content.includes('DROP COLUMN')) {
      console.warn(`⚠️  ${file} contains potentially destructive operations`);
    }
  }

  if (hasErrors) {
    console.error('❌ Migration validation failed');
    process.exit(1);
  }

  console.log('✅ Migration discipline checks passed');
}

main();