import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Clock, 
  Gavel, 
  Eye, 
  Heart,
  DollarSign,
  TrendingUp,
  User,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BidDialog } from "./BidDialog";
import { AuctionDetailsDialog } from "./AuctionDetailsDialog";

interface Auction {
  id: string;
  title: string;
  description: string;
  starting_bid: number;
  current_bid: number;
  reserve_price?: number;
  end_time: string;
  status: string;
  total_bids: number;
  watchers_count: number;
  images: any;
  category?: string;
  seller_id: string;
  winner_id?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isWatching, setIsWatching] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const endTime = new Date(auction.end_time).getTime();
      const difference = endTime - now;

      if (difference <= 0) {
        setTimeLeft("Auction Ended");
        setIsEnded(true);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    updateTimeLeft();
    const timer = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [auction.end_time]);

  useEffect(() => {
    if (user) {
      checkWatchStatus();
    }
  }, [user, auction.id]);

  const checkWatchStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('auction_watchers')
      .select('id')
      .eq('auction_id', auction.id)
      .eq('user_id', user.id)
      .single();

    setIsWatching(!!data);
  };

  const toggleWatch = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to watch auctions",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isWatching) {
        const { error } = await supabase
          .from('auction_watchers')
          .delete()
          .eq('auction_id', auction.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsWatching(false);
        toast({
          title: "Removed from watchlist",
          description: "You will no longer receive notifications for this auction"
        });
      } else {
        const { error } = await supabase
          .from('auction_watchers')
          .insert({
            auction_id: auction.id,
            user_id: user.id
          });

        if (error) throw error;
        setIsWatching(true);
        toast({
          title: "Added to watchlist",
          description: "You'll receive notifications when someone bids on this auction"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = () => {
    if (auction.status === 'active' && !isEnded) {
      return <Badge className="bg-secondary text-secondary-foreground">Active</Badge>;
    } else if (auction.status === 'ended' || isEnded) {
      return <Badge variant="outline" className="border-muted-foreground">Ended</Badge>;
    } else if (auction.status === 'cancelled') {
      return <Badge variant="destructive">Cancelled</Badge>;
    }
    return <Badge variant="secondary">{auction.status}</Badge>;
  };

  const canBid = user && auction.status === 'active' && !isEnded && auction.seller_id !== user.id;
  const isOwner = user && auction.seller_id === user.id;
  const hasReserve = auction.reserve_price && auction.reserve_price > 0;
  const reserveMet = !hasReserve || (auction.current_bid >= auction.reserve_price!);

  const mainImage = Array.isArray(auction.images) && auction.images.length > 0 
    ? auction.images[0] 
    : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";

  return (
    <>
      <Card className="apple-card group overflow-hidden">
        {/* Image */}
        <div className="relative">
          <img 
            src={mainImage}
            alt={auction.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
            }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            {getStatusBadge()}
          </div>

          {/* Watch Button */}
          {user && !isOwner && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full"
              onClick={toggleWatch}
            >
              <Heart className={`h-4 w-4 ${isWatching ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          )}

          {/* Category */}
          {auction.category && (
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-background/90 text-foreground border-0 text-xs">
                {auction.category}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-6 space-y-4">
          {/* Title and Description */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight tracking-tight line-clamp-1">
              {auction.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {auction.description}
            </p>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {auction.profiles?.first_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {auction.profiles?.first_name} {auction.profiles?.last_name}
            </span>
          </div>

          {/* Bid Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Bid</p>
                <p className="text-xl font-semibold text-foreground">
                  ${auction.current_bid.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Starting</p>
                <p className="text-sm text-muted-foreground">
                  ${auction.starting_bid.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Reserve Price Warning */}
            {hasReserve && !reserveMet && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs">Reserve not met</span>
              </div>
            )}

            {/* Time Left */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {timeLeft}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                {auction.total_bids} bids
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 apple-button"
              onClick={() => setShowDetailsDialog(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
            
            {canBid && (
              <Button 
                className="flex-1 apple-button bg-primary hover:bg-primary/90"
                onClick={() => setShowBidDialog(true)}
              >
                <Gavel className="h-4 w-4 mr-2" />
                Place Bid
              </Button>
            )}
          </div>

          {/* Owner Actions */}
          {isOwner && auction.status === 'active' && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                Your auction • {auction.watchers_count} watchers
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BidDialog
        auction={auction}
        open={showBidDialog}
        onOpenChange={setShowBidDialog}
      />
      
      <AuctionDetailsDialog
        auctionId={auction.id}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </>
  );
}