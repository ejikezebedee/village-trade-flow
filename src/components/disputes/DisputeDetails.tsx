import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File, MessageSquare, Scale, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DisputeDetailsProps {
  dispute: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const DisputeDetails = ({ dispute, onClose, onUpdate }: DisputeDetailsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [newEvidence, setNewEvidence] = useState({
    evidence_type: "photo",
    description: "",
    file_url: ""
  });
  const [mediatorVote, setMediatorVote] = useState({
    vote: "",
    reasoning: ""
  });
  const [loading, setLoading] = useState(false);
  const [isMediator, setIsMediator] = useState(false);

  useEffect(() => {
    fetchEvidence();
    fetchVotes();
    checkMediatorAccess();
  }, [dispute.id]);

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from("dispute_evidence")
        .select("*")
        .eq("dispute_id", dispute.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error) {
      console.error("Error fetching evidence:", error);
    }
  };

  const fetchVotes = async () => {
    try {
      const { data, error } = await supabase
        .from("dispute_votes")
        .select(`
          *,
          mediators!inner(
            user_id,
            rating
          )
        `)
        .eq("dispute_id", dispute.id);

      if (error) throw error;
      setVotes(data || []);
    } catch (error) {
      console.error("Error fetching votes:", error);
    }
  };

  const checkMediatorAccess = async () => {
    if (dispute.assigned_mediator_id === user?.id) {
      setIsMediator(true);
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from("dispute_evidence")
        .insert({
          dispute_id: dispute.id,
          submitted_by: user?.id,
          ...newEvidence
        });

      if (error) throw error;

      toast({
        title: "Evidence Submitted",
        description: "Your evidence has been added to the dispute.",
      });
      
      setNewEvidence({ evidence_type: "photo", description: "", file_url: "" });
      fetchEvidence();
    } catch (error) {
      console.error("Error submitting evidence:", error);
      toast({
        title: "Error",
        description: "Failed to submit evidence.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMediatorVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("dispute_votes")
        .insert({
          dispute_id: dispute.id,
          mediator_id: dispute.assigned_mediator_id,
          ...mediatorVote
        });

      if (error) throw error;

      // Check if we should auto-resolve based on votes
      const { data: resolutionResult, error: resolutionError } = await supabase
        .rpc("resolve_dispute_by_votes", { dispute_uuid: dispute.id });

      if (resolutionError) {
        console.error("Error resolving dispute:", resolutionError);
      }

      toast({
        title: "Vote Submitted",
        description: "Your mediation vote has been recorded.",
      });
      
      fetchVotes();
      onUpdate();
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast({
        title: "Error",
        description: "Failed to submit vote.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{dispute.title}</DialogTitle>
              <DialogDescription>
                Dispute #{dispute.id.slice(0, 8)} • Filed {new Date(dispute.created_at).toLocaleDateString()}
              </DialogDescription>
            </div>
            <Badge className={getStatusColor(dispute.status)}>
              {dispute.status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            {isMediator && <TabsTrigger value="mediation">Mediation</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Dispute Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm">{dispute.dispute_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <p className="text-sm">{dispute.priority}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Resolution Tier</Label>
                    <p className="text-sm">{dispute.resolution_tier}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <p className="text-sm">{dispute.status}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1">{dispute.description}</p>
                </div>
                {dispute.resolution_notes && (
                  <div>
                    <Label className="text-sm font-medium">Resolution Notes</Label>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{dispute.resolution_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Evidence</CardTitle>
                <CardDescription>
                  Upload supporting documents, photos, or other evidence for your dispute.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEvidence} className="space-y-4">
                  <div>
                    <Label htmlFor="evidence_type">Evidence Type</Label>
                    <Select value={newEvidence.evidence_type} onValueChange={(value) => 
                      setNewEvidence(prev => ({ ...prev, evidence_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="message">Message Screenshot</SelectItem>
                        <SelectItem value="receipt">Receipt</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="file_url">File URL</Label>
                    <Input
                      id="file_url"
                      value={newEvidence.file_url}
                      onChange={(e) => setNewEvidence(prev => ({ ...prev, file_url: e.target.value }))}
                      placeholder="https://example.com/evidence.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvidence.description}
                      onChange={(e) => setNewEvidence(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this evidence shows..."
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {loading ? "Submitting..." : "Submit Evidence"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Submitted Evidence</h3>
              {evidence.length === 0 ? (
                <p className="text-muted-foreground">No evidence submitted yet.</p>
              ) : (
                evidence.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <File className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{item.evidence_type}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {item.file_url && (
                            <a href={item.file_url} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-primary hover:underline">
                              View File
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {isMediator && (
            <TabsContent value="mediation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Mediator Decision
                  </CardTitle>
                  <CardDescription>
                    Review the evidence and cast your vote for resolution.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleMediatorVote} className="space-y-4">
                    <div>
                      <Label htmlFor="vote">Resolution Vote</Label>
                      <Select value={mediatorVote.vote} onValueChange={(value) => 
                        setMediatorVote(prev => ({ ...prev, vote: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your decision..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="favor_complainant">Favor Complainant</SelectItem>
                          <SelectItem value="favor_respondent">Favor Respondent</SelectItem>
                          <SelectItem value="partial_resolution">Partial Resolution</SelectItem>
                          <SelectItem value="insufficient_evidence">Insufficient Evidence</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="reasoning">Reasoning</Label>
                      <Textarea
                        id="reasoning"
                        value={mediatorVote.reasoning}
                        onChange={(e) => setMediatorVote(prev => ({ ...prev, reasoning: e.target.value }))}
                        placeholder="Explain your decision and reasoning..."
                        required
                      />
                    </div>

                    <Button type="submit" disabled={loading || !mediatorVote.vote}>
                      {loading ? "Submitting..." : "Submit Vote"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {votes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mediation Votes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {votes.map((vote) => (
                      <div key={vote.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant="outline">{vote.vote.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(vote.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{vote.reasoning}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};