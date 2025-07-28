import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Coins, 
  TrendingUp, 
  Gift, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TokenReward {
  id: string;
  amount: number;
  action_type: string;
  user_role: string;
  status: string;
  created_at: string;
  order_id?: string;
}

interface RoleProgression {
  user_role: string;
  earnings_total: number;
  sales_count: number;
  referrals_count: number;
}

export const TokenRewards: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<TokenReward[]>([]);
  const [progression, setProgression] = useState<RoleProgression | null>(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTokenRewards();
      fetchRoleProgression();
    }
  }, [user]);

  const fetchTokenRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('token_rewards')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRewards(data || []);
      
      // Calculate totals
      const total = data?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;
      const pending = data?.filter(r => r.status === 'pending')
        .reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;
      
      setTotalEarnings(total);
      setPendingEarnings(pending);
    } catch (error) {
      console.error('Error fetching token rewards:', error);
    }
  };

  const fetchRoleProgression = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles_progression')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProgression(data);
    } catch (error) {
      console.error('Error fetching role progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'purchase':
        return <Gift className="h-4 w-4" />;
      case 'sale':
        return <TrendingUp className="h-4 w-4" />;
      case 'referral_sale':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getActionLabel = (actionType: string) => {
    switch (actionType) {
      case 'purchase':
        return 'Purchase Reward';
      case 'sale':
        return 'Sale Commission';
      case 'referral_sale':
        return 'Referral Bonus';
      case 'downline_commission':
        return 'Agent Commission';
      default:
        return actionType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          $ZSHOP Token Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
            <div className="text-2xl font-bold text-foreground">
              {totalEarnings.toFixed(4)}
            </div>
            <p className="text-sm text-muted-foreground">Total $ZSHOP Earned</p>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border">
            <div className="text-2xl font-bold text-foreground">
              {pendingEarnings.toFixed(4)}
            </div>
            <p className="text-sm text-muted-foreground">Pending Rewards</p>
          </div>
        </div>

        {/* Current Role & Progress */}
        {progression && (
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {progression.user_role.charAt(0).toUpperCase() + progression.user_role.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">Role</span>
              </div>
              {progression.user_role === 'buyer' && (
                <Button size="sm" variant="outline">
                  Upgrade to Seller
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold">{progression.sales_count}</div>
                <div className="text-muted-foreground">Sales</div>
              </div>
              <div>
                <div className="font-semibold">{progression.referrals_count}</div>
                <div className="text-muted-foreground">Referrals</div>
              </div>
              <div>
                <div className="font-semibold">{progression.earnings_total.toFixed(4)}</div>
                <div className="text-muted-foreground">Total Earned</div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Recent Rewards */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Rewards
          </h4>
          
          {rewards.length === 0 ? (
            <div className="text-center py-6">
              <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No rewards yet</p>
              <p className="text-sm text-muted-foreground">Start shopping or selling to earn $ZSHOP tokens!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">
                      {getActionIcon(reward.action_type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getActionLabel(reward.action_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      +{Number(reward.amount).toFixed(4)} $ZSHOP
                    </span>
                    <Badge variant="outline" className={getStatusColor(reward.status)}>
                      {reward.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Earning Rates */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-sm mb-2 text-blue-800">Current Earning Rates</h4>
          <div className="grid grid-cols-1 gap-1 text-xs text-blue-700">
            <div>• Buyer: 0.01 $ZSHOP per $1 spent</div>
            <div>• Seller: 0.05 $ZSHOP per $1 in sales</div>
            <div>• Agent: 0.10 $ZSHOP per referral sale</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};