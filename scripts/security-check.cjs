#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 Running security checks...');

const checks = [
  {
    name: 'Environment variables validation',
    check: () => {
      const envExample = fs.readFileSync('.env.example', 'utf8');
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'NEXT_PUBLIC_DEFAULT_CURRENCY',
        'NEXT_PUBLIC_DEFAULT_LOCALE'
      ];
      
      const missing = requiredVars.filter(v => !envExample.includes(v));
      if (missing.length > 0) {
        throw new Error(`Missing required env vars in .env.example: ${missing.join(', ')}`);
      }
      return '✅ All required environment variables defined';
    }
  },
  {
    name: 'Security headers configuration', 
    check: () => {
      if (!fs.existsSync('vercel.json')) {
        throw new Error('vercel.json missing - security headers not configured');
      }
      
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      const headers = vercelConfig.headers?.[0]?.headers || [];
      
      const requiredHeaders = [
        'X-Frame-Options',
        'X-Content-Type-Options', 
        'Referrer-Policy',
        'Content-Security-Policy',
        'Strict-Transport-Security'
      ];
      
      const missing = requiredHeaders.filter(h => 
        !headers.some(header => header.key === h)
      );
      
      if (missing.length > 0) {
        throw new Error(`Missing security headers: ${missing.join(', ')}`);
      }
      
      return '✅ Security headers properly configured';
    }
  },
  {
    name: 'Default admin credentials removed',
    check: () => {
      require('./check-default-admin.cjs');
      return '✅ No default admin credentials found';
    }
  },
  {
    name: 'Environment validation module',
    check: () => {
      if (!fs.existsSync('src/lib/env.ts')) {
        throw new Error('Environment validation module missing');
      }
      return '✅ Runtime environment validation in place';
    }
  }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    const result = check.check();
    console.log(result);
    passed++;
  } catch (error) {
    console.error(`❌ ${check.name}: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Security Check Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('🎉 All security checks passed!');