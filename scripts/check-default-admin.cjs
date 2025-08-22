#!/usr/bin/env node

/**
 * Security Check: Detect Default Admin Credentials
 * 
 * This script scans the repository for hardcoded admin credentials
 * like "admin123", "admin/admin", or other insecure defaults.
 * 
 * Used in CI to prevent deployment with admin backdoors.
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate insecure admin credentials
const DANGEROUS_PATTERNS = [
  /admin123/gi,
  /password.*admin/gi,
  /admin.*password/gi,
  /default.*admin/gi,
  /admin.*admin/gi,
  /hardcoded.*admin/gi,
  /static.*credential/gi,
  /fallback.*auth/gi,
  /"admin".*"admin"/gi,
  /username.*admin.*password/gi
];

// Files to exclude from scanning
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage'
];

const EXCLUDED_FILES = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.woff', '.woff2', '.ttf', '.eot',
  '.mp4', '.webm', '.ogg', '.mp3', '.wav',
  '.zip', '.tar', '.gz'
];

function shouldSkipPath(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Skip excluded directories
  if (EXCLUDED_DIRS.some(dir => relativePath.includes(dir))) {
    return true;
  }
  
  // Skip binary files
  if (EXCLUDED_FILES.some(ext => filePath.toLowerCase().endsWith(ext))) {
    return true;
  }
  
  return false;
}

function scanFile(filePath) {
  if (shouldSkipPath(filePath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    DANGEROUS_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const lines = content.split('\n');
        matches.forEach(match => {
          const lineIndex = lines.findIndex(line => line.includes(match));
          issues.push({
            file: filePath,
            line: lineIndex + 1,
            match: match,
            pattern: pattern.toString(),
            severity: 'CRITICAL'
          });
        });
      }
    });
    
    return issues;
  } catch (error) {
    // Skip files that can't be read as text
    return [];
  }
}

function scanDirectory(dirPath) {
  const issues = [];
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!shouldSkipPath(fullPath)) {
          issues.push(...scanDirectory(fullPath));
        }
      } else if (entry.isFile()) {
        issues.push(...scanFile(fullPath));
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
  }
  
  return issues;
}

function main() {
  console.log('🔍 Scanning for hardcoded admin credentials...\n');
  
  const issues = scanDirectory(process.cwd());
  
  if (issues.length === 0) {
    console.log('✅ No hardcoded admin credentials found.');
    console.log('✅ Security check passed: No default admin backdoors detected.\n');
    process.exit(0);
  }
  
  console.error('🚨 SECURITY VIOLATION: Hardcoded admin credentials detected!\n');
  
  issues.forEach((issue, index) => {
    console.error(`${index + 1}. ${issue.severity}: ${issue.file}:${issue.line}`);
    console.error(`   Pattern: ${issue.pattern}`);
    console.error(`   Match: "${issue.match}"`);
    console.error('');
  });
  
  console.error('❌ SECURITY CHECK FAILED');
  console.error('❌ Remove all hardcoded admin credentials before deployment');
  console.error('❌ Admin access must be via Supabase Auth + role verification only\n');
  
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile, DANGEROUS_PATTERNS };