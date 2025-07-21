import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  ArrowLeft,
  ShoppingCart,
  Star,
  Trash2,
  Package
} from "lucide-react";
import { Link } from "react-router-dom";

export default function FavoritesPage() {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock favorites data since we don't have a favorites table yet
  const mockFavorites = [
    {
      id: "1",
      product_id: "prod-1",
      product_name: "Fresh Organic Tomatoes",
      seller_name: "Green Valley Farm",
      price: 4.99,
      image_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&h=300",
      in_stock: true,
      stock_quantity: 25,
      rating: 4.8,
      added_date: "2024-01-15"
    },
    {
      id: "2", 
      product_id: "prod-2",
      product_name: "Handwoven Basket Set",
      seller_name: "Artisan Crafts Co",
      price: 29.99,
      image_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=300&h=300", 
      in_stock: true,
      stock_quantity: 8,
      rating: 4.9,
      added_date: "2024-01-10"
    },
    {
      id: "3",
      product_id: "prod-3", 
      product_name: "Pure Mountain Honey",
      seller_name: "Bee Happy Farm",
      price: 12.50,
      image_url: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?auto=format&fit=crop&w=300&h=300",
      in_stock: false,
      stock_quantity: 0, 
      rating: 4.7,
      added_date: "2024-01-05"
    }
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, using mock data
      setTimeout(() => {
        setFavorites(mockFavorites);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load favorites. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      setFavorites(favorites => favorites.filter(fav => fav.id !== favoriteId));
      toast({
        title: "Removed from favorites",
        description: "Product has been removed from your favorites."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites.",
        variant: "destructive"
      });
    }
  };

  const addToCart = async (product) => {
    try {
      toast({
        title: "Added to cart",
        description: `${product.product_name} has been added to your cart.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to cart.",
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your favorites</h2>
              <Button onClick={() => window.location.href = '/auth'}>
                Go to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        <div className="container mx-auto px-4 py-6">
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                My Favorites
              </h1>
            </div>
            <p className="text-muted-foreground">
              Products you've saved for later
            </p>
          </div>

          {/* Favorites List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Favorite Products ({favorites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading favorites...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
                  <p className="text-muted-foreground mb-4">Start browsing and save products you love</p>
                  <Button asChild>
                    <Link to="/">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Browse Products
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <div key={favorite.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      {/* Product Image */}
                      <div className="relative">
                        <img 
                          src={favorite.image_url} 
                          alt={favorite.product_name}
                          className="w-full h-48 object-cover"
                        />
                        {!favorite.in_stock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive">Out of Stock</Badge>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white"
                          onClick={() => removeFavorite(favorite.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-medium text-lg mb-1">{favorite.product_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">by {favorite.seller_name}</p>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{favorite.rating}</span>
                          </div>
                          {favorite.in_stock && (
                            <Badge variant="secondary" className="text-xs">
                              {favorite.stock_quantity} in stock
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold">${favorite.price}</span>
                          <Button 
                            size="sm" 
                            disabled={!favorite.in_stock}
                            onClick={() => addToCart(favorite)}
                          >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {favorite.in_stock ? 'Add to Cart' : 'Out of Stock'}
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(favorite.added_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {favorites.length > 0 && (
                <div className="mt-6 text-center">
                  <Button variant="outline" asChild>
                    <Link to="/">
                      <Package className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}