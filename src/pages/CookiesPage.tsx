import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cookie, Settings, BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CookiesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center mb-8">
              <Cookie className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Cookie Policy
              </h1>
              <p className="text-muted-foreground text-lg">
                Learn about how we use cookies to improve your experience.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>What Are Cookies?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cookies are small text files that are stored on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  understanding how you use our platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Types of Cookies We Use
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Essential Cookies</h4>
                    <Badge variant="secondary">Required</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable core functionality 
                    such as security, network management, and accessibility.
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground ml-4">
                    <li>Authentication and login status</li>
                    <li>Shopping cart contents</li>
                    <li>Security tokens</li>
                    <li>Load balancing</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Functional Cookies</h4>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies enable enhanced functionality and personalization features.
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground ml-4">
                    <li>Language preferences</li>
                    <li>Regional settings</li>
                    <li>User interface customizations</li>
                    <li>Recently viewed products</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Analytics Cookies</h4>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies help us understand how visitors interact with our website.
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground ml-4">
                    <li>Page views and traffic sources</li>
                    <li>Time spent on pages</li>
                    <li>Popular content and features</li>
                    <li>Error tracking and performance monitoring</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Marketing Cookies</h4>
                    <Badge variant="outline">Optional</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    These cookies are used to deliver relevant advertisements and track campaign effectiveness.
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground ml-4">
                    <li>Targeted advertising</li>
                    <li>Social media integration</li>
                    <li>Cross-platform tracking</li>
                    <li>Conversion tracking</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Third-Party Cookies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  We may also use third-party services that set their own cookies. These include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Google Analytics:</strong> For website analytics and performance monitoring</li>
                  <li><strong>Payment Processors:</strong> For secure payment processing</li>
                  <li><strong>Social Media Platforms:</strong> For social sharing and login features</li>
                  <li><strong>Customer Support:</strong> For live chat and support ticket management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Managing Your Cookie Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Browser Settings</h4>
                  <p className="text-muted-foreground">
                    You can control cookies through your browser settings. Most browsers allow you to:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-muted-foreground ml-4">
                    <li>View which cookies are stored</li>
                    <li>Delete existing cookies</li>
                    <li>Block cookies from specific sites</li>
                    <li>Block third-party cookies</li>
                    <li>Clear all cookies when closing the browser</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Our Cookie Settings</h4>
                  <p className="text-muted-foreground mb-4">
                    You can manage your cookie preferences for our website using the settings below:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Cookie Preferences
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Cookie className="h-4 w-4 mr-2" />
                      Clear All Cookies
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Impact of Disabling Cookies</h4>
                  <p className="text-muted-foreground">
                    Please note that disabling certain cookies may affect the functionality of our website. 
                    Essential cookies cannot be disabled as they are required for basic website operation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about our use of cookies, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> privacy@villagemarket.com</p>
                  <p><strong>Phone:</strong> +1-800-VILLAGE</p>
                  <p><strong>Address:</strong> VillageMarket Privacy Team, 123 Market Street, City, State 12345</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}