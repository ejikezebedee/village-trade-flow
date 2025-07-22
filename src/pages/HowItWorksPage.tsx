import { Header } from "@/components/marketplace/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  CheckCircle,
  QrCode,
  Shield,
  MessageCircle,
  Star
} from "lucide-react";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              Simple & Secure Trading
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              How VillageMarket Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the simplest and safest way to buy and sell in your local community. 
              Our escrow system protects every transaction.
            </p>
          </div>

          {/* Steps Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="text-center p-6">
              <CardHeader>
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>1. Browse & Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Discover fresh products from local sellers. Browse categories, read reviews, and find exactly what you need.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>2. Secure Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Pay safely with our escrow system. Your money is held securely until you confirm delivery.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>3. QR Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your order with QR codes. From seller to driver to pickup location - every step is verified.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>4. Confirm & Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Scan the final QR to confirm delivery. Rate your experience and payment is released to the seller.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Process */}
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Complete Journey</h2>
              <p className="text-xl text-muted-foreground">
                Follow along as we walk through a typical transaction
              </p>
            </div>

            {/* For Buyers */}
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  For Buyers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      Find Products
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Browse local products, check seller ratings, and read reviews from other buyers.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      Secure Checkout
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Pay with confidence knowing your money is held in escrow until delivery is confirmed.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      Track Delivery
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Receive real-time updates as your order moves from seller to driver to pickup location.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                      Pickup & Rate
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Scan the QR code to confirm pickup and rate your experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Sellers */}
            <Card className="p-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Star className="h-6 w-6 text-primary" />
                  For Sellers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      List Products
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Upload photos, set prices, and describe your products. Our AI helps categorize them automatically.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      Receive Orders
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Get notified when orders come in. Payment is secured in escrow so you know you'll get paid.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      Prepare & Handoff
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Prepare your product and hand it off to the driver with a QR code scan for verification.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                      Get Paid
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Receive payment automatically when the buyer confirms delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card className="p-8 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Shield className="h-6 w-6 text-primary" />
                  Security & Trust
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h4 className="font-semibold mb-2">QR Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Every handoff is verified with secure QR codes
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h4 className="font-semibold mb-2">Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Payments held securely until delivery confirmed
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h4 className="font-semibold mb-2">Dispute Resolution</h4>
                    <p className="text-sm text-muted-foreground">
                      Community-driven mediation for any issues
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of satisfied users who trust VillageMarket for their local trading needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8" asChild>
                <Link to="/auth">Start Buying</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8" asChild>
                <Link to="/auth">Start Selling</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}