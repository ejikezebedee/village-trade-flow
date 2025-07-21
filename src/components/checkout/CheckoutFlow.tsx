import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Shield, Truck, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  seller_id: string;
  image?: string;
}

interface CheckoutFlowProps {
  product: Product;
  quantity: number;
  onClose: () => void;
}

interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ product, quantity, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const totalAmount = product.price * quantity;
  const tax = totalAmount * 0.08; // 8% tax
  const shipping = 9.99;
  const finalTotal = totalAmount + tax + shipping;

  const steps = [
    { number: 1, title: 'Review Order', icon: CheckCircle },
    { number: 2, title: 'Shipping Details', icon: Truck },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Confirmation', icon: Shield }
  ];

  const handleShippingChange = (field: keyof ShippingDetails, value: string) => {
    setShippingDetails(prev => ({ ...prev, [field]: value }));
  };

  const validateShipping = () => {
    return Object.values(shippingDetails).every(value => value.trim() !== '');
  };

  const processPayment = async () => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to complete your purchase.",
          variant: "destructive"
        });
        return;
      }

      // Create order in database with notifications
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: product.seller_id,
          product_name: product.name,
          product_price: product.price,
          quantity,
          total_amount: finalTotal,
          shipping_address: shippingDetails as any,
          order_status: 'pending',
          payment_status: 'pending',
          current_stage: 'seller_preparing'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create payment session with Stripe
      const { data: paymentData, error: paymentError } = await supabase.functions
        .invoke("create-payment", {
          body: { orderId: order.id }
        });

      if (paymentError) throw paymentError;

      // Redirect to Stripe Checkout in new tab
      if (paymentData.url) {
        window.open(paymentData.url, '_blank');
        onClose();
        
        // Send automated messages for order placed
        try {
          await supabase.functions.invoke('send-automated-messages', {
            body: {
              messageType: 'order_placed',
              orderId: order.id
            }
          });
        } catch (messageError) {
          console.error('Failed to send automated messages:', messageError);
          // Don't fail the whole process if messaging fails
        }

        toast({
          title: "Redirecting to payment",
          description: "Complete your secure payment with escrow protection in the new tab.",
        });
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 border rounded-lg">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-muted-foreground">Quantity: {quantity}</p>
                <p className="font-medium">${product.price.toFixed(2)} each</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Escrow Protection</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Your payment will be held securely until you confirm receipt of the item.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={shippingDetails.fullName}
                  onChange={(e) => handleShippingChange('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={shippingDetails.phone}
                  onChange={(e) => handleShippingChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={shippingDetails.address}
                onChange={(e) => handleShippingChange('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={shippingDetails.city}
                  onChange={(e) => handleShippingChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={shippingDetails.state}
                  onChange={(e) => handleShippingChange('state', e.target.value)}
                  placeholder="NY"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={shippingDetails.zipCode}
                  onChange={(e) => handleShippingChange('zipCode', e.target.value)}
                  placeholder="10001"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border">
              <h3 className="font-semibold text-lg mb-2">Escrow Payment Summary</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your payment will be held securely until you confirm receipt of your order.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Order Total:</span>
                  <span className="font-semibold">${finalTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Escrow Protection Fee:</span>
                  <span>Free</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">How Escrow Works:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <p>Your payment is held securely in escrow</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <p>Seller ships your order</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <p>You confirm receipt and release payment</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Funds will be automatically released to the seller after 14 days if no disputes are raised.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-800">Order Confirmed!</h3>
              <p className="text-muted-foreground mt-2">
                Your order has been placed and payment is secured in escrow.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg text-left">
              <h4 className="font-medium text-green-800 mb-2">What happens next?</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Seller will be notified to ship your order</li>
                <li>• You'll receive tracking information once shipped</li>
                <li>• Confirm receipt to release payment to seller</li>
                <li>• Rate your experience (optional)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Order Total:</span>
                <span className="font-medium">${finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payment Status:</span>
                <Badge variant="secondary">Held in Escrow</Badge>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Checkout</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.number <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.number <= currentStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`ml-2 text-sm ${
                  step.number <= currentStep ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-4 ${
                    step.number < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : onClose()}
              disabled={isProcessing}
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            {currentStep < 4 && (
              <Button
                onClick={() => {
                  if (currentStep === 2 && !validateShipping()) {
                    toast({
                      title: "Missing Information",
                      description: "Please fill in all shipping details.",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (currentStep === 3) {
                    processPayment();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={isProcessing}
              >
                {currentStep === 3 ? (isProcessing ? 'Processing...' : 'Complete Payment') : 'Continue'}
              </Button>
            )}
            
            {currentStep === 4 && (
              <Button onClick={onClose}>
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};