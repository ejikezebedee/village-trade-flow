import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, MapPin, Shield, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { QRCodeScanner } from "./QRCodeScanner";
import { useToast } from "@/hooks/use-toast";

interface QRLog {
  id: string;
  qr_code: string;
  scan_stage: string;
  verification_status: string;
  expires_at: string;
  scanned_at: string;
  location_data?: any;
  orders?: {
    product_name: string;
    current_stage: string;
  };
}

export const EnhancedQRSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrLogs, setQrLogs] = useState<QRLog[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [qrToDisplay, setQrToDisplay] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchQRLogs();
      fetchUserOrders();
    }
  }, [user]);

  const fetchQRLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("qr_verification_logs")
        .select(`
          *,
          orders!inner(
            product_name,
            current_stage,
            buyer_id,
            seller_id,
            driver_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQrLogs(data || []);
    } catch (error) {
      console.error("Error fetching QR logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id},driver_id.eq.${user?.id}`)
        .in("current_stage", ["seller_preparing", "driver_pickup", "in_transit", "shop_delivery"]);

      if (error) throw error;
      setUserOrders(data || []);
    } catch (error) {
      console.error("Error fetching user orders:", error);
    }
  };

  const generateQRCode = async (orderId: string, stage: string) => {
    try {
      const { data, error } = await supabase
        .rpc("generate_secure_qr", {
          p_order_id: orderId,
          p_stage: stage,
          p_expires_hours: 24
        });

      if (error) throw error;

      setQrToDisplay(data);
      setShowQRDisplay(true);
      
      toast({
        title: "QR Code Generated",
        description: "Secure QR code created for delivery tracking.",
      });

      fetchQRLogs();
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = async (qrData: string, location?: any) => {
    try {
      const { data, error } = await supabase
        .rpc("verify_qr_scan", {
          p_qr_code: qrData,
          p_scanner_id: user?.id,
          p_location: location
        });

      if (error) throw error;

      if (data) {
        toast({
          title: "QR Scan Verified",
          description: "Delivery stage updated successfully.",
        });
        fetchQRLogs();
        fetchUserOrders();
      } else {
        toast({
          title: "Invalid QR Code",
          description: "QR code is expired, invalid, or you're not authorized to scan it.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying QR scan:", error);
      toast({
        title: "Scan Error",
        description: "Failed to verify QR code.",
        variant: "destructive",
      });
    }
  };

  const getStageAction = (order: any) => {
    const userId = user?.id;
    
    switch (order.current_stage) {
      case "seller_preparing":
        if (order.seller_id === userId) {
          return {
            label: "Generate Pickup QR",
            action: () => generateQRCode(order.id, "seller_to_driver"),
            variant: "default" as const
          };
        }
        break;
      case "driver_pickup":
        if (order.driver_id === userId) {
          return {
            label: "Scan Pickup QR",
            action: () => setShowScanner(true),
            variant: "secondary" as const
          };
        }
        break;
      case "in_transit":
        if (order.driver_id === userId) {
          return {
            label: "Generate Delivery QR",
            action: () => generateQRCode(order.id, "driver_to_shop"),
            variant: "default" as const
          };
        }
        break;
      case "shop_delivery":
        if (order.buyer_id === userId) {
          return {
            label: "Scan Final QR",
            action: () => setShowScanner(true),
            variant: "secondary" as const
          };
        }
        break;
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      case "disputed": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "seller_to_driver": return <QrCode className="h-4 w-4 text-blue-500" />;
      case "driver_to_shop": return <MapPin className="h-4 w-4 text-purple-500" />;
      case "shop_to_buyer": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">QR Delivery Tracking</h1>
          <p className="text-muted-foreground">Secure delivery verification system</p>
        </div>
        <Button onClick={() => setShowScanner(true)} variant="outline">
          <QrCode className="h-4 w-4 mr-2" />
          Scan QR Code
        </Button>
      </div>

      {/* Active Orders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Orders</h2>
        {userOrders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
              <p className="text-muted-foreground">You don't have any orders requiring QR actions.</p>
            </CardContent>
          </Card>
        ) : (
          userOrders.map((order) => {
            const action = getStageAction(order);
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{order.product_name}</CardTitle>
                      <CardDescription>Order #{order.id.slice(0, 8)}</CardDescription>
                    </div>
                    <Badge variant="outline">{order.current_stage}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <p>Amount: ${order.total_amount}</p>
                      <p>Status: {order.order_status}</p>
                    </div>
                    {action && (
                      <Button 
                        variant={action.variant} 
                        onClick={action.action}
                        size="sm"
                      >
                        {action.label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* QR History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">QR Scan History</h2>
        {qrLogs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No QR Activity</h3>
              <p className="text-muted-foreground">Your QR scan history will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          qrLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStageIcon(log.scan_stage)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{log.orders?.product_name}</span>
                        <Badge className={getStatusColor(log.verification_status)}>
                          {log.verification_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Stage: {log.scan_stage.replace('_', ' → ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        QR: {log.qr_code.slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Scanned: {new Date(log.scanned_at).toLocaleString()}</p>
                    <p>Expires: {new Date(log.expires_at).toLocaleString()}</p>
                    {log.location_data && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>Location tracked</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {log.verification_status === "expired" && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700">This QR code has expired</span>
                  </div>
                )}
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
                  fetchQRLogs();
                  fetchUserOrders();
                }
              }}
            />
          </div>
        </div>
      )}

      {/* QR Display Modal */}
      {showQRDisplay && qrToDisplay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Delivery QR Code</h3>
              <Button variant="outline" size="sm" onClick={() => {
                setShowQRDisplay(false);
                setQrToDisplay("");
              }}>
                Close
              </Button>
            </div>
            <div className="text-center space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="w-48 h-48 bg-gray-100 border flex items-center justify-center mx-auto">
                  <QrCode className="h-24 w-24 text-gray-400" />
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">QR Code:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  {qrToDisplay}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Show this QR code to the next person in the delivery chain
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};