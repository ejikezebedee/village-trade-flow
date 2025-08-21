-- Fix Security Linter Issues: Address remaining security warnings
-- Part 1: Fix RLS tables without policies and remaining function hardening

-- Add missing RLS policies for tables that have RLS enabled but no policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Check for tables with RLS enabled but no policies
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE pt.schemaname = 'public' 
          AND c.relrowsecurity = true
          AND NOT EXISTS (
            SELECT 1 FROM pg_policies pp 
            WHERE pp.schemaname = pt.schemaname 
            AND pp.tablename = pt.tablename
          )
    LOOP
        RAISE NOTICE 'Found table with RLS but no policies: %.%', r.schemaname, r.tablename;
        
        -- Add basic restrictive policy for tables without policies
        EXECUTE format(
            'CREATE POLICY "Default restrictive policy" ON %I.%I FOR ALL USING (false)',
            r.schemaname, r.tablename
        );
        
        RAISE NOTICE 'Added restrictive policy to %.%', r.schemaname, r.tablename;
    END LOOP;
END;
$$;

-- Convert Security Definer views to Security Invoker where safe
-- First identify security definer views
DO $$
DECLARE
    v_name text;
    v_definition text;
BEGIN
    FOR v_name IN 
        SELECT viewname FROM pg_views 
        WHERE schemaname = 'public'
        AND definition ILIKE '%SECURITY DEFINER%'
    LOOP
        -- Get view definition
        SELECT definition INTO v_definition 
        FROM pg_views 
        WHERE schemaname = 'public' AND viewname = v_name;
        
        RAISE NOTICE 'Converting Security Definer view: %', v_name;
        
        -- Drop and recreate as Security Invoker (default)
        EXECUTE format('DROP VIEW IF EXISTS public.%I', v_name);
        
        -- Recreate without SECURITY DEFINER (defaults to INVOKER)
        v_definition := regexp_replace(v_definition, 'SECURITY\s+DEFINER', '', 'gi');
        EXECUTE format('CREATE VIEW public.%I AS %s', v_name, v_definition);
        
        RAISE NOTICE 'Converted view % to Security Invoker', v_name;
    END LOOP;
END;
$$;

-- Additional function hardening for any missed functions
DO $$
DECLARE
    r RECORD;
    func_def TEXT;
    new_def TEXT;
BEGIN
    -- Double-check for any remaining unhardened functions
    FOR r IN
        SELECT 
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f','p')
          AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%'
    LOOP
        func_def := r.definition;
        
        -- Add SET search_path = '' if missing
        new_def := regexp_replace(
            func_def,
            '(\$\$|\s+)$',
            E'\nSET search_path = '''';\\1',
            1, 1, 'n'
        );
        
        IF new_def != func_def THEN
            EXECUTE new_def;
            RAISE NOTICE 'Additional hardening applied to: %(%)', r.function_name, r.args;
        END IF;
    END LOOP;
END;
$$;

-- Create function to check and report security status
CREATE OR REPLACE FUNCTION public.get_comprehensive_security_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result jsonb;
    tables_without_policies integer;
    security_definer_views integer;
    unhardened_functions integer;
    total_functions integer;
BEGIN
    -- Count tables with RLS but no policies
    SELECT COUNT(*) INTO tables_without_policies
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE pt.schemaname = 'public' 
      AND c.relrowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies pp 
        WHERE pp.schemaname = pt.schemaname 
        AND pp.tablename = pt.tablename
      );
    
    -- Count security definer views
    SELECT COUNT(*) INTO security_definer_views
    FROM pg_views 
    WHERE schemaname = 'public'
      AND definition ILIKE '%SECURITY DEFINER%';
    
    -- Count total and unhardened functions
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p');
    
    SELECT COUNT(*) INTO unhardened_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
      AND pg_get_functiondef(p.oid) NOT ILIKE '%SET search_path%';
    
    result := jsonb_build_object(
        'tables_without_policies', tables_without_policies,
        'security_definer_views', security_definer_views,
        'unhardened_functions', unhardened_functions,
        'total_functions', total_functions,
        'function_hardening_percentage', 
            CASE WHEN total_functions > 0 
                 THEN ROUND(((total_functions - unhardened_functions)::numeric / total_functions) * 100, 2)
                 ELSE 100.0 
            END,
        'security_score', 
            CASE WHEN tables_without_policies = 0 AND security_definer_views = 0 AND unhardened_functions = 0
                 THEN 100
                 ELSE GREATEST(0, 100 - (tables_without_policies * 10) - (security_definer_views * 15) - (unhardened_functions * 5))
            END,
        'last_checked', now()
    );
    
    RETURN result;
END;
$$;