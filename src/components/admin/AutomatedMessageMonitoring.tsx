import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Calendar,
  User,
  Package,
  RefreshCw
} from 'lucide-react';

interface AutomatedMessage {
  id: string;
  order_id: string;
  message_type: string;
  recipient_id: string;
  recipient_type: string;
  subject: string;
  message_content: string;
  template_used: string;
  delivery_status: string;
  sent_at: string;
  delivered_at?: string;
  failure_reason?: string;
  retry_count: number;
  metadata: any;
  created_at: string;
}

export const AutomatedMessageMonitoring: React.FC = () => {
  const [messages, setMessages] = useState<AutomatedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<AutomatedMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('automated_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching automated messages:', error);
      toast({
        title: "Error",
        description: "Failed to load automated messages. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };

    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMessageTypeColor = (type: string) => {
    const colors = {
      order_placed: 'bg-blue-100 text-blue-800',
      payment_received: 'bg-green-100 text-green-800',
      order_shipped: 'bg-purple-100 text-purple-800',
      delivery_confirmed: 'bg-emerald-100 text-emerald-800',
      payment_released: 'bg-amber-100 text-amber-800'
    };

    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipient_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || message.message_type === filterType;
    const matchesStatus = filterStatus === 'all' || message.delivery_status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Automated Message Monitoring
            </CardTitle>
            <Button onClick={fetchMessages} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="order_placed">Order Placed</SelectItem>
                <SelectItem value="payment_received">Payment Received</SelectItem>
                <SelectItem value="order_shipped">Order Shipped</SelectItem>
                <SelectItem value="delivery_confirmed">Delivery Confirmed</SelectItem>
                <SelectItem value="payment_released">Payment Released</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {messages.length}
              </div>
              <div className="text-sm text-blue-700">Total Messages</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {messages.filter(m => m.delivery_status === 'sent').length}
              </div>
              <div className="text-sm text-green-700">Sent</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {messages.filter(m => m.delivery_status === 'failed').length}
              </div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {messages.filter(m => m.delivery_status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
          </div>

          {/* Messages Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading messages...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.delivery_status)}
                          {getStatusBadge(message.delivery_status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMessageTypeColor(message.message_type)}>
                          {message.message_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {message.subject}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">{message.recipient_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">
                            {message.order_id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.sent_at ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(message.sent_at).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => setSelectedMessage(message)}
                          size="sm"
                          variant="outline"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Message Details Modal */}
      {selectedMessage && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Message Details</CardTitle>
              <Button
                onClick={() => setSelectedMessage(null)}
                size="sm"
                variant="ghost"
              >
                ×
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Subject</label>
                <p className="mt-1">{selectedMessage.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Template Used</label>
                <p className="mt-1">{selectedMessage.template_used}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Message Type</label>
                <p className="mt-1 capitalize">{selectedMessage.message_type.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recipient Type</label>
                <p className="mt-1 capitalize">{selectedMessage.recipient_type}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Message Content</label>
              <div className="mt-1 p-4 bg-muted rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">
                  {selectedMessage.message_content}
                </pre>
              </div>
            </div>

            {selectedMessage.failure_reason && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Failure Reason</label>
                <p className="mt-1 text-red-600">{selectedMessage.failure_reason}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="mt-1">{new Date(selectedMessage.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sent</label>
                <p className="mt-1">
                  {selectedMessage.sent_at 
                    ? new Date(selectedMessage.sent_at).toLocaleString()
                    : 'Not sent'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                <p className="mt-1">{selectedMessage.retry_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};