import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Eye, 
  Flag,
  Search,
  Filter,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  message_type: string;
  is_encrypted: boolean;
  created_at: string;
  is_read: boolean;
  order_id?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  subject?: string;
  order_id?: string;
  created_at: string;
  last_message_at: string;
}

export const MessageMonitoring: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessageData();
  }, []);

  const fetchMessageData = async () => {
    try {
      // Fetch conversations
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (messagesError) throw messagesError;

      setConversations(conversationsData || []);
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching message data:', error);
      toast({
        title: "Error",
        description: "Failed to load message data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlagMessage = async (messageId: string, reason: string) => {
    try {
      // Log the flagged message
      await supabase.rpc('log_security_event', {
        p_event_type: 'message_flagged',
        p_severity: 'warning',
        p_target_resource: 'messages',
        p_target_id: messageId,
        p_action_performed: `Message flagged for review: ${reason}`,
        p_metadata: { reason, flagged_by: 'admin' }
      });

      toast({
        title: "Message Flagged",
        description: "Message has been flagged for review.",
      });
    } catch (error) {
      console.error('Error flagging message:', error);
      toast({
        title: "Error",
        description: "Failed to flag message.",
        variant: "destructive"
      });
    }
  };

  const getConversationMessages = (conversationId: string) => {
    return messages.filter(msg => msg.conversation_id === conversationId);
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    return conv.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           conv.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Encrypted Messages</p>
                <p className="text-2xl font-bold">{messages.filter(m => m.is_encrypted).length}</p>
              </div>
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order-Related</p>
                <p className="text-2xl font-bold">{conversations.filter(c => c.order_id).length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Conversations</CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                    selectedConversation === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">
                      {conversation.subject || `Conversation ${conversation.id.slice(0, 8)}...`}
                    </h4>
                    {conversation.order_id && (
                      <Badge variant="outline" className="text-xs">Order</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {conversation.participants.length} participants
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last: {new Date(conversation.last_message_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation ? 'Conversation Messages' : 'Select a Conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedConversation ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {getConversationMessages(selectedConversation).map((message) => (
                  <div key={message.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          {message.sender_id.slice(0, 8)}...
                        </span>
                        {message.is_encrypted && (
                          <Lock className="w-4 h-4 text-purple-600" />
                        )}
                        <Badge variant={message.is_read ? "default" : "secondary"} className="text-xs">
                          {message.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFlagMessage(message.id, 'Suspicious content')}
                        >
                          <Flag className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded text-sm">
                      {message.is_encrypted ? (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Lock className="w-4 h-4" />
                          <span>Encrypted message content</span>
                        </div>
                      ) : (
                        <p>{message.message_text}</p>
                      )}
                    </div>

                    {message.order_id && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Related to order: {message.order_id.slice(0, 8)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};