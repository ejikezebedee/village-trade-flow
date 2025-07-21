-- Create auction system tables

-- Auction status enum
CREATE TYPE auction_status AS ENUM ('draft', 'active', 'ended', 'cancelled', 'suspended');

-- Bid increment strategy enum  
CREATE TYPE bid_increment_type AS ENUM ('fixed', 'percentage', 'dynamic');

-- Create auctions table
CREATE TABLE public.auctions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL,
    product_id UUID,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    starting_bid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    reserve_price DECIMAL(10,2),
    current_bid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bid_increment DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    bid_increment_type bid_increment_type NOT NULL DEFAULT 'fixed',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status NOT NULL DEFAULT 'draft',
    winner_id UUID,
    total_bids INTEGER NOT NULL DEFAULT 0,
    watchers_count INTEGER NOT NULL DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    location TEXT,
    shipping_details JSONB DEFAULT '{}'::jsonb,
    terms_conditions TEXT,
    auto_extend_on_bid BOOLEAN DEFAULT false,
    extension_time_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cancelled_reason TEXT,
    cancelled_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Create auction bids table
CREATE TABLE public.auction_bids (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    max_bid DECIMAL(10,2), -- For proxy bidding
    is_winning_bid BOOLEAN NOT NULL DEFAULT false,
    bid_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    invalidation_reason TEXT
);

-- Create auction watchers table (users following auctions)
CREATE TABLE public.auction_watchers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(auction_id, user_id)
);

