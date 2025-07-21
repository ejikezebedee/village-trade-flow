import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/marketplace/Header";
import { 
  Truck, 
  DollarSign, 
  MapPin, 
  Clock,
  MessageCircle,
  Star,
  Navigation,
  Package,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const availableJobs = [
  {
    id: "JOB001",
    pickup: "Village Farm Co-op",
    delivery: "Downtown Market",
    distance: "15 km",
    payment: "$12.00",
    deadline: "2 hours",
    product: "Fresh Vegetables",
    seller: "Mike F.",
    buyer: "Sarah M.",
    bids: 3,
    status: "open"
  },
  {
    id: "JOB002", 
    pickup: "Clay Masters Workshop",
    delivery: "Residential Area",
    distance: "8 km",
    payment: "$8.00",
    deadline: "4 hours",
    product: "Pottery Set",
    seller: "Anna K.",
    buyer: "John D.",
    bids: 1,
    status: "open"
  },
  {
    id: "JOB003",
    pickup: "Bee Keeper Collective",
    delivery: "Township Center", 
    distance: "22 km",
    payment: "$18.00",
    deadline: "6 hours",
    product: "Honey Jars",
    seller: "Robert H.",
    buyer: "Emily R.",
    bids: 5,
    status: "bidding"
  }
];

const currentDeliveries = [
  {
    id: "DEL001",
    product: "Fresh Organic Tomatoes",
    pickup: "Village Farm Co-op",
    delivery: "City Center",
    progress: 75,
    status: "in_transit",
    payment: "$12.00",
    eta: "30 mins"
  },
  {
    id: "DEL002",
    product: "Handwoven Baskets", 
    pickup: "Artisan Village",
    delivery: "Suburban Area",
    progress: 100,
    status: "delivered",
    payment: "$15.00",
    eta: "Completed"
  }
];

const recentEarnings = [
  {
    id: "EARN001",
    job: "Vegetable Delivery",
    amount: "$12.00",
    date: "2024-01-15",
    status: "paid"
  },
  {
    id: "EARN002",
    job: "Pottery Delivery",
    amount: "$8.00", 
    date: "2024-01-14",
    status: "pending"
  },
  {
    id: "EARN003",
    job: "Honey Transport",
    amount: "$18.00",
    date: "2024-01-13", 
    status: "paid"
  }
];

export default function DriverDashboard() {
  const [bidAmount, setBidAmount] = useState<{[key: string]: string}>({});

  const handleBid = (jobId: string) => {
    console.log(`Bidding ${bidAmount[jobId]} for job ${jobId}`);
    // Here you would implement the bidding logic
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered": return "text-green-500";
      case "in_transit": return "text-blue-500"; 
      case "pickup": return "text-yellow-500";
      default: return "text-gray-500";
    }
  };

  const getJobStatusBadge = (status: string) => {
    switch (status) {
      case "open": return <Badge className="bg-green-100 text-green-800">🟢 Open</Badge>;
      case "bidding": return <Badge className="bg-yellow-100 text-yellow-800">🔥 Hot Bidding</Badge>;
      case "assigned": return <Badge className="bg-blue-100 text-blue-800">✅ Assigned</Badge>;
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
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&h=100" />
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                    Ready to deliver, Alex! 🚚
                  </h1>
                  <p className="text-muted-foreground">Local Delivery Driver • 4.9 ⭐ Rating</p>
                </div>
              </div>
              <Button className="h-12 px-6">
                <Navigation className="h-4 w-4 mr-2" />
                Go Online
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-foreground">47</div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold text-foreground">$342</div>
                <p className="text-sm text-muted-foreground">This Month</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <div className="text-2xl font-bold text-foreground">4.9</div>
                <p className="text-sm text-muted-foreground">Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold text-foreground">2</div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Available Jobs & Bidding */}
            <div className="lg:col-span-2 space-y-6">
              {/* Available Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Available Delivery Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{job.product}</h4>
                            {getJobStatusBadge(job.status)}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>From: {job.pickup}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Navigation className="h-4 w-4" />
                              <span>To: {job.delivery}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span>📏 {job.distance}</span>
                              <span>⏰ {job.deadline}</span>
                              <span>👥 {job.bids} bids</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{job.payment}</div>
                          <p className="text-xs text-muted-foreground">Suggested payment</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-border">
                        <Input
                          placeholder="Your bid amount"
                          value={bidAmount[job.id] || ""}
                          onChange={(e) => setBidAmount({...bidAmount, [job.id]: e.target.value})}
                          className="flex-1"
                        />
                        <Button onClick={() => handleBid(job.id)}>
                          💰 Place Bid
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Current Deliveries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Current Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{delivery.product}</h4>
                          <p className="text-sm text-muted-foreground">
                            {delivery.pickup} → {delivery.delivery}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-primary">{delivery.payment}</span>
                          <p className="text-xs text-muted-foreground">ETA: {delivery.eta}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Progress</span>
                          <span className={`text-sm font-medium ${getStatusColor(delivery.status)}`}>
                            {delivery.status === "delivered" ? "✅ Delivered" : 
                             delivery.status === "in_transit" ? "🚛 In Transit" : "📦 Pickup"}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${delivery.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Message
                        </Button>
                        {delivery.status !== "delivered" && (
                          <Button size="sm" className="flex-1">
                            Update Status
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions & Earnings */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start h-12">
                    <Navigation className="h-4 w-4 mr-3" />
                    Go Online/Offline
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MapPin className="h-4 w-4 mr-3" />
                    Update Location
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <MessageCircle className="h-4 w-4 mr-3" />
                    Messages (3)
                  </Button>
                  <Button variant="outline" className="w-full justify-start h-12">
                    <DollarSign className="h-4 w-4 mr-3" />
                    Earnings Report
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Earnings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Recent Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentEarnings.map((earning) => (
                    <div key={earning.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-medium text-sm text-foreground">{earning.job}</h5>
                        <span className="font-semibold text-primary">{earning.amount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">{earning.date}</span>
                        <Badge 
                          variant={earning.status === "paid" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {earning.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    View All Earnings
                  </Button>
                </CardContent>
              </Card>

              {/* Driver Status */}
              <Card>
                <CardHeader>
                  <CardTitle>📍 Driver Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status</span>
                    <Badge className="bg-green-100 text-green-800">🟢 Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Location</span>
                    <span className="text-sm text-muted-foreground">Village Center</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Vehicle</span>
                    <span className="text-sm text-muted-foreground">Motorcycle</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Update Vehicle Info
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