#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TYPES_FILE = 'src/types/database.ts';
const TEMP_TYPES_FILE = 'src/types/database.ts.tmp';

function main() {
  console.log('🔍 Checking for Supabase type drift...');
  
  // Check if types file exists
  if (!fs.existsSync(TYPES_FILE)) {
    console.error(`❌ Types file ${TYPES_FILE} does not exist. Run 'npm run db:types' first.`);
    process.exit(1);
  }

  try {
    // Generate fresh types to temp file
    const projectId = process.env.SUPABASE_PROJECT_ID;
    if (!projectId) {
      console.error('❌ SUPABASE_PROJECT_ID environment variable is required');
      process.exit(1);
    }

    console.log('📦 Generating fresh types...');
    execSync(`supabase gen types typescript --project-id ${projectId} > ${TEMP_TYPES_FILE}`, {
      stdio: 'inherit'
    });

    // Compare files
    const currentTypes = fs.readFileSync(TYPES_FILE, 'utf8');
    const freshTypes = fs.readFileSync(TEMP_TYPES_FILE, 'utf8');

    // Clean up temp file
    fs.unlinkSync(TEMP_TYPES_FILE);

    if (currentTypes.trim() !== freshTypes.trim()) {
      console.error('❌ Type drift detected! Database schema has changed.');
      console.error('   Run "npm run db:types" to update types and commit the changes.');
      process.exit(1);
    }

    console.log('✅ No type drift detected. Types are in sync!');
  } catch (error) {
    // Clean up temp file if it exists
    if (fs.existsSync(TEMP_TYPES_FILE)) {
      fs.unlinkSync(TEMP_TYPES_FILE);
    }
    
    console.error('❌ Error checking type drift:', error.message);
    process.exit(1);
  }
}

main();