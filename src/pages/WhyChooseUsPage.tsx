import { Header } from "@/components/marketplace/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Shield, 
  Clock, 
  Users, 
  MapPin,
  Star,
  Zap,
  Heart,
  TrendingUp,
  CheckCircle,
  Award,
  Globe,
  Smartphone
} from "lucide-react";

export default function WhyChooseUsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Trusted by Thousands
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Why Choose VillageMarket?
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              We're not just another marketplace. We're your trusted partner in local commerce,
              built with security, simplicity, and community at our core.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg" className="mb-4">
                ← Back to Home
              </Button>
            </Link>
          </div>

          {/* Key Benefits Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>100% Secure Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your money is protected with our escrow system. Payments are only released when you confirm delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Lightning Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Local products delivered quickly to convenient pickup locations. Most orders ready within 24 hours.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Community-Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Built by locals, for locals. Support your community while getting the freshest products.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Smart Technology</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  QR code tracking, AI-powered recommendations, and real-time notifications keep you informed.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Quality Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Verified sellers, customer reviews, and our dispute resolution system ensure quality every time.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-2 hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle>Convenient Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pick up your orders at local shops and businesses. No waiting at home for deliveries.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">How We Compare</h2>
            <Card className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-2">Feature</th>
                      <th className="text-center py-4 px-2 text-primary font-bold">VillageMarket</th>
                      <th className="text-center py-4 px-2 text-muted-foreground">Traditional Marketplace</th>
                      <th className="text-center py-4 px-2 text-muted-foreground">Local Classifieds</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="py-4 px-2 font-medium">Payment Protection</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">Limited</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">None</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2 font-medium">QR Code Tracking</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2 font-medium">Local Focus</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2 font-medium">Dispute Resolution</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">Limited</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-4 px-2 font-medium">Fresh Products</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">Variable</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-2 font-medium">Community Support</td>
                      <td className="py-4 px-2 text-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-2 text-center text-muted-foreground">❌</td>
                      <td className="py-4 px-2 text-center text-muted-foreground">Limited</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Local Sellers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <p className="text-muted-foreground">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>

          {/* Features Showcase */}
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Makes Us Different</h2>
              <p className="text-xl text-muted-foreground">
                Innovation meets tradition in our marketplace platform
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Globe className="h-6 w-6 text-primary" />
                  Multi-Language Support
                </h3>
                <p className="text-muted-foreground mb-6">
                  Shop in your preferred language. Our platform supports multiple languages with real-time translation for product descriptions and communications.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Automatic language detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time translation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Cultural localization</span>
                  </li>
                </ul>
              </div>
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="text-center">
                  <Globe className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h4 className="font-semibold mb-2">Available in 20+ Languages</h4>
                  <p className="text-sm text-muted-foreground">
                    Breaking down language barriers in local commerce
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 order-2 lg:order-1">
                <div className="text-center">
                  <Smartphone className="h-16 w-16 mx-auto mb-4 text-primary" />
                  <h4 className="font-semibold mb-2">Mobile-First Design</h4>
                  <p className="text-sm text-muted-foreground">
                    Optimized for on-the-go trading and communications
                  </p>
                </div>
              </Card>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Smartphone className="h-6 w-6 text-primary" />
                  Smart Mobile Experience
                </h3>
                <p className="text-muted-foreground mb-6">
                  Designed for mobile users who need quick access to local commerce. Scan QR codes, get notifications, and manage your trades on the go.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Native mobile optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Offline-capable features</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Push notifications</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6">
                <CardContent className="pt-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "The escrow system gives me complete peace of mind. I know my money is safe until I get my products."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      S
                    </div>
                    <div>
                      <p className="font-semibold">Sarah M.</p>
                      <p className="text-sm text-muted-foreground">Regular Buyer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="pt-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "I've increased my sales by 300% since joining VillageMarket. The QR system is brilliant!"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      J
                    </div>
                    <div>
                      <p className="font-semibold">James L.</p>
                      <p className="text-sm text-muted-foreground">Local Farmer</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardContent className="pt-0">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "Fast delivery, fresh products, and excellent customer service. Exactly what our community needed."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                      M
                    </div>
                    <div>
                      <p className="font-semibold">Maria R.</p>
                      <p className="text-sm text-muted-foreground">Business Owner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16 p-12 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
            <Award className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-3xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the growing community of satisfied users who have discovered a better way to trade locally.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <a href="/auth">Get Started Today</a>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <a href="/how-it-works">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}