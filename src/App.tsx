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
import NotFound from "./pages/NotFound";
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
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/language-settings" element={<LanguageSettingsPage />} />
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
