import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Clock, AlertCircle, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

interface OTPMetrics {
  totalGenerated: number;
  totalVerified: number;
  totalFailed: number;
  currentActive: number;
  averageVerificationTime: number;
  successRate: number;
}

interface OTPLog {
  id: string;
  user_id: string;
  phone_number?: string;
  email?: string;
  created_at: string;
  expires_at: string;
  is_verified: boolean;
  verified?: boolean; // Support both naming conventions
  attempts: number;
  phone?: string; // Support alternative naming
}

export default function SecurityOTPDashboard() {
  const [metrics, setMetrics] = useState<OTPMetrics>({
    totalGenerated: 0,
    totalVerified: 0,
    totalFailed: 0,
    currentActive: 0,
    averageVerificationTime: 0,
    successRate: 0
  });
  
  const [recentOTPs, setRecentOTPs] = useState<OTPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data for demonstration
  const mockChartData = [
    { time: '00:00', generated: 12, verified: 10, failed: 2 },
    { time: '04:00', generated: 8, verified: 7, failed: 1 },
    { time: '08:00', generated: 25, verified: 22, failed: 3 },
    { time: '12:00', generated: 35, verified: 31, failed: 4 },
    { time: '16:00', generated: 28, verified: 25, failed: 3 },
    { time: '20:00', generated: 18, verified: 16, failed: 2 }
  ];

  const mockFailureReasons = [
    { reason: 'Expired Code', count: 45, percentage: 35 },
    { reason: 'Invalid Code', count: 38, percentage: 30 },
    { reason: 'Too Many Attempts', count: 25, percentage: 20 },
    { reason: 'Network Error', count: 19, percentage: 15 }
  ];

  const fetchOTPMetrics = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would query the otp_verifications table
      const { data: otpLogs, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error && error.code !== 'PGRST116') { // Ignore table not found for demo
        console.warn('OTP metrics query failed:', error.message);
      }

      // Map data to match interface
      const mappedOTPs = otpLogs?.map(log => ({
        ...log,
        is_verified: log.verified || false,
        phone_number: log.phone || undefined
      })) || [];

      // Mock data for demonstration
      const mockMetrics: OTPMetrics = {
        totalGenerated: 1247,
        totalVerified: 1098,
        totalFailed: 149,
        currentActive: 23,
        averageVerificationTime: 45, // seconds
        successRate: 88.1
      };

      setMetrics(mockMetrics);
      setRecentOTPs(mappedOTPs);
      toast.success('OTP metrics updated');
    } catch (error) {
      toast.error('Failed to fetch OTP metrics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredOTPs = async () => {
    try {
      // Call the edge function instead of RPC for OTP cleanup
      const { data, error } = await supabase.functions.invoke('secure-otp', {
        body: { action: 'cleanup' }
      });
      
      if (error) {
        toast.error('Failed to cleanup expired OTPs: ' + error.message);
        return;
      }
      
      toast.success(`Cleaned up expired OTP codes`);
      fetchOTPMetrics(); // Refresh metrics
    } catch (error) {
      toast.error('Error during OTP cleanup');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchOTPMetrics();
    
    // Set up real-time subscription for OTP events
    const channel = supabase
      .channel('otp_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'otp_verifications' },
        () => fetchOTPMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">OTP Security Dashboard</h2>
          <p className="text-muted-foreground">
            One-time password generation and verification monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchOTPMetrics} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={cleanupExpiredOTPs} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.successRate.toFixed(1)}%
              <Badge 
                variant={metrics.successRate >= 90 ? "default" : metrics.successRate >= 75 ? "secondary" : "destructive"}
                className="ml-2"
              >
                {metrics.successRate >= 90 ? "Excellent" : metrics.successRate >= 75 ? "Good" : "Needs Review"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              OTP verification success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Today</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Total OTP codes issued
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.totalVerified}</div>
            <p className="text-xs text-muted-foreground">
              Successfully verified codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.currentActive}</div>
            <p className="text-xs text-muted-foreground">
              Currently valid OTP codes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="failures">Failure Analysis</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>OTP Activity (Last 24 Hours)</CardTitle>
                <CardDescription>Generation and verification trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="generated" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="verified" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                    <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>OTP system performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Verification Time</span>
                  <Badge variant="outline">{metrics.averageVerificationTime}s</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Failed Attempts Rate</span>
                  <Badge variant="secondary">
                    {((metrics.totalFailed / metrics.totalGenerated) * 100).toFixed(1)}%
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Peak Generation Time</span>
                  <Badge variant="outline">12:00 - 16:00</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Load</span>
                  <Badge variant={metrics.currentActive > 50 ? "destructive" : "default"}>
                    {metrics.currentActive > 50 ? "High" : "Normal"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>In-depth OTP usage patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-3">Hourly Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="generated" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-3">Delivery Methods</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">SMS</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }} />
                        </div>
                        <span className="text-sm font-mono">75%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Email</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div className="bg-chart-2 h-2 rounded-full" style={{ width: '25%' }} />
                        </div>
                        <span className="text-sm font-mono">25%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failures">
          <Card>
            <CardHeader>
              <CardTitle>Failure Analysis</CardTitle>
              <CardDescription>Common reasons for OTP verification failures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFailureReasons.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="font-medium">{item.reason}</p>
                        <p className="text-sm text-muted-foreground">{item.count} occurrences</p>
                      </div>
                    </div>
                    <Badge variant="outline">{item.percentage}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>OTP Configuration</CardTitle>
              <CardDescription>Security settings and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code Expiry Time</label>
                  <p className="text-sm text-muted-foreground">5 minutes (recommended)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Attempts</label>
                  <p className="text-sm text-muted-foreground">3 attempts per code</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit</label>
                  <p className="text-sm text-muted-foreground">5 codes per hour per user</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code Length</label>
                  <p className="text-sm text-muted-foreground">6 digits</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}