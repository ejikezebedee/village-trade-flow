import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, TrendingUp, Tag } from "lucide-react";
import { useState } from "react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  trending?: boolean;
  featured?: boolean;
}

const BlogsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Product Reviews", "Shopping Tips", "Seller Stories", "Market Trends", "How To"];

  const blogPosts: BlogPost[] = [
    {
      id: "1",
      title: "10 Essential Tips for Smart Online Shopping in 2024",
      excerpt: "Discover the latest strategies to save money, avoid scams, and find the best deals when shopping online. Our comprehensive guide covers everything from price comparison to secure payments.",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "8 min",
      category: "Shopping Tips",
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=400&h=300",
      featured: true,
      trending: true
    },
    {
      id: "2",
      title: "How Small Businesses Are Thriving on VillageMarket",
      excerpt: "Meet the entrepreneurs who have transformed their local crafts into thriving online businesses. Learn their success stories and get inspired to start your own journey.",
      author: "Mike Chen",
      date: "2024-01-12",
      readTime: "6 min",
      category: "Seller Stories",
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "3",
      title: "The Rise of Sustainable Shopping: A Complete Guide",
      excerpt: "Learn how to make eco-conscious purchasing decisions without breaking the bank. Discover sustainable brands and products that align with your values.",
      author: "Emma Green",
      date: "2024-01-10",
      readTime: "12 min",
      category: "Market Trends",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=400&h=300",
      trending: true
    },
    {
      id: "4",
      title: "Review: Top 5 Premium Coffee Makers Under $200",
      excerpt: "We tested the most popular coffee makers in the market to help you find the perfect brew companion. Detailed analysis of features, taste, and value for money.",
      author: "David Rodriguez",
      date: "2024-01-08",
      readTime: "10 min",
      category: "Product Reviews",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "5",
      title: "Maximizing Your Auction Wins: Insider Strategies",
      excerpt: "Learn from seasoned auction participants about timing, bidding strategies, and how to spot genuine bargains in our auction marketplace.",
      author: "Lisa Wang",
      date: "2024-01-05",
      readTime: "7 min",
      category: "How To",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&h=300"
    },
    {
      id: "6",
      title: "From Farm to Table: Supporting Local Food Producers",
      excerpt: "Discover the impact of buying local and how VillageMarket connects you directly with farmers and food artisans in your community.",
      author: "Tom Anderson",
      date: "2024-01-03",
      readTime: "9 min",
      category: "Market Trends",
      image: "https://images.unsplash.com/photo-1516110833967-0b5715da08da?auto=format&fit=crop&w=400&h=300"
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-14 sm:pt-16">
        {/* Hero Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                VillageMarket Blog
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover shopping tips, seller stories, product reviews, and market insights to help you make the most of your marketplace experience.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Article */}
        {featuredPost && selectedCategory === "All" && !searchQuery && (
          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-8">
                <Badge variant="secondary" className="mb-2">Featured Article</Badge>
                <h2 className="text-2xl font-bold">Editor's Pick</h2>
              </div>
              
              <Card className="overflow-hidden hover:shadow-xl transition-all duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="relative aspect-video lg:aspect-auto">
                    <img 
                      src={featuredPost.image} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                    {featuredPost.trending && (
                      <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <div className="p-8">
                    <Badge variant="outline" className="mb-3">
                      {featuredPost.category}
                    </Badge>
                    <h3 className="text-2xl font-bold mb-4 hover:text-primary transition-colors cursor-pointer">
                      {featuredPost.title}
                    </h3>
                    <p className="text-muted-foreground mb-6 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {featuredPost.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(featuredPost.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.readTime}
                        </div>
                      </div>
                      <Button>Read More</Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Blog Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post, index) => (
                <Card 
                  key={post.id}
                  className="overflow-hidden hover:shadow-xl transition-all duration-500 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                    />
                    {post.trending && (
                      <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <Badge variant="outline" className="mb-3">
                      <Tag className="h-3 w-3 mr-1" />
                      {post.category}
                    </Badge>
                    
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                      {post.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readTime}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No articles found matching your criteria.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogsPage;