import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell,
  Send,
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

export function NotificationDemo() {
  const [testingNotifications, setTestingNotifications] = useState(false);
  const [emailServiceStatus, setEmailServiceStatus] = useState<'checking' | 'ready' | 'needs_setup'>('checking');
  const { toast } = useToast();

  const testAutomatedNotifications = async () => {
    setTestingNotifications(true);
    try {
      // Test the automated notification system
      const { data, error } = await supabase.functions.invoke('send-notifications');
      
      if (error) throw error;
      
      toast({
        title: "Notification System Test",
        description: data.message || "Automated notification service is working!",
      });
    } catch (error) {
      console.error('Error testing notifications:', error);
      toast({
        title: "Test Failed",
        description: "Unable to test automated notifications. Check configuration.",
        variant: "destructive",
      });
    } finally {
      setTestingNotifications(false);
    }
  };

  const createTestNotification = async () => {
    try {
      // Create a test notification to demonstrate the system
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to test notifications",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_type: 'system_alert',
        p_title: 'Test Notification',
        p_message: 'This is a test notification to demonstrate the automated messaging system.',
        p_priority: 'high'
      });

      if (error) throw error;

      toast({
        title: "Test Notification Created",
        description: "Check your notification center for the new test notification!",
      });
    } catch (error) {
      console.error('Error creating test notification:', error);
      toast({
        title: "Error",
        description: "Failed to create test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Automated Messaging System
            <Badge variant="secondary">Live Demo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Automated Events
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Order placed/confirmed/shipped/delivered</li>
                <li>• Payment received/released from escrow</li>
                <li>• QR code scans and delivery updates</li>
                <li>• New messages and stock alerts</li>
                <li>• High-priority notifications via email</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                System Features
              </h3>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Real-time in-app notifications</li>
                <li>• Priority-based email delivery</li>
                <li>• Notification bell with unread count</li>
                <li>• Comprehensive notification center</li>
                <li>• Database triggers for automation</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={createTestNotification}
              className="flex-1"
            >
              <Bell className="h-4 w-4 mr-2" />
              Create Test Notification
            </Button>
            
            <Button 
              variant="outline"
              onClick={testAutomatedNotifications}
              disabled={testingNotifications}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {testingNotifications ? 'Testing...' : 'Test Email Service'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Notification Center */}
      <NotificationCenter />

      {/* Email Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Email Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg border">
            {emailServiceStatus === 'ready' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-600">Email Service Ready</p>
                  <p className="text-sm text-muted-foreground">
                    High-priority notifications will be sent via email automatically
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-600">Email Service Setup Required</p>
                  <p className="text-sm text-muted-foreground">
                    Configure RESEND_API_KEY in edge function secrets for email notifications
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}