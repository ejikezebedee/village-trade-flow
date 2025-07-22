import { Header } from "@/components/marketplace/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Users, CreditCard, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TermsPage() {
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
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Terms of Service
              </h1>
              <p className="text-muted-foreground text-lg">
                Please read these terms carefully before using our service.
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
                  <Users className="h-5 w-5 text-primary" />
                  Acceptance of Terms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  By accessing and using VillageMarket, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Use License</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Permission is granted to temporarily use VillageMarket for personal, non-commercial transitory viewing only. 
                  This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to reverse engineer any software contained on the website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Escrow System</h4>
                  <p className="text-muted-foreground">
                    All payments are held in escrow until the buyer confirms receipt of goods. 
                    This protects both buyers and sellers in every transaction.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Fees</h4>
                  <p className="text-muted-foreground">
                    VillageMarket charges a small transaction fee for facilitating secure payments and QR verification. 
                    All fees are clearly disclosed before completing any transaction.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Refunds</h4>
                  <p className="text-muted-foreground">
                    Refunds are processed according to our dispute resolution process. 
                    If goods are not delivered or are significantly different from description, 
                    buyers may request a full refund.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Conduct</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Users agree to use VillageMarket responsibly and in accordance with all applicable laws. 
                  Prohibited activities include:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Selling illegal, dangerous, or prohibited items</li>
                  <li>Misrepresenting products or services</li>
                  <li>Engaging in fraudulent activities</li>
                  <li>Harassing or threatening other users</li>
                  <li>Attempting to circumvent our security measures</li>
                  <li>Creating multiple accounts to manipulate ratings or reviews</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Dispute Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  VillageMarket provides a community-driven dispute resolution system. In case of disputes:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Users should first attempt to resolve the issue directly</li>
                  <li>If unsuccessful, either party can initiate a formal dispute</li>
                  <li>A neutral mediator will review the case and evidence</li>
                  <li>The mediator's decision is final and binding</li>
                  <li>Refunds or other remedies will be processed accordingly</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  VillageMarket acts as a facilitator between buyers and sellers. While we implement security measures 
                  and dispute resolution processes, we are not liable for the actions of individual users or the 
                  quality of goods and services traded on our platform. Users engage in transactions at their own risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong>Email:</strong> legal@villagemarket.com</p>
                  <p><strong>Phone:</strong> +1-800-VILLAGE</p>
                  <p><strong>Address:</strong> VillageMarket Legal Team, 123 Market Street, City, State 12345</p>
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