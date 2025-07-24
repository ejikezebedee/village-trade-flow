import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AuctionCard } from "@/components/auction/AuctionCard";
import { CreateAuctionDialog } from "@/components/auction/CreateAuctionDialog";
import { AuctionFilters } from "@/components/auction/AuctionFilters";
import { Clock, Gavel, TrendingUp, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

export default function AuctionPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("end_time");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAuctions();
    
    // Set up real-time subscription for auction updates
    const auctionChannel = supabase
      .channel('auction-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'auctions'
      }, (payload) => {
        console.log('Auction update:', payload);
        fetchAuctions();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'auction_bids'
      }, (payload) => {
        console.log('Bid update:', payload);
        fetchAuctions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(auctionChannel);
    };
  }, [activeTab, categoryFilter, sortBy]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('auctions')
        .select('*');

      // Filter by tab
      if (activeTab === "active") {
        query = query.eq('status', 'active');
      } else if (activeTab === "ending_soon") {
        query = query
          .eq('status', 'active')
          .gte('end_time', new Date().toISOString())
          .lte('end_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      } else if (activeTab === "my_auctions" && user) {
        query = query.eq('seller_id', user.id);
      } else if (activeTab === "my_bids" && user) {
        // Get auctions where user has placed bids
        const { data: bidAuctions } = await supabase
          .from('auction_bids')
          .select('auction_id')
          .eq('bidder_id', user.id);
        
        const auctionIds = bidAuctions?.map(b => b.auction_id) || [];
        if (auctionIds.length > 0) {
          query = query.in('id', auctionIds);
        } else {
          setAuctions([]);
          setLoading(false);
          return;
        }
      } else {
        query = query.in('status', ['active', 'ended']);
      }

      // Apply category filter
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      // Apply sorting
      if (sortBy === "end_time") {
        query = query.order('end_time', { ascending: true });
      } else if (sortBy === "current_bid") {
        query = query.order('current_bid', { ascending: false });
      } else if (sortBy === "created_at") {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching auctions:', error);
        toast({
          title: "Error",
          description: "Failed to load auctions",
          variant: "destructive"
        });
        return;
      }

      // Filter by search term
      let filteredData = data || [];
      if (searchTerm) {
        filteredData = filteredData.filter(auction =>
          auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          auction.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Fetch profiles for all sellers
      const sellerIds = filteredData.map(auction => auction.seller_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', sellerIds);

      const auctionsWithProfiles = filteredData.map(auction => ({
        ...auction,
        profiles: profilesData?.find(profile => profile.user_id === auction.seller_id) || null
      }));

      setAuctions(auctionsWithProfiles);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      toast({
        title: "Error", 
        description: "Failed to load auctions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getAuctionStats = () => {
    const total = auctions.length;
    const active = auctions.filter(a => a.status === 'active').length;
    const endingSoon = auctions.filter(a => {
      const endTime = new Date(a.end_time);
      const now = new Date();
      return a.status === 'active' && endTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
    }).length;
    
    return { total, active, endingSoon };
  };

  const stats = getAuctionStats();

  return (
    <div className="container mx-auto px-6 lg:px-8 py-8 space-y-8">
      {/* Back to Home Button */}
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 h-auto"
          aria-label="Return to homepage"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Auction Marketplace
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover unique items and place bids in real-time
          </p>
        </div>
        
        {user && (
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="apple-button bg-primary hover:bg-primary/90"
          >
            <Gavel className="h-4 w-4 mr-2" />
            Create Auction
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="apple-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Auctions</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <Gavel className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="apple-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Auctions</p>
                <p className="text-2xl font-semibold text-secondary">{stats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="apple-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ending Soon</p>
                <p className="text-2xl font-semibold text-accent">{stats.endingSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="apple-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bidders</p>
                <p className="text-2xl font-semibold">
                  {auctions.reduce((sum, a) => sum + a.watchers_count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">Search auctions</Label>
          <Input
            id="search"
            placeholder="Search auctions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <AuctionFilters
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="all">All Auctions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="ending_soon">Ending Soon</TabsTrigger>
          {user && (
            <>
              <TabsTrigger value="my_auctions">My Auctions</TabsTrigger>
              <TabsTrigger value="my_bids">My Bids</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="apple-card animate-pulse">
                  <div className="h-48 bg-muted rounded-t-2xl"></div>
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : auctions.length === 0 ? (
            <Card className="apple-card">
              <CardContent className="p-12 text-center">
                <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === "my_auctions" 
                    ? "You haven't created any auctions yet."
                    : activeTab === "my_bids"
                    ? "You haven't placed any bids yet."
                    : "No auctions match your current filters."}
                </p>
                {user && activeTab === "my_auctions" && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    Create Your First Auction
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {auctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Auction Dialog */}
      <CreateAuctionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onAuctionCreated={fetchAuctions}
      />
    </div>
  );
}