-- Create auction notifications table
CREATE TABLE public.auction_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    notification_type TEXT NOT NULL, -- 'bid_placed', 'outbid', 'auction_won', 'auction_ended', 'auction_extended'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create auction escrow table
CREATE TABLE public.auction_escrow (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    winner_id UUID NOT NULL,
    seller_id UUID NOT NULL,
    winning_bid DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    escrow_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'funded', 'released', 'refunded', 'disputed'
    payment_intent_id TEXT,
    funded_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_auctions_seller_id ON public.auctions(seller_id);
CREATE INDEX idx_auctions_status ON public.auctions(status);
CREATE INDEX idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX idx_auctions_category ON public.auctions(category);
CREATE INDEX idx_auction_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX idx_auction_bids_bidder_id ON public.auction_bids(bidder_id);
CREATE INDEX idx_auction_bids_bid_time ON public.auction_bids(bid_time);
CREATE INDEX idx_auction_watchers_user_id ON public.auction_watchers(user_id);
CREATE INDEX idx_auction_notifications_user_id ON public.auction_notifications(user_id);

-- Enable Row Level Security
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_escrow ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Anyone can view active auctions" ON public.auctions
    FOR SELECT USING (status IN ('active', 'ended'));

CREATE POLICY "Sellers can create their own auctions" ON public.auctions
    FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update their own auctions" ON public.auctions
    FOR UPDATE USING (seller_id = auth.uid());

CREATE POLICY "Admins can manage all auctions" ON public.auctions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for auction bids
CREATE POLICY "Anyone can view auction bids" ON public.auction_bids
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can place bids" ON public.auction_bids
    FOR INSERT WITH CHECK (bidder_id = auth.uid());

CREATE POLICY "Admins can manage all bids" ON public.auction_bids
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND user_role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for auction watchers
CREATE POLICY "Users can manage their own watchlist" ON public.auction_watchers
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for auction notifications
CREATE POLICY "Users can view their own auction notifications" ON public.auction_notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create auction notifications" ON public.auction_notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for auction escrow
CREATE POLICY "Auction participants can view escrow details" ON public.auction_escrow
    FOR SELECT USING (winner_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "System can manage auction escrow" ON public.auction_escrow
    FOR ALL USING (true);

-- Functions for auction management

-- Function to calculate next minimum bid
CREATE OR REPLACE FUNCTION public.calculate_next_minimum_bid(p_auction_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
    auction_record public.auctions%ROWTYPE;
    next_bid DECIMAL;
BEGIN
    SELECT * INTO auction_record FROM public.auctions WHERE id = p_auction_id;
    
    IF auction_record.id IS NULL THEN
        RETURN 0;
    END IF;
    
    IF auction_record.current_bid = 0 THEN
        RETURN auction_record.starting_bid;
    END IF;
    
    CASE auction_record.bid_increment_type
        WHEN 'fixed' THEN
            next_bid := auction_record.current_bid + auction_record.bid_increment;
        WHEN 'percentage' THEN
            next_bid := auction_record.current_bid * (1 + auction_record.bid_increment / 100);
        WHEN 'dynamic' THEN
            -- Dynamic increment based on current bid amount
            IF auction_record.current_bid < 100 THEN
                next_bid := auction_record.current_bid + 5;
            ELSIF auction_record.current_bid < 500 THEN
                next_bid := auction_record.current_bid + 10;
            ELSIF auction_record.current_bid < 1000 THEN
                next_bid := auction_record.current_bid + 25;
            ELSE
                next_bid := auction_record.current_bid + 50;
            END IF;
        ELSE
            next_bid := auction_record.current_bid + auction_record.bid_increment;
    END CASE;
    
    RETURN next_bid;
END;
$$;

-- Function to end auction and determine winner
CREATE OR REPLACE FUNCTION public.end_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auction_record public.auctions%ROWTYPE;
    winner_bid public.auction_bids%ROWTYPE;
    result JSONB;
BEGIN
    -- Get auction details
    SELECT * INTO auction_record FROM public.auctions WHERE id = p_auction_id;
    
    IF auction_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;
    
    IF auction_record.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;
    
    -- Get the winning bid
    SELECT * INTO winner_bid 
    FROM public.auction_bids 
    WHERE auction_id = p_auction_id AND is_winning_bid = true
    ORDER BY bid_time DESC 
    LIMIT 1;
    
    -- Check if reserve price is met
    IF auction_record.reserve_price IS NOT NULL AND 
       auction_record.current_bid < auction_record.reserve_price THEN
        -- Reserve not met - cancel auction
        UPDATE public.auctions 
        SET status = 'cancelled',
            cancelled_reason = 'Reserve price not met',
            updated_at = NOW()
        WHERE id = p_auction_id;
        
        result := jsonb_build_object(
            'success', true,
            'auction_ended', true,
            'winner', null,
            'reserve_met', false,
            'final_bid', auction_record.current_bid
        );
    ELSE
        -- Auction successful
        UPDATE public.auctions 
        SET status = 'ended',
            winner_id = winner_bid.bidder_id,
            updated_at = NOW()
        WHERE id = p_auction_id;
        
        -- Create escrow transaction
        INSERT INTO public.auction_escrow (
            auction_id, winner_id, seller_id, winning_bid
        ) VALUES (
            p_auction_id, winner_bid.bidder_id, auction_record.seller_id, winner_bid.bid_amount
        );
        
        result := jsonb_build_object(
            'success', true,
            'auction_ended', true,
            'winner', winner_bid.bidder_id,
            'reserve_met', true,
            'final_bid', winner_bid.bid_amount
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to place a bid
CREATE OR REPLACE FUNCTION public.place_auction_bid(
    p_auction_id UUID,
    p_bidder_id UUID,
    p_bid_amount DECIMAL,
    p_max_bid DECIMAL DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    auction_record public.auctions%ROWTYPE;
    min_bid DECIMAL;
    bid_id UUID;
    previous_winner UUID;
    result JSONB;
BEGIN
    -- Get auction details
    SELECT * INTO auction_record FROM public.auctions WHERE id = p_auction_id;
    
    -- Validate auction
    IF auction_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction not found');
    END IF;
    
    IF auction_record.status != 'active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction is not active');
    END IF;
    
    IF auction_record.end_time < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Auction has ended');
    END IF;
    
    IF auction_record.seller_id = p_bidder_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sellers cannot bid on their own auctions');
    END IF;
    
    -- Calculate minimum bid
    min_bid := public.calculate_next_minimum_bid(p_auction_id);
    
    IF p_bid_amount < min_bid THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Bid amount must be at least ' || min_bid::TEXT,
            'minimum_bid', min_bid
        );
    END IF;
    
    -- Get current winner
    SELECT bidder_id INTO previous_winner 
    FROM public.auction_bids 
    WHERE auction_id = p_auction_id AND is_winning_bid = true;
    
    -- Mark previous winning bid as no longer winning
    UPDATE public.auction_bids 
    SET is_winning_bid = false 
    WHERE auction_id = p_auction_id AND is_winning_bid = true;
    
    -- Insert new bid
    INSERT INTO public.auction_bids (
        auction_id, bidder_id, bid_amount, max_bid, is_winning_bid
    ) VALUES (
        p_auction_id, p_bidder_id, p_bid_amount, p_max_bid, true
    ) RETURNING id INTO bid_id;
    
    -- Update auction current bid and total bids
    UPDATE public.auctions 
    SET current_bid = p_bid_amount,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE id = p_auction_id;
    
    -- Auto-extend auction if configured and bid placed in last few minutes
    IF auction_record.auto_extend_on_bid AND 
       auction_record.end_time - NOW() < INTERVAL '5 minutes' THEN
        UPDATE public.auctions 
        SET end_time = end_time + INTERVAL '5 minutes'
        WHERE id = p_auction_id;
    END IF;
    
    result := jsonb_build_object(
        'success', true,
        'bid_id', bid_id,
        'bid_amount', p_bid_amount,
        'previous_winner', previous_winner,
        'total_bids', auction_record.total_bids + 1
    );
    
    RETURN result;
END;
$$;

-- Triggers for auction notifications
CREATE OR REPLACE FUNCTION public.notify_auction_events()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Create triggers
CREATE TRIGGER auction_bid_notifications
    AFTER INSERT ON public.auction_bids
    FOR EACH ROW EXECUTE FUNCTION public.notify_auction_events();

CREATE TRIGGER auction_status_notifications
    AFTER UPDATE ON public.auctions
    FOR EACH ROW EXECUTE FUNCTION public.notify_auction_events();

-- Enable realtime for auction tables
ALTER TABLE public.auctions REPLICA IDENTITY FULL;
ALTER TABLE public.auction_bids REPLICA IDENTITY FULL;
ALTER TABLE public.auction_notifications REPLICA IDENTITY FULL;