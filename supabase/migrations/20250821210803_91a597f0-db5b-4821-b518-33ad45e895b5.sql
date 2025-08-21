-- =====================================================================
-- FUNCTION HARDENING - ALTER APPROACH
-- =====================================================================
-- Use ALTER FUNCTION to add SET search_path = '' to existing functions
-- without changing their signatures or return types

-- Harden all remaining functions using ALTER FUNCTION approach where possible

-- Update functions that already exist and are properly working
DO $$
DECLARE
    func_record RECORD;
    func_signature TEXT;
BEGIN
    -- Get all functions in public schema that don't have search_path set
    FOR func_record IN 
        SELECT n.nspname as schema_name,
               p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as args,
               p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.prokind IN ('f','p')
          AND NOT (pg_get_functiondef(p.oid) LIKE '%SET search_path = %')
          AND p.proname NOT IN (
            'admin_get_audit_logs',
            'admin_set_user_role', 
            'advance_order_stages',
            'auto_categorize_product',
            'auto_categorize_ticket',
            'check_rate_limit_enhanced'
          ) -- Skip functions we've already tried to modify
    LOOP
        BEGIN
            func_signature := func_record.schema_name || '.' || func_record.function_name;
            IF func_record.args != '' THEN
                func_signature := func_signature || '(' || func_record.args || ')';
            ELSE 
                func_signature := func_signature || '()';
            END IF;
            
            -- Try to alter the function to add search_path
            EXECUTE 'ALTER FUNCTION ' || func_signature || ' SET search_path = ''''';
            
            RAISE NOTICE 'Successfully hardened function: %', func_signature;
            
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not alter function %: %', func_signature, SQLERRM;
                CONTINUE;
        END;
    END LOOP;
END $$;

-- Now manually recreate the specific functions that need signature changes
-- These are the ones that failed before due to return type/parameter changes

-- Update remaining core trigger functions
CREATE OR REPLACE FUNCTION public.handle_new_user_role_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles_progression (user_id, user_role)
  VALUES (NEW.user_id, COALESCE(NEW.user_type, 'buyer'))
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_unique_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Only generate if unique_user_id is null
  IF NEW.unique_user_id IS NULL THEN
    NEW.unique_user_id := public.generate_unique_user_id();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.hash_password(password text, salt text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    hashed_password TEXT;
    password_salt TEXT;
BEGIN
    -- Generate salt if not provided
    IF salt IS NULL THEN
        password_salt := encode(gen_random_bytes(32), 'base64');
    ELSE
        password_salt := salt;
    END IF;
    
    -- Create hash using SHA-256 with salt
    hashed_password := encode(digest(password || password_salt, 'sha256'), 'hex');
    
    RETURN jsonb_build_object(
        'hash', hashed_password,
        'salt', password_salt
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.invalidate_user_sessions_on_password_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Invalidate all active sessions when password changes
  UPDATE public.user_sessions 
  SET is_active = false, 
      expires_at = now()
  WHERE user_id = NEW.id 
    AND is_active = true;
    
  -- Log the security event
  INSERT INTO public.security_audit (
    event_type, user_id, event_data, severity
  ) VALUES (
    'password_changed', 
    NEW.id, 
    jsonb_build_object('sessions_invalidated', true),
    'warning'
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_access_attempt(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_authorized boolean;
  current_user_id uuid;
  user_role_value text;
BEGIN
  current_user_id := auth.uid();
  is_authorized := public.is_security_admin();
  
  -- Get user role safely
  SELECT user_role INTO user_role_value 
  FROM public.profiles 
  WHERE user_id = current_user_id;
  
  -- Log all attempts to access audit tables
  INSERT INTO public.security_audit (
    event_type,
    user_id,
    event_data,
    severity
  ) VALUES (
    'audit_log_access_attempt',
    current_user_id,
    jsonb_build_object(
      'table_name', p_table_name,
      'authorized', is_authorized,
      'user_role', user_role_value,
      'timestamp', now()
    ),
    CASE WHEN is_authorized THEN 'info' ELSE 'critical' END
  );
  
  -- If unauthorized access attempted, create immediate alert
  IF NOT is_authorized AND current_user_id IS NOT NULL THEN
    INSERT INTO public.security_audit (
      event_type,
      user_id,
      event_data,
      severity
    ) VALUES (
      'unauthorized_audit_access',
      current_user_id,
      jsonb_build_object(
        'table_name', p_table_name,
        'user_role', user_role_value,
        'timestamp', now(),
        'alert', 'CRITICAL: Unauthorized attempt to access security audit logs'
      ),
      'critical'
    );
  END IF;
  
  RETURN is_authorized;
END;
$$;

-- Continue with more trigger functions
CREATE OR REPLACE FUNCTION public.notify_auction_events()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    auction_record public.auctions%ROWTYPE;
    notification_data JSONB;
BEGIN
    IF TG_TABLE_NAME = 'auction_bids' AND TG_OP = 'INSERT' THEN
        -- Get auction details
        SELECT * INTO auction_record FROM public.auctions WHERE id = NEW.auction_id;
        
        notification_data := jsonb_build_object(
            'auction_id', NEW.auction_id,
            'bid_amount', NEW.bid_amount,
            'auction_title', auction_record.title
        );
        
        -- Notify seller of new bid
        INSERT INTO public.auction_notifications (
            auction_id, user_id, notification_type, title, message, data
        ) VALUES (
            NEW.auction_id,
            auction_record.seller_id,
            'bid_placed',
            'New Bid on Your Auction',
            'A new bid of $' || NEW.bid_amount || ' was placed on ' || auction_record.title,
            notification_data
        );
        
        -- Notify watchers of new bid
        INSERT INTO public.auction_notifications (
            auction_id, user_id, notification_type, title, message, data
        )
        SELECT 
            NEW.auction_id,
            aw.user_id,
            'bid_placed',
            'New Bid on Watched Auction',
            'A new bid of $' || NEW.bid_amount || ' was placed on ' || auction_record.title,
            notification_data
        FROM public.auction_watchers aw
        WHERE aw.auction_id = NEW.auction_id 
        AND aw.user_id != NEW.bidder_id;
        
    ELSIF TG_TABLE_NAME = 'auctions' AND TG_OP = 'UPDATE' THEN
        notification_data := jsonb_build_object(
            'auction_id', NEW.id,
            'auction_title', NEW.title
        );
        
        -- Auction ended
        IF OLD.status = 'active' AND NEW.status = 'ended' THEN
            -- Notify winner
            IF NEW.winner_id IS NOT NULL THEN
                INSERT INTO public.auction_notifications (
                    auction_id, user_id, notification_type, title, message, data
                ) VALUES (
                    NEW.id,
                    NEW.winner_id,
                    'auction_won',
                    'Congratulations! You Won the Auction',
                    'You won the auction for ' || NEW.title || ' with a bid of $' || NEW.current_bid,
                    notification_data || jsonb_build_object('winning_bid', NEW.current_bid)
                );
            END IF;
            
            -- Notify seller
            INSERT INTO public.auction_notifications (
                auction_id, user_id, notification_type, title, message, data
            ) VALUES (
                NEW.id,
                NEW.seller_id,
                'auction_ended',
                'Your Auction Has Ended',
                'Your auction for ' || NEW.title || ' has ended' || 
                CASE WHEN NEW.winner_id IS NOT NULL 
                     THEN ' with a winning bid of $' || NEW.current_bid
                     ELSE ' without meeting the reserve price'
                END,
                notification_data
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;