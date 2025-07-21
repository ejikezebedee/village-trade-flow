import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Star,
  Send,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface FeedbackPrompt {
  id: string;
  order_id: string;
  prompt_type: 'rate_seller' | 'rate_buyer' | 'rate_product';
  is_completed: boolean;
  created_at: string;
  expires_at: string;
  orders?: {
    product_name: string;
    total_amount: number;
    seller_id: string;
    buyer_id: string;
  };
}

export function FeedbackPrompts() {
  const [prompts, setPrompts] = useState<FeedbackPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFeedbackPrompts();
  }, []);

  const fetchFeedbackPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('feedback_prompts')
        .select(`
          *,
          orders (
            product_name,
            total_amount,
            seller_id,
            buyer_id
          )
        `)
        .eq('is_completed', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts((data as FeedbackPrompt[]) || []);
    } catch (error) {
      console.error('Error fetching feedback prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (
    promptId: string,
    orderId: string,
    rating: number,
    comment: string,
    feedbackType: string,
    revieweeId: string
  ) => {
    setSubmitting(promptId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user profile to determine reviewer type
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('feedback')
        .insert({
          order_id: orderId,
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          reviewer_type: profile?.user_type || 'buyer',
          rating,
          comment: comment.trim() || null,
          feedback_type: feedbackType
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps improve our marketplace.",
      });

      // Remove the completed prompt from the list
      setPrompts(prompts.filter(p => p.id !== promptId));
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(null);
    }
  };

  const FeedbackForm = ({ prompt }: { prompt: FeedbackPrompt }) => {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');

    const getPromptDetails = () => {
      switch (prompt.prompt_type) {
        case 'rate_seller':
          return {
            title: 'Rate the Seller',
            icon: <User className="h-5 w-5" />,
            description: 'How was your experience with this seller?',
            revieweeId: prompt.orders?.seller_id || '',
            feedbackType: 'seller'
          };
        case 'rate_product':
          return {
            title: 'Rate the Product',
            icon: <Package className="h-5 w-5" />,
            description: 'How would you rate this product?',
            revieweeId: prompt.orders?.seller_id || '',
            feedbackType: 'product'
          };
        case 'rate_buyer':
          return {
            title: 'Rate the Buyer',
            icon: <User className="h-5 w-5" />,
            description: 'How was your experience with this buyer?',
            revieweeId: prompt.orders?.buyer_id || '',
            feedbackType: 'buyer'
          };
        default:
          return {
            title: 'Rate Experience',
            icon: <Star className="h-5 w-5" />,
            description: 'Please rate your experience',
            revieweeId: '',
            feedbackType: 'product'
          };
      }
    };

    const details = getPromptDetails();
    const daysLeft = Math.ceil(
      (new Date(prompt.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {details.icon}
            {details.title}
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {daysLeft} days left
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Order: {prompt.orders?.product_name}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{details.description}</p>
          
          {/* Star Rating */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                {rating} star{rating !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comment (optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience to help other users..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={() => submitFeedback(
              prompt.id,
              prompt.order_id,
              rating,
              comment,
              details.feedbackType,
              details.revieweeId
            )}
            disabled={rating === 0 || submitting === prompt.id}
            className="w-full"
          >
            {submitting === prompt.id ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Pending Feedback Requests
            {prompts.length > 0 && (
              <Badge variant="secondary">
                {prompts.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prompts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                You have no pending feedback requests at the moment.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {prompts.map((prompt) => (
                <FeedbackForm key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}