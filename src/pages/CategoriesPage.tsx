import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { 
  Apple, 
  Shirt, 
  Laptop, 
  Home, 
  Heart, 
  Car,
  BookOpen,
  Gamepad2,
  Baby,
  Dumbbell,
  Leaf,
  Gift
} from "lucide-react";

const categories = [
  {
    id: "food",
    name: "Food & Beverages",
    icon: Apple,
    count: 1247,
    description: "Fresh produce, packaged foods, and beverages",
    color: "text-green-600"
  },
  {
    id: "fashion",
    name: "Fashion & Clothing",
    icon: Shirt,
    count: 892,
    description: "Clothing, shoes, and fashion accessories",
    color: "text-purple-600"
  },
  {
    id: "electronics",
    name: "Electronics",
    icon: Laptop,
    count: 654,
    description: "Phones, computers, and electronic devices",
    color: "text-blue-600"
  },
  {
    id: "home",
    name: "Home & Garden",
    icon: Home,
    count: 543,
    description: "Furniture, decor, and garden supplies",
    color: "text-orange-600"
  },
  {
    id: "health",
    name: "Health & Beauty",
    icon: Heart,
    count: 432,
    description: "Skincare, cosmetics, and health products",
    color: "text-pink-600"
  },
  {
    id: "automotive",
    name: "Automotive",
    icon: Car,
    count: 321,
    description: "Car parts, accessories, and tools",
    color: "text-gray-600"
  },
  {
    id: "books",
    name: "Books & Media",
    icon: BookOpen,
    count: 289,
    description: "Books, magazines, and educational materials",
    color: "text-indigo-600"
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    icon: Dumbbell,
    count: 198,
    description: "Exercise equipment and sporting goods",
    color: "text-red-600"
  },
  {
    id: "toys",
    name: "Toys & Games",
    icon: Gamepad2,
    count: 176,
    description: "Toys, games, and entertainment",
    color: "text-yellow-600"
  },
  {
    id: "baby",
    name: "Baby & Kids",
    icon: Baby,
    count: 143,
    description: "Baby products and children's items",
    color: "text-cyan-600"
  },
  {
    id: "organic",
    name: "Organic & Natural",
    icon: Leaf,
    count: 98,
    description: "Eco-friendly and organic products",
    color: "text-emerald-600"
  },
  {
    id: "gifts",
    name: "Gifts & Crafts",
    icon: Gift,
    count: 87,
    description: "Handmade gifts and craft supplies",
    color: "text-rose-600"
  }
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse All Categories
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore our wide range of product categories from local sellers and trusted brands.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card 
                key={category.id}
                className="apple-card group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className={`inline-flex p-4 rounded-full bg-muted ${category.color}`}>
                      <category.icon className="h-8 w-8" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">
                      {category.count.toLocaleString()} items
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Active sellers
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full apple-button"
                    onClick={() => window.location.href = `/products?category=${category.id}`}
                  >
                    Browse Category
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}