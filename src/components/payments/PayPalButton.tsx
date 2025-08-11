import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PayPalButtonProps {
  amount: number;
  orderId?: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export const PayPalButton: React.FC<PayPalButtonProps> = ({
  amount,
  orderId,
  onSuccess,
  onError,
  onCancel
}) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }

    if (!paypalRef.current) return;

    const renderPayPalButton = () => {
      window.paypal.Buttons({
        createOrder: async (data: any, actions: any) => {
          try {
            // Create PayPal order via our edge function
            const { data: orderData, error } = await supabase.functions.invoke('process-paypal-payment', {
              body: {
                amount: parseFloat(amount.toString()),
                currency: 'USD',
                orderId: orderId || `order_${Date.now()}`,
                description: 'Village Trading Purchase',
                buyerId: user?.id || 'guest_user',
                sellerId: 'marketplace'
              }
            });

            if (error) throw error;

            return orderData.paypal_order_id;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            onError?.(error);
            return null;
          }
        },

        onApprove: async (data: any, actions: any) => {
          try {
            // Capture payment via our edge function
            const { data: captureData, error } = await supabase.functions.invoke('verify-paypal-payment', {
              body: {
                paypal_order_id: data.orderID
              }
            });

            if (error) throw error;

            toast({
              title: "Payment Successful",
              description: `Transaction ID: ${captureData.transaction_id}`,
            });

            onSuccess?.(captureData.capture_id);
          } catch (error) {
            console.error('Error capturing PayPal payment:', error);
            toast({
              title: "Payment Error",
              description: "Failed to process payment. Please try again.",
              variant: "destructive"
            });
            onError?.(error);
          }
        },

        onCancel: (data: any) => {
          toast({
            title: "Payment Cancelled",
            description: "Payment was cancelled by user",
            variant: "destructive"
          });
          onCancel?.();
        },

        onError: (err: any) => {
          console.error('PayPal payment error:', err);
          toast({
            title: "Payment Error",
            description: "An error occurred during payment processing",
            variant: "destructive"
          });
          onError?.(err);
        },

        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        }
      }).render(paypalRef.current);
    };

    renderPayPalButton();

    // Cleanup function
    return () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [amount, orderId, user?.id, onSuccess, onError, onCancel, toast]);

  return (
    <div className="w-full">
      <div ref={paypalRef} className="w-full"></div>
    </div>
  );
};