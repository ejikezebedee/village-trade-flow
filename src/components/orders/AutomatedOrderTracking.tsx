import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Truck, 
  Store, 
  CheckCircle, 
  Clock,
  DollarSign,
  QrCode,
  ArrowRight,
  Zap
} from "lucide-react";

interface OrderStatusHistory {
  id: string;
  previous_status: string;
  new_status: string;
  previous_stage: string;
  new_stage: string;
  change_reason: string;
  created_at: string;
}

interface AutomatedOrderTrackingProps {
  orderId: string;
}

export function AutomatedOrderTracking({ orderId }: AutomatedOrderTrackingProps) {
  const [statusHistory, setStatusHistory] = useState<OrderStatusHistory[]>([]);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const statusFlow = [
    { key: 'pending', label: 'Order Created', icon: Package, color: 'gray' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'blue' },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'yellow' },
    { key: 'delivered_to_shop', label: 'At Shop', icon: Store, color: 'orange' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'green' }
  ];

  const stageFlow = [
    { key: 'seller_preparing', label: 'Preparing', trigger: 'Seller packages order' },
    { key: 'driver_pickup', label: 'Ready for Pickup', trigger: 'QR: Seller → Driver' },
    { key: 'in_transit', label: 'In Transit', trigger: 'QR: Driver picked up' },
    { key: 'shop_delivery', label: 'At Shop', trigger: 'QR: Driver → Shop' },
    { key: 'buyer_pickup', label: 'Ready for Collection', trigger: 'QR: Shop received' },
    { key: 'completed', label: 'Completed', trigger: 'QR: Buyer pickup + Payment released' }
  ];

  useEffect(() => {
    fetchOrderData();
    
    // Set up real-time subscription for order changes
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_status_history',
          filter: `order_id=eq.${orderId}`
        },
        () => {
          fetchOrderData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        () => {
          fetchOrderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      // Fetch current order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setCurrentOrder(order);

      // Fetch status history
      const { data: history, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;
      setStatusHistory(history || []);
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast({
        title: "Error",
        description: "Failed to load order tracking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500 bg-gray-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-yellow-600 bg-yellow-100';
      case 'delivered_to_shop': return 'text-orange-600 bg-orange-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getChangeReasonLabel = (reason: string) => {
    switch (reason) {
      case 'qr_scan_pickup_confirmed': return 'QR Scan: Pickup Confirmed';
      case 'qr_scan_shop_delivered': return 'QR Scan: Delivered to Shop';
      case 'qr_scan_delivery_confirmed': return 'QR Scan: Delivery Confirmed + Payment Released';
      case 'automatic_status_update': return 'Automatic Status Update';
      default: return reason.replace(/_/g, ' ').toUpperCase();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
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

  return (
    <div className="space-y-6">
      {/* Current Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automated Order Tracking
            <Badge variant="secondary" className="ml-2">
              Real-time Updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{currentOrder.product_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Order #{currentOrder.id.slice(0, 8)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${currentOrder.total_amount}</div>
                  <Badge className={getStatusColor(currentOrder.order_status)}>
                    {currentOrder.order_status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              {/* Payment Status */}
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Escrow Payment</p>
                  <p className="text-sm text-muted-foreground">
                    {currentOrder.order_status === 'delivered' 
                      ? 'Payment automatically released upon delivery confirmation'
                      : 'Payment held in escrow until delivery confirmation'
                    }
                  </p>
                </div>
                {currentOrder.order_status === 'delivered' && (
                  <Badge variant="outline" className="ml-auto text-green-600">
                    Released
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Flow Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Automated Progress Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stageFlow.map((stage, index) => {
              const isCompleted = currentOrder && 
                stageFlow.findIndex(s => s.key === currentOrder.current_stage) >= index;
              const isCurrent = currentOrder?.current_stage === stage.key;
              
              return (
                <div key={stage.key} className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isCurrent ? 'bg-blue-100 text-blue-600 animate-pulse' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${isCurrent ? 'text-blue-600' : ''}`}>
                        {stage.label}
                      </h4>
                      {stage.trigger.includes('QR:') && (
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                      )}
                      {isCurrent && (
                        <Badge variant="outline" className="text-blue-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stage.trigger}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {statusHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No status changes recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {statusHistory.map((change) => (
                <div key={change.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {change.previous_stage?.replace(/_/g, ' ')}
                    </Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge variant="secondary" className="text-xs">
                      {change.new_stage?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {getChangeReasonLabel(change.change_reason)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(change.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {change.change_reason.includes('delivery_confirmed') && (
                    <Badge variant="outline" className="text-green-600">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Payment Released
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}