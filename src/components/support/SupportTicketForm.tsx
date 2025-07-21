import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Ticket, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface SupportTicketFormProps {
  onTicketCreated?: () => void;
}

export const SupportTicketForm = ({ onTicketCreated }: SupportTicketFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const categories = [
    { value: 'account', label: 'Account Issues' },
    { value: 'orders', label: 'Order Problems' },
    { value: 'payments', label: 'Payment Issues' },
    { value: 'technical', label: 'Technical Issues' },
    { value: 'disputes', label: 'Disputes' },
    { value: 'general', label: 'General Support' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', icon: Clock, color: 'bg-blue-500' },
    { value: 'normal', label: 'Normal', icon: AlertCircle, color: 'bg-yellow-500' },
    { value: 'high', label: 'High', icon: AlertCircle, color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'bg-red-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a support ticket.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !description.trim() || !category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to support team
      await supabase.functions.invoke('send-support-notifications', {
        body: {
          ticketId: data.id,
          type: 'ticket_created',
          userEmail: user.email,
          title,
          category,
          priority
        }
      });

      toast({
        title: "Ticket Created",
        description: `Your support ticket #${data.id.slice(0, 8)} has been created successfully. We'll respond within 24 hours.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('normal');

      onTicketCreated?.();
    } catch (error) {
      console.error('Error creating support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priorityValue: string) => {
    const priority = priorities.find(p => p.value === priorityValue);
    if (!priority) return null;

    const Icon = priority.icon;
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${priority.color}`} />
        {priority.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Submit Support Ticket
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Subject *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of your issue"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category *
              </label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium mb-1">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((prio) => (
                    <SelectItem key={prio.value} value={prio.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${prio.color}`} />
                        {prio.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description *
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed information about your issue, including any error messages and steps to reproduce the problem"
              rows={5}
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              {getPriorityBadge(priority)}
            </div>
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            What happens next?
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• You'll receive a confirmation email with your ticket number</li>
            <li>• Our support team will review your ticket within 24 hours</li>
            <li>• You'll be notified of any updates via email and in-app notifications</li>
            <li>• For urgent issues, our team may contact you directly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};