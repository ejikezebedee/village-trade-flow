import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter } from "lucide-react";

export function SearchSection() {
  return (
    <section className="bg-gradient-subtle py-8 md:py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              🔍 What Are You Looking For?
            </h2>
            <p className="text-muted-foreground text-lg">
              Search thousands of products from villages near you
            </p>
          </div>
          
          <div className="bg-card rounded-2xl p-4 md:p-6 shadow-card">
            <div className="space-y-4">
              {/* Main search - Full width on mobile */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input 
                  placeholder="Type what you want to buy..."
                  className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-primary"
                />
              </div>
              
              {/* Location and search button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Your area or nearby town..."
                    className="pl-12 h-14 text-lg rounded-xl border-2 focus:border-primary"
                  />
                </div>
                
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl font-semibold">
                  🔍 Find Products
                </Button>
              </div>

              {/* Quick categories */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">Popular categories:</p>
                <div className="flex flex-wrap gap-2">
                  {['🥕 Fresh Vegetables', '🍯 Honey & Dairy', '🧺 Handmade Crafts', '🌾 Grains & Pulses'].map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-sm hover:bg-primary hover:text-primary-foreground"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}