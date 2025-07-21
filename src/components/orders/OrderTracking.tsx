import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Truck, 
  Store, 
  User, 
  CheckCircle, 
  Clock,
  MapPin,
  QrCode
} from 'lucide-react';
import { QRCodeDisplay } from '@/components/qr/QRCodeDisplay';
import { QRCodeScanner } from '@/components/qr/QRCodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  product_name: string;
  total_amount: number;
  current_stage: string;
  seller_to_driver_qr?: string;
  driver_to_shop_qr?: string;
  shop_to_buyer_qr?: string;
  buyer_id: string;
  seller_id: string;
  driver_id?: string;
  shop_id?: string;
  created_at: string;
  updated_at: string;
}

interface OrderTrackingProps {
  orderId: string;
  userRole?: 'buyer' | 'seller' | 'driver' | 'shop' | 'admin';
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderId, userRole = 'buyer' }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');
  const { toast } = useToast();

  const stages = [
    { key: 'seller_preparing', label: 'Seller Preparing', icon: Package, description: 'Seller is preparing your order' },
    { key: 'driver_pickup', label: 'Ready for Pickup', icon: Clock, description: 'Waiting for driver to collect' },
    { key: 'in_transit', label: 'In Transit', icon: Truck, description: 'Driver is delivering to shop' },
    { key: 'shop_delivery', label: 'At Shop', icon: Store, description: 'Delivered to local shop' },
    { key: 'buyer_pickup', label: 'Ready for Collection', icon: User, description: 'Ready for buyer to collect' },
    { key: 'completed', label: 'Completed', icon: CheckCircle, description: 'Order completed successfully' }
  ];

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast({
        title: "Error",
        description: "Failed to load order details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = () => {
    return stages.findIndex(stage => stage.key === order?.current_stage);
  };

  const getStageStatus = (stageIndex: number) => {
    const currentIndex = getCurrentStageIndex();
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  };

  const canShowQR = (stage: string) => {
    if (!order) return false;
    
    switch (stage) {
      case 'SELLER_TO_DRIVER':
        return userRole === 'seller' && (order.current_stage === 'driver_pickup' || order.current_stage === 'seller_preparing');
      case 'DRIVER_TO_SHOP':
        return userRole === 'driver' && order.current_stage === 'in_transit';
      case 'SHOP_TO_BUYER':
        return userRole === 'shop' && (order.current_stage === 'shop_delivery' || order.current_stage === 'buyer_pickup');
      default:
        return false;
    }
  };

  const canScanQR = () => {
    if (!order) return false;
    
    switch (userRole) {
      case 'driver':
        return order.current_stage === 'driver_pickup';
      case 'shop':
        return order.current_stage === 'in_transit';
      case 'buyer':
        return order.current_stage === 'buyer_pickup';
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
          <p className="text-muted-foreground">The requested order could not be found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-2">{order.product_name}</CardTitle>
            <p className="text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
            <Badge variant="secondary">
              {order.current_stage.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6">
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const status = getStageStatus(index);
                const Icon = stage.icon;
                
                return (
                  <div key={stage.key} className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      status === 'completed' ? 'bg-green-100 text-green-600' :
                      status === 'current' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${
                          status === 'current' ? 'text-blue-600' : ''
                        }`}>
                          {stage.label}
                        </h4>
                        {status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {status === 'current' && (
                          <Clock className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="qr-codes" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {canShowQR('SELLER_TO_DRIVER') && (
                <QRCodeDisplay
                  orderId={order.id}
                  stage="SELLER_TO_DRIVER"
                  currentStage={order.current_stage}
                  existingQRCode={order.seller_to_driver_qr}
                  onQRGenerated={fetchOrder}
                />
              )}
              
              {canShowQR('DRIVER_TO_SHOP') && (
                <QRCodeDisplay
                  orderId={order.id}
                  stage="DRIVER_TO_SHOP"
                  currentStage={order.current_stage}
                  existingQRCode={order.driver_to_shop_qr}
                  onQRGenerated={fetchOrder}
                />
              )}
              
              {canShowQR('SHOP_TO_BUYER') && (
                <QRCodeDisplay
                  orderId={order.id}
                  stage="SHOP_TO_BUYER"
                  currentStage={order.current_stage}
                  existingQRCode={order.shop_to_buyer_qr}
                  onQRGenerated={fetchOrder}
                />
              )}
            </div>

            {!canShowQR('SELLER_TO_DRIVER') && !canShowQR('DRIVER_TO_SHOP') && !canShowQR('SHOP_TO_BUYER') && (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No QR Codes Available</h3>
                <p className="text-muted-foreground">
                  QR codes will be available when it's time for the next handoff stage.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="scanner" className="space-y-6">
            {canScanQR() ? (
              <div className="flex justify-center">
                <QRCodeScanner onScanComplete={fetchOrder} />
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scanner Not Available</h3>
                <p className="text-muted-foreground">
                  You can scan QR codes when it's your turn in the delivery process.
                </p>
                <Badge variant="outline" className="mt-2">
                  Current role: {userRole}
                </Badge>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};