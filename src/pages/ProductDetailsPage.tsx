import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  MapPin, 
  Verified, 
  MessageCircle,
  Shield,
  Truck,
  Clock
} from "lucide-react";

// Mock product data (in real app, this would come from API)
const mockProducts = [
  {
    id: 1,
    name: "Fresh Organic Tomatoes - Premium Quality",
    price: "$2.50/kg",
    originalPrice: "$3.00/kg",
    description: "Farm-fresh organic tomatoes grown without pesticides. Perfect for cooking and salads. Harvested daily for maximum freshness. These tomatoes are grown using sustainable farming practices and are completely chemical-free.",
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=800&h=600",
    images: [
      "https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&h=600",
      "https://images.unsplash.com/photo-1574643156929-51fa5b9cd8d9?auto=format&fit=crop&w=800&h=600"
    ],
    category: "🥕 Vegetables",
    rating: 4.8,
    reviews: 124,
    seller: {
      name: "Village Farm Co-op",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100",
      verified: true,
      location: "Rural Valley, 5km away",
      rating: 4.9,
      totalSales: 1250,
      memberSince: "2022"
    },
    inStock: true,
    stockQuantity: 45,
    featured: true,
    specifications: {
      "Origin": "Local Farm, Rural Valley",
      "Organic": "Yes, USDA Certified",
      "Harvest Date": "Daily",
      "Storage": "Room temperature, use within 5 days",
      "Weight": "Sold per kg"
    }
  }
  // Add more mock products as needed
];

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [checkoutProduct, setCheckoutProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // In real app, fetch from API using id
        const foundProduct = mockProducts.find(p => p.id === parseInt(id || "1"));
        
        if (!foundProduct) {
          toast({
            title: "Product not found",
            description: "The product you're looking for doesn't exist.",
            variant: "destructive"
          });
          navigate("/products");
          return;
        }
        
        setProduct(foundProduct);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate, toast]);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: isFavorited ? "Product removed from your favorites" : "Product added to your favorites",
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    setCheckoutProduct({
      ...product,
      seller_id: 'seller-' + Math.random().toString(36).substr(2, 9)
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product?.name,
        text: `Check out this product: ${product?.name}`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to your clipboard.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-20 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - VillageMarket</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8">
          
          {/* Back Button */}
          <Button asChild variant="outline" className="mb-6">
            <Link to="/products" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>

          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 object-cover"
                />
                {product.featured && (
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Featured
                  </Badge>
                )}
                {!product.inStock && (
                  <Badge variant="destructive" className="absolute top-4 left-4">
                    Out of Stock
                  </Badge>
                )}
              </div>
              
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              
              {/* Product Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{product.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{product.rating}</span>
                    <span className="text-sm text-muted-foreground">({product.reviews} reviews)</span>
                  </div>
                </div>
                
                <h1 className="text-3xl font-bold text-foreground mb-4">{product.name}</h1>
                
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-primary">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-xl text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
              </div>

              {/* Seller Info */}
              <Card className="apple-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                        {product.seller.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{product.seller.name}</h3>
                        {product.seller.verified && (
                          <Verified className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {product.seller.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {product.seller.rating} rating
                        </div>
                        <div>{product.seller.totalSales} sales</div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stock & Quantity */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {product.inStock ? `${product.stockQuantity} in stock` : 'Out of stock'}
                  </span>
                  <div className="flex items-center gap-3">
                    <label htmlFor="quantity" className="text-sm font-medium">Quantity:</label>
                    <select
                      id="quantity"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="border border-border rounded-md px-3 py-1 text-sm"
                      disabled={!product.inStock}
                    >
                      {[...Array(Math.min(product.stockQuantity, 10))].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleFavorite}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="icon"
                  className="flex-shrink-0"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                
                <Button
                  onClick={handleBuyNow}
                  className="flex-1 h-12 text-base font-medium"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {product.inStock ? 'Buy Now' : 'Out of Stock'}
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-sm font-medium">Secure Payment</div>
                  <div className="text-xs text-muted-foreground">Escrow Protection</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-sm font-medium">Fast Delivery</div>
                  <div className="text-xs text-muted-foreground">24-48 hours</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-sm font-medium">QR Tracking</div>
                  <div className="text-xs text-muted-foreground">Real-time updates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          {product.specifications && (
            <Card className="apple-card mt-12">
              <CardHeader>
                <CardTitle>Product Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="font-medium text-foreground">{key}</span>
                      <span className="text-muted-foreground">{value as string}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Checkout Flow */}
      {checkoutProduct && (
        <CheckoutFlow
          product={checkoutProduct}
          quantity={quantity}
          onClose={() => setCheckoutProduct(null)}
        />
      )}
    </>
  );
}