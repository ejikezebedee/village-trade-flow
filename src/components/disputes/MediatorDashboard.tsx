import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Scale, Clock, CheckCircle, Users, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const MediatorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mediatorProfile, setMediatorProfile] = useState<any>(null);
  const [assignedDisputes, setAssignedDisputes] = useState<any[]>([]);
  const [availableDisputes, setAvailableDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMediatorProfile();
      fetchAssignedDisputes();
      fetchAvailableDisputes();
    }
  }, [user]);

  const fetchMediatorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("mediators")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMediatorProfile(data);
    } catch (error) {
      console.error("Error fetching mediator profile:", error);
    }
  };

  const fetchAssignedDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          orders!inner(product_name, total_amount)
        `)
        .eq("assigned_mediator_id", user?.id)
        .in("status", ["mediation", "investigating"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssignedDisputes(data || []);
    } catch (error) {
      console.error("Error fetching assigned disputes:", error);
    }
  };

  const fetchAvailableDisputes = async () => {
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select(`
          *,
          orders!inner(product_name, total_amount)
        `)
        .is("assigned_mediator_id", null)
        .eq("resolution_tier", "community")
        .eq("status", "pending")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) throw error;
      setAvailableDisputes(data || []);
    } catch (error) {
      console.error("Error fetching available disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDispute = async (disputeId: string) => {
    try {
      const { error } = await supabase
        .from("disputes")
        .update({
          assigned_mediator_id: user?.id,
          status: "mediation",
          updated_at: new Date().toISOString()
        })
        .eq("id", disputeId);

      if (error) throw error;

      toast({
        title: "Dispute Accepted",
        description: "You have been assigned to mediate this dispute.",
      });

      fetchAssignedDisputes();
      fetchAvailableDisputes();
    } catch (error) {
      console.error("Error accepting dispute:", error);
      toast({
        title: "Error",
        description: "Failed to accept dispute.",
        variant: "destructive",
      });
    }
  };

  const becomeMediator = async () => {
    try {
      const { error } = await supabase
        .from("mediators")
        .insert({
          user_id: user?.id,
          is_active: true,
          specializations: ["general"],
          certified_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Welcome, Mediator!",
        description: "You are now certified to help resolve disputes.",
      });

      fetchMediatorProfile();
    } catch (error) {
      console.error("Error becoming mediator:", error);
      toast({
        title: "Error",
        description: "Failed to register as mediator.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "investigating": return "bg-blue-100 text-blue-800";
      case "mediation": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "border-red-500";
      case "high": return "border-orange-500";
      default: return "border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!mediatorProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-6 w-6" />
            Become a Mediator
          </CardTitle>
          <CardDescription>
            Help resolve disputes in the community and earn recognition for fair judgments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Requirements:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Active community member</li>
                <li>• Fair and impartial judgment</li>
                <li>• Good communication skills</li>
                <li>• Available for case review</li>
              </ul>
            </div>
            <Button onClick={becomeMediator} className="w-full">
              <Scale className="h-4 w-4 mr-2" />
              Apply to Become a Mediator
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mediator Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-xl font-bold">{mediatorProfile.total_cases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="text-xl font-bold">{mediatorProfile.successful_resolutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="text-xl font-bold">{mediatorProfile.rating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-xl font-bold">{assignedDisputes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Resolution Success</span>
              <span>{mediatorProfile.total_cases > 0 ? 
                Math.round((mediatorProfile.successful_resolutions / mediatorProfile.total_cases) * 100) : 0}%</span>
            </div>
            <Progress 
              value={mediatorProfile.total_cases > 0 ? 
                (mediatorProfile.successful_resolutions / mediatorProfile.total_cases) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Assigned Disputes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Active Cases</h2>
        {assignedDisputes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Cases</h3>
              <p className="text-muted-foreground">You don't have any assigned disputes at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          assignedDisputes.map((dispute) => (
            <Card key={dispute.id} className={`border-l-4 ${getPriorityColor(dispute.priority)}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{dispute.title}</CardTitle>
                    <CardDescription>
                      Order: {dispute.orders?.product_name} - ${dispute.orders?.total_amount}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(dispute.status)}>
                    {dispute.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {dispute.description.substring(0, 200)}...
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <span className="mr-4">Type: {dispute.dispute_type}</span>
                    <span>Priority: {dispute.priority}</span>
                  </div>
                  <Button size="sm">Review Case</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Available Disputes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Available Cases</h2>
        {availableDisputes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Cases Available</h3>
              <p className="text-muted-foreground">All disputes are currently assigned or resolved.</p>
            </CardContent>
          </Card>
        ) : (
          availableDisputes.map((dispute) => (
            <Card key={dispute.id} className={`border-l-4 ${getPriorityColor(dispute.priority)}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{dispute.title}</CardTitle>
                    <CardDescription>
                      Order: {dispute.orders?.product_name} - ${dispute.orders?.total_amount}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{dispute.priority}</Badge>
                    <Badge className={getStatusColor(dispute.status)}>
                      {dispute.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {dispute.description.substring(0, 200)}...
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <span className="mr-4">Type: {dispute.dispute_type}</span>
                    <span>Filed: {new Date(dispute.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptDispute(dispute.id)}>
                    Accept Case
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};