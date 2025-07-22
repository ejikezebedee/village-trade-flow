import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Filter, X, ChevronDown, ChevronUp, Star } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FilterOptions } from "@/hooks/useProductFilters";

interface ProductFiltersProps {
  filters: FilterOptions;
  availableCategories: string[];
  availableBrands: string[];
  priceRange: { min: number; max: number };
  filterStats: { activeFiltersCount: number; totalResults: number };
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  onResetFilters: () => void;
  isLoading?: boolean;
}

export function ProductFilters({
  filters,
  availableCategories,
  availableBrands,
  priceRange,
  filterStats,
  onFiltersChange,
  onResetFilters,
  isLoading = false
}: ProductFiltersProps) {
  const [isPriceOpen, setIsPriceOpen] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);

  const handlePriceChange = (value: number[]) => {
    onFiltersChange({
      priceRange: { min: value[0], max: value[1] }
    });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const newCategories = checked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onFiltersChange({ categories: newCategories });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter(b => b !== brand);
    
    onFiltersChange({ brands: newBrands });
  };

  const handleRatingChange = (rating: number) => {
    onFiltersChange({ minRating: rating === filters.minRating ? 0 : rating });
  };

  const ratingOptions = [5, 4, 3, 2, 1];

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
            {filterStats.activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filterStats.activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {filterStats.activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `${filterStats.totalResults} products found`}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* In Stock Only */}
        <div className="flex items-center justify-between">
          <Label htmlFor="in-stock" className="text-sm font-medium">
            In Stock Only
          </Label>
          <Switch
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onFiltersChange({ inStockOnly: checked })}
          />
        </div>

        <Separator />

        {/* Price Range */}
        <Collapsible open={isPriceOpen} onOpenChange={setIsPriceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">Price Range</h3>
            {isPriceOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <Slider
              value={[filters.priceRange.min, filters.priceRange.max]}
              onValueChange={handlePriceChange}
              max={priceRange.max}
              min={priceRange.min}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${filters.priceRange.min}</span>
              <span>${filters.priceRange.max}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Categories */}
        <Collapsible open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">Categories</h3>
            {isCategoryOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {availableCategories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="text-sm capitalize cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Brands */}
        {availableBrands.length > 0 && (
          <>
            <Collapsible open={isBrandOpen} onOpenChange={setIsBrandOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h3 className="text-sm font-medium">Brands</h3>
                {isBrandOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-4">
                {availableBrands.map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={filters.brands.includes(brand)}
                      onCheckedChange={(checked) => 
                        handleBrandChange(brand, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`brand-${brand}`}
                      className="text-sm cursor-pointer"
                    >
                      {brand}
                    </Label>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <Separator />
          </>
        )}

        {/* Rating */}
        <Collapsible open={isRatingOpen} onOpenChange={setIsRatingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium">Minimum Rating</h3>
            {isRatingOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-4">
            {ratingOptions.map((rating) => (
              <div 
                key={rating} 
                className="flex items-center space-x-2 cursor-pointer group"
                onClick={() => handleRatingChange(rating)}
              >
                <Checkbox
                  id={`rating-${rating}`}
                  checked={filters.minRating === rating}
                />
                <Label 
                  htmlFor={`rating-${rating}`}
                  className="flex items-center gap-1 text-sm cursor-pointer group-hover:text-foreground"
                >
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < rating 
                            ? 'fill-accent text-accent' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <span>& up</span>
                </Label>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}