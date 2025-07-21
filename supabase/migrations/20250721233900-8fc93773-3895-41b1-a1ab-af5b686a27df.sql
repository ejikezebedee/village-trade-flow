-- Add foreign key constraints for profiles relationships
ALTER TABLE public.auctions 
ADD CONSTRAINT auctions_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.auction_bids 
ADD CONSTRAINT auction_bids_bidder_id_fkey 
FOREIGN KEY (bidder_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key constraint for auction relationship
ALTER TABLE public.auction_bids 
ADD CONSTRAINT auction_bids_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

ALTER TABLE public.auction_watchers 
ADD CONSTRAINT auction_watchers_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

ALTER TABLE public.auction_watchers 
ADD CONSTRAINT auction_watchers_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.auction_notifications 
ADD CONSTRAINT auction_notifications_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

ALTER TABLE public.auction_notifications 
ADD CONSTRAINT auction_notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.auction_escrow 
ADD CONSTRAINT auction_escrow_auction_id_fkey 
FOREIGN KEY (auction_id) REFERENCES public.auctions(id) ON DELETE CASCADE;

ALTER TABLE public.auction_escrow 
ADD CONSTRAINT auction_escrow_seller_id_fkey 
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.auction_escrow 
ADD CONSTRAINT auction_escrow_winner_id_fkey 
FOREIGN KEY (winner_id) REFERENCES auth.users(id) ON DELETE CASCADE;