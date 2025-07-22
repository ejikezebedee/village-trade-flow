import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Truck, QrCode, MapPin, Package } from "lucide-react";
import { Link } from "react-router-dom";

export default function DeliveryFAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/faq">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to FAQ
            </Button>
          </Link>
          <div className="text-center">
            <Truck className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Delivery & QR Codes</h1>
            <p className="text-muted-foreground text-lg">Everything about our secure delivery process</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery Process & QR Verification FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="delivery-process">
                <AccordionTrigger>How does the delivery process work from start to finish?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Our delivery process is designed to be secure, trackable, and reliable:</p>
                    
                    <div className="space-y-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">1. 📦 Order Preparation</h4>
                        <p className="text-sm text-muted-foreground mt-1">After you place an order, the seller prepares your items for shipment. They'll package everything securely and generate shipping labels.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">2. 🚛 Pickup & Transit</h4>
                        <p className="text-sm text-muted-foreground mt-1">Our verified drivers collect the package from the seller. You'll receive real-time tracking updates as your order moves toward you.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">3. 📱 QR Code Generation</h4>
                        <p className="text-sm text-muted-foreground mt-1">A unique QR code is generated for your delivery. This code is sent to your phone and is required to complete the delivery process.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">4. 🏠 Delivery Attempt</h4>
                        <p className="text-sm text-muted-foreground mt-1">The driver arrives at your location and contacts you. You'll need to scan the QR code to verify receipt of your order.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">5. ✅ Confirmation & Payment Release</h4>
                        <p className="text-sm text-muted-foreground mt-1">Once the QR code is scanned successfully, payment is released to the seller, and you'll receive a delivery confirmation.</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">⏱️ <strong>Average delivery time:</strong> 1-3 business days for local orders, 3-7 days for nationwide shipping.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="real-time-tracking">
                <AccordionTrigger>How do I track my delivery in real time?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Stay informed about your order's location every step of the way:</p>
                    
                    <div className="space-y-3">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">📱 Mobile Tracking</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Download our mobile app for push notifications</li>
                          <li>• Get instant updates when status changes</li>
                          <li>• View driver location on live map</li>
                          <li>• Receive ETA updates throughout the day</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">💻 Web Tracking</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Log into your account and go to "My Orders"</li>
                          <li>• Click "Track Order" next to your purchase</li>
                          <li>• View detailed delivery timeline</li>
                          <li>• Access driver contact information when needed</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">📧 Email & SMS Updates</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Automatic notifications for major milestones</li>
                          <li>• "Out for delivery" alerts with time window</li>
                          <li>• Delivery completion confirmation</li>
                          <li>• Issue alerts if delays occur</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>📍 Tracking Stages You'll See:</strong></p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>🔄 Order Confirmed - Seller is preparing your items</li>
                        <li>📦 Ready for Pickup - Package is ready for collection</li>
                        <li>🚛 In Transit - On the way to your location</li>
                        <li>📍 Out for Delivery - Driver is in your area</li>
                        <li>✅ Delivered - Successfully received and verified</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="qr-code-system">
                <AccordionTrigger>How does the QR Code delivery verification system work?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Our QR code system ensures secure and verified deliveries:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-4 bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <QrCode className="h-4 w-4" />
                          How QR Codes Work
                        </h4>
                        <ol className="list-decimal list-inside text-sm space-y-2">
                          <li>When your order ships, we generate a unique QR code</li>
                          <li>The code is sent to your registered phone number via SMS</li>
                          <li>The delivery driver also receives a copy of the code</li>
                          <li>At delivery, you scan the code using our app or camera</li>
                          <li>Successful scan confirms delivery and releases payment</li>
                        </ol>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🔐 Security Features</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Each QR code is unique and can't be duplicated</li>
                          <li>• Codes expire after successful delivery</li>
                          <li>• Time-limited validity (24 hours after delivery attempt)</li>
                          <li>• GPS location verification required for scanning</li>
                          <li>• Photo evidence captured during scan process</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm"><strong>📱 Scanning Instructions:</strong></p>
                      <ol className="text-sm list-decimal list-inside ml-2 mt-1 space-y-1">
                        <li>Open our mobile app or use your phone's camera</li>
                        <li>Point at the QR code shown by the driver</li>
                        <li>Wait for the green checkmark confirmation</li>
                        <li>Your delivery is now complete!</li>
                      </ol>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="qr-code-issues">
                <AccordionTrigger>What happens if my QR code doesn't work or I can't find it?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Don't worry! We have multiple solutions for QR code issues:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-amber-500 pl-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300">📱 Can't Find Your QR Code?</h4>
                        <ul className="text-sm space-y-1 mt-2">
                          <li>• Check your SMS messages for the delivery code</li>
                          <li>• Log into your account and go to "Active Orders"</li>
                          <li>• Look in your email for the QR code image</li>
                          <li>• Ask the driver to show you their copy</li>
                          <li>• Call our support line for immediate assistance</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-red-500 pl-4 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                        <h4 className="font-semibold text-red-700 dark:text-red-300">🚫 QR Code Won't Scan?</h4>
                        <ul className="text-sm space-y-1 mt-2">
                          <li>• Ensure your camera lens is clean</li>
                          <li>• Try scanning in better lighting</li>
                          <li>• Make sure the QR code isn't damaged or crumpled</li>
                          <li>• Use the manual code entry option in our app</li>
                          <li>• The driver can initiate emergency verification</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">⚡ Emergency Alternatives</h4>
                        <ul className="text-sm space-y-1 mt-2">
                          <li>• Driver can call support for manual verification</li>
                          <li>• Photo ID verification + order confirmation</li>
                          <li>• Phone verification with order details</li>
                          <li>• Signature confirmation as backup</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        💚 <strong>Quick Help:</strong> Text "HELP" to our delivery hotline: +1-555-DELIVERY 
                        <br />We'll resolve any QR code issues within minutes!
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="qr-importance">
                <AccordionTrigger>Why are QR codes important for escrow payment release?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>QR codes are the key to our secure payment protection system:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🛡️ Buyer Protection</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Your money is held safely until you confirm receipt</li>
                          <li>• Prevents release of payment for undelivered items</li>
                          <li>• Protects against fraudulent delivery claims</li>
                          <li>• Ensures you actually received what you ordered</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">✅ Delivery Verification</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Confirms the right person received the package</li>
                          <li>• Provides timestamp and location proof</li>
                          <li>• Creates an unalterable delivery record</li>
                          <li>• Links driver, buyer, and order together</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded">
                      <h4 className="font-semibold mb-2">🔄 Payment Release Process:</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        <li>You scan the QR code to confirm delivery</li>
                        <li>System verifies location, time, and order details</li>
                        <li>Your confirmation triggers automatic payment release</li>
                        <li>Seller receives payment within 2-4 hours</li>
                        <li>Transaction is marked as completed</li>
                      </ol>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        <strong>💡 Remember:</strong> No QR code scan = No payment release. 
                        This protects both you and the seller by ensuring fair transactions.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delivery-scenarios">
                <AccordionTrigger>Can you give me examples of common delivery scenarios?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Here are real-life scenarios to help you understand our process:</p>
                    
                    <div className="space-y-4">
                      <div className="border rounded p-4 bg-green-50 dark:bg-green-900/20">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Perfect Delivery</h4>
                        <p className="text-sm text-green-600 dark:text-green-400 italic mb-2">
                          "Sarah ordered a laptop. The driver arrived on time, Sarah scanned the QR code, verified the laptop was correct, and payment was released instantly."
                        </p>
                        <p className="text-xs text-green-500">Outcome: Transaction completed successfully in under 5 minutes.</p>
                      </div>
                      
                      <div className="border rounded p-4 bg-amber-50 dark:bg-amber-900/20">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">⚠️ QR Code Problems</h4>
                        <p className="text-sm text-amber-600 dark:text-amber-400 italic mb-2">
                          "John's QR code SMS didn't arrive. The driver called support, verified John's identity using his order details and photo ID, then completed the delivery manually."
                        </p>
                        <p className="text-xs text-amber-500">Outcome: Resolved in 10 minutes using backup verification.</p>
                      </div>
                      
                      <div className="border rounded p-4 bg-red-50 dark:bg-red-900/20">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">❌ Delivery Issue</h4>
                        <p className="text-sm text-red-600 dark:text-red-400 italic mb-2">
                          "Maria's phone was broken when the driver arrived. She couldn't scan the QR code, and the driver left without delivering. Her payment remained in escrow."
                        </p>
                        <p className="text-xs text-red-500">Outcome: Redelivery scheduled, full refund available if needed.</p>
                      </div>
                      
                      <div className="border rounded p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">🏠 Not Home Scenario</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 italic mb-2">
                          "David wasn't home during delivery. The driver left a notification, and David rescheduled for the next day using his tracking link."
                        </p>
                        <p className="text-xs text-blue-500">Outcome: Successful delivery on second attempt, no extra fees.</p>
                      </div>
                      
                      <div className="border rounded p-4 bg-purple-50 dark:bg-purple-900/20">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">📦 Wrong Item</h4>
                        <p className="text-sm text-purple-600 dark:text-purple-400 italic mb-2">
                          "Lisa received the wrong product. She didn't scan the QR code and contacted support immediately. The item was returned and she got a full refund."
                        </p>
                        <p className="text-xs text-purple-500">Outcome: Return processed, refund issued within 24 hours.</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm">
                        💡 <strong>Key Takeaway:</strong> The QR code system protects you in every scenario. 
                        Don't scan unless you're completely satisfied with your delivery!
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delivery-support">
                <AccordionTrigger>What if I have problems during delivery?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We're here to help 24/7 during your delivery:</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">📞 Immediate Help</h4>
                        <ul className="text-sm space-y-2">
                          <li>• <strong>Delivery Hotline:</strong> +1-555-DELIVERY</li>
                          <li>• <strong>Live Chat:</strong> Available in app and website</li>
                          <li>• <strong>Driver Direct Contact:</strong> Call/text during delivery</li>
                          <li>• <strong>Emergency Support:</strong> 24/7 availability</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🛠️ Self-Service Options</h4>
                        <ul className="text-sm space-y-2">
                          <li>• <strong>Reschedule Delivery:</strong> Via tracking link</li>
                          <li>• <strong>Update Address:</strong> Before driver arrives</li>
                          <li>• <strong>Special Instructions:</strong> Leave notes for driver</li>
                          <li>• <strong>Alternative Contact:</strong> Add backup phone</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1">🚨 Emergency Situations</h4>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          If you feel unsafe or encounter aggressive behavior from a driver, 
                          call our emergency line immediately: +1-555-SAFE-NOW
                        </p>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-1">📋 Common Issues We Resolve</h4>
                        <ul className="text-sm text-amber-600 dark:text-amber-400 list-disc list-inside space-y-1">
                          <li>Wrong or damaged items delivered</li>
                          <li>Driver can't find your address</li>
                          <li>QR code technical problems</li>
                          <li>Delivery scheduling conflicts</li>
                          <li>Missing packages or items</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        ✅ <strong>Our Promise:</strong> Every delivery issue is resolved within 2 hours, 
                        or we'll provide a full refund and expedited replacement.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}