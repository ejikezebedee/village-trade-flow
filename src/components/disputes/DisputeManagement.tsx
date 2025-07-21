import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare,
  FileText,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

interface DisputeManagementProps {
  disputeId?: string;
}

interface Dispute {
  id: string;
  title: string;
  dispute_type: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  order_id?: string;
  filed_by: string;
  respondent_id: string;
  assigned_mediator_id?: string;
  filed_by_profile?: {
    first_name: string;
    last_name: string;
    user_type: string;
  };
  respondent_profile?: {
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

interface DisputeEvidence {
  id: string;
  evidence_type: string;
  file_url?: string;
  description: string;
  submitted_by: string;
  created_at: string;
}

export default function DisputeManagement({ disputeId }: DisputeManagementProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const isAdmin = profile?.user_role === 'admin' || profile?.user_role === 'moderator';

  useEffect(() => {
    if (disputeId) {
      fetchDisputeById(disputeId);
    } else {
      fetchDisputes();
    }
  }, [disputeId]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, only show user's disputes
      if (!isAdmin) {
        query = query.or(`filed_by.eq.${user?.id},respondent_id.eq.${user?.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profile data separately
      const disputesWithProfiles = await Promise.all(
        (data || []).map(async (dispute) => {
          const [filedByProfile, respondentProfile] = await Promise.all([
            supabase
              .from('profiles')
              .select('first_name, last_name, user_type')
              .eq('user_id', dispute.filed_by)
              .single(),
            supabase
              .from('profiles')
              .select('first_name, last_name, user_type')
              .eq('user_id', dispute.respondent_id)
              .single()
          ]);

          return {
            ...dispute,
            filed_by_profile: filedByProfile.data,
            respondent_profile: respondentProfile.data
          };
        })
      );

      setDisputes(disputesWithProfiles);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeById = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // Fetch profile data separately
      const [filedByProfile, respondentProfile] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name, user_type')
          .eq('user_id', data.filed_by)
          .single(),
        supabase
          .from('profiles')
          .select('first_name, last_name, user_type')
          .eq('user_id', data.respondent_id)
          .single()
      ]);

      const disputeWithProfiles = {
        ...data,
        filed_by_profile: filedByProfile.data,
        respondent_profile: respondentProfile.data
      };

      setSelectedDispute(disputeWithProfiles);
      setNewStatus(data.status);
      setResolutionNotes(data.resolution_notes || '');
      
      // Fetch evidence
      const { data: evidenceData, error: evidenceError } = await supabase
        .from('dispute_evidence')
        .select('*')
        .eq('dispute_id', id)
        .order('created_at', { ascending: true });

      if (!evidenceError) {
        setEvidence(evidenceData || []);
      }
    } catch (error) {
      console.error('Error fetching dispute:', error);
      toast({
        title: "Error",
        description: "Failed to load dispute details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDisputeStatus = async () => {
    if (!selectedDispute || !isAdmin) return;

    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', selectedDispute.id);

      if (error) throw error;

      // Send notifications
      await supabase.functions.invoke('send-dispute-notifications', {
        body: {
          disputeId: selectedDispute.id,
          type: 'status_updated',
          newStatus,
          resolutionNotes,
          adminName: `${profile?.first_name} ${profile?.last_name}`.trim()
        }
      });

      toast({
        title: "Dispute Updated",
        description: "Dispute status has been updated successfully."
      });

      // Refresh dispute data
      await fetchDisputeById(selectedDispute.id);
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update dispute status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'investigating': return 'bg-blue-500';
      case 'mediation': return 'bg-purple-500';
      case 'resolved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-500';
      case 'normal': return 'bg-blue-500';
      case 'high': return 'bg-orange-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user || !profile) {
    return <div>Please sign in to access dispute management.</div>;
  }

  if (selectedDispute) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelectedDispute(null)}>
            ← Back to Disputes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {selectedDispute.title}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={getStatusColor(selectedDispute.status)}>
                    {selectedDispute.status}
                  </Badge>
                  <Badge className={getPriorityColor(selectedDispute.priority)}>
                    {selectedDispute.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    {selectedDispute.dispute_type}
                  </Badge>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created: {new Date(selectedDispute.created_at).toLocaleDateString()}
                </div>
                {selectedDispute.resolved_at && (
                  <div className="flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" />
                    Resolved: {new Date(selectedDispute.resolved_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                {isAdmin && <TabsTrigger value="admin">Admin Actions</TabsTrigger>}
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{selectedDispute.description}</p>
                </div>

                {selectedDispute.order_id && (
                  <div>
                    <h3 className="font-semibold mb-2">Related Order</h3>
                    <Badge variant="outline">Order ID: {selectedDispute.order_id}</Badge>
                  </div>
                )}

                {selectedDispute.resolution_notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Resolution Notes</h3>
                    <p className="text-muted-foreground bg-muted p-3 rounded">
                      {selectedDispute.resolution_notes}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="evidence" className="space-y-4">
                {evidence.length === 0 ? (
                  <p className="text-muted-foreground">No evidence uploaded for this dispute.</p>
                ) : (
                  <div className="grid gap-4">
                    {evidence.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4" />
                                <span className="font-medium">{item.evidence_type}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Submitted: {new Date(item.created_at).toLocaleString()}
                              </p>
                            </div>
                            {item.file_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(item.file_url, '_blank')}
                              >
                                View File
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Update Status</h3>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="mediation">In Mediation</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Resolution Notes</h3>
                    <Textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Add notes about the resolution or current status..."
                      rows={4}
                    />
                  </div>

                  <Button onClick={updateDisputeStatus} disabled={loading}>
                    {loading ? "Updating..." : "Update Dispute"}
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dispute Management</h1>
        {isAdmin && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Admin View
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="text-center">Loading disputes...</div>
      ) : disputes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Disputes Found</h3>
            <p className="text-muted-foreground">
              {isAdmin ? "No disputes have been reported yet." : "You have no active disputes."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4" onClick={() => setSelectedDispute(dispute)}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{dispute.title}</h3>
                      <Badge className={getStatusColor(dispute.status)}>
                        {dispute.status}
                      </Badge>
                      <Badge className={getPriorityColor(dispute.priority)}>
                        {dispute.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {dispute.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(dispute.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Filed by: {dispute.filed_by_profile?.first_name} {dispute.filed_by_profile?.last_name}
                      </span>
                      {dispute.order_id && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Order: {dispute.order_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{dispute.dispute_type}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}