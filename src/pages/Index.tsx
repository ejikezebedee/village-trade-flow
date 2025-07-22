import { Header } from "@/components/marketplace/Header";
import { HeroSection } from "@/components/marketplace/HeroSection";
import { SearchSection } from "@/components/marketplace/SearchSection";
import { FeaturedProducts } from "@/components/marketplace/FeaturedProducts";
import { FlashSalesSection } from "@/components/flash-sales/FlashSalesSection";
import { BestSellersSection } from "@/components/marketplace/BestSellersSection";
import { NewProductsSection } from "@/components/marketplace/NewProductsSection";
import { PremiumProductsSection } from "@/components/marketplace/PremiumProductsSection";
import { TodaysDealsSection } from "@/components/marketplace/TodaysDealsSection";
import { EmailSubscriptionSection } from "@/components/email/EmailSubscriptionSection";
import { AffiliateSection } from "@/components/affiliate/AffiliateSection";
import { RoleBasedDashboard } from "@/components/auth/RoleBasedDashboard";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading } = useAuth();

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
          <div className="animate-fade-in">
            <HeroSection />
            <SearchSection />
            <div className="space-y-8 sm:space-y-12">
              <TodaysDealsSection maxItems={6} showHeader={true} />
              <FlashSalesSection showHeader={true} maxItems={4} className="py-6 sm:py-8" />
              <BestSellersSection maxItems={6} />
              <PremiumProductsSection maxItems={8} />
              <NewProductsSection maxItems={6} />
              <FeaturedProducts />
              <EmailSubscriptionSection />
              <AffiliateSection variant="landing" />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
