import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Clock, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OtpSendButtonProps {
  orderId: string;
  channel: 'sms' | 'email' | 'whatsapp';
  recipientId: string;
  onCodeSent: () => void;
  disabled?: boolean;
}

export function OtpSendButton({ orderId, channel, recipientId, onCodeSent, disabled }: OtpSendButtonProps) {
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(cooldownTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-otp', {
        body: {
          action: 'generate',
          order_id: orderId,
          channel: channel,
          recipient_id: recipientId
        }
      });

      if (error) throw error;

      setCooldownTime(60); // 60 second cooldown
      onCodeSent();
      toast({
        title: "OTP Sent",
        description: `Verification code sent via ${channel.toUpperCase()}`
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send verification code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSendOTP}
      disabled={disabled || loading || cooldownTime > 0}
      variant="outline"
      className="w-full"
    >
      <Send className="w-4 h-4 mr-2" />
      {cooldownTime > 0 
        ? `Resend in ${cooldownTime}s` 
        : `Send ${channel.toUpperCase()} Code`
      }
    </Button>
  );
}

interface OtpEntryFormProps {
  orderId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  title?: string;
  description?: string;
}

export function OtpEntryForm({ orderId, onSuccess, onError, title, description }: OtpEntryFormProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('secure-otp', {
        body: {
          action: 'verify',
          order_id: orderId,
          otp_code: otp
        }
      });

      if (error) throw error;

      if (data.verified) {
        toast({
          title: "Verified",
          description: "Order confirmation successful"
        });
        onSuccess();
      } else {
        const errorMsg = "Invalid or expired verification code";
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive"
        });
        onError?.(errorMsg);
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      const errorMsg = "Failed to verify code";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="text-center space-y-2">
          <h3 className="font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Enter 6-digit verification code</Label>
        <InputOTP value={otp} onChange={setOtp} maxLength={6}>
          <InputOTPGroup className="justify-center">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        onClick={handleVerifyOTP}
        disabled={loading || otp.length !== 6}
        className="w-full"
      >
        {loading ? "Verifying..." : "Confirm Delivery"}
      </Button>
    </div>
  );
}

interface OtpTimerProps {
  expiryTime: number; // Unix timestamp
  onExpired?: () => void;
}

export function OtpTimer({ expiryTime, onExpired }: OtpTimerProps) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, expiryTime - now);
      setTimeLeft(remaining);
      
      if (remaining === 0 && onExpired) {
        onExpired();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiryTime, onExpired]);

  if (timeLeft <= 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Verification code has expired. Please request a new one.
        </AlertDescription>
      </Alert>
    );
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Alert>
      <Clock className="h-4 w-4" />
      <AlertDescription>
        Code expires in {minutes}:{seconds.toString().padStart(2, '0')}
      </AlertDescription>
    </Alert>
  );
}

interface DeliveryOtpFlowProps {
  orderId: string;
  buyerEmail: string;
  buyerPhone?: string;
  onDeliveryConfirmed: () => void;
}

export function DeliveryOtpFlow({ orderId, buyerEmail, buyerPhone, onDeliveryConfirmed }: DeliveryOtpFlowProps) {
  const [codeSent, setCodeSent] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'sms'>('email');
  const [expiryTime, setExpiryTime] = useState(0);

  const handleCodeSent = () => {
    setCodeSent(true);
    setExpiryTime(Math.floor(Date.now() / 1000) + 300); // 5 minutes from now
  };

  const handleSuccess = () => {
    onDeliveryConfirmed();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Confirm Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!codeSent ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Notice:</strong> Funds are held in escrow until OTP-confirmed delivery.
                Only the buyer can confirm delivery with their verification code.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Label>Choose verification method:</Label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="email"
                    name="channel"
                    value="email"
                    checked={selectedChannel === 'email'}
                    onChange={() => setSelectedChannel('email')}
                  />
                  <label htmlFor="email" className="text-sm">
                    Email ({buyerEmail})
                  </label>
                </div>

                {buyerPhone && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="sms"
                      name="channel"
                      value="sms"
                      checked={selectedChannel === 'sms'}
                      onChange={() => setSelectedChannel('sms')}
                    />
                    <label htmlFor="sms" className="text-sm">
                      SMS ({buyerPhone})
                    </label>
                  </div>
                )}
              </div>

              <OtpSendButton
                orderId={orderId}
                channel={selectedChannel}
                recipientId={buyerEmail}
                onCodeSent={handleCodeSent}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <OtpTimer expiryTime={expiryTime} />
            
            <OtpEntryForm
              orderId={orderId}
              onSuccess={handleSuccess}
              title="Delivery Confirmation"
              description="Enter the code sent to confirm you have received your order"
            />
            
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCodeSent(false)}
                className="w-full"
              >
                Send New Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}