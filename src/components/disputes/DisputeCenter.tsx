import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, AlertTriangle, Clock, CheckCircle, Users } from "lucide-react";
import { DisputeForm } from "./DisputeForm";
import { DisputeDetails } from "./DisputeDetails";
import { MediatorDashboard } from "./MediatorDashboard";
import { useToast } from "@/hooks/use-toast";

interface Dispute {
  id: string;
  order_id: string;
  title: string;
  description: string;
  dispute_type: string;
  status: string;
  priority: string;
  resolution_tier: string;
  created_at: string;
  orders?: {
    product_name: string;
    total_amount: number;
  };
}

export const DisputeCenter = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [isMediator, setIsMediator] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDisputes();
      fetchUserOrders();
      checkMediatorStatus();
    }
  }, [user]);

  const fetchDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          orders!inner(product_name, total_amount)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDisputes(data || []);
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or(`buyer_id.eq.${user?.id},seller_id.eq.${user?.id}`);

      if (error) throw error;
      setUserOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const checkMediatorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("mediators")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .single();

      if (!error && data) {
        setIsMediator(true);
      }
    } catch (error) {
      // User is not a mediator, which is fine
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "investigating": return "bg-blue-100 text-blue-800";
      case "mediation": return "bg-purple-100 text-purple-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "escalated": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "high": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dispute Resolution Center</h1>
          <p className="text-muted-foreground">Manage and resolve transaction disputes</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary/90">
          <FileText className="h-4 w-4 mr-2" />
          File New Dispute
        </Button>
      </div>

      <Tabs defaultValue="my-disputes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-disputes">My Disputes</TabsTrigger>
          {isMediator && (
            <TabsTrigger value="mediation">
              <Users className="h-4 w-4 mr-2" />
              Mediation Cases
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-disputes" className="space-y-4">
          {disputes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
                <p className="text-muted-foreground">You haven't filed any disputes yet.</p>
              </CardContent>
            </Card>
          ) : (
            disputes.map((dispute) => (
              <Card key={dispute.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedDispute(dispute)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{dispute.title}</CardTitle>
                      <CardDescription>
                        Order: {dispute.orders?.product_name} - ${dispute.orders?.total_amount}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(dispute.priority)}
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {dispute.description.substring(0, 150)}...
                  </p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Type: {dispute.dispute_type}</span>
                    <span>Filed: {new Date(dispute.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {isMediator && (
          <TabsContent value="mediation">
            <MediatorDashboard />
          </TabsContent>
        )}
      </Tabs>

      {showForm && (
        <DisputeForm
          orders={userOrders}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchDisputes();
          }}
        />
      )}

      {selectedDispute && (
        <DisputeDetails
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onUpdate={fetchDisputes}
        />
      )}
    </div>
  );
};