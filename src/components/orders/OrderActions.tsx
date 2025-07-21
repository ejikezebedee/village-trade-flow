import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Truck, CheckCircle, Package, Clock } from 'lucide-react';

interface Order {
  id: string;
  product_name: string;
  order_status: string;
  current_stage: string;
  total_amount: number;
  buyer_id: string;
  seller_id: string;
  payment_status: string;
  created_at: string;
}

interface OrderActionsProps {
  order: Order;
  userRole: 'buyer' | 'seller';
  onOrderUpdate: () => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order, userRole, onOrderUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShipOrder = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          orderId: order.id,
          action: 'ship'
        }
      });

      if (error) throw error;

      toast({
        title: "Order Shipped",
        description: "Order status updated and buyer has been notified."
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Ship order error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to ship order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          orderId: order.id,
          action: 'confirm_receipt'
        }
      });

      if (error) throw error;

      toast({
        title: "Receipt Confirmed",
        description: "Payment has been released to the seller. Thank you for your purchase!"
      });
      
      onOrderUpdate();
    } catch (error) {
      console.error('Confirm receipt error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      shipped: { color: 'bg-blue-100 text-blue-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Package };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const canShip = userRole === 'seller' && order.order_status === 'pending' && order.payment_status === 'escrow';
  const canConfirmReceipt = userRole === 'buyer' && order.order_status === 'shipped';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{order.product_name}</CardTitle>
          {getStatusBadge(order.order_status)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Order Total:</span>
            <p className="font-medium">${order.total_amount.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Payment Status:</span>
            <p className="font-medium capitalize">{order.payment_status}</p>
          </div>
        </div>

        <div className="space-y-2">
          {/* Seller Actions */}
          {canShip && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Ready to Ship?</h4>
                  <p className="text-sm text-blue-700">Payment is secured in escrow. Mark as shipped once dispatched.</p>
                </div>
                <Button 
                  onClick={handleShipOrder} 
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Shipping...' : 'Mark as Shipped'}
                </Button>
              </div>
            </div>
          )}

          {/* Buyer Actions */}
          {canConfirmReceipt && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">Received Your Order?</h4>
                  <p className="text-sm text-green-700">Confirm receipt to release payment to the seller.</p>
                </div>
                <Button 
                  onClick={handleConfirmReceipt} 
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Confirming...' : 'Confirm Receipt'}
                </Button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {userRole === 'seller' && order.order_status === 'shipped' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <Clock className="h-4 w-4 inline mr-1" />
                Waiting for buyer to confirm receipt...
              </p>
            </div>
          )}

          {userRole === 'buyer' && order.order_status === 'pending' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <Package className="h-4 w-4 inline mr-1" />
                Seller is preparing your order...
              </p>
            </div>
          )}

          {order.order_status === 'delivered' && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Order Completed</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {userRole === 'seller' 
                  ? 'Payment has been released to you!' 
                  : 'Thank you for your purchase!'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};