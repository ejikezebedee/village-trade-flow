import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Coins, 
  Send, 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign,
  Gift,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function TokenAdminPanel() {
  const [tokenStats, setTokenStats] = useState({
    totalDistributed: 0,
    pendingRewards: 0,
    totalBurned: 0,
    activeUsers: 0
  });
  const [rewardRates, setRewardRates] = useState({
    buyer: 0.01,
    seller: 0.05,
    agent: 0.10
  });
  const [selectedUser, setSelectedUser] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokenStats();
    fetchRewardRates();
  }, []);

  const fetchTokenStats = async () => {
    try {
      // This would fetch from your token tracking tables
      const { data: wallets } = await supabase
        .from('user_wallets')
        .select('escrow_balance');
      
      const totalDistributed = wallets?.reduce((sum, wallet) => sum + (wallet.escrow_balance || 0), 0) || 0;
      
      setTokenStats({
        totalDistributed,
        pendingRewards: 250000,
        totalBurned: 15000,
        activeUsers: 1247
      });
    } catch (error) {
      console.error('Error fetching token stats:', error);
    }
  };

  const fetchRewardRates = async () => {
    try {
      const { data: config } = await supabase
        .from('token_config')
        .select('*')
        .eq('is_active', true);
      
      if (config) {
        const rates = config.reduce((acc, item) => {
          acc[item.user_role] = item.reward_rate;
          return acc;
        }, {});
        setRewardRates({ ...rewardRates, ...rates });
      }
    } catch (error) {
      console.error('Error fetching reward rates:', error);
    }
  };

  const updateRewardRate = async (role: string, rate: number) => {
    try {
      const { error } = await supabase
        .from('token_config')
        .update({ reward_rate: rate })
        .eq('user_role', role)
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: "Reward Rate Updated",
        description: `${role} reward rate updated to ${rate} $ZSHOP per $1`,
      });
    } catch (error) {
      console.error('Error updating reward rate:', error);
      toast({
        title: "Error",
        description: "Failed to update reward rate",
        variant: "destructive"
      });
    }
  };

  const sendTokens = async () => {
    if (!selectedUser || !tokenAmount) return;

    setLoading(true);
    try {
      // This would call an edge function to send tokens
      const { error } = await supabase.functions.invoke('send-tokens', {
        body: {
          user_id: selectedUser,
          amount: parseFloat(tokenAmount),
          reason: 'Admin manual distribution'
        }
      });

      if (error) throw error;

      toast({
        title: "Tokens Sent",
        description: `${tokenAmount} $ZSHOP tokens sent successfully`,
      });

      setSelectedUser('');
      setTokenAmount('');
      fetchTokenStats();
    } catch (error) {
      console.error('Error sending tokens:', error);
      toast({
        title: "Error",
        description: "Failed to send tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportTokenLogs = async () => {
    try {
      const { data } = await supabase
        .from('token_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (data) {
        const csv = [
          ['Date', 'User ID', 'Amount', 'Type', 'Reason'].join(','),
          ...data.map(row => [
            new Date(row.created_at).toLocaleDateString(),
            row.user_id,
            row.amount,
            row.transaction_type,
            row.description || ''
          ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `token-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export token logs",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            $ZSHOP Token Administration
          </h2>
          <p className="text-muted-foreground">Manage token economy and rewards</p>
        </div>
        <Button onClick={exportTokenLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Distributed</p>
                <p className="text-2xl font-bold">{tokenStats.totalDistributed.toLocaleString()} $ZSHOP</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Rewards</p>
                <p className="text-2xl font-bold">{tokenStats.pendingRewards.toLocaleString()} $ZSHOP</p>
              </div>
              <Gift className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Burned</p>
                <p className="text-2xl font-bold">{tokenStats.totalBurned.toLocaleString()} $ZSHOP</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Token Users</p>
                <p className="text-2xl font-bold">{tokenStats.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rewards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Reward Settings</TabsTrigger>
          <TabsTrigger value="distribute">Manual Distribution</TabsTrigger>
          <TabsTrigger value="claims">Pending Claims</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Reward Rate Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Buyer Rewards (per $1 spent)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={rewardRates.buyer}
                      onChange={(e) => setRewardRates({...rewardRates, buyer: parseFloat(e.target.value)})}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => updateRewardRate('buyer', rewardRates.buyer)}
                    >
                      Update
                    </Button>
                  </div>
                  <Badge variant="secondary">Current: {rewardRates.buyer} $ZSHOP</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Seller Rewards (per $1 sold)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={rewardRates.seller}
                      onChange={(e) => setRewardRates({...rewardRates, seller: parseFloat(e.target.value)})}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => updateRewardRate('seller', rewardRates.seller)}
                    >
                      Update
                    </Button>
                  </div>
                  <Badge variant="secondary">Current: {rewardRates.seller} $ZSHOP</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Agent Rewards (per downline $1)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={rewardRates.agent}
                      onChange={(e) => setRewardRates({...rewardRates, agent: parseFloat(e.target.value)})}
                    />
                    <Button 
                      size="sm" 
                      onClick={() => updateRewardRate('agent', rewardRates.agent)}
                    >
                      Update
                    </Button>
                  </div>
                  <Badge variant="secondary">Current: {rewardRates.agent} $ZSHOP</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribute">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Manual Token Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-select">Select User</Label>
                  <Input
                    id="user-select"
                    placeholder="Enter User ID or email"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token-amount">Token Amount</Label>
                  <Input
                    id="token-amount"
                    type="number"
                    placeholder="Enter amount"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={sendTokens} 
                disabled={!selectedUser || !tokenAmount || loading}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Tokens'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Pending Token Claims</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending claims at this time</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}