import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  UserCheck, 
  UserX,
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Star,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  user_type: string;
  user_role: string;
  verification_status: string;
  rating: number;
  total_ratings: number;
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
}

interface UserWithStats extends UserProfile {
  restrictions?: number;
  orders_count?: number;
  products_count?: number;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch user profiles with additional stats
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Enhance with additional statistics
      const enhancedUsers = await Promise.all(
        (profilesData || []).map(async (profile) => {
          // Get restriction count
          const { count: restrictionCount } = await supabase
            .from('user_restrictions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .eq('is_active', true);

          // Get orders count (as buyer)
          const { count: ordersCount } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('buyer_id', profile.user_id);

          // Get products count (as seller)
          const { count: productsCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', profile.id);

          return {
            ...profile,
            restrictions: restrictionCount || 0,
            orders_count: ordersCount || 0,
            products_count: productsCount || 0
          };
        })
      );

      setUsers(enhancedUsers);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteToAdmin = async (userId: string, userName: string) => {
    try {
      // Temporarily use direct update until RPC function is properly deployed
      const { error } = await supabase
        .from('profiles')
        .update({ user_role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "User Promoted",
        description: `User has been promoted to admin.`,
      });

      fetchUserData();
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error",
        description: "Failed to promote user.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'verified' })
        .eq('user_id', userId);

      if (error) throw error;

      // Log the verification
      await supabase.rpc('log_security_event', {
        p_event_type: 'user_verified',
        p_severity: 'info',
        p_user_id: userId,
        p_action_performed: `User manually verified: ${userName}`,
        p_metadata: { verification_method: 'admin_manual' }
      });

      toast({
        title: "User Verified",
        description: "User has been verified.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast({
        title: "Error",
        description: "Failed to verify user.",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;

      // Add user restriction
      await supabase
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: 'suspended',
          reason: 'Account deactivated by admin'
        });

      // Log the deactivation
      await supabase.rpc('log_security_event', {
        p_event_type: 'user_deactivated',
        p_severity: 'warning',
        p_user_id: userId,
        p_action_performed: `User account deactivated: ${userName}`
      });

      toast({
        title: "User Deactivated",
        description: "User account has been deactivated.",
      });

      fetchUserData();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate user.",
        variant: "destructive"
      });
    }
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || user.user_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.verification_status === 'verified').length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Restricted Users</p>
                <p className="text-2xl font-bold">{users.filter(u => (u.restrictions || 0) > 0).length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.user_role === 'admin').length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Management</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="buyer">Buyers</option>
                <option value="seller">Sellers</option>
                <option value="driver">Drivers</option>
                <option value="agent">Agents</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {`${user.first_name?.[0] || 'U'}${user.last_name?.[0] || ''}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'Unnamed User'
                        }
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">{user.user_type}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{user.rating.toFixed(1)} ({user.total_ratings} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getVerificationColor(user.verification_status)}>
                      {user.verification_status}
                    </Badge>
                    <Badge className={getRoleColor(user.user_role)}>
                      {user.user_role}
                    </Badge>
                    {!user.is_active && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium">User ID:</span> {user.user_id.slice(0, 8)}...
                  </div>
                  <div>
                    <span className="font-medium">Orders:</span> {user.orders_count}
                  </div>
                  <div>
                    <span className="font-medium">Products:</span> {user.products_count}
                  </div>
                  <div>
                    <span className="font-medium">Restrictions:</span> {user.restrictions}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {user.verification_status !== 'verified' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleVerifyUser(user.user_id, `${user.first_name} ${user.last_name}`)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                  )}
                  
                  {user.user_role === 'user' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handlePromoteToAdmin(user.user_id, `${user.first_name} ${user.last_name}`)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Promote to Admin
                    </Button>
                  )}

                  {user.is_active && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeactivateUser(user.user_id, `${user.first_name} ${user.last_name}`)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};