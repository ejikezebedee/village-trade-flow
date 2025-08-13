import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  QrCode, 
  Scan, 
  Package, 
  Truck, 
  Store, 
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';

import type { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

interface QRScanData {
  qr_code: string;
  order_id: string;
  scan_stage: string;
  location?: any;
  notes?: string;
}

export const QRDeliverySystem: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [scanInput, setScanInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user and profile
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        fetchUserProfile(user.id);
        fetchOrders();
      }
    });
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id},driver_id.eq.${user.id},shop_id.eq.${user.id}`)
        .neq('current_stage', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);

    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (orderId: string, stage: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: {
          order_id: orderId,
          stage: stage,
          expires_hours: 24
        }
      });

      if (error) throw error;

      toast({
        title: "QR Code Generated",
        description: `QR code for ${stage} has been generated.`,
      });

      fetchOrders(); // Refresh to get updated QR codes
      return data.qr_code;

    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive"
      });
    }
  };

  const scanQRCode = async () => {
    try {
      setScanning(true);

      if (!scanInput.trim()) {
        toast({
          title: "Invalid QR Code",
          description: "Please enter a valid QR code.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('scan-qr', {
        body: {
          qr_code: scanInput.trim(),
          scanner_id: user.id,
          location: {
            // You would get this from device location
            timestamp: new Date().toISOString(),
            coordinates: null
          },
          notes: "Scanned via mobile app"
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Scan Successful",
          description: `Order stage updated to: ${data.new_stage}`,
        });

        setScanInput('');
        fetchOrders();
      } else {
        toast({
          title: "Scan Failed",
          description: data.error || "Invalid QR code or unauthorized scan.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error scanning QR code:', error);
      toast({
        title: "Error",
        description: "Failed to process QR scan.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'order_placed':
      case 'seller_preparing':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'driver_pickup':
      case 'in_transit':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'shop_delivery':
      case 'ready_for_collection':
        return <Store className="h-5 w-5 text-orange-600" />;
      case 'buyer_pickup':
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'order_placed':
      case 'seller_preparing':
        return 'bg-blue-100 text-blue-800';
      case 'driver_pickup':
      case 'in_transit':
        return 'bg-purple-100 text-purple-800';
      case 'shop_delivery':
      case 'ready_for_collection':
        return 'bg-orange-100 text-orange-800';
      case 'buyer_pickup':
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canGenerateQR = (order: Order, stage: string) => {
    const userRole = profile?.user_type;
    
    switch (stage) {
      case 'seller_to_driver':
        return order.seller_id === user?.id && order.current_stage === 'seller_preparing';
      case 'driver_to_shop':
        return order.driver_id === user?.id && order.current_stage === 'in_transit';
      case 'shop_to_buyer':
        return order.shop_id === user?.id && order.current_stage === 'shop_delivery';
      default:
        return false;
    }
  };

  const canScanQR = (order: Order) => {
    const userRole = profile?.user_type;
    
    switch (order.current_stage) {
      case 'seller_preparing':
        return order.driver_id === user?.id || userRole === 'driver';
      case 'in_transit':
        return order.shop_id === user?.id || userRole === 'shop';
      case 'shop_delivery':
        return order.buyer_id === user?.id;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="h-8 w-8 text-primary" />
            QR Delivery System
          </h1>
          <p className="text-muted-foreground">Secure order handoff with QR verification</p>
        </div>
      </div>

      {/* QR Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter or scan QR code"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={scanQRCode}
              disabled={scanning || !scanInput.trim()}
            >
              {scanning ? 'Scanning...' : 'Scan'}
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Secure Verification</p>
                <p className="text-blue-700">
                  QR codes ensure secure handoffs between seller, driver, shop, and buyer.
                  Each scan is verified and logged for security.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Active Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No active orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStageIcon(order.current_stage)}
                          <h3 className="font-semibold">{order.product_name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order #{order.order_number}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge className={getStageColor(order.current_stage)}>
                            {order.current_stage.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{order.order_status}</Badge>
                        </div>
                        
                        {/* Location Info */}
                        <div className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Pickup: {(order.pickup_location as any)?.community || 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Delivery: {(order.delivery_location as any)?.community || 'N/A'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* QR Code Generation */}
                        {canGenerateQR(order, 'seller_to_driver') && !order.seller_to_driver_qr && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateQRCode(order.id, 'seller_to_driver')}
                          >
                            Generate Pickup QR
                          </Button>
                        )}
                        
                        {canGenerateQR(order, 'driver_to_shop') && !order.driver_to_shop_qr && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateQRCode(order.id, 'driver_to_shop')}
                          >
                            Generate Drop-off QR
                          </Button>
                        )}
                        
                        {canGenerateQR(order, 'shop_to_buyer') && !order.shop_to_buyer_qr && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateQRCode(order.id, 'shop_to_buyer')}
                          >
                            Generate Collection QR
                          </Button>
                        )}

                        {/* QR Code Display */}
                        {order.seller_to_driver_qr && (
                          <div className="text-xs bg-muted p-2 rounded">
                            <strong>Pickup QR:</strong> {order.seller_to_driver_qr.slice(0, 15)}...
                          </div>
                        )}
                        
                        {order.driver_to_shop_qr && (
                          <div className="text-xs bg-muted p-2 rounded">
                            <strong>Drop-off QR:</strong> {order.driver_to_shop_qr.slice(0, 15)}...
                          </div>
                        )}
                        
                        {order.shop_to_buyer_qr && (
                          <div className="text-xs bg-muted p-2 rounded">
                            <strong>Collection QR:</strong> {order.shop_to_buyer_qr.slice(0, 15)}...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Next Action */}
                    {canScanQR(order) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-700">
                            Action Required: Scan QR code to confirm handoff
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};