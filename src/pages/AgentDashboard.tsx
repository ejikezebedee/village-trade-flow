import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/marketplace/Header";
import { 
  Users, 
  DollarSign, 
  MessageCircle, 
  HelpCircle,
  Star,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

const supportTickets = [
  {
    id: "TICKET001",
    user: "Sarah M.",
    issue: "Payment not received",
    priority: "high",
    status: "open",
    date: "2024-01-15",
    category: "payment"
  },
  {
    id: "TICKET002",
    user: "John D.",
    issue: "Help with product listing",
    priority: "medium", 
    status: "in_progress",
    date: "2024-01-14",
    category: "listing"
  },
  {
    id: "TICKET003",
    user: "Mike F.",
    issue: "Driver communication issue",
    priority: "low",
    status: "resolved",
    date: "2024-01-13",
    category: "delivery"
  }
];

const recentAssistance = [
  {
    id: "ASSIST001",
    user: "Emily R.",
    task: "Account verification help",
    commission: "$2.50",
    date: "2024-01-15",
    status: "completed"
  },
  {
    id: "ASSIST002",
    user: "Robert H.",
    task: "Product photography guidance",
    commission: "$3.00",
    date: "2024-01-14", 
    status: "completed"
  },
  {
    id: "ASSIST003",
    user: "Anna K.",
    task: "Delivery setup assistance",
    commission: "$2.00",
    date: "2024-01-13",
    status: "completed"
  }
];

const communityStats = [
  {
    title: "Active Users Helped",
    value: "47",
    icon: Users,
    color: "text-blue-500"
  },
  {
    title: "Commission Earned",
    value: "$127.50",
    icon: DollarSign,
    color: "text-green-500"
  },
  {
    title: "Resolution Rate",
    value: "96%",
    icon: CheckCircle,
    color: "text-green-500"
  },
  {
    title: "Avg Response Time",
    value: "< 1hr",
    icon: Clock,
    color: "text-blue-500"
  }
];

export default function AgentDashboard() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500"; 
      case "low": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return "🔴";
      case "medium": return "🟡";
      case "low": return "🟢";
      default: return "⚪";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge variant="destructive">🔴 Open</Badge>;
      case "in_progress": return <Badge className="bg-yellow-100 text-yellow-800">🟡 In Progress</Badge>;
      case "resolved": return <Badge className="bg-green-100 text-green-800">✅ Resolved</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b494?auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>LK</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Hello Lisa! 🤝
                  </h1>
                  <p className="text-muted-foreground">Community Support Agent • 4.9 ⭐ Rating</p>
                </div>
              </div>
              <Button className="h-12 px-6">
                <Phone className="h-4 w-4 mr-2" />
                Available for Help
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {communityStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4 text-center">
                  <stat.icon className={`h-8 w-8 mx-auto mb-2 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Support Tickets */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Active Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground">{ticket.issue}</h4>
                            <span className="text-lg">{getPriorityIcon(ticket.priority)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            User: {ticket.user} • {ticket.category} • {ticket.date}
                          </p>
                        </div>
                        {getStatusBadge(ticket.status)}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message User
                        </Button>
                        <Button size="sm" className="flex-1">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Tickets
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Commission */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start h-12">
                    <Phone className="h-4 w-4 mr-3" />
                    Start Help Session
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Check Messages
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <Users className="h-4 w-4 mr-3" />
                    Community Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <DollarSign className="h-4 w-4 mr-3" />
                    Commission Report
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Assistance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Recent Assistance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentAssistance.map((assist) => (
                    <div key={assist.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium text-sm text-foreground truncate">{assist.task}</h5>
                        <span className="font-semibold text-primary text-sm">{assist.commission}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">User: {assist.user}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">{assist.date}</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          ✅ {assist.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Assistance
                  </Button>
                </CardContent>
              </Card>

              {/* Help Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 Help Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      💰 Payments
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      📦 Listings
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      🚚 Delivery
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      ⚙️ Technical
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      👤 Account
                    </Button>
                    <Button variant="outline" size="sm" className="h-10 text-xs">
                      🆘 General
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Agent Status */}
              <Card>
                <CardHeader>
                  <CardTitle>📍 Agent Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Availability</span>
                    <Badge className="bg-green-100 text-green-800">🟢 Available</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Chats</span>
                    <span className="text-sm text-muted-foreground">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-muted-foreground">&lt; 5 min</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Status
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}