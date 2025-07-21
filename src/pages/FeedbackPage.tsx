import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackPrompts } from "@/components/feedback/FeedbackPrompts";
import { FeedbackDisplay } from "@/components/feedback/FeedbackDisplay";
import { Header } from "@/components/marketplace/Header";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star,
  MessageCircle,
  TrendingUp,
  Award,
  Users
} from "lucide-react";

export default function FeedbackPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Feedback & Reviews
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Share your experience and help build a trusted marketplace community. 
                Your feedback helps others make informed decisions.
              </p>
            </div>
            
            {user ? (
              <Tabs defaultValue="pending" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="pending" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Pending Reviews
                  </TabsTrigger>
                  <TabsTrigger value="my-reviews" className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    My Reviews
                  </TabsTrigger>
                  <TabsTrigger value="received" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Reviews Received
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                  <FeedbackPrompts />
                </TabsContent>

                <TabsContent value="my-reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews I've Written</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        This section will show all the reviews you've written for products and sellers.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="received">
                  <div className="space-y-6">
                    <FeedbackDisplay 
                      userId={user.id} 
                      feedbackType="seller" 
                      limit={20} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="insights">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Feedback Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-primary mb-2">
                            4.8
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Average Rating Received
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            156
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total Reviews
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            94%
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Positive Feedback
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold">Recent Trends</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Your customer satisfaction scores have improved by 15% this month</li>
                          <li>• Product quality ratings are consistently above 4.5 stars</li>
                          <li>• Delivery speed feedback is excellent (4.9/5)</li>
                          <li>• Customers appreciate your communication skills</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Sign in to leave reviews, rate your experiences, and help build 
                    a trusted marketplace community.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}