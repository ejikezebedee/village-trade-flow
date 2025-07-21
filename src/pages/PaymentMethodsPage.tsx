import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus,
  ArrowLeft,
  Trash2,
  Star,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentMethodsPage() {
  const [user, setUser] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock payment methods data
  const mockPaymentMethods = [
    {
      id: "1",
      type: "credit_card",
      last4: "4242",
      brand: "Visa",
      expires: "12/25",
      isDefault: true,
      nickname: "Main Card"
    },
    {
      id: "2", 
      type: "credit_card",
      last4: "8888",
      brand: "Mastercard", 
      expires: "08/26",
      isDefault: false,
      nickname: "Business Card"
    }
  ];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, using mock data
      setTimeout(() => {
        setPaymentMethods(mockPaymentMethods);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: "Error",
        description: "Failed to load payment methods. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const makeDefault = async (methodId) => {
    try {
      setPaymentMethods(methods => 
        methods.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
      toast({
        title: "Success",
        description: "Default payment method updated."
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update default payment method.",
        variant: "destructive"
      });
    }
  };

  const removePaymentMethod = async (methodId) => {
    try {
      setPaymentMethods(methods => methods.filter(method => method.id !== methodId));
      toast({
        title: "Success",
        description: "Payment method removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive"
      });
    }
  };

  const getCardIcon = (brand) => {
    return <CreditCard className="h-6 w-6" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your payment methods</h2>
              <Button onClick={() => window.location.href = '/auth'}>
                Go to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header with Back Button */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Payment Methods
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your payment methods for secure and convenient transactions
            </p>
          </div>

          {/* Add New Payment Method */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Add New Payment Method</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a credit card, debit card, or other payment method
                    </p>
                  </div>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Your Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading payment methods...</p>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No payment methods</h3>
                  <p className="text-muted-foreground mb-4">Add a payment method to start making purchases</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Payment Method
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-muted rounded-full">
                          {getCardIcon(method.brand)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {method.brand} •••• {method.last4}
                            </h4>
                            {method.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Expires {method.expires}</span>
                            {method.nickname && (
                              <span>• {method.nickname}</span>
                            )}
                            <div className="flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => makeDefault(method.id)}
                          >
                            Make Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePaymentMethod(method.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paymentMethods.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Secure Payments</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        All payment information is encrypted and securely stored. 
                        We never store your full card details on our servers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}