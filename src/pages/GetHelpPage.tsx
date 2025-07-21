import { Header } from "@/components/marketplace/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock,
  Search,
  HelpCircle,
  BookOpen,
  Shield,
  CreditCard,
  Truck,
  Users,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

export default function GetHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const faqCategories = [
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Payments & Escrow",
      questions: [
        {
          q: "How does the escrow system work?",
          a: "Our escrow system holds your payment securely until you confirm delivery. This protects both buyers and sellers by ensuring products are delivered before payment is released."
        },
        {
          q: "When will the seller receive payment?",
          a: "Payment is automatically released to the seller when you scan the final QR code to confirm pickup, or after 7 days if no issues are reported."
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, and mobile payment methods. All payments are processed securely through our encrypted system."
        }
      ]
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: "Delivery & QR Codes",
      questions: [
        {
          q: "How do QR codes work for delivery tracking?",
          a: "Each stage of delivery has a unique QR code: seller to driver, driver to pickup location, and pickup location to buyer. Scanning these codes confirms each handoff."
        },
        {
          q: "What if I can't scan the QR code?",
          a: "Contact our support team immediately. We can manually verify the delivery or provide alternative verification methods."
        },
        {
          q: "How long does delivery usually take?",
          a: "Most local deliveries are completed within 24-48 hours. You'll receive real-time updates as your order progresses through each stage."
        }
      ]
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Safety & Security",
      questions: [
        {
          q: "How do you verify sellers?",
          a: "All sellers go through identity verification and we monitor ratings and reviews. Sellers with poor performance are removed from the platform."
        },
        {
          q: "What if I receive a damaged product?",
          a: "Report the issue immediately through our dispute system. We'll investigate and provide a full refund or replacement as appropriate."
        },
        {
          q: "Is my personal information safe?",
          a: "Yes, we use enterprise-grade encryption and never share your personal information with third parties. Your privacy is our priority."
        }
      ]
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Account & Profile",
      questions: [
        {
          q: "How do I become a seller?",
          a: "Sign up for an account, complete the verification process, and start listing your products. Our team will review your application within 24 hours."
        },
        {
          q: "Can I change my user type later?",
          a: "Yes, you can upgrade your account to add seller privileges or other roles. Contact support to update your account type."
        },
        {
          q: "How do ratings and reviews work?",
          a: "After each completed transaction, both buyers and sellers can rate each other. These ratings help build trust in our community."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      qa => 
        qa.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        qa.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">
              24/7 Support Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              How Can We Help?
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Find answers to common questions, get in touch with our support team, 
              or explore our comprehensive help resources.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help topics, FAQs, guides..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card className="p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Get instant help from our support team
                </p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  • Online Now
                </Badge>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Email Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Send us a detailed message
                </p>
                <Badge variant="outline">
                  Response within 2 hours
                </Badge>
              </CardContent>
            </Card>

            <Card className="p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader className="pb-4">
                <div className="bg-gradient-primary p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Phone className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Phone Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Call us for urgent issues
                </p>
                <Badge variant="outline">
                  Mon-Fri 9AM-6PM
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Send Us a Message</h2>
              <Card className="p-6">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input type="email" placeholder="your.email@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <Input placeholder="Brief description of your issue" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <select className="w-full p-3 border border-border rounded-md bg-background">
                      <option>Payment Issue</option>
                      <option>Delivery Problem</option>
                      <option>Account Question</option>
                      <option>Technical Support</option>
                      <option>General Inquiry</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <Textarea 
                      placeholder="Please describe your issue in detail..."
                      className="min-h-32"
                    />
                  </div>
                  <Button className="w-full" size="lg">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Contact Information</h2>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Support Hours
                  </h3>
                  <div className="space-y-2 text-muted-foreground">
                    <p><strong>Live Chat:</strong> 24/7 available</p>
                    <p><strong>Email:</strong> 24/7 (2-hour response)</p>
                    <p><strong>Phone:</strong> Mon-Fri 9AM-6PM EST</p>
                    <p><strong>Emergency:</strong> 24/7 for urgent issues</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Emergency Contact
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    For urgent issues like payment problems or safety concerns:
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      +1-800-VILLAGE
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      emergency@villagemarket.com
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <h3 className="font-semibold mb-2">Community Forum</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with other users and get community support
                  </p>
                  <Button variant="outline" size="sm">
                    Visit Forum
                  </Button>
                </Card>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground">
                Find quick answers to the most common questions
              </p>
            </div>

            <div className="space-y-8">
              {(searchQuery ? filteredFAQs : faqCategories).map((category, categoryIndex) => (
                <Card key={categoryIndex} className="p-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="bg-gradient-primary p-2 rounded-lg text-primary-foreground">
                        {category.icon}
                      </div>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {category.questions.map((qa, qaIndex) => (
                        <div key={qaIndex} className="border-l-4 border-primary/20 pl-4">
                          <h4 className="font-semibold mb-2 flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            {qa.q}
                          </h4>
                          <p className="text-muted-foreground text-sm leading-relaxed ml-6">
                            {qa.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {searchQuery && filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or contact our support team directly
                </p>
                <Button variant="outline">Contact Support</Button>
              </div>
            )}
          </div>

          {/* Additional Resources */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">User Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete guide to using VillageMarket
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/how-it-works">Read Guide</a>
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Safety Tips</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Best practices for safe trading
              </p>
              <Button variant="outline" size="sm">
                Learn More
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join our user community
              </p>
              <Button variant="outline" size="sm">
                Join Now
              </Button>
            </Card>

            <Card className="p-6 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Feedback</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your suggestions
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/feedback">Give Feedback</a>
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}