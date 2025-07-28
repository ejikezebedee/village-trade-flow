import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { WalletConnection } from '@/components/web3/WalletConnection';
import { TokenRewards } from '@/components/web3/TokenRewards';
import { RoleUpgrade } from '@/components/web3/RoleUpgrade';
import { 
  ShoppingCart, 
  Store, 
  Users, 
  Star,
  TrendingUp,
  Gift,
  Crown,
  Shield,
  Coins
} from 'lucide-react';

interface RoleProgression {
  user_role: string;
  sales_count: number;
  referrals_count: number;
  earnings_total: number;
}

export const RoleBasedDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [progression, setProgression] = useState<RoleProgression | null>(null);
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
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setProgression(data);
    } catch (error) {
      console.error('Error fetching role progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'buyer':
        return <ShoppingCart className="h-4 w-4" />;
      case 'seller':
        return <Store className="h-4 w-4" />;
      case 'agent':
        return <Crown className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
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

  const getRoleActions = () => {
    const currentRole = progression?.user_role || profile?.user_type || 'buyer';
    
    const baseActions = [
      {
        label: 'My Profile',
        action: () => navigate('/profile'),
        icon: Users,
      },
    ];

    switch (currentRole) {
      case 'buyer':
        return [
          ...baseActions,
          {
            label: 'Browse Products',
            action: () => navigate('/'),
            icon: ShoppingCart,
          },
          {
            label: 'My Orders',
            action: () => navigate('/orders/all'),
            icon: Gift,
          },
          {
            label: 'Become a Seller',
            action: () => navigate('/seller-dashboard'),
            icon: TrendingUp,
          },
        ];

      case 'seller':
        return [
          ...baseActions,
          {
            label: 'Seller Dashboard',
            action: () => navigate('/seller-dashboard'),
            icon: Store,
          },
          {
            label: 'Add Products',
            action: () => navigate('/seller-dashboard'),
            icon: TrendingUp,
          },
          {
            label: 'My Sales',
            action: () => navigate('/seller-dashboard'),
            icon: Star,
          },
        ];

      case 'agent':
        return [
          ...baseActions,
          {
            label: 'Agent Dashboard',
            action: () => navigate('/agent-dashboard'),
            icon: Crown,
          },
          {
            label: 'Referral Program',
            action: () => navigate('/affiliate'),
            icon: Users,
          },
          {
            label: 'My Network',
            action: () => navigate('/agent-dashboard'),
            icon: TrendingUp,
          },
        ];

      default:
        return baseActions;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentRole = progression?.user_role || profile?.user_type || 'buyer';
  const actions = getRoleActions();

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : user?.email
                  }
                </h3>
                <Badge className={getRoleColor(currentRole)}>
                  {getRoleIcon(currentRole)}
                  <span className="ml-1">
                    {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
                  </span>
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{user?.email}</span>
                <Badge variant="outline" className={getVerificationColor(profile?.verification_status || 'unverified')}>
                  {profile?.verification_status || 'Unverified'}
                </Badge>
              </div>
            </div>
          </div>

          {progression && (
            <div className="grid grid-cols-3 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold">{progression.sales_count}</div>
                <div className="text-xs text-muted-foreground">Sales</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{progression.referrals_count}</div>
                <div className="text-xs text-muted-foreground">Referrals</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  {progression.earnings_total.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">$ZSHOP Earned</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={action.action}
                className="justify-start h-12"
              >
                <action.icon className="h-4 w-4 mr-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Web3 Components */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WalletConnection />
        <RoleUpgrade />
      </div>
      
      <TokenRewards />

      {/* Verification Notice */}
      {profile?.verification_status !== 'verified' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Account Verification Required</p>
                <p className="text-sm text-orange-700">
                  Complete your verification to unlock full platform features and higher earning rates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};