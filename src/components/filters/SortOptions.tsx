import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Grid, List } from "lucide-react";
import { sortOptions, SortOption } from "@/hooks/useProductFilters";

interface SortOptionsProps {
  sortBy: string;
  onSortChange: (value: string) => void;
  totalResults: number;
  isLoading?: boolean;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export function SortOptions({
  sortBy,
  onSortChange,
  totalResults,
  isLoading = false,
  viewMode = 'grid',
  onViewModeChange
}: SortOptionsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-background border rounded-lg">
      {/* Results Count */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="px-3 py-1">
          {isLoading ? 'Loading...' : `${totalResults} results`}
        </Badge>
      </div>

      {/* Sort and View Controls */}
      <div className="flex items-center gap-3">
        {/* Sort Selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={onSortChange} disabled={isLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option: SortOption) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none border-r"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => onViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}