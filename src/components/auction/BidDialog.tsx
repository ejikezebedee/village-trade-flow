import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Gavel, TrendingUp, AlertTriangle } from "lucide-react";

interface Auction {
  id: string;
  title: string;
  current_bid: number;
  reserve_price?: number;
  total_bids: number;
  end_time: string;
}

interface BidDialogProps {
  auction: Auction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BidDialog({ auction, open, onOpenChange }: BidDialogProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimumBid, setMinimumBid] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMinimumBid();
      setBidAmount("");
    }
  }, [open, auction.id]);

  const fetchMinimumBid = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_next_minimum_bid', {
        p_auction_id: auction.id
      });

      if (error) throw error;
      setMinimumBid(data);
      setBidAmount(data.toString());
    } catch (error: any) {
      console.error('Error fetching minimum bid:', error);
      // Fallback calculation
      const nextBid = auction.current_bid > 0 ? auction.current_bid + 1 : auction.current_bid + 1;
      setMinimumBid(nextBid);
      setBidAmount(nextBid.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to place a bid",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(bidAmount);
    
    if (isNaN(amount) || amount < minimumBid) {
      toast({
        title: "Invalid bid amount",
        description: `Minimum bid is $${minimumBid.toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('place-auction-bid', {
        body: {
          auction_id: auction.id,
          bid_amount: amount
        }
      });

      if (error) throw error;

      if (!data.success) {
        toast({
          title: "Bid failed",
          description: data.error || "Failed to place bid",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Bid placed successfully!",
        description: `Your bid of $${amount.toFixed(2)} has been placed`
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error placing bid:', error);
      toast({
        title: "Error",
        description: "Failed to place bid. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const timeLeft = () => {
    const now = new Date().getTime();
    const endTime = new Date(auction.end_time).getTime();
    const difference = endTime - now;

    if (difference <= 0) return "Auction Ended";

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const hasReserve = auction.reserve_price && auction.reserve_price > 0;
  const reserveMet = !hasReserve || (auction.current_bid >= auction.reserve_price!);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Place Bid
          </DialogTitle>
          <DialogDescription>
            {auction.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Auction Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Bid:</span>
              <span className="font-semibold text-lg">${auction.current_bid.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Bids:</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-sm">{auction.total_bids}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Time Left:</span>
              <Badge variant="outline" className="text-xs">
                {timeLeft()}
              </Badge>
            </div>

            {hasReserve && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reserve:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">${auction.reserve_price!.toFixed(2)}</span>
                  {reserveMet ? (
                    <Badge className="bg-secondary text-secondary-foreground text-xs">Met</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                      Not Met
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reserve Warning */}
          {hasReserve && !reserveMet && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Reserve price not yet met</p>
                <p className="text-xs">The seller has set a minimum price of ${auction.reserve_price!.toFixed(2)}. If this amount isn't reached, the auction may be cancelled.</p>
              </div>
            </div>
          )}

          {/* Bid Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bidAmount">Your Bid Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={minimumBid}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-10"
                  placeholder={`Minimum: $${minimumBid.toFixed(2)}`}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimum bid: ${minimumBid.toFixed(2)}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="apple-button bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Placing Bid..." : "Place Bid"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}