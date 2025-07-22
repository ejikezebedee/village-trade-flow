import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPage() {
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
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-muted-foreground text-lg">
                Your privacy is important to us. Learn how we protect your data.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information</h4>
                  <p className="text-muted-foreground">
                    We collect information you provide when creating an account, such as your name, email address, phone number, and profile details.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Transaction Information</h4>
                  <p className="text-muted-foreground">
                    We collect information about your purchases, sales, and other transactions on our platform, including payment details and delivery addresses.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Usage Information</h4>
                  <p className="text-muted-foreground">
                    We collect information about how you use our platform, including search queries, product views, and interaction patterns.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>To provide and improve our marketplace services</li>
                  <li>To process transactions and facilitate payments</li>
                  <li>To communicate with you about your account and transactions</li>
                  <li>To provide customer support and resolve disputes</li>
                  <li>To detect and prevent fraud and abuse</li>
                  <li>To comply with legal obligations</li>
                  <li>To send you marketing communications (with your consent)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-primary" />
                  Data Protection & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Encryption</h4>
                  <p className="text-muted-foreground">
                    All sensitive data is encrypted in transit and at rest using industry-standard encryption protocols.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Access Controls</h4>
                  <p className="text-muted-foreground">
                    We implement strict access controls to ensure only authorized personnel can access your personal information.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Regular Audits</h4>
                  <p className="text-muted-foreground">
                    We conduct regular security audits and vulnerability assessments to maintain the highest security standards.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> You can request access to your personal information</li>
                  <li><strong>Correction:</strong> You can update or correct your information</li>
                  <li><strong>Deletion:</strong> You can request deletion of your account and data</li>
                  <li><strong>Portability:</strong> You can request a copy of your data in a portable format</li>
                  <li><strong>Objection:</strong> You can object to certain processing of your data</li>
                  <li><strong>Restriction:</strong> You can request restriction of processing in certain circumstances</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
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