import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SecureMarketplace } from '@/components/marketplace/SecureMarketplace';
import { SecureWallet } from '@/components/wallet/SecureWallet';
import { QRDeliverySystem } from '@/components/delivery/QRDeliverySystem';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/components/auth/SecureAuthProvider';

export const SecurePlatform: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          {isAdmin() && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        <TabsContent value="marketplace">
          <SecureMarketplace />
        </TabsContent>

        <TabsContent value="wallet">
          <SecureWallet />
        </TabsContent>

        <TabsContent value="delivery">
          <QRDeliverySystem />
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="admin">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};