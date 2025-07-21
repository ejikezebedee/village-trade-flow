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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - Larger for easier recognition */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-3 rounded-xl">
              <QrCode className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">VillageMarket</h1>
              <Badge variant="secondary" className="text-xs">
                Simple & Safe Trading
              </Badge>
            </div>
          </div>

          {/* Desktop Navigation - Simplified */}
          <nav className="hidden lg:flex items-center space-x-8">
            <a href="/how-it-works" className="text-lg text-foreground hover:text-primary transition-colors font-medium">
              How It Works
            </a>
            <a href="/why-choose-us" className="text-lg text-foreground hover:text-primary transition-colors font-medium">
              Why Choose Us
            </a>
            <a href="/get-help" className="text-lg text-foreground hover:text-primary transition-colors font-medium">
              Get Help
            </a>
          </nav>

          {/* Action Buttons - Larger and clearer */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center gap-4">
                <NotificationBell />
                <UserMenu />
              </div>
            ) : (
              <>
                <Button variant="ghost" size="lg" className="text-base" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button variant="premium" size="lg" className="text-base px-6" onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Larger touch target */}
          <Button 
            variant="ghost" 
            size="lg"
            className="lg:hidden p-3"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu - Simplified and touch-friendly */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-md">
            <nav className="py-6 space-y-1">
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