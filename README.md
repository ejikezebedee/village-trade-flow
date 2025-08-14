# VillageMarket - Secure Marketplace Platform

A comprehensive marketplace platform built with React, TypeScript, and Supabase with enterprise-grade security hardening.

## Quick Start

```bash
# Setup development environment
npm run dev:setup

# Verify everything works
npm run verify

# Start development server
npm run dev
```

## Development Workflow

### Type-Safe Database Access

This project maintains perfect sync between Supabase schema and TypeScript types:

```bash
# Generate fresh types from database
npm run db:types

# Check for type drift (CI enforced)
npm run db:types:check
```

### Migration Discipline

All database changes are validated for security:

```bash
# Create new migration
npm run db:diff

# Validate migration security
npm run db:migrations:check
```

### CI/CD Pipeline

- ✅ **Type Drift Detection**: Fails if DB types are out of sync
- ✅ **Migration Validation**: Ensures RLS policies and search_path protection
- ✅ **Security Testing**: Comprehensive security test suite
- ✅ **Strict TypeScript**: No `any` types allowed

## Documentation

- [Developer Setup](./docs/developer-setup.md) - Complete setup guide
- [Architecture](./docs/architecture.md) - System architecture and patterns  
- [Security](./docs/security.md) - Security implementation details

## Local Development

### How to run locally
```bash
npm run dev:setup && npm run verify
```

### How CI enforces type/migration discipline
- Pre-commit hooks validate types and migrations
- CI fails on type drift or insecure migrations
- Automated security testing on every PR

### Where generated types live
- **Database types**: `src/types/database.ts`
- **RPC types**: `src/types/rpc.ts`

Built with enterprise security standards and strict type safety.