import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Menu } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <QrCode className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">VillageMarket</h1>
              <Badge variant="secondary" className="text-xs">
                Secure Trading Platform
              </Badge>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost">
              Login
            </Button>
            <Button variant="premium">
              Join Platform
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
            <nav className="py-4 space-y-4">
              <a href="#features" className="block px-4 py-2 text-foreground hover:text-primary">
                Features
              </a>
              <a href="#how-it-works" className="block px-4 py-2 text-foreground hover:text-primary">
                How It Works
              </a>
              <a href="#pricing" className="block px-4 py-2 text-foreground hover:text-primary">
                Pricing
              </a>
              <a href="#contact" className="block px-4 py-2 text-foreground hover:text-primary">
                Contact
              </a>
              <div className="flex flex-col space-y-2 px-4 pt-4 border-t border-border">
                <Button variant="ghost">Login</Button>
                <Button variant="premium">Join Platform</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}