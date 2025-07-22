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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Mobile optimized */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 apple-button rounded-lg px-2 py-1">
            <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg">
              <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">VillageMarket</h1>
          </Link>

          {/* Desktop Navigation - Apple-style clean */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link to="/" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Home
            </Link>
            <Link to="/flash-sales" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Flash Sales
            </Link>
            <Link to="/blogs" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Blogs
            </Link>
            <Link to="/brands" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              All Brands
            </Link>
            <Link to="/categories" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              All Categories
            </Link>
            <Link to="/auctions" className="text-sm text-foreground hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-muted/50 font-medium">
              Auctions
            </Link>
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
              <Link 
                to="/" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 Home
              </Link>
              <Link 
                to="/flash-sales" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ⚡ Flash Sales
              </Link>
              <Link 
                to="/blogs" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                📝 Blogs
              </Link>
              <Link 
                to="/brands" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                👑 All Brands
              </Link>
              <Link 
                to="/categories" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                📂 All Categories
              </Link>
              <Link 
                to="/auctions" 
                className="block px-4 py-4 text-lg font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🔨 Auctions
              </Link>
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