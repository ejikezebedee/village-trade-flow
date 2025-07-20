import { Header } from "@/components/marketplace/Header";
import { HeroSection } from "@/components/marketplace/HeroSection";
import { SearchSection } from "@/components/marketplace/SearchSection";
import { FeaturedProducts } from "@/components/marketplace/FeaturedProducts";
import { DashboardNavigation } from "@/components/marketplace/DashboardNavigation";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <SearchSection />
        <FeaturedProducts />
        <DashboardNavigation />
      </main>
    </div>
  );
};

export default Index;
