import { Header } from "@/components/marketplace/Header";
import { RoleBasedDashboard } from "@/components/auth/RoleBasedDashboard";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      toast.success(`Searching for: ${searchQuery}`);
      // Navigate to a search results page or filter products
      // For now, we'll just show a toast
      console.log("Searching for:", searchQuery);
    } else {
      toast.error("Please enter a search term");
    }
  };

  const handlePopularSearch = (tag: string) => {
    setSearchQuery(tag);
    toast.success(`Searching for: ${tag}`);
    console.log("Popular search clicked:", tag);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14 sm:pt-16">
        {user ? (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <RoleBasedDashboard />
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center overflow-hidden py-16 sm:py-20">
              <div className="container mx-auto px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                  <div className="space-y-6">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground leading-tight tracking-tighter">
                      Simple & Safe
                      <span className="text-primary block"> Village Trading</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                      Buy and sell with confidence. We protect your money until you receive your goods. 
                      Easy to use, safe for everyone.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="text-base px-8 py-3 bg-primary hover:bg-primary/90">
                      Start Trading Now
                    </Button>
                    <Button size="lg" variant="outline" className="text-base px-8 py-3">
                      See How It Works
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Search Section */}
            <section className="bg-muted/30 py-8 md:py-12">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-6 md:mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                      🔍 What Are You Looking For?
                    </h2>
                    <p className="text-muted-foreground text-lg mb-6">
                      Search thousands of products from villages near you
                    </p>
                  </div>
                  
                  <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Search for products, categories, or brands..."
                          className="w-full px-4 py-4 text-lg rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90"
                        >
                          Search
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="text-sm text-muted-foreground">Popular searches:</span>
                       {['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'].map((tag) => (
                         <Button
                           key={tag}
                           variant="outline"
                           size="sm"
                           onClick={() => handlePopularSearch(tag)}
                           className="text-xs px-3 py-1 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                         >
                           {tag}
                         </Button>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Simple Product Grid */}
            <section className="py-8 sm:py-12">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                    Featured Products
                  </h2>
                  <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
                    Discover amazing products from local sellers
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="group hover:shadow-lg transition-all duration-300">
                      <div className="aspect-square bg-muted rounded-t-lg"></div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">
                          Sample Product {i}
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-primary">
                            $29.99
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            $49.99
                          </span>
                        </div>
                        <Button className="w-full bg-primary hover:bg-primary/90">
                          Add to Cart
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Newsletter Section */}
            <section className="py-8 sm:py-12 bg-muted/30">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                    Stay Updated
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Get the latest deals and updates delivered to your inbox
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <Button size="lg" className="bg-primary hover:bg-primary/90 px-8">
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
