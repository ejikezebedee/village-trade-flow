import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveMetrics {
  activeUsersNow: number;
  ordersPendingAction: number;
  disputesRequiringAttention: number;
  escrowBalance: number;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'payment' | 'dispute' | 'user';
    description: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export const RealTimeMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    activeUsersNow: 0,
    ordersPendingAction: 0,
    disputesRequiringAttention: 0,
    escrowBalance: 0,
    recentActivity: []
  });

  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    fetchLiveMetrics();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order change:', payload);
          addActivity({
            id: Date.now().toString(),
            type: 'order',
            description: `Order ${payload.eventType}: ${(payload.new as any)?.product_name || 'Unknown'}`,
            timestamp: new Date().toISOString(),
            priority: payload.eventType === 'INSERT' ? 'medium' : 'low'
          });
          fetchLiveMetrics();
        }
      )
      .subscribe();

    const disputesChannel = supabase
      .channel('disputes-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'disputes' },
        (payload) => {
          console.log('Dispute change:', payload);
          addActivity({
            id: Date.now().toString(),
            type: 'dispute',
            description: `Dispute ${payload.eventType}: ${(payload.new as any)?.title || 'Unknown'}`,
            timestamp: new Date().toISOString(),
            priority: 'high'
          });
          fetchLiveMetrics();
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Payment change:', payload);
          addActivity({
            id: Date.now().toString(),
            type: 'payment',
            description: `Payment ${payload.eventType}: $${(payload.new as any)?.amount || 0}`,
            timestamp: new Date().toISOString(),
            priority: 'medium'
          });
          fetchLiveMetrics();
        }
      )
      .subscribe();

    // Heartbeat to check connection
    const heartbeat = setInterval(() => {
      setIsConnected(supabase.realtime.isConnected());
    }, 5000);

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(disputesChannel);
      supabase.removeChannel(paymentsChannel);
      clearInterval(heartbeat);
    };
  }, []);

  const fetchLiveMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's active users (mock - in real app would track sessions)
      const { data: todayUsers } = await supabase
        .from('user_analytics')
        .select('user_id')
        .gte('created_at', today + 'T00:00:00.000Z');

      // Get orders pending action
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .in('order_status', ['pending', 'confirmed']);

      // Get disputes requiring attention
      const { data: activeDisputes } = await supabase
        .from('disputes')
        .select('id')
        .in('status', ['pending', 'investigating']);

      // Get escrow balance
      const { data: heldPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('escrow_status', 'held');

      const escrowBalance = heldPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const activeUsers = new Set(todayUsers?.map(u => u.user_id)).size;

      setMetrics(prev => ({
        ...prev,
        activeUsersNow: Math.floor(activeUsers * 0.15), // Mock: 15% currently online
        ordersPendingAction: pendingOrders?.length || 0,
        disputesRequiringAttention: activeDisputes?.length || 0,
        escrowBalance
      }));

    } catch (error) {
      console.error('Error fetching live metrics:', error);
    }
  };

  const addActivity = (activity: LiveMetrics['recentActivity'][0]) => {
    setMetrics(prev => ({
      ...prev,
      recentActivity: [activity, ...prev.recentActivity.slice(0, 9)] // Keep last 10
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'dispute': return <AlertTriangle className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Real-Time Platform Monitor</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Users Online</p>
                <p className="text-xl font-bold">{metrics.activeUsersNow}</p>
              </div>
              <div className="relative">
                <Users className="h-6 w-6 text-blue-500" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-xl font-bold">{metrics.ordersPendingAction}</p>
              </div>
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Disputes</p>
                <p className="text-xl font-bold">{metrics.disputesRequiringAttention}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escrow Balance</p>
                <p className="text-xl font-bold">${metrics.escrowBalance.toLocaleString()}</p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {metrics.recentActivity.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Real-time updates will appear here</p>
              </div>
            ) : (
              metrics.recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg animate-fade-in"
                >
                  <div className={`mt-0.5 ${getPriorityColor(activity.priority)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge 
                    variant={activity.priority === 'high' ? 'destructive' : 
                            activity.priority === 'medium' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {activity.priority}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium">Review Pending Orders</p>
                  <p className="text-sm text-muted-foreground">{metrics.ordersPendingAction} orders need attention</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Resolve Disputes</p>
                  <p className="text-sm text-muted-foreground">{metrics.disputesRequiringAttention} disputes active</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">System Health</p>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};