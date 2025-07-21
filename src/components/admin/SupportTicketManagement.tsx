import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Ticket, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  MessageSquare, 
  Search,
  Filter,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';

interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  first_response_at?: string;
}

interface TicketResponse {
  id: string;
  ticket_id: string;
  responder_id: string;
  response_text: string;
  is_internal_note: boolean;
  created_at: string;
}

interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  urgent: number;
}

export const SupportTicketManagement = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [responses, setResponses] = useState<Record<string, TicketResponse[]>>({});
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, in_progress: 0, resolved: 0, urgent: 0 });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketResponses(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load support tickets.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status, priority');

      if (error) throw error;

      const stats = data.reduce((acc, ticket) => {
        acc.total++;
        if (ticket.status === 'open') acc.open++;
        if (ticket.status === 'in_progress') acc.in_progress++;
        if (ticket.status === 'resolved') acc.resolved++;
        if (ticket.priority === 'urgent') acc.urgent++;
        return acc;
      }, { total: 0, open: 0, in_progress: 0, resolved: 0, urgent: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTicketResponses = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setResponses(prev => ({ ...prev, [ticketId]: data || [] }));
    } catch (error) {
      console.error('Error loading ticket responses:', error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string, assignedTo?: string) => {
    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };

      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      // Send notification
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        await supabase.functions.invoke('send-support-notifications', {
          body: {
            ticketId,
            type: status === 'resolved' ? 'ticket_resolved' : 'ticket_updated',
            userEmail: 'user@example.com', // You'd get this from user profile
            title: ticket.title,
            category: ticket.category,
            priority: ticket.priority,
            agentName: 'Support Agent'
          }
        });
      }

      loadTickets();
      loadStats();
      
      toast({
        title: "Success",
        description: `Ticket status updated to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status.",
        variant: "destructive",
      });
    }
  };

  const addResponse = async () => {
    if (!selectedTicket || !newResponse.trim() || !user) return;

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: selectedTicket.id,
          responder_id: user.id,
          response_text: newResponse.trim(),
          is_internal_note: isInternalNote
        });

      if (error) throw error;

      // Update first_response_at if this is the first response
      if (!selectedTicket.first_response_at) {
        await supabase
          .from('support_tickets')
          .update({ 
            first_response_at: new Date().toISOString(),
            status: 'in_progress'
          })
          .eq('id', selectedTicket.id);
      }

      // Send notification if not internal note
      if (!isInternalNote) {
        await supabase.functions.invoke('send-support-notifications', {
          body: {
            ticketId: selectedTicket.id,
            type: 'ticket_updated',
            userEmail: 'user@example.com', // You'd get this from user profile
            title: selectedTicket.title,
            category: selectedTicket.category,
            priority: selectedTicket.priority,
            response: newResponse.trim(),
            agentName: 'Support Agent'
          }
        });
      }

      setNewResponse('');
      setIsInternalNote(false);
      loadTicketResponses(selectedTicket.id);
      loadTickets();

      toast({
        title: "Success",
        description: isInternalNote ? "Internal note added." : "Response sent successfully.",
      });
    } catch (error) {
      console.error('Error adding response:', error);
      toast({
        title: "Error",
        description: "Failed to add response.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { color: 'bg-blue-500', icon: AlertCircle, label: 'Open' },
      in_progress: { color: 'bg-yellow-500', icon: Clock, label: 'In Progress' },
      resolved: { color: 'bg-green-500', icon: CheckCircle, label: 'Resolved' },
      closed: { color: 'bg-gray-500', icon: CheckCircle, label: 'Closed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    const Icon = config.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-blue-500', label: 'Low' },
      normal: { color: 'bg-yellow-500', label: 'Normal' },
      high: { color: 'bg-orange-500', label: 'High' },
      urgent: { color: 'bg-red-500', label: 'Urgent' }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return <Badge variant="outline">{priority}</Badge>;

    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support Ticket Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="payments">Payments</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="disputes">Disputes</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Support Tickets ({filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{ticket.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Ticket #{ticket.id.slice(0, 8)} • User: {ticket.user_id.slice(0, 8)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>Created {formatDate(ticket.created_at)}</span>
                        <span>•</span>
                        <span className="capitalize">{ticket.category}</span>
                        {ticket.first_response_at && (
                          <>
                            <span>•</span>
                            <span>First response: {formatDate(ticket.first_response_at)}</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2 mb-3">{ticket.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {ticket.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'in_progress', user?.id)}
                        >
                          Assign to Me
                        </Button>
                      )}
                      {ticket.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>
                            Ticket #{ticket.id.slice(0, 8)} - {ticket.title}
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                            <Badge variant="outline">{ticket.category}</Badge>
                          </div>
                          
                          <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium mb-2">Original Request:</h4>
                            <p className="text-sm">{ticket.description}</p>
                          </div>
                          
                          <ScrollArea className="h-64">
                            <div className="space-y-3">
                              {responses[ticket.id]?.map((response) => (
                                <div
                                  key={response.id}
                                  className={`p-3 rounded-lg ${
                                    response.is_internal_note
                                      ? 'bg-yellow-50 border border-yellow-200'
                                      : 'bg-blue-50 border border-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant={response.is_internal_note ? 'outline' : 'default'}>
                                      {response.is_internal_note ? 'Internal Note' : 'Response'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(response.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-sm">{response.response_text}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          
                          <div className="space-y-3 border-t pt-4">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={isInternalNote}
                                  onChange={(e) => setIsInternalNote(e.target.checked)}
                                />
                                Internal note (not visible to customer)
                              </label>
                            </div>
                            <Textarea
                              value={newResponse}
                              onChange={(e) => setNewResponse(e.target.value)}
                              placeholder={isInternalNote ? "Add internal note..." : "Type your response..."}
                              rows={3}
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Select
                                  value={ticket.status}
                                  onValueChange={(status) => updateTicketStatus(ticket.id, status)}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button 
                                onClick={addResponse}
                                disabled={isSubmitting || !newResponse.trim()}
                              >
                                {isSubmitting ? 'Sending...' : isInternalNote ? 'Add Note' : 'Send Response'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};