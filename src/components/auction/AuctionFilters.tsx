import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AuctionFiltersProps {
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export function AuctionFilters({ 
  categoryFilter, 
  setCategoryFilter, 
  sortBy, 
  setSortBy 
}: AuctionFiltersProps) {
  return (
    <div className="flex gap-4">
      <div className="w-48">
        <Label htmlFor="category-filter" className="sr-only">Filter by category</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
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

      <div className="w-48">
        <Label htmlFor="sort-by" className="sr-only">Sort by</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger id="sort-by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="end_time">Ending Soon</SelectItem>
            <SelectItem value="current_bid">Highest Bid</SelectItem>
            <SelectItem value="created_at">Recently Added</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}