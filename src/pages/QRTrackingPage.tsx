import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedQRSystem } from "@/components/qr/EnhancedQRSystem";
import { TransactionQRSystem } from "@/components/qr/TransactionQRSystem";
import { DeliveryTrackingSystem } from "@/components/qr/DeliveryTrackingSystem";
import { QrCode, Package, Truck } from "lucide-react";

const QRTrackingPage = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QR Code Management</h1>
        <p className="text-muted-foreground">
          Comprehensive QR code system for transaction lifecycle and delivery tracking
        </p>
      </div>

      <Tabs defaultValue="delivery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Live Delivery Tracking
          </TabsTrigger>
          <TabsTrigger value="transaction" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Transaction QR System
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Legacy QR System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Delivery Tracking</CardTitle>
              <CardDescription>
                Real-time delivery tracking with automatic status updates and notifications.
                QR codes automatically update transaction status as goods move through the delivery chain.
              </CardDescription>
            </CardHeader>
          </Card>
          <DeliveryTrackingSystem />
        </TabsContent>

        <TabsContent value="transaction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Transaction Lifecycle</CardTitle>
              <CardDescription>
                QR codes are automatically generated for every transaction stage: 
                product listing, order creation, payment confirmation, shipping, and delivery.
              </CardDescription>
            </CardHeader>
          </Card>
          <TransactionQRSystem />
        </TabsContent>

        <TabsContent value="legacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Legacy QR Tracking System</CardTitle>
              <CardDescription>
                Original QR tracking system for delivery chain management: 
                seller → driver → shop → buyer.
              </CardDescription>
            </CardHeader>
          </Card>
          <EnhancedQRSystem />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QRTrackingPage;