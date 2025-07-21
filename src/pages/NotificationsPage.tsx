import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationDemo } from "@/components/notifications/NotificationDemo";
import { Header } from "@/components/marketplace/Header";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Automated Messaging System
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience real-time notifications for all marketplace events - from order placement to delivery confirmation and payment release.
              </p>
            </div>
            
            <NotificationDemo />
          </div>
        </div>
      </main>
    </div>
  );
}