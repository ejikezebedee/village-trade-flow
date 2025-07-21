import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TranslateButton } from './TranslateButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Bell, 
  Package, 
  CreditCard, 
  Truck, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface DemoMessage {
  id: string;
  type: 'order_placed' | 'payment_received' | 'order_shipped' | 'order_delivered' | 'system_alert';
  title: string;
  message: string;
  timestamp: string;
  priority: 'high' | 'normal' | 'low';
}

export const MessageTranslationDemo: React.FC = () => {
  const { getLocalizedContent } = useLanguage();
  const [demoMessages] = useState<DemoMessage[]>([
    {
      id: '1',
      type: 'order_placed',
      title: 'Order Confirmation',
      message: 'Your order for Fresh Organic Tomatoes has been placed successfully. You will receive updates as your order is processed.',
      timestamp: '2 minutes ago',
      priority: 'high'
    },
    {
      id: '2',
      type: 'payment_received',
      title: 'Payment Confirmed',
      message: 'We have received your payment of $12.99. Your order is now being prepared for shipping.',
      timestamp: '15 minutes ago',
      priority: 'normal'
    },
    {
      id: '3',
      type: 'order_shipped',
      title: 'Order Shipped',
      message: 'Great news! Your order has been picked up by our delivery partner and is on its way to you. Expected delivery: Tomorrow.',
      timestamp: '2 hours ago',
      priority: 'normal'
    },
    {
      id: '4',
      type: 'order_delivered',
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. We hope you enjoy your purchase! Please consider leaving a review.',
      timestamp: '1 day ago',
      priority: 'low'
    },
    {
      id: '5',
      type: 'system_alert',
      title: 'Platform Maintenance',
      message: 'We will be performing scheduled maintenance tonight from 2:00 AM to 4:00 AM. Some features may be temporarily unavailable.',
      timestamp: '3 hours ago',
      priority: 'high'
    }
  ]);

  const [localizedNotifications, setLocalizedNotifications] = useState({
    orderPlaced: 'Order placed successfully',
    paymentReceived: 'Payment received',
    orderShipped: 'Your order has been shipped',
    orderDelivered: 'Your order has been delivered'
  });

  useEffect(() => {
    const loadLocalizedNotifications = async () => {
      try {
        const [orderPlaced, paymentReceived, orderShipped, orderDelivered] = await Promise.all([
          getLocalizedContent('order_placed'),
          getLocalizedContent('payment_received'),
          getLocalizedContent('order_shipped'),
          getLocalizedContent('order_delivered')
        ]);

        setLocalizedNotifications({
          orderPlaced,
          paymentReceived,
          orderShipped,
          orderDelivered
        });
      } catch (error) {
        console.error('Error loading localized notifications:', error);
      }
    };

    loadLocalizedNotifications();
  }, [getLocalizedContent]);

  const getMessageIcon = (type: string) => {
    const icons = {
      'order_placed': <Package className="w-5 h-5 text-blue-600" />,
      'payment_received': <CreditCard className="w-5 h-5 text-green-600" />,
      'order_shipped': <Truck className="w-5 h-5 text-purple-600" />,
      'order_delivered': <CheckCircle className="w-5 h-5 text-green-600" />,
      'system_alert': <AlertTriangle className="w-5 h-5 text-orange-600" />
    };
    return icons[type] || <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'normal': 'bg-blue-100 text-blue-800',
      'low': 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.normal;
  };

  const getLocalizedTitle = (type: string) => {
    const mapping = {
      'order_placed': localizedNotifications.orderPlaced,
      'payment_received': localizedNotifications.paymentReceived,
      'order_shipped': localizedNotifications.orderShipped,
      'order_delivered': localizedNotifications.orderDelivered
    };
    return mapping[type] || 'Notification';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Message Translation Demo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Experience how notifications and messages are translated in real-time based on your language preference.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoMessages.map((message) => (
              <Card key={message.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getMessageIcon(message.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{message.title}</h4>
                          <Badge className={getPriorityColor(message.priority)} variant="secondary">
                            {message.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp}
                        </span>
                      </div>

                      {/* Original Message */}
                      <p className="text-sm text-muted-foreground">
                        {message.message}
                      </p>

                      {/* Translation Controls */}
                      <div className="space-y-2">
                        <TranslateButton
                          text={message.title}
                          contentType="notification"
                          contentId={message.id}
                          sourceLanguage="en"
                          size="sm"
                          variant="ghost"
                        />
                        
                        <TranslateButton
                          text={message.message}
                          contentType="notification"
                          contentId={message.id}
                          sourceLanguage="en"
                          size="sm"
                          variant="ghost"
                        />
                      </div>

                      {/* Show localized title if available */}
                      {message.type in localizedNotifications && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center space-x-2">
                            <Info className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800">
                              Pre-localized: "{getLocalizedTitle(message.type)}"
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Translation Explanation */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Translation Strategy</h4>
            <div className="text-sm text-amber-700 space-y-2">
              <p>
                <strong>Static Content:</strong> Common notification types (like "Order Placed") 
                use pre-translated content from our localization database for instant display.
              </p>
              <p>
                <strong>Dynamic Content:</strong> Detailed messages and custom content are 
                translated on-demand using Google Translate API with caching for performance.
              </p>
              <p>
                <strong>Hybrid Approach:</strong> This ensures both speed for common content 
                and accuracy for personalized messages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};