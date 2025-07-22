import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  Search, 
  HelpCircle, 
  CreditCard, 
  Truck, 
  Shield, 
  Users, 
  MessageCircle,
  ArrowLeft
} from "lucide-react";
import { Link } from "react-router-dom";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  icon: any;
}

const faqData: FAQItem[] = [
  // Payments & Escrow
  {
    id: "p1",
    question: "How does the escrow system work?",
    answer: "Our escrow system holds your payment securely until you confirm delivery. This protects both buyers and sellers by ensuring products are delivered before payment is released. When you make a purchase, funds are held in escrow and automatically released to the seller when you scan the final QR code to confirm pickup, or after 7 days if no issues are reported.",
    category: "Payments & Escrow",
    icon: Shield
  },
  {
    id: "p2", 
    question: "When will the seller receive payment?",
    answer: "Payment is automatically released to the seller when you scan the final QR code to confirm pickup, or after 7 days if no issues are reported. This ensures you receive your product before the seller gets paid, providing maximum security for your purchase.",
    category: "Payments & Escrow",
    icon: CreditCard
  },
  {
    id: "p3",
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, debit cards, and mobile payment methods including Apple Pay, Google Pay, and PayPal. All payments are processed securely through our encrypted system with bank-level security protocols.",
    category: "Payments & Escrow",
    icon: CreditCard
  },
  {
    id: "p4",
    question: "Is my payment information secure?",
    answer: "Yes, absolutely. We use industry-standard SSL encryption and PCI DSS compliance to protect your payment information. Your card details are never stored on our servers and all transactions are processed through secure, certified payment gateways.",
    category: "Payments & Escrow",
    icon: Shield
  },

  // Delivery & QR Codes
  {
    id: "d1",
    question: "How do QR codes work for delivery tracking?",
    answer: "Each stage of delivery has a unique QR code: seller to driver, driver to pickup location, and pickup location to buyer. Scanning these codes confirms each handoff and provides real-time tracking updates. This system ensures transparency and accountability throughout the entire delivery process.",
    category: "Delivery & QR Codes",
    icon: Truck
  },
  {
    id: "d2",
    question: "What if I can't scan the QR code?",
    answer: "Contact our support team immediately if you can't scan a QR code. We can manually verify the delivery or provide alternative verification methods. You can reach us through live chat, email, or phone for instant assistance.",
    category: "Delivery & QR Codes", 
    icon: HelpCircle
  },
  {
    id: "d3",
    question: "How long does delivery usually take?",
    answer: "Most local deliveries are completed within 24-48 hours. You'll receive real-time updates as your order progresses through each stage. Delivery time may vary based on distance, product type, and local driver availability.",
    category: "Delivery & QR Codes",
    icon: Truck
  },
  {
    id: "d4",
    question: "Can I track my order in real-time?",
    answer: "Yes! Our QR-based tracking system provides real-time updates at every stage of delivery. You'll get notifications when your order is picked up, in transit, and ready for pickup. You can view the complete delivery timeline in your account dashboard.",
    category: "Delivery & QR Codes",
    icon: Truck
  },

  // Orders & Shopping
  {
    id: "o1",
    question: "How do I place an order?",
    answer: "Browse products, click 'Buy Now' on your chosen item, select quantity, and proceed to checkout. You'll need to create an account and verify your location for delivery. Payment is held securely in escrow until you confirm receipt of your order.",
    category: "Orders & Shopping",
    icon: Users
  },
  {
    id: "o2",
    question: "Can I modify or cancel my order?",
    answer: "You can modify or cancel your order before the seller confirms it (usually within 30 minutes). Once the seller starts preparing your order, modifications may not be possible. Contact the seller directly through our messaging system to discuss any changes.",
    category: "Orders & Shopping",
    icon: Users
  },
  {
    id: "o3",
    question: "What if I receive a damaged or wrong product?",
    answer: "If you receive a damaged or incorrect product, don't scan the final QR code. Instead, report the issue immediately through our dispute resolution system. Our escrow system will protect your payment while we investigate and resolve the issue with the seller.",
    category: "Orders & Shopping",
    icon: Shield
  },

  // Affiliates & Commissions
  {
    id: "a1",
    question: "How do I become an affiliate?",
    answer: "Sign up for our affiliate program through your account dashboard. Once approved, you'll receive a unique referral link and access to marketing materials. Start earning commissions by referring new customers to VillageMarket.",
    category: "Affiliates & Commissions",
    icon: Users
  },
  {
    id: "a2",
    question: "How are commissions paid?",
    answer: "Affiliate commissions are calculated monthly and paid out via your chosen payment method (bank transfer, PayPal, or digital wallet). Payments are made by the 15th of each month for the previous month's earnings, with a minimum payout threshold of $50.",
    category: "Affiliates & Commissions",
    icon: CreditCard
  },
  {
    id: "a3",
    question: "What commission rates do you offer?",
    answer: "Our commission structure ranges from 5-15% depending on your tier level and performance. New affiliates start at 5%, with opportunities to earn higher rates based on sales volume, customer retention, and referral quality.",
    category: "Affiliates & Commissions",
    icon: Users
  },

  // Support & Account
  {
    id: "s1",
    question: "How to contact support?",
    answer: "You can reach our support team 24/7 through multiple channels: live chat (fastest response), email at support@villagemarket.com, or phone at +1-800-VILLAGE. We also have a comprehensive help center with guides and video tutorials.",
    category: "Support & Account",
    icon: MessageCircle
  },
  {
    id: "s2",
    question: "How do I reset my password?",
    answer: "Click 'Forgot Password' on the login page and enter your email address. We'll send you a secure reset link. If you don't receive the email within 5 minutes, check your spam folder or contact support for assistance.",
    category: "Support & Account",
    icon: Users
  },
  {
    id: "s3",
    question: "Can I delete my account?",
    answer: "Yes, you can delete your account at any time through Account Settings > Privacy > Delete Account. Please note that this action is permanent and will remove all your data, order history, and earned credits. Consider deactivating instead if you might return.",
    category: "Support & Account",
    icon: Users
  }
];

