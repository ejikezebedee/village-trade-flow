import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Star,
  Bell
} from 'lucide-react';

export const UserMenu: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user || !profile) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
        <Button onClick={() => navigate('/auth')}>
          Sign Up
        </Button>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'driver': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const getUserInitials = () => {
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  return (
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="sm">
        <Bell className="w-4 h-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url} alt="Profile" />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-80" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium leading-none">
                  {profile.first_name} {profile.last_name}
                </p>
                {profile.verification_status === 'verified' && (
                  <Shield className="w-4 h-4 text-green-600" />
                )}
              </div>
              
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor(profile.user_type)}>
                  {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                </Badge>
                
                <Badge className={getVerificationColor(profile.verification_status)}>
                  {profile.verification_status.charAt(0).toUpperCase() + profile.verification_status.slice(1)}
                </Badge>
              </div>

              {profile.rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">
                    {profile.rating.toFixed(1)} ({profile.total_ratings} reviews)
                  </span>
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => navigate(`/dashboard/${profile.user_type}`)}>
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          
          {profile.user_type === 'admin' && (
            <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};