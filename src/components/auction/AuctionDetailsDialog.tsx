import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Gavel, 
  Eye, 
  Heart,
  DollarSign,
  TrendingUp,
  User,
  AlertTriangle,
  Package,
  MapPin,
  Star
} from "lucide-react";
import { BidDialog } from "./BidDialog";

interface AuctionDetailsDialogProps {
  auctionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AuctionBid {
  id: string;
  bid_amount: number;
  bid_time: string;
  bidder_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface AuctionDetails {
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
  location?: string;
  seller_id: string;
  winner_id?: string;
  shipping_details?: any;
  terms_conditions?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    rating?: number;
    total_ratings?: number;
  } | null;
}

export function AuctionDetailsDialog({ auctionId, open, onOpenChange }: AuctionDetailsDialogProps) {
  const [auction, setAuction] = useState<AuctionDetails | null>(null);
  const [bids, setBids] = useState<AuctionBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && auctionId) {
      fetchAuctionDetails();
      fetchAuctionBids();
      if (user) {
        checkWatchStatus();
      }
    }
  }, [open, auctionId, user]);

  useEffect(() => {
    if (auction) {
      const updateTimeLeft = () => {
        const now = new Date().getTime();
        const endTime = new Date(auction.end_time).getTime();
        const difference = endTime - now;

        if (difference <= 0) {
          setTimeLeft("Auction Ended");
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      };

      updateTimeLeft();
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [auction]);

  const fetchAuctionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          profiles!auctions_seller_id_fkey(first_name, last_name, rating, total_ratings)
        `)
        .eq('id', auctionId)
        .single();

      if (error) throw error;
      setAuction(data);
    } catch (error: any) {
      console.error('Error fetching auction details:', error);
      toast({
        title: "Error",
        description: "Failed to load auction details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAuctionBids = async () => {
    try {
      const { data, error } = await supabase
        .from('auction_bids')
        .select(`
          *,
          profiles!auction_bids_bidder_id_fkey(first_name, last_name)
        `)
        .eq('auction_id', auctionId)
        .eq('is_valid', true)
        .order('bid_time', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBids(data || []);
    } catch (error: any) {
      console.error('Error fetching auction bids:', error);
    }
  };

  const checkWatchStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('auction_watchers')
      .select('id')
      .eq('auction_id', auctionId)
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
          .eq('auction_id', auctionId)
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
            auction_id: auctionId,
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!auction) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <p>Auction not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canBid = user && auction.status === 'active' && auction.seller_id !== user.id;
  const isOwner = user && auction.seller_id === user.id;
  const hasReserve = auction.reserve_price && auction.reserve_price > 0;
  const reserveMet = !hasReserve || (auction.current_bid >= auction.reserve_price!);
  
  const images = Array.isArray(auction.images) ? auction.images : 
    typeof auction.images === 'string' ? [auction.images] : 
    ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{auction.title}</DialogTitle>
            <DialogDescription>
              {auction.category && (
                <Badge className="mr-2">{auction.category}</Badge>
              )}
              {auction.location && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {auction.location}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Images and Description */}
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                <img 
                  src={images[0]}
                  alt={auction.title}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
                  }}
                />
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1, 5).map((img: string, index: number) => (
                      <img 
                        key={index}
                        src={img}
                        alt={`${auction.title} ${index + 2}`}
                        className="w-full h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{auction.description}</p>
                  
                  {auction.terms_conditions && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Terms & Conditions</h4>
                      <p className="text-sm text-muted-foreground">{auction.terms_conditions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Bidding and Details */}
            <div className="space-y-6">
              {/* Current Bid Status */}
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Bid</span>
                      <Badge variant={auction.status === 'active' ? 'default' : 'outline'}>
                        {auction.status}
                      </Badge>
                    </div>
                    
                    <div className="text-3xl font-bold text-primary">
                      ${auction.current_bid.toFixed(2)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Starting Bid:</span>
                        <div className="font-medium">${auction.starting_bid.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Bids:</span>
                        <div className="font-medium flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {auction.total_bids}
                        </div>
                      </div>
                    </div>

                    {hasReserve && (
                      <div className="p-3 rounded-lg border">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Reserve Price:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">${auction.reserve_price!.toFixed(2)}</span>
                            {reserveMet ? (
                              <Badge className="bg-secondary text-secondary-foreground text-xs">Met</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-amber-600 border-amber-600">
                                Not Met
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{timeLeft}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {auction.watchers_count} watching
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {canBid && (
                        <Button 
                          className="w-full apple-button bg-primary hover:bg-primary/90"
                          onClick={() => setShowBidDialog(true)}
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Place Bid
                        </Button>
                      )}
                      
                      {user && !isOwner && (
                        <Button 
                          variant="outline"
                          className="w-full apple-button"
                          onClick={toggleWatch}
                        >
                          <Heart className={`h-4 w-4 mr-2 ${isWatching ? "fill-red-500 text-red-500" : ""}`} />
                          {isWatching ? "Remove from Watchlist" : "Add to Watchlist"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Seller Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {auction.profiles?.first_name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {auction.profiles?.first_name} {auction.profiles?.last_name}
                      </p>
                      {auction.profiles?.rating && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {auction.profiles.rating.toFixed(1)} 
                          ({auction.profiles.total_ratings || 0} reviews)
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bid History */}
              <Card>
                <CardHeader>
                  <CardTitle>Bid History</CardTitle>
                </CardHeader>
                <CardContent>
                  {bids.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No bids placed yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {bids.map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                              {index === 0 ? "Winning" : `#${index + 1}`}
                            </Badge>
                            <span className="font-medium">
                              {bid.profiles?.first_name} {bid.profiles?.last_name?.charAt(0)}.
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${bid.bid_amount.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(bid.bid_time).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bid Dialog */}
      <BidDialog
        auction={auction}
        open={showBidDialog}
        onOpenChange={setShowBidDialog}
      />
    </>
  );
}