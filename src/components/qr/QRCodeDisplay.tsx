import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeDisplayProps {
  orderId: string;
  stage: 'SELLER_TO_DRIVER' | 'DRIVER_TO_SHOP' | 'SHOP_TO_BUYER';
  currentStage: string;
  existingQRCode?: string;
  onQRGenerated?: (qrCode: string) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  orderId,
  stage,
  currentStage,
  existingQRCode,
  onQRGenerated
}) => {
  const [qrCodeData, setQRCodeData] = useState<{
    code: string;
    dataUrl: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const stageLabels = {
    'SELLER_TO_DRIVER': 'Seller → Driver Handoff',
    'DRIVER_TO_SHOP': 'Driver → Shop Delivery',
    'SHOP_TO_BUYER': 'Shop → Buyer Pickup'
  };

  const stageDescriptions = {
    'SELLER_TO_DRIVER': 'Driver scans this code when picking up from seller',
    'DRIVER_TO_SHOP': 'Shop owner scans this code when receiving delivery',
    'SHOP_TO_BUYER': 'Buyer scans this code when collecting from shop'
  };

  const canGenerateQR = () => {
    switch (stage) {
      case 'SELLER_TO_DRIVER':
        return currentStage === 'driver_pickup' || currentStage === 'seller_preparing';
      case 'DRIVER_TO_SHOP':
        return currentStage === 'in_transit';
      case 'SHOP_TO_BUYER':
        return currentStage === 'shop_delivery' || currentStage === 'buyer_pickup';
      default:
        return false;
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-qr', {
        body: {
          order_id: orderId,
          stage: stage
        }
      });

      if (error) throw error;

      if (data.success) {
        setQRCodeData({
          code: data.qr_code,
          dataUrl: data.qr_data_url
        });
        onQRGenerated?.(data.qr_code);
        toast({
          title: "QR Code Generated",
          description: "QR code is ready for scanning at the next handoff point.",
        });
      } else {
        throw new Error(data.error || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyQRCode = async () => {
    if (qrCodeData?.code) {
      await navigator.clipboard.writeText(qrCodeData.code);
      toast({
        title: "Copied",
        description: "QR code copied to clipboard",
      });
    }
  };

  const downloadQRCode = () => {
    if (qrCodeData?.dataUrl) {
      const link = document.createElement('a');
      link.href = qrCodeData.dataUrl;
      link.download = `qr-${stage.toLowerCase()}-${orderId.slice(0, 8)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  useEffect(() => {
    if (existingQRCode && !qrCodeData) {
      // If there's an existing QR code, generate the display data
      const qrSvg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="white"/>
          <rect x="10" y="10" width="20" height="20" fill="black"/>
          <rect x="50" y="10" width="20" height="20" fill="black"/>
          <rect x="90" y="10" width="20" height="20" fill="black"/>
          <rect x="130" y="10" width="20" height="20" fill="black"/>
          <rect x="170" y="10" width="20" height="20" fill="black"/>
          <text x="100" y="115" text-anchor="middle" font-size="8" font-family="monospace" fill="black">
            ${existingQRCode.slice(0, 20)}
          </text>
        </svg>
      `;
      const base64 = btoa(qrSvg);
      setQRCodeData({
        code: existingQRCode,
        dataUrl: `data:image/svg+xml;base64,${base64}`
      });
    }
  }, [existingQRCode, qrCodeData]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code
          </CardTitle>
          <Badge variant="outline">
            {stage.replace(/_/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-1">{stageLabels[stage]}</h4>
          <p className="text-sm text-muted-foreground">
            {stageDescriptions[stage]}
          </p>
        </div>

        {qrCodeData ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border rounded-lg p-4 bg-white">
                <img 
                  src={qrCodeData.dataUrl} 
                  alt="QR Code" 
                  className="w-48 h-48"
                />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">QR Code ID:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {qrCodeData.code.slice(0, 30)}...
              </code>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyQRCode} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadQRCode} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {canGenerateQR() ? (
              <>
                <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate QR code for this handoff stage
                  </p>
                  <Button onClick={generateQRCode} disabled={loading}>
                    {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                    Generate QR Code
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  QR code not available for current order stage
                </p>
                <Badge variant="secondary" className="mt-2">
                  Current: {currentStage.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};