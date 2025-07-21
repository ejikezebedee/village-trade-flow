import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/marketplace/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Plus,
  ArrowLeft,
  Trash2,
  Star,
  Home,
  Building,
  Edit3
} from "lucide-react";
import { Link } from "react-router-dom";

export default function DeliveryAddressesPage() {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Mock addresses data
  const mockAddresses = [
    {
      id: "1",
      type: "home",
      name: "Home",
      street: "123 Main Street",
      city: "Springfield",
      state: "IL", 
      zipCode: "62701",
      country: "United States",
      isDefault: true,
      instructions: "Leave at front door"
    },
    {
      id: "2",
      type: "work", 
      name: "Work Office",
      street: "456 Business Ave, Suite 200",
      city: "Springfield", 
      state: "IL",
      zipCode: "62702",
      country: "United States",
      isDefault: false,
      instructions: "Reception desk"
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
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      // For demo purposes, using mock data
      setTimeout(() => {
        setAddresses(mockAddresses);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery addresses. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const makeDefault = async (addressId) => {
    try {
      setAddresses(addresses => 
        addresses.map(address => ({
          ...address,
          isDefault: address.id === addressId
        }))
      );
      toast({
        title: "Success",
        description: "Default delivery address updated."
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to update default address.",
        variant: "destructive"
      });
    }
  };

  const removeAddress = async (addressId) => {
    try {
      setAddresses(addresses => addresses.filter(address => address.id !== addressId));
      toast({
        title: "Success",
        description: "Address removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove address.",
        variant: "destructive"
      });
    }
  };

  const getAddressIcon = (type) => {
    switch (type) {
      case "home":
        return <Home className="h-5 w-5" />;
      case "work":
        return <Building className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Please log in to view your delivery addresses</h2>
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
                Delivery Addresses
              </h1>
            </div>
            <p className="text-muted-foreground">
              Manage your delivery addresses for quick and easy checkout
            </p>
          </div>

          {/* Add New Address */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Add New Address</h3>
                    <p className="text-sm text-muted-foreground">
                      Add a home, work, or other delivery address
                    </p>
                  </div>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Addresses List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Your Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No delivery addresses</h3>
                  <p className="text-muted-foreground mb-4">Add your first delivery address to get started</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-muted rounded-full">
                          {getAddressIcon(address.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{address.name}</h4>
                            {address.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{address.street}</p>
                            <p>{address.city}, {address.state} {address.zipCode}</p>
                            <p>{address.country}</p>
                            {address.instructions && (
                              <p className="text-xs">
                                <span className="font-medium">Instructions:</span> {address.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => makeDefault(address.id)}
                          >
                            Make Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAddress(address.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {addresses.length > 0 && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-sm">Delivery Information</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your addresses are securely stored and only used for delivery purposes. 
                        You can update or remove them at any time.
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