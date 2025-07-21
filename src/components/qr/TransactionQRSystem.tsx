import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, CreditCard, Truck, CheckCircle, Eye, Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeScanner } from "./QRCodeScanner";

interface TransactionQR {
  id: string;
  transaction_id: string;
  transaction_type: string;
  qr_code_identifier: string;
  qr_data_url: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  scan_count: number;
  metadata: any;
  products?: any;
  orders?: any;
  payments?: any;
}

export const TransactionQRSystem = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCodes, setQrCodes] = useState<TransactionQR[]>([]);
  const [selectedQR, setSelectedQR] = useState<TransactionQR | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showQRDisplay, setShowQRDisplay] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactionQRs();
    }
  }, [user]);

  const fetchTransactionQRs = async () => {
    try {
      const { data, error } = await supabase
        .from("transaction_qr_codes")
        .select(`
          *,
          products(*),
          orders(*),
          payments(*)
        `)
        .eq('created_by', user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error("Error fetching transaction QRs:", error);
      toast({
        title: "Error",
        description: "Failed to load QR codes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (transactionType: string, transactionId: string, additionalData?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('transaction-qr', {
        body: {
          transaction_type: transactionType,
          transaction_id: transactionId,
          product_id: additionalData?.product_id,
          order_id: additionalData?.order_id,
          payment_id: additionalData?.payment_id,
          metadata: additionalData?.metadata || {}
        }
      });

      if (error) throw error;

      toast({
        title: "QR Code Generated",
        description: `${transactionType.replace('_', ' ')} QR code created successfully.`,
      });

      fetchTransactionQRs();
      return data;
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
      const { data, error } = await supabase.functions.invoke('scan-transaction-qr', {
        body: {
          qr_code: qrData,
          location_data: location,
          scanner_context: 'transaction_system'
        }
      });

      if (error) throw error;

      toast({
        title: "QR Scan Successful",
        description: data.message,
      });

      setShowScanner(false);
      fetchTransactionQRs();
    } catch (error) {
      console.error("Error scanning QR code:", error);
      toast({
        title: "Scan Error",
        description: error.message || "Failed to scan QR code.",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = (qr: TransactionQR) => {
    const link = document.createElement('a');
    link.href = qr.qr_data_url;
    link.download = `${qr.transaction_type}_${qr.qr_code_identifier}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyQRCode = async (qrIdentifier: string) => {
    try {
      await navigator.clipboard.writeText(qrIdentifier);
      toast({
        title: "Copied",
        description: "QR code identifier copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy QR code.",
        variant: "destructive",
      });
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'product_listing': return <Package className="h-4 w-4 text-blue-500" />;
      case 'order_created': return <QrCode className="h-4 w-4 text-purple-500" />;
      case 'payment_confirmed': return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-orange-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      default: return <QrCode className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'product_listing': return "bg-blue-100 text-blue-800";
      case 'order_created': return "bg-purple-100 text-purple-800";
      case 'payment_confirmed': return "bg-green-100 text-green-800";
      case 'shipped': return "bg-orange-100 text-orange-800";
      case 'delivered': return "bg-emerald-100 text-emerald-800";
      default: return "bg-gray-100 text-gray-800";
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
          <h1 className="text-3xl font-bold">Transaction QR System</h1>
          <p className="text-muted-foreground">Manage QR codes for complete transaction lifecycle</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowScanner(true)} variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Scan QR Code
          </Button>
        </div>
      </div>

      {/* QR Code Generation Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Generate QR codes for different transaction stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => {
                // This would typically open a product selection modal
                toast({
                  title: "Feature Demo",
                  description: "QR codes are automatically generated when products are listed.",
                });
              }}
            >
              <Package className="h-6 w-6" />
              <span className="text-xs">Product Listing</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => {
                toast({
                  title: "Feature Demo",
                  description: "QR codes are automatically generated when orders are created.",
                });
              }}
            >
              <QrCode className="h-6 w-6" />
              <span className="text-xs">Order Created</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => {
                toast({
                  title: "Feature Demo",
                  description: "QR codes are automatically generated when payments are confirmed.",
                });
              }}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-xs">Payment Confirmed</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => {
                toast({
                  title: "Feature Demo",
                  description: "Generate QR codes for shipment tracking.",
                });
              }}
            >
              <Truck className="h-6 w-6" />
              <span className="text-xs">Shipped</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col gap-2"
              onClick={() => {
                toast({
                  title: "Feature Demo",
                  description: "Generate QR codes for delivery confirmation.",
                });
              }}
            >
              <CheckCircle className="h-6 w-6" />
              <span className="text-xs">Delivered</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction QR Codes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Transaction QR Codes</h2>
        {qrCodes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No QR Codes Yet</h3>
              <p className="text-muted-foreground">
                QR codes will be automatically generated for your transactions.
              </p>
            </CardContent>
          </Card>
        ) : (
          qrCodes.map((qr) => (
            <Card key={qr.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getTransactionTypeIcon(qr.transaction_type)}
                    <div>
                      <CardTitle className="text-lg">
                        {qr.transaction_type.replace('_', ' ').toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        ID: {qr.qr_code_identifier.slice(-12)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTransactionTypeColor(qr.transaction_type)}>
                      {qr.is_active ? 'Active' : 'Expired'}
                    </Badge>
                    <Badge variant="outline">
                      Scanned {qr.scan_count} times
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Transaction Details</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Type: {qr.transaction_type}</p>
                      <p>Created: {new Date(qr.created_at).toLocaleDateString()}</p>
                      <p>Expires: {new Date(qr.expires_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {qr.products && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Product</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{qr.products.name}</p>
                        <p>${qr.products.price}</p>
                      </div>
                    </div>
                  )}

                  {qr.orders && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Order</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{qr.orders.product_name}</p>
                        <p>Status: {qr.orders.order_status}</p>
                        <p>Amount: ${qr.orders.total_amount}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 lg:col-span-full">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedQR(qr);
                          setShowQRDisplay(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(qr)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyQRCode(qr.qr_code_identifier)}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Copy ID
                      </Button>
                    </div>
                  </div>
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
              <h3 className="text-lg font-semibold">Scan Transaction QR Code</h3>
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

      {/* QR Display Modal */}
      {showQRDisplay && selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transaction QR Code</h3>
              <Button variant="outline" size="sm" onClick={() => {
                setShowQRDisplay(false);
                setSelectedQR(null);
              }}>
                Close
              </Button>
            </div>
            <div className="text-center space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <img 
                  src={selectedQR.qr_data_url} 
                  alt="Transaction QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">QR Code:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  {selectedQR.qr_code_identifier}
                </code>
              </div>
              <Badge className={getTransactionTypeColor(selectedQR.transaction_type)}>
                {selectedQR.transaction_type.replace('_', ' ').toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Share this QR code for transaction verification
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};