import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket, Clock, AlertCircle, CheckCircle, MessageSquare, Search } from 'lucide-react';
import { SupportTicketForm } from './SupportTicketForm';
import { Input } from '@/components/ui/input';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  first_response_at?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful_count: number;
}

export const SupportDashboard = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
    loadFAQs();
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
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

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('helpful_count', { ascending: false });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
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

  const markFAQHelpful = async (faqId: string) => {
    try {
      await supabase
        .from('faqs')
        .update({ helpful_count: faqs.find(f => f.id === faqId)?.helpful_count! + 1 })
        .eq('id', faqId);

      setFaqs(prev => prev.map(faq => 
        faq.id === faqId 
          ? { ...faq, helpful_count: faq.helpful_count + 1 }
          : faq
      ));

      toast({
        title: "Thank you!",
        description: "Your feedback helps us improve our FAQ.",
      });
    } catch (error) {
      console.error('Error marking FAQ as helpful:', error);
    }
  };

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const faqCategories = [...new Set(faqs.map(faq => faq.category))];

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
        <h1 className="text-3xl font-bold">Support Center</h1>
        <Badge variant="outline" className="text-sm">
          {tickets.filter(t => t.status === 'open').length} Open Tickets
        </Badge>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="new">New Ticket</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No support tickets</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't submitted any support tickets yet.
                  </p>
                  <Button onClick={() => {/* Switch to new ticket tab */}}>
                    Create First Ticket
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium mb-1">{ticket.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Ticket #{ticket.id.slice(0, 8)}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Created {formatDate(ticket.created_at)}</span>
                              <span>•</span>
                              <span className="capitalize">{ticket.category}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                        
                        <p className="text-sm mb-3 line-clamp-2">{ticket.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {ticket.first_response_at && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                First response: {formatDate(ticket.first_response_at)}
                              </span>
                            )}
                            {ticket.resolved_at && (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Resolved: {formatDate(ticket.resolved_at)}
                              </span>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Categories</option>
                  {faqCategories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <Card key={faq.id}>
                      <CardContent className="pt-4">
                        <h4 className="font-medium mb-2">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {faq.helpful_count} found this helpful
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markFAQHelpful(faq.id)}
                            >
                              Helpful
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <SupportTicketForm onTicketCreated={loadTickets} />
        </TabsContent>
      </Tabs>
    </div>
  );
};