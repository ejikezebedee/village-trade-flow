import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url('Invalid API base URL').optional(),
  NEXT_PUBLIC_OPENAPI_URL: z.string().url('Invalid OpenAPI URL').optional(),
  NEXT_PUBLIC_DEFAULT_CURRENCY: z.string().default('NGN'),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
});

function getEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      NEXT_PUBLIC_OPENAPI_URL: import.meta.env.VITE_OPENAPI_URL,
      NEXT_PUBLIC_DEFAULT_CURRENCY: import.meta.env.VITE_DEFAULT_CURRENCY || 'NGN',
      NEXT_PUBLIC_DEFAULT_LOCALE: import.meta.env.VITE_DEFAULT_LOCALE || 'en',
    });
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    throw new Error('Environment validation failed. Check your environment variables.');
  }
}

export const env = getEnv();