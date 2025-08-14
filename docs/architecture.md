# Architecture Documentation

## Data Access Layer

### Type-Safe Database Access

All database interactions must use generated TypeScript types from `src/types/database.ts`:

```typescript
// ✅ Correct - Use generated types
import type { Database } from '@/types/database'
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

// ❌ Incorrect - Shadow interfaces are forbidden
interface Profile {
  id: string
  name: string
  // ... manual type definition
}
```

### Required Patterns

#### Table Operations
```typescript
// Select with proper typing
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .returns<Database['public']['Tables']['profiles']['Row'][]>()

// Insert with type validation
const profileData: Database['public']['Tables']['profiles']['Insert'] = {
  user_id: userId,
  display_name: name
}
```

#### RPC Functions
```typescript
import type { FunctionArgs, FunctionReturns } from '@/types/rpc'

// Type-safe RPC calls
const args: FunctionArgs<'my_function'> = { param1: 'value' }
const { data } = await supabase.rpc('my_function', args)
// data is automatically typed as FunctionReturns<'my_function'>
```

### Database Security Requirements

#### Row Level Security (RLS)
Every table must have RLS enabled with appropriate policies:

```sql
-- Required for all tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Example policies
CREATE POLICY "Users can view their own data" 
ON table_name FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" 
ON table_name FOR UPDATE 
USING (auth.uid() = user_id);
```

#### Function Security
All database functions must include search path protection:

```sql
-- ✅ Required pattern
CREATE OR REPLACE FUNCTION my_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Function body
END;
$$;

-- ❌ Forbidden - missing search_path protection
CREATE OR REPLACE FUNCTION unsafe_function()
RETURNS void
AS $$
  -- Vulnerable to search_path attacks
$$;
```

## Component Architecture

### Type Integration

Components must use database types directly:

```typescript
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface ProductCardProps {
  product: Product  // Direct database type usage
  onSelect?: (product: Product) => void
}

// ❌ Avoid prop drilling without types
interface ProductCardProps {
  id: string
  name: string
  price: number
  // ... manually maintained props
}
```

### Data Fetching Patterns

```typescript
// Custom hooks with proper typing
function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .returns<Product[]>()
      
      if (data) setProducts(data)
    }
    
    fetchProducts()
  }, [])
  
  return { products }
}
```

## Security Architecture

### Authentication Flow
1. User authenticates via Supabase Auth
2. JWT tokens contain user UUID
3. RLS policies enforce data access using `auth.uid()`
4. No direct user data exposure

### Authorization Patterns
```sql
-- Role-based access
CREATE POLICY "Admins can manage all" 
ON sensitive_table FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND user_role = 'admin'
  )
);

-- Resource ownership
CREATE POLICY "Users own their resources" 
ON user_resources FOR ALL 
USING (owner_id = auth.uid());
```

### Edge Function Security
```typescript
// Required headers for all edge functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff'
}

// Authentication validation
const jwt = req.headers.get('authorization')?.replace('Bearer ', '')
const { data: { user }, error } = await supabase.auth.getUser(jwt)
if (error || !user) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Performance Considerations

### Database Optimization
- Use proper indexes on frequently queried columns
- Implement pagination for large datasets
- Cache static data appropriately
- Monitor RLS policy performance

### Type Generation Performance
- Types are generated only when schema changes
- CI caches node_modules for faster builds
- Local development uses watch mode for instant updates

## Migration Strategy

### Schema Evolution
1. **Additive changes**: Add columns with defaults
2. **Breaking changes**: Use feature flags and gradual rollout
3. **Data migrations**: Separate from schema migrations
4. **Rollback plan**: Always have a rollback strategy

### Type Synchronization
1. Schema changes automatically trigger type regeneration
2. CI fails if types are out of sync
3. Pre-commit hooks prevent drift
4. Development workflow enforces type updates

## Testing Architecture

### Database Testing
```typescript
// Use generated types in tests
import type { Database } from '@/types/database'

describe('User Profile', () => {
  it('should create profile with correct types', async () => {
    const profileData: Database['public']['Tables']['profiles']['Insert'] = {
      user_id: testUserId,
      display_name: 'Test User'
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single()
    
    expect(error).toBeNull()
    expect(data).toMatchObject(profileData)
  })
})
```

### Security Testing
- RLS policy validation
- Search path protection verification
- Input sanitization tests
- Authentication flow testing

## Deployment Pipeline

### CI/CD Flow
1. **Type Generation**: Fresh types from current schema
2. **Drift Detection**: Fail if types are outdated
3. **Migration Validation**: Security and safety checks
4. **Linting & Type Checking**: Code quality enforcement
5. **Testing**: Comprehensive test suite
6. **Security Audit**: Dependency and code scanning
7. **Build**: Production-ready application

### Environment Promotion
- **Development**: Local Supabase instance
- **Staging**: Shared staging database
- **Production**: Isolated production environment

Each environment maintains its own type generation to ensure consistency.