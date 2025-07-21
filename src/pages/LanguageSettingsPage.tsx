import React from 'react';
import { LanguageSelector } from '@/components/language/LanguageSelector';
import { ProductTranslation } from '@/components/language/ProductTranslation';
import { MessageTranslationDemo } from '@/components/language/MessageTranslationDemo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Package, Bell, Settings } from 'lucide-react';

export default function LanguageSettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Language & Translation Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your language preferences and explore translation features
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Language Settings
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Translation
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Message Translation
            </TabsTrigger>
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Live Demo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <LanguageSelector />
          </TabsContent>

          <TabsContent value="products">
            <ProductTranslation />
          </TabsContent>

          <TabsContent value="messages">
            <MessageTranslationDemo />
          </TabsContent>

          <TabsContent value="demo">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProductTranslation />
              <MessageTranslationDemo />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}