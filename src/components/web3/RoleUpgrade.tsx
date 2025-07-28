import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Star, 
  ArrowRight,
  Lock,
  CheckCircle,
  Crown
} from 'lucide-react';

interface RoleProgression {
  user_role: string;
  sales_count: number;
  referrals_count: number;
  earnings_total: number;
  requirements_met: boolean;
}

export const RoleUpgrade: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [progression, setProgression] = useState<RoleProgression | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoleProgression();
    }
  }, [user]);

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

  const handleRoleUpgrade = async (newRole: string) => {
    if (!user) return;
    
    setUpgrading(true);
    try {
      const { data, error } = await supabase.rpc('upgrade_user_role', {
        p_user_id: user.id,
        p_new_role: newRole
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "🎉 Role Upgraded Successfully!",
          description: `Welcome to your new ${newRole} role! You now have access to enhanced features and better earning rates.`,
        });
        
        // Refresh data
        await fetchRoleProgression();
        
        // Refresh auth context to update profile
        window.location.reload();
      } else {
        toast({
          title: "Upgrade Requirements Not Met",
          description: getUpgradeRequirementMessage(newRole),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error upgrading role:', error);
      toast({
        title: "Upgrade Failed",
        description: "Unable to upgrade role. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const getUpgradeRequirementMessage = (role: string) => {
    switch (role) {
      case 'seller':
        return 'Anyone can become a seller! Click to upgrade now.';
      case 'agent':
        return 'You need at least 5 completed sales as a seller to become an agent.';
      default:
        return 'Requirements not met for this upgrade.';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'buyer':
        return <ShoppingCart className="h-5 w-5" />;
      case 'seller':
        return <TrendingUp className="h-5 w-5" />;
      case 'agent':
        return <Crown className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'agent':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressToNextRole = () => {
    if (!progression) return { progress: 0, requirement: 0, current: 0 };
    
    const currentRole = progression.user_role;
    
    if (currentRole === 'buyer') {
      return { progress: 100, requirement: 0, current: 1 }; // Can always upgrade to seller
    } else if (currentRole === 'seller') {
      const requirement = 5;
      const current = progression.sales_count;
      const progress = Math.min((current / requirement) * 100, 100);
      return { progress, requirement, current };
    }
    
    return { progress: 100, requirement: 0, current: 1 }; // Already at highest role
  };

  const canUpgrade = () => {
    if (!progression) return false;
    
    const currentRole = progression.user_role;
    if (currentRole === 'buyer') return true;
    if (currentRole === 'seller') return progression.sales_count >= 5;
    return false;
  };

  const getNextRole = () => {
    if (!progression) return null;
    
    const currentRole = progression.user_role;
    if (currentRole === 'buyer') return 'seller';
    if (currentRole === 'seller') return 'agent';
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressData = getProgressToNextRole();
  const nextRole = getNextRole();
  const currentRole = progression?.user_role || 'buyer';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Role Progression
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Role Status */}
        <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getRoleIcon(currentRole)}
            <Badge className={getRoleColor(currentRole)}>
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Your current role</p>
        </div>

        {progression && (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{progression.sales_count}</div>
              <div className="text-xs text-muted-foreground">Sales Completed</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{progression.referrals_count}</div>
              <div className="text-xs text-muted-foreground">Referrals Made</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-lg font-semibold">{progression.earnings_total.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">$ZSHOP Earned</div>
            </div>
          </div>
        )}

        <Separator />

        {/* Next Role Upgrade */}
        {nextRole ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Upgrade to {nextRole.charAt(0).toUpperCase() + nextRole.slice(1)}</h4>
              {canUpgrade() ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {nextRole === 'seller' ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-3">Ready to upgrade! 🎉</p>
                <p className="text-xs text-green-700 mb-4">
                  Become a seller to earn 5x more tokens and access advanced features.
                </p>
                <Button 
                  onClick={() => handleRoleUpgrade('seller')}
                  disabled={upgrading}
                  className="w-full"
                >
                  {upgrading ? 'Upgrading...' : 'Become a Seller'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : nextRole === 'agent' ? (
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 mb-2">
                    Agent Role Requirements:
                  </p>
                  <p className="text-xs text-purple-700 mb-3">
                    Complete 5 sales as a seller to unlock agent privileges and referral bonuses.
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Sales Progress</span>
                      <span>{progressData.current}/{progressData.requirement}</span>
                    </div>
                    <Progress value={progressData.progress} className="h-2" />
                  </div>
                </div>

                {canUpgrade() && (
                  <Button 
                    onClick={() => handleRoleUpgrade('agent')}
                    disabled={upgrading}
                    className="w-full"
                  >
                    {upgrading ? 'Upgrading...' : 'Become an Agent'}
                    <Crown className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
            <Crown className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
            <p className="font-medium">Maximum Role Achieved!</p>
            <p className="text-sm text-muted-foreground">
              You've reached the highest role in our platform.
            </p>
          </div>
        )}

        {/* Role Benefits */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-sm mb-2 text-blue-800">Role Benefits</h4>
          <div className="space-y-1 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-3 w-3" />
              <span>Buyer: 0.01 $ZSHOP per $1 spent</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span>Seller: 0.05 $ZSHOP per $1 in sales</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-3 w-3" />
              <span>Agent: 0.10 $ZSHOP per referral + commissions</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};