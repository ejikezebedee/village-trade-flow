import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/marketplace/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Filter, Download, ArrowUpDown, Receipt, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TransferRecord {
  id: string;
  amount: number;
  transaction_fee: number;
  status: string;
  reference_number: string;
  message?: string | null;
  created_at: string;
  completed_at?: string | null;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  recipient_profile?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  is_sender: boolean;
}

export default function WalletHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingReceipts, setDownloadingReceipts] = useState<Set<string>>(new Set());
  const itemsPerPage = 20;

  useEffect(() => {
    if (user) {
      fetchTransfers();
    }
  }, [user, currentPage, statusFilter, typeFilter]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('wallet_transfers')
        .select(`
          id,
          amount,
          transaction_fee,
          status,
          reference_number,
          message,
          created_at,
          completed_at,
          sender_id,
          recipient_id
        `, { count: 'exact' })
        .or(`sender_id.eq.${user?.id},recipient_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter === 'sent') {
        query = query.eq('sender_id', user?.id);
      } else if (typeFilter === 'received') {
        query = query.eq('recipient_id', user?.id);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data: transfers, error, count } = await query;

      if (error) throw error;

      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

      if (!transfers || transfers.length === 0) {
        setTransfers([]);
        return;
      }

      // Get unique user IDs for profile lookup
      const userIds = [...new Set([
        ...transfers.map(t => t.sender_id),
        ...transfers.map(t => t.recipient_id)
      ])];

      // Fetch profiles for all involved users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map(
        profiles?.map(p => [p.user_id, { first_name: p.first_name, last_name: p.last_name }]) || []
      );

      const transfersWithType: TransferRecord[] = transfers.map(transfer => ({
        id: transfer.id,
        amount: transfer.amount,
        transaction_fee: transfer.transaction_fee,
        status: transfer.status,
        reference_number: transfer.reference_number,
        message: transfer.message,
        created_at: transfer.created_at,
        completed_at: transfer.completed_at,
        sender_profile: profileMap.get(transfer.sender_id) || null,
        recipient_profile: profileMap.get(transfer.recipient_id) || null,
        is_sender: transfer.sender_id === user?.id
      }));

      setTransfers(transfersWithType);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'pending_2fa':
        return <Badge variant="outline">Awaiting 2FA</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransfers = transfers.filter(transfer => {
    const searchString = searchTerm.toLowerCase();
    const senderName = transfer.sender_profile 
      ? `${transfer.sender_profile.first_name || ''} ${transfer.sender_profile.last_name || ''}`.trim().toLowerCase()
      : '';
    const recipientName = transfer.recipient_profile
      ? `${transfer.recipient_profile.first_name || ''} ${transfer.recipient_profile.last_name || ''}`.trim().toLowerCase()
      : '';
    
    return (
      transfer.reference_number.toLowerCase().includes(searchString) ||
      senderName.includes(searchString) ||
      recipientName.includes(searchString) ||
      (transfer.message && transfer.message.toLowerCase().includes(searchString))
    );
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Reference', 'Type', 'Counterparty', 'Amount', 'Fee', 'Status', 'Message'];
    const csvData = filteredTransfers.map(transfer => [
      formatDate(transfer.created_at),
      transfer.reference_number,
      transfer.is_sender ? 'Sent' : 'Received',
      transfer.is_sender 
        ? `${transfer.recipient_profile?.first_name || ''} ${transfer.recipient_profile?.last_name || ''}`.trim()
        : `${transfer.sender_profile?.first_name || ''} ${transfer.sender_profile?.last_name || ''}`.trim(),
      `$${transfer.amount.toFixed(2)}`,
      `$${transfer.transaction_fee.toFixed(2)}`,
      transfer.status,
      transfer.message || ''
    ]);

    const csvContent = [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadReceipt = async (transferId: string, format: 'json' | 'pdf' = 'pdf') => {
    setDownloadingReceipts(prev => new Set(prev).add(transferId));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { transfer_id: transferId, format }
      });

      if (error) throw error;

      if (format === 'pdf') {
        // Create blob and download HTML file (which can be printed as PDF)
        const blob = new Blob([data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${transferId}.html`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Receipt Downloaded",
        description: "Transaction receipt has been downloaded successfully.",
      });

    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download receipt",
        variant: "destructive",
      });
    } finally {
      setDownloadingReceipts(prev => {
        const newSet = new Set(prev);
        newSet.delete(transferId);
        return newSet;
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/wallet')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Wallet
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Transaction History
                  </h1>
                  <p className="text-muted-foreground">
                    View all your wallet transactions and download receipts
                  </p>
                </div>
              </div>
              <Button
                onClick={exportToCSV}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by reference, name, or message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Status
                    </label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="pending_2fa">Awaiting 2FA</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Type
                    </label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setCurrentPage(1);
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Transactions ({filteredTransfers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading transactions...</p>
                  </div>
                ) : filteredTransfers.length === 0 ? (
                  <div className="text-center py-8">
                    <ArrowUpDown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No transactions found
                    </h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTransfers.map((transfer) => (
                      <div
                        key={transfer.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`p-2 rounded-full ${
                            transfer.is_sender 
                              ? 'bg-orange-100 text-orange-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            <ArrowUpDown className={`h-4 w-4 ${
                              transfer.is_sender ? 'rotate-90' : '-rotate-90'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {transfer.is_sender ? 'Sent to' : 'Received from'}{' '}
                              {transfer.is_sender 
                                ? `${transfer.recipient_profile?.first_name || ''} ${transfer.recipient_profile?.last_name || ''}`.trim()
                                : `${transfer.sender_profile?.first_name || ''} ${transfer.sender_profile?.last_name || ''}`.trim()
                              }
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(transfer.created_at)} • {transfer.reference_number}
                            </div>
                            {transfer.message && (
                              <div className="text-sm text-muted-foreground italic mt-1">
                                "{transfer.message}"
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`font-medium ${
                              transfer.is_sender ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {transfer.is_sender ? '-' : '+'}${transfer.amount.toFixed(2)}
                            </div>
                            {transfer.is_sender && transfer.transaction_fee > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Fee: ${transfer.transaction_fee.toFixed(2)}
                              </div>
                            )}
                            <div className="mt-1">
                              {getStatusBadge(transfer.status)}
                            </div>
                          </div>

                          {/* Receipt Download Button */}
                          {transfer.status === 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceipt(transfer.id)}
                              disabled={downloadingReceipts.has(transfer.id)}
                              className="flex items-center gap-2"
                            >
                              {downloadingReceipts.has(transfer.id) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                              ) : (
                                <Receipt className="h-3 w-3" />
                              )}
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}