import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandCard } from "./BrandCard";
import { Crown, Sparkles } from "lucide-react";

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

interface FeaturedBrandsProps {
  brands: Brand[];
}

export function FeaturedBrands({ brands }: FeaturedBrandsProps) {
  if (brands.length === 0) return null;

  return (
    <Card className="apple-card bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Crown className="h-6 w-6 text-amber-500" />
          Featured Brands
          <Sparkles className="h-6 w-6 text-amber-500" />
        </CardTitle>
        <p className="text-muted-foreground">
          Premium brands handpicked by our team for exceptional quality and service
        </p>
        <Badge className="mx-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
          Verified Premium Partners
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <BrandCard key={brand.id} brand={brand} size="large" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}