const categories = [
  { name: "All", icon: HelpCircle, count: faqData.length },
  { name: "Payments & Escrow", icon: CreditCard, count: faqData.filter(faq => faq.category === "Payments & Escrow").length },
  { name: "Delivery & QR Codes", icon: Truck, count: faqData.filter(faq => faq.category === "Delivery & QR Codes").length },
  { name: "Orders & Shopping", icon: Users, count: faqData.filter(faq => faq.category === "Orders & Shopping").length },
  { name: "Affiliates & Commissions", icon: Users, count: faqData.filter(faq => faq.category === "Affiliates & Commissions").length },
  { name: "Support & Account", icon: MessageCircle, count: faqData.filter(faq => faq.category === "Support & Account").length }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <>
      <Helmet>
        <title>Frequently Asked Questions - VillageMarket</title>
        <meta 
          name="description" 
          content="Find quick answers to the most common questions about VillageMarket. Learn about our escrow system, QR delivery tracking, payments, and more."
        />
        <meta 
          name="keywords" 
          content="FAQ, help, support, escrow, QR codes, delivery, payments, marketplace, questions, answers"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 lg:px-8 py-8">
          
          {/* Back to Home Button */}
          <div className="mb-6">
            <Button asChild variant="outline" className="mb-4">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">Frequently Asked Questions</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to the most common questions about our platform
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.name)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* FAQ Items */}
          <div className="max-w-4xl mx-auto">
            {filteredFAQs.length > 0 ? (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => {
                  const Icon = faq.icon;
                  const isOpen = openItems.includes(faq.id);
                  
                  return (
                    <Card key={faq.id} className="apple-card">
                      <Collapsible open={isOpen} onOpenChange={() => toggleItem(faq.id)}>
                        <CollapsibleTrigger className="w-full">
                          <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-left">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-lg font-semibold">{faq.question}</span>
                              </div>
                              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                                isOpen ? 'transform rotate-180' : ''
                              }`} />
                            </CardTitle>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="pl-14">
                              <p className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                              </p>
                              <Badge variant="outline" className="mt-3">
                                {faq.category}
                              </Badge>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="apple-card">
                <CardContent className="p-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or browse different categories.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All");
                    }}
                  >
                    Clear Search
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Support CTA */}
          <div className="max-w-2xl mx-auto mt-12">
            <Card className="apple-card border-primary/20 bg-primary/5">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">
                  Our support team is here to help you 24/7. Get in touch with us for personalized assistance.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild>
                    <Link to="/get-help">Contact Support</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/auth">Join VillageMarket</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}