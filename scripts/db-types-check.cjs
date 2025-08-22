#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Checking for database type drift...');

try {
  // Check if types file exists and is not empty
  const typesPath = 'src/types/database.ts';
  if (!fs.existsSync(typesPath)) {
    throw new Error('Database types file missing. Run: npm run db:types');
  }

  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Check for empty database schema (indicates types are out of sync)
  if (typesContent.includes('[_ in never]: never')) {
    throw new Error('Database types appear empty. This usually means types are out of sync with database schema. Run: npm run db:types');
  }

  // Check if file is recent (within last 7 days for development)
  const stats = fs.statSync(typesPath);
  const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSinceModified > 7) {
    console.warn('⚠️  Database types are more than 7 days old. Consider running: npm run db:types');
  }

  console.log('✅ Database types are up to date');
  
  // Verify TypeScript compilation
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    throw new Error('TypeScript compilation failed. Fix type errors before deploying.');
  }

} catch (error) {
  console.error('❌ Database type check failed:', error.message);
  process.exit(1);
}