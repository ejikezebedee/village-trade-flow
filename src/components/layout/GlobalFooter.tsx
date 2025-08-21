import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  const footerSections = {
    company: {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Why Choose Us', href: '/why-choose-us' },
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' }
      ]
    },
    marketplace: {
      title: 'Marketplace',
      links: [
        { label: 'Browse Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'Best Sellers', href: '/best-sellers' },
        { label: 'New Arrivals', href: '/new-products' },
        { label: 'Flash Sales', href: '/flash-sales' }
      ]
    },
    support: {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/get-help' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Security', href: '/security' },
        { label: 'Feedback', href: '/feedback' }
      ]
    },
    legal: {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
        { label: 'Dispute Resolution', href: '/disputes' }
      ]
    }
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">VM</span>
              </div>
              <span className="font-bold text-xl">VillageMarket</span>
            </div>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              Connecting rural communities with global markets through secure, 
              community-driven commerce. Empowering local sellers, buyers, and 
              delivery partners across Nigeria and beyond.
            </p>
            
            {/* Regional Focus */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">🇳🇬 Nigeria</Badge>
              <Badge variant="outline">🌍 Global</Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Lagos, Nigeria</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@villagemarket.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+234 (0) 800 VILLAGE</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(footerSections).map(([key, section]) => (
            <div key={key}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <span>© {currentYear} VillageMarket. All rights reserved.</span>
            <div className="flex items-center gap-1">
              <span>Made with ❤️ for</span>
              <Badge variant="outline" className="text-xs">Rural Communities</Badge>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com/villagemarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://twitter.com/villagemarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://instagram.com/villagemarket"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Security & Trust Indicators */}
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Secure Platform</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Escrow Protection</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>2FA Security</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Community Verified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}