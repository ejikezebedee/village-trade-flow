import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MessageCircle, X, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  message_text: string;
  sender_id: string;
  is_automated: boolean;
  faq_id?: string;
  created_at: string;
}

interface ChatSession {
  id: string;
  status: string;
  agent_id?: string;
  started_at: string;
}

export const LiveChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time chat updates
  useEffect(() => {
    if (!currentSession) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${currentSession.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSession]);

  const startChatSession = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a chat session.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Check for existing active session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (existingSession) {
        setCurrentSession(existingSession);
        loadChatMessages(existingSession.id);
      } else {
        // Create new session
        const { data: newSession, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        setCurrentSession(newSession);
        
        // Send welcome message
        await sendWelcomeMessage(newSession.id);
      }
    } catch (error) {
      console.error('Error starting chat session:', error);
      toast({
        title: "Error",
        description: "Failed to start chat session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChatMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const sendWelcomeMessage = async (sessionId: string) => {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: 'system',
          message_text: "Hello! I'm here to help you. Ask me any questions about our platform, and I'll do my best to assist you.",
          is_automated: true
        });
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession || !user) return;

    try {
      setIsLoading(true);
      
      // Send user message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: currentSession.id,
          sender_id: user.id,
          message_text: newMessage,
          is_automated: false
        });

      if (messageError) throw messageError;

      // Try to get automated FAQ response
      const { data: faqMatch } = await supabase
        .rpc('match_faq_response', { p_message_text: newMessage });

      if (faqMatch) {
        // Get FAQ answer
        const { data: faq } = await supabase
          .from('faqs')
          .select('*')
          .eq('id', faqMatch)
          .single();

        if (faq) {
          // Send automated response
          setTimeout(async () => {
            await supabase
              .from('chat_messages')
              .insert({
                session_id: currentSession.id,
                sender_id: 'system',
                message_text: faq.answer,
                is_automated: true,
                faq_id: faq.id
              });
          }, 1000);
        }
      } else {
        // Send fallback message if no FAQ match
        setTimeout(async () => {
          await supabase
            .from('chat_messages')
            .insert({
              session_id: currentSession.id,
              sender_id: 'system',
              message_text: "I'll connect you with a support agent who can help you better. Please wait a moment.",
              is_automated: true
            });
        }, 2000);
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endChatSession = async () => {
    if (!currentSession) return;

    try {
      await supabase
        .from('chat_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      setCurrentSession(null);
      setMessages([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error ending chat session:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className={`w-80 shadow-xl transition-all duration-300 ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 bg-primary text-primary-foreground">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Live Support
            {currentSession && (
              <Badge variant="secondary" className="text-xs">
                Online
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                endChatSession();
                setIsOpen(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {!currentSession ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get instant help from our support team
                  </p>
                  <Button onClick={startChatSession} disabled={isLoading}>
                    Start Chat
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {message.sender_id === user?.id ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-xs opacity-70">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                          <p>{message.message_text}</p>
                          {message.is_automated && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Auto-response
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={isLoading}
                    />
                    <Button 
                      size="icon" 
                      onClick={sendMessage}
                      disabled={isLoading || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
};