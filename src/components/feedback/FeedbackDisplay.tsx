import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { 
  Star,
  MessageCircle,
  Calendar,
  User,
  Package,
  TrendingUp,
  Award
} from "lucide-react";

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  feedback_type: string;
  reviewer_type: string;
  is_anonymous: boolean;
  created_at: string;
  helpful_count: number;
}

interface FeedbackDisplayProps {
  userId?: string;
  productName?: string;
  feedbackType?: 'seller' | 'buyer' | 'product';
  limit?: number;
}

export function FeedbackDisplay({ 
  userId, 
  productName, 
  feedbackType = 'seller',
  limit = 10 
}: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });

  useEffect(() => {
    fetchFeedback();
  }, [userId, productName, feedbackType]);

  const fetchFeedback = async () => {
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .eq('feedback_type', feedbackType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('reviewee_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setFeedback(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (feedbackData: Feedback[]) => {
    if (feedbackData.length === 0) {
      setStats({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      });
      return;
    }

    const totalRating = feedbackData.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = totalRating / feedbackData.length;
    
    const distribution = [0, 0, 0, 0, 0];
    feedbackData.forEach(f => {
      distribution[f.rating - 1]++;
    });

    setStats({
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: feedbackData.length,
      ratingDistribution: distribution
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizeClass = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    }[size];

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getTypeIcon = () => {
    switch (feedbackType) {
      case 'seller':
        return <User className="h-5 w-5" />;
      case 'buyer':
        return <User className="h-5 w-5" />;
      case 'product':
        return <Package className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTypeTitle = () => {
    switch (feedbackType) {
      case 'seller':
        return 'Seller Reviews';
      case 'buyer':
        return 'Buyer Reviews';
      case 'product':
        return 'Product Reviews';
      default:
        return 'Reviews';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {getTypeTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stats.averageRating}
                </div>
                <div className="flex justify-center mb-2">
                  {renderStars(Math.round(stats.averageRating), 'lg')}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: stats.totalReviews > 0 
                          ? `${(stats.ratingDistribution[rating - 1] / stats.totalReviews) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">
                    {stats.ratingDistribution[rating - 1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Reviews Yet</h3>
              <p className="text-muted-foreground">
                Be the first to leave a review!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-border rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {review.is_anonymous ? '?' : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <p className="font-medium">
                          {review.is_anonymous ? 'Anonymous' : 'User'}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <Badge variant="outline" className="text-xs">
                            {review.reviewer_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                      {review.helpful_count > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3" />
                          {review.helpful_count} helpful
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {review.comment && (
                    <p className="text-sm text-muted-foreground pl-13">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}