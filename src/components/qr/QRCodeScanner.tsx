import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { QrCode, Scan, MapPin, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeScannerProps {
  onScanComplete?: (result: any) => void;
}

export const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScanComplete }) => {
  const [qrCode, setQrCode] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const { toast } = useToast();

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(position);
          toast({
            title: "Location Captured",
            description: "Your location has been recorded for this scan.",
          });
        },
        (error) => {
          console.error('Location error:', error);
          toast({
            title: "Location Error",
            description: "Could not get your location. You can still proceed with scanning.",
            variant: "destructive"
          });
        }
      );
    }
  };

  const scanQRCode = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Missing QR Code",
        description: "Please enter a QR code to scan.",
        variant: "destructive"
      });
      return;
    }

    setScanning(true);
    try {
      const locationData = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp
      } : null;

      const { data, error } = await supabase.functions.invoke('scan-qr', {
        body: {
          qr_code: qrCode.trim(),
          location_data: locationData,
          notes: notes.trim()
        }
      });

      if (error) throw error;

      if (data.success) {
        setScanResult(data);
        onScanComplete?.(data);
        toast({
          title: "QR Code Scanned Successfully",
          description: `Order moved from ${data.previous_stage} to ${data.new_stage}`,
        });
        
        // Reset form
        setQrCode('');
        setNotes('');
        setLocation(null);
      } else {
        throw new Error(data.error || 'Failed to scan QR code');
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to scan QR code. Please check the code and try again.",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  if (scanResult) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Scan Complete
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="font-semibold mb-2">QR Code Processed Successfully</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono">{scanResult.order_id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stage:</span>
                <Badge variant="outline">{scanResult.scan_stage.replace(/_/g, ' ')}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Status:</span>
                <Badge variant="secondary">{scanResult.new_stage.replace(/_/g, ' ')}</Badge>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setScanResult(null)} 
            className="w-full"
          >
            Scan Another QR Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="w-5 h-5" />
          Scan QR Code
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="qrCode">QR Code</Label>
          <Input
            id="qrCode"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            placeholder="Enter or paste QR code here"
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Manually enter the QR code text or scan with your device camera
          </p>
        </div>

        <div className="space-y-2">
          <Label>Location</Label>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={getLocation}
              className="flex-1"
            >
              <MapPin className="w-4 h-4 mr-2" />
              {location ? 'Location Captured' : 'Get Location'}
            </Button>
            {location && (
              <Badge variant="secondary" className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                GPS
              </Badge>
            )}
          </div>
          {location && (
            <p className="text-xs text-muted-foreground">
              Lat: {location.coords.latitude.toFixed(6)}, 
              Long: {location.coords.longitude.toFixed(6)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this handoff..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Button 
            onClick={scanQRCode} 
            disabled={scanning || !qrCode.trim()}
            className="w-full"
          >
            {scanning ? (
              <>
                <QrCode className="w-4 h-4 mr-2 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Scan QR Code
              </>
            )}
          </Button>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <h4 className="font-medium text-blue-800 mb-1">How to scan:</h4>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>• Enter the QR code text manually</li>
            <li>• Use your phone camera to read QR codes</li>
            <li>• Capture location for delivery verification</li>
            <li>• Add notes if needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};