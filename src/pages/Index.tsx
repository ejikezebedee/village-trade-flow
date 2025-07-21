import { Header } from "@/components/marketplace/Header";
import { HeroSection } from "@/components/marketplace/HeroSection";
import { SearchSection } from "@/components/marketplace/SearchSection";
import { FeaturedProducts } from "@/components/marketplace/FeaturedProducts";
import { DashboardNavigation } from "@/components/marketplace/DashboardNavigation";
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
      <main>
        {user ? (
          <div className="container mx-auto px-4 py-8">
            <RoleBasedDashboard />
          </div>
        ) : (
          <>
            <HeroSection />
            <SearchSection />
            <FeaturedProducts />
            <DashboardNavigation />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
