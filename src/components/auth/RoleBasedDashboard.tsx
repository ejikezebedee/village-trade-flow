import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Store, 
  Truck, 
  Users, 
  Star,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoleBasedDashboard: React.FC = () => {
  const { profile, isVerified } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const getStatusBadge = () => {
    if (isVerified()) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    } else if (profile.verification_status === 'pending') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Not Verified</Badge>;
    }
  };

  const getRoleIcon = () => {
    switch (profile.user_type) {
      case 'buyer': return <ShoppingBag className="w-6 h-6" />;
      case 'seller': return <Store className="w-6 h-6" />;
      case 'driver': return <Truck className="w-6 h-6" />;
      case 'agent': return <Users className="w-6 h-6" />;
      default: return <Users className="w-6 h-6" />;
    }
  };

  const getRoleActions = () => {
    switch (profile.user_type) {
      case 'buyer':
        return [
          { label: 'Browse Products', action: () => navigate('/'), icon: ShoppingBag },
          { label: 'My Orders', action: () => navigate('/buyer-dashboard'), icon: ShoppingBag },
          { label: 'Track Deliveries', action: () => navigate('/buyer-dashboard'), icon: Truck }
        ];
      case 'seller':
        return [
          { label: 'My Products', action: () => navigate('/seller-dashboard'), icon: Store },
          { label: 'Add New Product', action: () => navigate('/product-listing'), icon: Store },
          { label: 'Sales Analytics', action: () => navigate('/seller-dashboard'), icon: Star }
        ];
      case 'driver':
        return [
          { label: 'Available Deliveries', action: () => navigate('/driver-dashboard'), icon: Truck },
          { label: 'My Routes', action: () => navigate('/driver-dashboard'), icon: Truck },
          { label: 'Earnings', action: () => navigate('/driver-dashboard'), icon: Star }
        ];
      case 'agent':
        return [
          { label: 'Help Users', action: () => navigate('/agent-dashboard'), icon: Users },
          { label: 'Community Management', action: () => navigate('/agent-dashboard'), icon: Users },
          { label: 'Reports', action: () => navigate('/agent-dashboard'), icon: Star }
        ];
      default:
        return [
          { label: 'Browse Products', action: () => navigate('/'), icon: ShoppingBag }
        ];
    }
  };

  const actions = getRoleActions();

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getRoleIcon()}
              <div>
                <CardTitle className="text-xl">
                  Welcome, {profile.first_name || 'User'}!
                </CardTitle>
                <p className="text-muted-foreground capitalize">
                  {profile.user_type} Account
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-yellow-500 mr-1" />
                <span className="font-semibold">{profile.rating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Rating</p>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2">{profile.total_ratings}</div>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center">
              <div className="font-semibold mb-2 capitalize">{profile.verification_status}</div>
              <p className="text-sm text-muted-foreground">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
                onClick={action.action}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification Notice */}
      {!isVerified() && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Account Verification Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              To access all features and build trust with other users, please complete your account verification.
            </p>
            <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
              Complete Verification
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};