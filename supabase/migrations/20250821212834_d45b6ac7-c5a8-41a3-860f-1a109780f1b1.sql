-- Complete Function Hardening Migration: Add SET search_path = '' to all remaining functions
-- Security Guard: Comprehensive function search path hardening for 100% coverage

DO $$
DECLARE
    r RECORD;
    func_def TEXT;
    new_def TEXT;
    func_signature TEXT;
    total_hardened INTEGER := 0;
BEGIN
    -- Log start of hardening process  
    RAISE NOTICE 'Starting comprehensive function hardening process...';
    
    -- Find and harden all functions/procedures missing SET search_path = ''
    FOR r IN
        SELECT 
            n.nspname AS schema_name,
            p.proname AS function_name,
            pg_get_function_identity_arguments(p.oid) AS args,
            p.oid,
            p.prokind AS kind,  -- 'f' = function, 'p' = procedure
            p.prosecdef AS is_security_definer,
            pg_get_userbyid(p.proowner) AS owner,
            l.lanname AS language,
            pg_get_functiondef(p.oid) AS definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_language l ON l.oid = p.prolang
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f','p')
          AND (
            p.proconfig IS NULL 
            OR NOT ('search_path=' || '' = ANY(p.proconfig))
          )
        ORDER BY p.proname
    LOOP
        -- Get current function definition
        func_def := r.definition;
        func_signature := format('%s.%s(%s)', r.schema_name, r.function_name, r.args);
        
        -- Skip if already has SET search_path = '' in definition
        IF func_def ILIKE '%SET search_path = ''''%' OR func_def ILIKE '%SET search_path TO ''''%' THEN
            CONTINUE;
        END IF;
        
        RAISE NOTICE 'Hardening function: % (Language: %, Security: %)', 
            func_signature, r.language, 
            CASE WHEN r.is_security_definer THEN 'DEFINER' ELSE 'INVOKER' END;
        
        -- Add SET search_path = '' after the LANGUAGE clause if not present
        -- This regex safely injects the search_path setting
        new_def := regexp_replace(
            func_def,
            '(LANGUAGE\s+\w+(?:\s+\w+)*)',
            E'\\1\nSET search_path = ''''',
            1, 1, 'ni'
        );
        
        -- Only proceed if we actually made a change
        IF new_def != func_def THEN
            -- Drop and recreate the function with hardening
            BEGIN
                EXECUTE new_def;
                
                -- Restore original owner
                IF r.kind = 'f' THEN
                    EXECUTE format('ALTER FUNCTION %I.%I(%s) OWNER TO %I', 
                        r.schema_name, r.function_name, r.args, r.owner);
                ELSE
                    EXECUTE format('ALTER PROCEDURE %I.%I(%s) OWNER TO %I', 
                        r.schema_name, r.function_name, r.args, r.owner);
                END IF;
                
                total_hardened := total_hardened + 1;
                
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING 'Failed to harden function %: %', func_signature, SQLERRM;
                CONTINUE;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Function hardening complete. Total functions hardened: %', total_hardened;
END;
$$;

-- Verify hardening was successful
DO $$
DECLARE
    unhardened_count INTEGER;
    total_count INTEGER;
    hardened_count INTEGER;
BEGIN
    -- Count total functions
    SELECT COUNT(*) INTO total_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p');
    
    -- Count hardened functions using both proconfig and definition check
    SELECT COUNT(*) INTO hardened_count
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
      AND (
        ('search_path=' || '' = ANY(COALESCE(p.proconfig, ARRAY[]::text[])))
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path = ''''%'
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path TO ''''%'
      );
    
    -- Count remaining unhardened
    unhardened_count := total_count - hardened_count;
    
    RAISE NOTICE 'HARDENING VERIFICATION:';
    RAISE NOTICE '  Total functions/procedures: %', total_count;
    RAISE NOTICE '  Hardened functions: %', hardened_count;
    RAISE NOTICE '  Remaining unhardened: %', unhardened_count;
    RAISE NOTICE '  Coverage: %% %', ROUND((hardened_count::NUMERIC / NULLIF(total_count, 0)) * 100, 2);
    
    IF unhardened_count = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All functions are now properly hardened!';
    ELSE
        RAISE WARNING '⚠️ WARNING: % functions still need hardening', unhardened_count;
    END IF;
END;
$$;

-- Create verification function for ongoing monitoring
CREATE OR REPLACE FUNCTION public.get_function_hardening_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    total_functions INTEGER;
    hardened_functions INTEGER;
    unhardened_list JSONB;
    result JSONB;
BEGIN
    -- Count total functions
    SELECT COUNT(*) INTO total_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p');
    
    -- Count hardened functions using both proconfig and definition check
    SELECT COUNT(*) INTO hardened_functions
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
      AND (
        ('search_path=' || '' = ANY(COALESCE(p.proconfig, ARRAY[]::text[])))
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path = ''''%'
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path TO ''''%'
      );
    
    -- Get list of unhardened functions
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'name', p.proname,
            'args', pg_get_function_identity_arguments(p.oid),
            'language', l.lanname,
            'security_definer', p.prosecdef
        )
    ), '[]'::jsonb) INTO unhardened_list
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
      AND NOT (
        ('search_path=' || '' = ANY(COALESCE(p.proconfig, ARRAY[]::text[])))
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path = ''''%'
        OR pg_get_functiondef(p.oid) ILIKE '%SET search_path TO ''''%'
      );
    
    result := jsonb_build_object(
        'total_functions', total_functions,
        'hardened_functions', hardened_functions,
        'unhardened_functions', total_functions - hardened_functions,
        'coverage_percentage', CASE 
            WHEN total_functions > 0 THEN 
                ROUND((hardened_functions::NUMERIC / total_functions) * 100, 2)
            ELSE 0 
        END,
        'unhardened_list', unhardened_list,
        'is_fully_hardened', (total_functions - hardened_functions) = 0,
        'last_checked', now()
    );
    
    RETURN result;
END;
$$;