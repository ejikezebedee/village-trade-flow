import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LiveChatWidget } from "@/components/support/LiveChatWidget";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import Index from "./pages/Index";
import ProductListing from "./pages/ProductListing";
import AuthPage from "./pages/AuthPage";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import FeedbackPage from "./pages/FeedbackPage";
import LanguageSettingsPage from "./pages/LanguageSettingsPage";
import TwoFactorSettings from "./pages/TwoFactorSettings";
import DisputePage from "./pages/DisputePage";
import QRTrackingPage from "./pages/QRTrackingPage";
import { PaymentSuccess } from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";
import { FeaturesPage } from "./pages/FeaturesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import WhyChooseUsPage from "./pages/WhyChooseUsPage";
import GetHelpPage from "./pages/GetHelpPage";
import MessagesPage from "./pages/MessagesPage";
import PaymentMethodsPage from "./pages/PaymentMethodsPage";
import DeliveryAddressesPage from "./pages/DeliveryAddressesPage";
import TotalOrdersPage from "./pages/TotalOrdersPage";
import PendingOrdersPage from "./pages/PendingOrdersPage";
import CompletedOrdersPage from "./pages/CompletedOrdersPage";
import FavoritesPage from "./pages/FavoritesPage";
import WalletPage from "./pages/WalletPage";
import WalletTransferPage from "./pages/WalletTransferPage";
import WalletHistoryPage from "./pages/WalletHistoryPage";
import BrandsPage from "./pages/BrandsPage";
import BrandDetailsPage from "./pages/BrandDetailsPage";
import AuctionPage from "./pages/AuctionPage";
import FlashSalesPage from "./pages/FlashSalesPage";
import BestSellersPage from "./pages/BestSellersPage";
import NewProductsPage from "./pages/NewProductsPage";
import AffiliatePage from "./pages/AffiliatePage";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import AffiliateTierPage from "./pages/AffiliateTierPage";
import BlogsPage from "./pages/BlogsPage";
import CategoriesPage from "./pages/CategoriesPage";
import { EmailVerificationHandler } from "./components/auth/EmailVerificationHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsProvider>
              <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/verify-email" element={<EmailVerificationHandler />} />
        <Route path="/products" element={<ProductListing />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/brands" element={<BrandsPage />} />
        <Route path="/brands/:slug" element={<BrandDetailsPage />} />
        <Route path="/auctions" element={<AuctionPage />} />
        <Route path="/flash-sales" element={<FlashSalesPage />} />
        <Route path="/best-sellers" element={<BestSellersPage />} />
        <Route path="/new-products" element={<NewProductsPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/language-settings" element={<LanguageSettingsPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/why-choose-us" element={<WhyChooseUsPage />} />
        <Route path="/get-help" element={<GetHelpPage />} />
        <Route path="/qr-tracking" element={
          <ProtectedRoute>
            <QRTrackingPage />
          </ProtectedRoute>
        } />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/disputes" element={
          <ProtectedRoute>
            <DisputePage />
          </ProtectedRoute>
        } />
        <Route path="/2fa-settings" element={
          <ProtectedRoute>
            <TwoFactorSettings />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        } />
        <Route path="/payment-methods" element={
          <ProtectedRoute>
            <PaymentMethodsPage />
          </ProtectedRoute>
        } />
        <Route path="/delivery-addresses" element={
          <ProtectedRoute>
            <DeliveryAddressesPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/all" element={
          <ProtectedRoute>
            <TotalOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/pending" element={
          <ProtectedRoute>
            <PendingOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/completed" element={
          <ProtectedRoute>
            <CompletedOrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/favorites" element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        } />
        <Route path="/wallet/transfer" element={
          <ProtectedRoute>
            <WalletTransferPage />
          </ProtectedRoute>
        } />
        <Route path="/wallet/history" element={
          <ProtectedRoute>
            <WalletHistoryPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <BuyerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/buyer" element={
                <ProtectedRoute requiredRole="buyer">
                  <BuyerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/seller" element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/driver" element={
                <ProtectedRoute requiredRole="driver">
                  <DriverDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/agent" element={
                <ProtectedRoute requiredRole="agent">
                  <AgentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
        <Route path="/affiliate-tiers/:tierName" element={<AffiliateTierPage />} />
        <Route path="*" element={<NotFound />} />
              </Routes>
              <LiveChatWidget />
            </AnalyticsProvider>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
