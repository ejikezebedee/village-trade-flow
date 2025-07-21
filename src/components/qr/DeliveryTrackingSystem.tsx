import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QrCode, Package, Truck, MapPin, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeScanner } from "./QRCodeScanner";

interface DeliveryTracking {
  id: string;
  tracking_number: string;
  current_location: string;
  current_holder_type: string;
  estimated_delivery_time: string;
  actual_delivery_time?: string;
  priority_level: string;
  orders: {
    id: string;
    product_name: string;
    total_amount: number;
    current_stage: string;
    order_status: string;
    buyer_id: string;
    seller_id: string;
    driver_id?: string;
    shop_id?: string;
  };
}

interface DeliveryCheckpoint {
  id: string;
  checkpoint_type: string;
  checkpoint_location: string;
  checkpoint_time: string;
  notes: string;
  scanned_by: string;
}

export const DeliveryTrackingSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryTracking[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryTracking | null>(null);
  const [checkpoints, setCheckpoints] = useState<DeliveryCheckpoint[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showTrackingDetail, setShowTrackingDetail] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
    }
  }, [user]);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_tracking")
        .select(`
          *,
          orders!inner(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery tracking data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckpoints = async (deliveryId: string) => {
    try {
      const { data, error } = await supabase
        .from("delivery_checkpoints")
        .select("*")
        .eq("delivery_tracking_id", deliveryId)
        .order("checkpoint_time", { ascending: true });

      if (error) throw error;
      setCheckpoints(data || []);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      toast({
        title: "Error",
        description: "Failed to load delivery checkpoints.",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = async (qrData: string, location?: any) => {
    try {
      setShowScanner(false);
      
      // First try the enhanced delivery QR scan
      const { data, error } = await supabase.functions.invoke('scan-qr', {
        body: {
          qr_code: qrData,
          location_data: location,
          notes: 'Delivery tracking scan'
        }
      });

      if (error) throw error;

      toast({
        title: "Delivery Updated",
        description: data.message,
      });

      fetchDeliveries();
      
      // If we have a selected delivery, refresh its checkpoints
      if (selectedDelivery) {
        fetchCheckpoints(selectedDelivery.id);
      }
      
    } catch (error) {
      console.error("Error scanning delivery QR:", error);
      toast({
        title: "Scan Error",
        description: error.message || "Failed to scan delivery QR code.",
        variant: "destructive",
      });
    }
  };

  const getDeliveryProgress = (delivery: DeliveryTracking) => {
    const stages = ['pickup_ready', 'picked_up', 'in_transit', 'arrived_at_destination', 'delivered'];
    const currentStageIndex = Math.max(0, stages.findIndex(stage => 
      delivery.orders.current_stage.includes(stage) || 
      delivery.current_holder_type === 'buyer'
    ));
    return (currentStageIndex / (stages.length - 1)) * 100;
  };

  const getStatusColor = (holderType: string) => {
    switch (holderType) {
      case 'seller': return "bg-blue-100 text-blue-800";
      case 'driver': return "bg-orange-100 text-orange-800";
      case 'shop': return "bg-purple-100 text-purple-800";
      case 'buyer': return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return "bg-red-100 text-red-800";
      case 'high': return "bg-orange-100 text-orange-800";
      case 'normal': return "bg-blue-100 text-blue-800";
      case 'low': return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCheckpointIcon = (type: string) => {
    switch (type) {
      case 'pickup_ready': return <Package className="h-4 w-4 text-blue-500" />;
      case 'picked_up': return <Truck className="h-4 w-4 text-orange-500" />;
      case 'in_transit': return <Truck className="h-4 w-4 text-yellow-500" />;
      case 'arrived_at_destination': return <MapPin className="h-4 w-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed_delivery': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <QrCode className="h-4 w-4 text-gray-500" />;
    }
  };

  const isUserAuthorized = (delivery: DeliveryTracking) => {
    return delivery.orders.buyer_id === user?.id ||
           delivery.orders.seller_id === user?.id ||
           delivery.orders.driver_id === user?.id ||
           delivery.orders.shop_id === user?.id;
  };

  const canUserScanQR = (delivery: DeliveryTracking) => {
    const { current_stage } = delivery.orders;
    const userId = user?.id;
    
    if (current_stage === 'driver_pickup' && delivery.orders.driver_id === userId) return true;
    if (current_stage === 'in_transit' && delivery.orders.driver_id === userId) return true;
    if (current_stage === 'shop_delivery' && delivery.orders.shop_id === userId) return true;
    if (current_stage === 'buyer_pickup' && delivery.orders.buyer_id === userId) return true;
    
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Delivery Tracking System</h1>
          <p className="text-muted-foreground">
            Real-time delivery tracking with automatic status updates via QR codes
          </p>
        </div>
        <Button onClick={() => setShowScanner(true)} variant="outline">
          <QrCode className="h-4 w-4 mr-2" />
          Scan Delivery QR
        </Button>
      </div>

      {/* Active Deliveries */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Deliveries</h2>
        {deliveries.filter(delivery => isUserAuthorized(delivery)).length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Deliveries</h3>
              <p className="text-muted-foreground">
                You don't have any deliveries to track at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          deliveries
            .filter(delivery => isUserAuthorized(delivery))
            .map((delivery) => (
              <Card key={delivery.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {delivery.orders.product_name}
                      </CardTitle>
                      <CardDescription>
                        Tracking: {delivery.tracking_number}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(delivery.current_holder_type)}>
                        With {delivery.current_holder_type}
                      </Badge>
                      <Badge className={getPriorityColor(delivery.priority_level)}>
                        {delivery.priority_level} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Delivery Progress</span>
                      <span>{Math.round(getDeliveryProgress(delivery))}% Complete</span>
                    </div>
                    <Progress value={getDeliveryProgress(delivery)} className="h-2" />
                  </div>

                  {/* Current Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Current Location</p>
                      <p className="text-sm text-muted-foreground">
                        {delivery.current_location || 'Location not updated'}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Estimated Delivery</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(delivery.estimated_delivery_time).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium">Order Amount</p>
                      <p className="text-sm text-muted-foreground">
                        ${delivery.orders.total_amount}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDelivery(delivery);
                        fetchCheckpoints(delivery.id);
                        setShowTrackingDetail(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    
                    {canUserScanQR(delivery) && (
                      <Button
                        size="sm"
                        onClick={() => setShowScanner(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <QrCode className="h-4 w-4 mr-1" />
                        Scan QR Code
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Delivery QR Code</h3>
              <Button variant="outline" size="sm" onClick={() => setShowScanner(false)}>
                Close
              </Button>
            </div>
            <QRCodeScanner 
              onScanComplete={(result) => {
                if (result.success) {
                  setShowScanner(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Tracking Detail Modal */}
      {showTrackingDetail && selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delivery Details</h3>
              <Button variant="outline" size="sm" onClick={() => {
                setShowTrackingDetail(false);
                setSelectedDelivery(null);
                setCheckpoints([]);
              }}>
                Close
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Tracking Number</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.tracking_number}</p>
                </div>
                <div>
                  <p className="font-medium">Product</p>
                  <p className="text-sm text-muted-foreground">{selectedDelivery.orders.product_name}</p>
                </div>
              </div>

              {/* Delivery Timeline */}
              <div>
                <h4 className="font-medium mb-4">Delivery Timeline</h4>
                <div className="space-y-4">
                  {checkpoints.map((checkpoint, index) => (
                    <div key={checkpoint.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getCheckpointIcon(checkpoint.checkpoint_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {checkpoint.checkpoint_type.replace('_', ' ')}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(checkpoint.checkpoint_time).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {checkpoint.checkpoint_location}
                        </p>
                        {checkpoint.notes && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {checkpoint.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};