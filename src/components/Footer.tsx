import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  QrCode, 
  Mail, 
  Phone, 
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Heart
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <QrCode className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">VillageMarket</h2>
                <Badge variant="secondary" className="text-xs">
                  Simple & Safe Trading
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Connecting local communities through secure, QR-verified trading. 
              Buy and sell with confidence in your neighborhood.
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" size="sm" className="p-2">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="p-2">
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/why-choose-us" className="text-muted-foreground hover:text-primary transition-colors">
                  Why Choose Us
                </a>
              </li>
              <li>
                <a href="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Browse Products
                </a>
              </li>
              <li>
                <a href="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Sign Up / Login
                </a>
              </li>
              <li>
                <a href="/feedback" className="text-muted-foreground hover:text-primary transition-colors">
                  Give Feedback
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/get-help" className="text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/get-help#faq" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/disputes" className="text-muted-foreground hover:text-primary transition-colors">
                  Dispute Resolution
                </a>
              </li>
              <li>
                <a href="/qr-tracking" className="text-muted-foreground hover:text-primary transition-colors">
                  QR Tracking
                </a>
              </li>
              <li>
                <a href="/language-settings" className="text-muted-foreground hover:text-primary transition-colors">
                  Language Settings
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@villagemarket.com</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1-800-VILLAGE</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Available in 50+ cities</span>
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                • 24/7 Support Available
              </Badge>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              © {currentYear} VillageMarket. Made with <Heart className="h-4 w-4 text-red-500" /> for local communities.
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </a>
            <Badge variant="secondary" className="text-xs">
              v2.1.0
            </Badge>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <div className="grid md:grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-primary mb-1">🔒 Secure</div>
              <div className="text-muted-foreground">End-to-end encryption</div>
            </div>
            <div>
              <div className="font-semibold text-primary mb-1">⚡ Fast</div>
              <div className="text-muted-foreground">QR-verified delivery</div>
            </div>
            <div>
              <div className="font-semibold text-primary mb-1">🌍 Local</div>
              <div className="text-muted-foreground">Community-focused</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}