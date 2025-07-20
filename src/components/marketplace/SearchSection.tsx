import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Filter } from "lucide-react";

export function SearchSection() {
  return (
    <section className="bg-gradient-subtle py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Find What You Need
            </h2>
            <p className="text-muted-foreground">
              Search across thousands of products from rural communities
            </p>
          </div>
          
          <div className="bg-card rounded-2xl p-6 shadow-card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search products, categories, or sellers..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Location..."
                  className="pl-10 h-12 w-full md:w-48"
                />
              </div>
              
              <Button size="lg" className="h-12 px-8">
                <Filter className="h-5 w-5 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}