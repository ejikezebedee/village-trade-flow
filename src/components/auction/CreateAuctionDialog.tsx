import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ImagePlus } from "lucide-react";

interface CreateAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuctionCreated: () => void;
}

export function CreateAuctionDialog({ open, onOpenChange, onAuctionCreated }: CreateAuctionDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    starting_bid: "",
    reserve_price: "",
    bid_increment: "1.00",
    bid_increment_type: "fixed" as "fixed" | "percentage" | "dynamic",
    category: "",
    location: "",
    duration_hours: "24",
    auto_extend: false,
    terms_conditions: "",
    images: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create an auction",
        variant: "destructive"
      });
      return;
    }

    // Validation
    if (!formData.title || !formData.description || !formData.starting_bid) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const startingBid = parseFloat(formData.starting_bid);
    const reservePrice = formData.reserve_price ? parseFloat(formData.reserve_price) : null;
    const bidIncrement = parseFloat(formData.bid_increment);
    const durationHours = parseInt(formData.duration_hours);

    if (isNaN(startingBid) || startingBid <= 0) {
      toast({
        title: "Invalid starting bid",
        description: "Starting bid must be a positive number",
        variant: "destructive"
      });
      return;
    }

    if (reservePrice && reservePrice < startingBid) {
      toast({
        title: "Invalid reserve price",
        description: "Reserve price must be greater than or equal to starting bid",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + durationHours);

      const { data, error } = await supabase
        .from('auctions')
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          starting_bid: startingBid,
          reserve_price: reservePrice,
          bid_increment: bidIncrement,
          bid_increment_type: formData.bid_increment_type,
          category: formData.category || null,
          location: formData.location || null,
          end_time: endTime.toISOString(),
          auto_extend_on_bid: formData.auto_extend,
          terms_conditions: formData.terms_conditions || null,
          images: formData.images,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Auction created successfully!",
        description: "Your auction is now live and accepting bids"
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        starting_bid: "",
        reserve_price: "",
        bid_increment: "1.00",
        bid_increment_type: "fixed",
        category: "",
        location: "",
        duration_hours: "24",
        auto_extend: false,
        terms_conditions: "",
        images: []
      });

      onAuctionCreated();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error creating auction:', error);
      toast({
        title: "Error",
        description: "Failed to create auction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Auction</DialogTitle>
          <DialogDescription>
            Set up your auction details. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter auction title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item in detail"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home_garden">Home & Garden</SelectItem>
                    <SelectItem value="collectibles">Collectibles</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="toys">Toys</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Your location"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing & Bidding</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="starting_bid">Starting Bid ($) *</Label>
                <Input
                  id="starting_bid"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.starting_bid}
                  onChange={(e) => setFormData({ ...formData, starting_bid: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reserve_price">Reserve Price ($)</Label>
                <Input
                  id="reserve_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.reserve_price}
                  onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })}
                  placeholder="Optional minimum price"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum price you'll accept. Auction cancels if not met.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bid_increment">Bid Increment ($)</Label>
                <Input
                  id="bid_increment"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.bid_increment}
                  onChange={(e) => setFormData({ ...formData, bid_increment: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="bid_increment_type">Increment Type</Label>
                <Select 
                  value={formData.bid_increment_type} 
                  onValueChange={(value: "fixed" | "percentage" | "dynamic") => 
                    setFormData({ ...formData, bid_increment_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="dynamic">Dynamic (Auto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Duration & Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Duration & Settings</h3>
            
            <div>
              <Label htmlFor="duration_hours">Auction Duration (hours)</Label>
              <Select 
                value={formData.duration_hours} 
                onValueChange={(value) => setFormData({ ...formData, duration_hours: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="3">3 Hours</SelectItem>
                  <SelectItem value="6">6 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">1 Day</SelectItem>
                  <SelectItem value="72">3 Days</SelectItem>
                  <SelectItem value="168">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto_extend"
                checked={formData.auto_extend}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_extend: checked })}
              />
              <Label htmlFor="auto_extend">Auto-extend auction by 5 minutes when bid placed in final 5 minutes</Label>
            </div>
          </div>

          {/* Terms */}
          <div>
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              placeholder="Any special terms or conditions for this auction"
              rows={2}
            />
          </div>

          {/* Images Placeholder */}
          <div>
            <Label>Images</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <ImagePlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Image upload will be available in a future update
              </p>
            </div>
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
              {loading ? "Creating..." : "Create Auction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}