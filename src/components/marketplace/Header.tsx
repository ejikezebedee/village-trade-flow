import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { QrCode, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 apple-glass border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Apple-style minimalist */}
          <Link to="/" className="flex items-center space-x-3 apple-button rounded-lg px-2 py-1">
            <div className="bg-primary/10 p-2 rounded-lg">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">VillageMarket</h1>
          </Link>

          {/* Desktop Navigation - Apple-style clean */}
          <nav className="hidden lg:flex items-center space-x-1">
            <a href="/flash-sales" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Flash Sales
            </a>
            <a href="/brands" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Top Brands
            </a>
            <a href="/auctions" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Auctions
            </a>
            <a href="/how-it-works" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              How It Works
            </a>
            <a href="/why-choose-us" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Why Choose Us
            </a>
            <a href="/get-help" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Get Help
            </a>
          </nav>

          {/* Action Buttons - Apple-style clean */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <UserMenu />
              </div>
            ) : (
              <>
                <Button variant="ghost" className="text-sm font-medium apple-button" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button variant="default" className="text-sm font-medium apple-button bg-primary hover:bg-primary/90" onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Apple-style clean */}
          <Button 
            variant="ghost" 
            size="sm"
            className="lg:hidden p-2 apple-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu - Simplified and touch-friendly */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-md">
            <nav className="py-6 space-y-1">
              <a 
                href="/flash-sales" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ⚡ Flash Sales
              </a>
              <a 
                href="/brands" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                👑 Top Brands
              </a>
              <a 
                href="/auctions" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🔨 Auctions
              </a>
              <a 
                href="/how-it-works" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                📖 How It Works
              </a>
              <a 
                href="/why-choose-us" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ⭐ Why Choose Us
              </a>
              <a 
                href="/get-help" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🆘 Get Help
              </a>
                <div className="flex flex-col space-y-3 px-4 pt-6 border-t border-border">
                {user ? (
                  <div className="flex flex-col items-center space-y-3">
                    <NotificationBell />
                    <UserMenu />
                  </div>
                ) : (
                  <>
                    <Button variant="ghost" size="lg" className="text-base justify-start" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                    <Button variant="premium" size="lg" className="text-base" onClick={() => navigate('/auth')}>
                      Get Started Now
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}