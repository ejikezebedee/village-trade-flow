import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Package, 
  TrendingUp, 
  MapPin, 
  Calendar,
  Heart,
  ExternalLink,
  Crown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  category?: string;
  is_featured: boolean;
  total_products: number;
  total_sales: number;
  average_rating: number;
  total_ratings: number;
  country?: string;
  founded_year?: number;
  website_url?: string;
}

interface BrandCardProps {
  brand: Brand;
  size?: "default" | "large";
}

export function BrandCard({ brand, size = "default" }: BrandCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkFollowStatus();
    }
    fetchFollowerCount();
  }, [user, brand.id]);

  const checkFollowStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('brand_followers')
      .select('id')
      .eq('brand_id', brand.id)
      .eq('user_id', user.id)
      .single();

    setIsFollowing(!!data);
  };

  const fetchFollowerCount = async () => {
    const { count } = await supabase
      .from('brand_followers')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', brand.id);

    setFollowerCount(count || 0);
  };

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow brands",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('brand_followers')
          .delete()
          .eq('brand_id', brand.id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
        toast({
          title: "Unfollowed brand",
          description: `You are no longer following ${brand.name}`
        });
      } else {
        const { error } = await supabase
          .from('brand_followers')
          .insert({
            brand_id: brand.id,
            user_id: user.id
          });

        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast({
          title: "Following brand",
          description: `You are now following ${brand.name}`
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

  const cardClasses = size === "large" 
    ? "apple-card group overflow-hidden md:col-span-2 lg:col-span-1" 
    : "apple-card group overflow-hidden";

  return (
    <Card className={cardClasses}>
      <CardContent className="p-6 space-y-4">
        {/* Header with Logo and Follow Button */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className={size === "large" ? "h-16 w-16" : "h-12 w-12"}>
              <AvatarImage src={brand.logo_url} alt={brand.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {brand.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${size === "large" ? "text-xl" : "text-lg"} leading-tight tracking-tight`}>
                  {brand.name}
                </h3>
                {brand.is_featured && (
                  <Crown className="h-4 w-4 text-amber-500" />
                )}
              </div>
              {brand.category && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {brand.category}
                </Badge>
              )}
            </div>
          </div>

          {user && (
            <Button
              size="sm"
              variant={isFollowing ? "default" : "outline"}
              onClick={toggleFollow}
              className="apple-button"
            >
              <Heart className={`h-4 w-4 mr-1 ${isFollowing ? "fill-current" : ""}`} />
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        {/* Description */}
        {brand.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {brand.description}
          </p>
        )}

        {/* Brand Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            {brand.country && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{brand.country}</span>
              </div>
            )}
            {brand.founded_year && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Est. {brand.founded_year}</span>
              </div>
            )}
          </div>
          <div className="space-y-2 text-right">
            <div className="flex items-center justify-end gap-1">
              <Star className="h-3 w-3 text-amber-500 fill-current" />
              <span className="font-medium">{brand.average_rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({brand.total_ratings})</span>
            </div>
            <div className="flex items-center justify-end gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>{brand.total_products} products</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{followerCount} followers</span>
          </div>
          
          <div className="flex gap-2">
            {brand.website_url && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => window.open(brand.website_url, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              asChild
              size="sm"
              className="apple-button"
            >
              <Link to={`/brands/${brand.slug}`}>
                View Products
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}