import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Flag, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Package,
  User,
  Clock,
  AlertTriangle,
  Filter
} from 'lucide-react';

// J) Dispute & Moderation Tools - Moderation queue for reported content

interface ReportedItem {
  id: string;
  type: 'message' | 'product' | 'profile';
  reported_by: string;
  reported_at: string;
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  content_id: string;
  content_data: any;
  moderator_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface ModerationAction {
  id: string;
  action: 'approve' | 'reject' | 'escalate' | 'ban_user' | 'remove_content';
  reason: string;
  notes?: string;
}

export const ModerationQueue: React.FC = () => {
  const [reportedItems, setReportedItems] = useState<ReportedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'high' | 'urgent'>('pending');
  const [batchAction, setBatchAction] = useState<string>('');
  const [actionNotes, setActionNotes] = useState('');
  const { toast } = useToast();

  const fetchReportedItems = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual database queries
      const mockData: ReportedItem[] = [
        {
          id: '1',
          type: 'message',
          reported_by: 'user1',
          reported_at: new Date().toISOString(),
          reason: 'spam',
          description: 'User is sending repetitive promotional messages',
          status: 'pending',
          priority: 'medium',
          content_id: 'msg1',
          content_data: {
            message: 'Buy now! Best prices! Click here!!!',
            sender: 'spammer123',
            recipient: 'victim456'
          }
        },
        {
          id: '2',
          type: 'product',
          reported_by: 'user2',
          reported_at: new Date(Date.now() - 86400000).toISOString(),
          reason: 'inappropriate_content',
          description: 'Product contains inappropriate imagery',
          status: 'pending',
          priority: 'high',
          content_id: 'prod1',
          content_data: {
            name: 'Questionable Product',
            description: 'Product with inappropriate content',
            seller: 'badvendor'
          }
        },
        {
          id: '3',
          type: 'profile',
          reported_by: 'user3',
          reported_at: new Date(Date.now() - 172800000).toISOString(),
          reason: 'fake_account',
          description: 'Suspected fake seller account with stolen photos',
          status: 'pending',
          priority: 'urgent',
          content_id: 'profile1',
          content_data: {
            username: 'fakevendor',
            display_name: 'Legitimate Business',
            suspicious_activity: 'Multiple failed verification attempts'
          }
        }
      ];

      setReportedItems(mockData);

    } catch (error: any) {
      console.error('Error fetching reported items:', error);
      toast({
        title: "Error",
        description: "Failed to load moderation queue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedItems();
  }, []);

  const handleSingleAction = async (itemId: string, action: ModerationAction) => {
    try {
      // Update item status based on action
      const newStatus = action.action === 'approve' ? 'approved' : 
                       action.action === 'reject' ? 'rejected' : 'escalated';

      setReportedItems(prev => prev.map(item => 
        item.id === itemId ? {
          ...item,
          status: newStatus,
          moderator_notes: action.notes,
          reviewed_by: 'current_moderator', // Replace with actual moderator ID
          reviewed_at: new Date().toISOString()
        } : item
      ));

      // Log moderation action
      await supabase
        .from('security_audit')
        .insert({
          event_type: 'moderation_action',
          event_data: {
            item_id: itemId,
            action: action.action,
            reason: action.reason,
            notes: action.notes
          },
          severity: 'info'
        });

      toast({
        title: "Action completed",
        description: `Item ${action.action}ed successfully`,
      });

    } catch (error: any) {
      console.error('Error processing moderation action:', error);
      toast({
        title: "Error",
        description: "Failed to process moderation action",
        variant: "destructive"
      });
    }
  };

  const handleBatchAction = async () => {
    if (selectedItems.length === 0 || !batchAction) {
      toast({
        title: "Invalid selection",
        description: "Please select items and an action",
        variant: "destructive"
      });
      return;
    }

    try {
      const action: ModerationAction = {
        id: crypto.randomUUID(),
        action: batchAction as any,
        reason: 'Batch moderation action',
        notes: actionNotes
      };

      // Process each selected item
      for (const itemId of selectedItems) {
        await handleSingleAction(itemId, action);
      }

      setSelectedItems([]);
      setBatchAction('');
      setActionNotes('');

      toast({
        title: "Batch action completed",
        description: `${selectedItems.length} items processed`,
      });

    } catch (error: any) {
      console.error('Error processing batch action:', error);
      toast({
        title: "Error",
        description: "Failed to process batch action",
        variant: "destructive"
      });
    }
  };

  const filteredItems = reportedItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return item.status === 'pending';
    if (filter === 'high' || filter === 'urgent') return item.priority === filter;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'profile': return <User className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moderation Queue</h1>
          <p className="text-muted-foreground">
            Review and moderate reported content
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReportedItems} variant="outline" size="sm">
            <Clock className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reportedItems.filter(i => i.status === 'pending').length}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reportedItems.filter(i => i.priority === 'urgent').length}</div>
            <p className="text-sm text-muted-foreground">Urgent Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reportedItems.filter(i => i.status === 'approved').length}</div>
            <p className="text-sm text-muted-foreground">Approved Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{reportedItems.filter(i => i.status === 'rejected').length}</div>
            <p className="text-sm text-muted-foreground">Rejected Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Batch Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Batch Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="mt-1 block w-32 px-3 py-2 border rounded-md"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            {selectedItems.length > 0 && (
              <>
                <div>
                  <label className="text-sm font-medium">Batch Action</label>
                  <select
                    value={batchAction}
                    onChange={(e) => setBatchAction(e.target.value)}
                    className="mt-1 block w-32 px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Action</option>
                    <option value="approve">Approve</option>
                    <option value="reject">Reject</option>
                    <option value="escalate">Escalate</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Optional notes for this action..."
                    className="mt-1"
                    rows={1}
                  />
                </div>
                
                <Button onClick={handleBatchAction}>
                  Apply to {selectedItems.length} items
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Moderation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Items</CardTitle>
          <CardDescription>
            Items reported by users requiring moderation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items require moderation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border ${
                    selectedItems.includes(item.id) ? 'bg-muted' : 'bg-background'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(prev => [...prev, item.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge variant={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                          <Badge variant="secondary">{item.reason}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.reported_at).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSingleAction(item.id, {
                              id: crypto.randomUUID(),
                              action: 'approve',
                              reason: 'Manual approval'
                            })}
                            disabled={item.status !== 'pending'}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSingleAction(item.id, {
                              id: crypto.randomUUID(),
                              action: 'reject',
                              reason: 'Policy violation'
                            })}
                            disabled={item.status !== 'pending'}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSingleAction(item.id, {
                              id: crypto.randomUUID(),
                              action: 'escalate',
                              reason: 'Requires senior review'
                            })}
                            disabled={item.status !== 'pending'}
                          >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Report Description:</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Content Preview:</p>
                        <div className="text-sm bg-muted p-3 rounded">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(item.content_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {item.moderator_notes && (
                        <div>
                          <p className="font-semibold">Moderator Notes:</p>
                          <p className="text-sm text-muted-foreground">{item.moderator_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModerationQueue;