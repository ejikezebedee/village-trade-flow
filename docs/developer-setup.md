# Developer Setup Guide

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd <project-name>
npm run dev:setup
npm run verify
```

## Type Generation & Sync

### How Types Are Generated

The project uses automated Supabase type generation to keep TypeScript types in sync with the database schema:

- **Database types**: Generated to `src/types/database.ts`
- **RPC types**: Generated to `src/types/rpc.ts`
- **Source**: Supabase CLI connects to your project and generates TypeScript definitions

### Commands

```bash
# Generate fresh types from Supabase
npm run db:types

# Check for type drift (fails if types are out of sync)
npm run db:types:check

# Watch for changes during development
npm run db:types:watch
```

### Type Drift Detection

Type drift occurs when the database schema changes but TypeScript types aren't updated. Our CI system automatically detects this:

1. **Local development**: Pre-commit hooks check for drift
2. **CI/CD**: Every PR/push validates types are current
3. **Detection method**: Compares committed types with fresh generation

**If you see type drift errors:**
```bash
npm run db:types
git add src/types/
git commit -m "chore: update database types"
```

## Migration Workflow

### Creating Migrations

```bash
# Generate a new migration
npm run db:diff

# Apply migrations locally
npm run db:migrate

# Reset local database (destructive)
supabase db reset --local
```

### Migration Discipline

All migrations are automatically validated for:

- **Security**: Functions must include `SET search_path = ''`
- **RLS**: New tables must have Row Level Security policies
- **Safety**: Warns about destructive operations

### Migration Guards

The CI system runs `scripts/check-migrations.cjs` to enforce:

1. All functions have proper search path protection
2. New tables include RLS policies
3. No obvious security vulnerabilities

## Environment Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Critical security notes:**
- Never commit `.env` files
- Service role keys must only be used in server environments
- Anon keys are safe for client-side use

### Local Development

```bash
# Install dependencies
npm install

# Setup Husky hooks
npx husky install

# Generate types and verify setup
npm run dev:setup

# Start development server
npm run dev
```

## Code Quality & Standards

### TypeScript Configuration

Strict mode is enforced with:
- `noImplicitAny`: Prevent implicit any types
- `noUncheckedIndexedAccess`: Safer array/object access
- `exactOptionalPropertyTypes`: Strict optional properties

### ESLint Rules

- No explicit `any` types
- Consistent type imports
- No unused variables
- Proper import patterns

### Pre-commit Hooks

Automatically runs on every commit:
1. Type drift check
2. Linting
3. Type checking
4. Migration validation

**If pre-commit fails:**
- Fix linting errors: `npm run lint:fix`
- Update types: `npm run db:types`
- Fix TypeScript errors manually

## Troubleshooting

### Type Generation Issues

```bash
# Check Supabase CLI is installed
supabase --version

# Login to Supabase
supabase login

# Verify project connection
supabase projects list
```

### Migration Problems

```bash
# View migration status
supabase migration list

# Force apply specific migration
supabase db reset --local
```

### Build Failures

```bash
# Full verification pipeline
npm run verify

# Individual checks
npm run lint
npm run typecheck
npm run test
```

## Development Workflow

1. **Pull latest**: `git pull origin main`
2. **Update types**: `npm run db:types`
3. **Make changes**: Follow TypeScript strict mode
4. **Test locally**: `npm run verify`
5. **Commit**: Pre-commit hooks validate automatically
6. **Push**: CI validates types, migrations, and tests

## Performance Tips

- Use `npm run db:types:watch` during active schema development
- Keep migrations small and focused
- Test migrations locally before pushing
- Use typed database helpers instead of raw SQL where possible