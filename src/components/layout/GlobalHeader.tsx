import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, User, Settings, LogOut, ShoppingCart, Plus } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSelector } from '@/components/internationalization/LanguageSelector';
import { useLanguage } from '@/components/internationalization/LanguageProvider';

export function GlobalHeader() {
  const navigate = useNavigate();
  const { user, profile, signOut, hasRole } = useAuth();
  const { t } = useLanguage();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const getUserInitials = () => {
    if (profile?.full_name || profile?.first_name) {
      const name = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      return name
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || '?';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600';
      case 'seller': return 'bg-green-600';
      case 'driver': return 'bg-blue-600';
      case 'agent': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">VM</span>
          </div>
          <span className="font-bold text-lg">VillageMarket</span>
        </Link>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t('nav.products')}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        to="/products"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          {t('nav.products')}
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Browse products from local sellers across Nigeria
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/categories" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Categories</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Shop by product categories
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/brands" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Brands</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Discover trusted local brands
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link to="/best-sellers" className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                        <div className="text-sm font-medium leading-none">Best Sellers</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Most popular products
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/pricing" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  {t('nav.pricing')}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link to="/how-it-works" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  How It Works
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <LanguageSelector variant="popover" />

          {!user ? (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                {t('auth.login')}
              </Button>
              <Button onClick={() => navigate('/auth')}>
                {t('auth.register')}
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Sell Button for non-sellers */}
              {!hasRole('seller') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/seller')}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Sell
                </Button>
              )}

              {/* Cart/Shopping */}
              <Button variant="ghost" size="sm" onClick={() => navigate('/favorites')}>
                <ShoppingCart className="w-4 h-4" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                <Bell className="w-4 h-4" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} alt="User avatar" />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{profile?.full_name || profile?.first_name || user?.email}</p>
                      {profile?.user_role && (
                        <Badge className={`w-fit text-xs ${getRoleBadgeColor(profile.user_role)}`}>
                          {profile.user_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Role-based dashboard links */}
                  {hasRole('buyer') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/buyer')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Buyer Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  {hasRole('seller') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/seller')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Seller Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  {hasRole('driver') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/driver')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Driver Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  {hasRole('admin') && (
                    <DropdownMenuItem onClick={() => navigate('/dashboard/admin')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/2fa-settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Security Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Wallet</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}