import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DisputeFormProps {
  orders: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DisputeForm = ({ orders, onClose, onSuccess }: DisputeFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    order_id: "",
    title: "",
    description: "",
    dispute_type: "",
    priority: "normal"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Get the selected order to determine respondent
      const selectedOrder = orders.find(o => o.id === formData.order_id);
      if (!selectedOrder) throw new Error("Order not found");

      const respondentId = selectedOrder.buyer_id === user.id ? selectedOrder.seller_id : selectedOrder.buyer_id;

      const { error } = await supabase
        .from("disputes")
        .insert({
          ...formData,
          filed_by: user.id,
          respondent_id: respondentId
        });

      if (error) throw error;

      toast({
        title: "Dispute Filed",
        description: "Your dispute has been successfully submitted for review.",
      });
      onSuccess();
    } catch (error) {
      console.error("Error filing dispute:", error);
      toast({
        title: "Error",
        description: "Failed to file dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>File a Dispute</DialogTitle>
          <DialogDescription>
            Provide details about your dispute. Our team will review and assign it to the appropriate resolution tier.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order">Select Order</Label>
            <Select value={formData.order_id} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, order_id: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Choose an order..." />
              </SelectTrigger>
              <SelectContent>
                {orders.map((order) => (
                  <SelectItem key={order.id} value={order.id}>
                    {order.product_name} - ${order.total_amount} ({order.order_status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dispute_type">Dispute Type</Label>
            <Select value={formData.dispute_type} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, dispute_type: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Select dispute type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery Issue</SelectItem>
                <SelectItem value="quality">Product Quality</SelectItem>
                <SelectItem value="payment">Payment Problem</SelectItem>
                <SelectItem value="fraud">Fraud/Scam</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, priority: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Dispute Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Detailed Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed explanation of the dispute, including any relevant information that will help with resolution..."
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Filing..." : "File Dispute"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};