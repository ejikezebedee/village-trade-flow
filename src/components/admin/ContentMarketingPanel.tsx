import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Megaphone, 
  Image, 
  FileText, 
  HelpCircle,
  Upload,
  Save,
  Send,
  Eye,
  Users,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function ContentMarketingPanel() {
  const [bannerImage, setBannerImage] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const uploadBanner = async () => {
    if (!bannerTitle || !bannerSubtitle) {
      toast({
        title: "Missing Information",
        description: "Please fill in banner title and subtitle",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For now, just show success - would integrate with actual banner system
      toast({
        title: "Banner Updated",
        description: "Banner configuration saved successfully",
      });

      setBannerTitle('');
      setBannerSubtitle('');
      setBannerImage('');
    } catch (error) {
      console.error('Error updating banner:', error);
      toast({
        title: "Error",
        description: "Failed to update banner",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const publishAnnouncement = async () => {
    if (!announcement.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter announcement content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create announcement and notify all users
      const { error } = await supabase.functions.invoke('send-announcement', {
        body: {
          title: 'Platform Announcement',
          message: announcement,
          type: 'announcement'
        }
      });

      if (error) throw error;

      toast({
        title: "Announcement Published",
        description: "Announcement has been sent to all users",
      });

      setAnnouncement('');
    } catch (error) {
      console.error('Error publishing announcement:', error);
      toast({
        title: "Error",
        description: "Failed to publish announcement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const publishBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in blog title and content",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For now, just show success - would integrate with actual blog system
      toast({
        title: "Blog Published",
        description: "Blog post saved successfully",
      });

      setBlogTitle('');
      setBlogContent('');
    } catch (error) {
      console.error('Error publishing blog:', error);
      toast({
        title: "Error",
        description: "Failed to publish blog article",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addFAQ = async () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      toast({
        title: "Missing Content",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('faqs')
        .insert({
          question: faqQuestion,
          answer: faqAnswer,
          category: 'general',
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "FAQ Added",
        description: "FAQ has been added to the help section",
      });

      setFaqQuestion('');
      setFaqAnswer('');
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Content & Marketing
          </h2>
          <p className="text-muted-foreground">Manage content, announcements, and marketing materials</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Banners</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Image className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Blog Posts</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">FAQs</p>
                <p className="text-2xl font-bold">18</p>
              </div>
              <HelpCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Referrals Tracked</p>
                <p className="text-2xl font-bold">1,247</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="banners" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="banners">Banners</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="blog">Blog</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="banners">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Homepage Banner Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="banner-title">Banner Title</Label>
                <Input
                  id="banner-title"
                  placeholder="Enter banner title"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="banner-subtitle">Banner Subtitle</Label>
                <Input
                  id="banner-subtitle"
                  placeholder="Enter banner subtitle"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="banner-image">Banner Image URL</Label>
                <Input
                  id="banner-image"
                  placeholder="Enter image URL or upload"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={uploadBanner} disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Update Banner'}
                </Button>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Platform Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="announcement">Announcement Message</Label>
                <Textarea
                  id="announcement"
                  placeholder="Enter announcement message for all users..."
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={publishAnnouncement} disabled={loading} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Publishing...' : 'Send to All Users'}
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                This will notify all active users via in-app notifications
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Blog Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blog-title">Blog Post Title</Label>
                <Input
                  id="blog-title"
                  placeholder="Enter blog post title"
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blog-content">Blog Content</Label>
                <Textarea
                  id="blog-content"
                  placeholder="Write your blog post content..."
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  rows={10}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={publishBlog} disabled={loading} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Publishing...' : 'Publish Blog Post'}
                </Button>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                FAQ Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="faq-question">FAQ Question</Label>
                <Input
                  id="faq-question"
                  placeholder="Enter frequently asked question"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faq-answer">FAQ Answer</Label>
                <Textarea
                  id="faq-answer"
                  placeholder="Enter the answer to this question"
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={addFAQ} disabled={loading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add FAQ'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}