import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Heart, ShoppingCart, Package2, Truck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: any;
  category?: string;
  stock_quantity: number;
  featured: boolean;
  seller_id: string;
  created_at: string;
}

interface BrandProductCardProps {
  product: Product;
  layout?: "grid" | "list";
}

export function BrandProductCard({ product, layout = "grid" }: BrandProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const mainImage = Array.isArray(product.images) && product.images.length > 0 
    ? product.images[0] 
    : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";

  const isInStock = product.stock_quantity > 0;
  const isLowStock = product.stock_quantity <= 5 && product.stock_quantity > 0;

  if (layout === "list") {
    return (
      <Card className="apple-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <img 
                src={mainImage}
                alt={product.name}
                className="w-24 h-24 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
                }}
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${product.id}`}>
                    <h3 className="font-semibold text-lg leading-tight tracking-tight line-clamp-1 hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xl font-semibold text-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                    
                    {product.category && (
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 w-9 p-0"
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                  </Button>
                  
                  <Button
                    size="sm"
                    disabled={!isInStock}
                    className="apple-button"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isInStock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1">
                  <Package2 className="h-3 w-3" />
                  <span className={`${!isInStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-muted-foreground"}`}>
                    {!isInStock ? "Out of stock" : isLowStock ? `Only ${product.stock_quantity} left` : `${product.stock_quantity} in stock`}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Truck className="h-3 w-3" />
                  <span>Free shipping</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="apple-card group overflow-hidden">
      {/* Image */}
      <div className="relative">
        <Link to={`/products/${product.id}`}>
          <img 
            src={mainImage}
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500";
            }}
          />
        </Link>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              Featured
            </Badge>
          )}
          {!isInStock && (
            <Badge variant="destructive">
              Out of Stock
            </Badge>
          )}
          {isLowStock && isInStock && (
            <Badge className="bg-amber-500 text-white">
              Low Stock
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-4 right-4 h-9 w-9 p-0 apple-glass rounded-full"
          onClick={() => setIsFavorited(!isFavorited)}
        >
          <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </Button>

        {/* Category */}
        {product.category && (
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-background/90 text-foreground border-0 text-xs">
              {product.category}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Title and Description */}
        <div className="space-y-2">
          <Link to={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg leading-tight tracking-tight line-clamp-1 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold text-foreground">
            ${product.price.toFixed(2)}
          </span>
          
          <div className="text-right text-sm text-muted-foreground">
            <div>{product.stock_quantity} in stock</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 apple-button"
            asChild
          >
            <Link to={`/products/${product.id}`}>
              View Details
            </Link>
          </Button>
          
          <Button 
            className="flex-1 apple-button bg-primary hover:bg-primary/90"
            disabled={!isInStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}