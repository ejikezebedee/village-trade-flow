import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Shield, Lock, Eye, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function SecurityFAQPage() {
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
            <Shield className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Safety & Security</h1>
            <p className="text-muted-foreground text-lg">Your safety and security are our top priorities</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Platform Security & Safety FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="data-protection">
                <AccordionTrigger>How is my personal data protected?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We use industry-leading security measures to protect your information:</p>
                    
                    <div className="grid gap-4">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">🔐 Encryption</h4>
                        <p className="text-sm text-muted-foreground">All sensitive data is encrypted using AES-256 encryption, both in transit and at rest. Your passwords are hashed using advanced algorithms.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">🏢 Secure Infrastructure</h4>
                        <p className="text-sm text-muted-foreground">Our servers are hosted in certified data centers with 24/7 monitoring, firewalls, and intrusion detection systems.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">🔒 Access Control</h4>
                        <p className="text-sm text-muted-foreground">Strict access controls ensure only authorized personnel can access systems, and all access is logged and monitored.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">📋 Compliance</h4>
                        <p className="text-sm text-muted-foreground">We comply with international data protection regulations including GDPR and maintain regular security audits.</p>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">✅ Your personal information is never sold to third parties and is only used to provide our services.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="two-factor-auth">
                <AccordionTrigger>What is Two-Factor Authentication and why should I use it?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>Two-Factor Authentication (2FA) adds an extra security layer to your account:</p>
                    
                    <div className="bg-muted p-4 rounded">
                      <p className="font-semibold mb-2">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>You enter your email and password (first factor)</li>
                        <li>We send a code to your phone or authenticator app (second factor)</li>
                        <li>You enter the code to complete login</li>
                      </ol>
                    </div>
                    
                    <p><strong>Benefits of 2FA:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Protects your account even if your password is compromised</li>
                      <li>Prevents unauthorized access to your wallet and orders</li>
                      <li>Required for high-value transactions</li>
                      <li>Shows other users you're a verified, trusted member</li>
                    </ul>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm">💡 We strongly recommend enabling 2FA, especially if you're a seller or frequently make large purchases.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transaction-security">
                <AccordionTrigger>How are my transactions and payments secured?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We use multiple layers of security to protect every transaction:</p>
                    
                    <div className="space-y-3">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">💳 Payment Security</h4>
                        <ul className="text-sm space-y-1">
                          <li>• PCI DSS compliant payment processing</li>
                          <li>• SSL encryption for all payment data</li>
                          <li>• We never store your full credit card details</li>
                          <li>• Secure tokenization of payment methods</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">🏦 Escrow Protection</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Your money is held safely until delivery is confirmed</li>
                          <li>• Funds are only released when you receive your goods</li>
                          <li>• Automatic refund if delivery fails</li>
                          <li>• Dispute resolution for any issues</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">📱 QR Code Verification</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Unique QR codes for each delivery</li>
                          <li>• Encrypted codes that can't be duplicated</li>
                          <li>• Time-limited validity for security</li>
                          <li>• Photo evidence of delivery</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm font-semibold">🛡️ Your Payment Promise:</p>
                      <p className="text-sm">We guarantee that your money is protected. If you don't receive your order, we'll issue a full refund within 24 hours.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="seller-verification">
                <AccordionTrigger>How do you verify and vet sellers on the platform?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Every seller goes through a comprehensive verification process:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">📋 Identity Verification (KYC)</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• Government-issued ID verification</li>
                          <li>• Address proof documentation</li>
                          <li>• Phone number and email verification</li>
                          <li>• Background checks where applicable</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">🏪 Business Documentation</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• Business registration certificates</li>
                          <li>• Tax identification numbers</li>
                          <li>• Banking information verification</li>
                          <li>• Product sourcing documentation</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">⭐ Ongoing Monitoring</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• Regular review of seller performance</li>
                          <li>• Customer feedback and rating analysis</li>
                          <li>• Quality checks on products and services</li>
                          <li>• Compliance with platform policies</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>Verification Badges:</strong> Look for these trust indicators:</p>
                      <ul className="text-sm mt-2 space-y-1">
                        <li>✅ <strong>Verified Seller:</strong> Identity and documents confirmed</li>
                        <li>🏆 <strong>Premium Seller:</strong> High ratings and sales volume</li>
                        <li>📜 <strong>Certified Business:</strong> Registered business entity</li>
                        <li>🛡️ <strong>Trusted Partner:</strong> Long-term platform member</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="fraud-detection">
                <AccordionTrigger>How do you detect and prevent fraud?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We use advanced AI and machine learning to detect suspicious activity:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">🤖 AI-Powered Detection</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Real-time transaction monitoring</li>
                          <li>• Pattern analysis for unusual behavior</li>
                          <li>• IP address and device fingerprinting</li>
                          <li>• Machine learning fraud models</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">👥 Human Review Team</h4>
                        <ul className="text-sm space-y-1">
                          <li>• 24/7 fraud monitoring specialists</li>
                          <li>• Manual review of flagged accounts</li>
                          <li>• Investigation of reported suspicious activity</li>
                          <li>• Coordination with law enforcement when needed</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm"><strong>🚨 Red Flags We Monitor:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>Unusual payment patterns or large transactions</li>
                        <li>Multiple accounts from the same device/location</li>
                        <li>Fake reviews or manipulated ratings</li>
                        <li>Suspicious communication patterns</li>
                        <li>Products that violate our policies</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="report-fraud">
                <AccordionTrigger>How do I report suspicious activity or fraud?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>If you encounter suspicious activity, report it immediately:</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-red-600 mb-2">🚨 Emergency Reporting</h4>
                        <p className="text-sm mb-2">For urgent security issues:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Email: security@marketplace.com</li>
                          <li>• Phone: +1-555-FRAUD (24/7)</li>
                          <li>• Live chat with "FRAUD" in message</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-amber-600 mb-2">📋 Standard Reporting</h4>
                        <p className="text-sm mb-2">For general suspicious activity:</p>
                        <ul className="text-sm space-y-1">
                          <li>• Use "Report" button on listings</li>
                          <li>• Contact seller support</li>
                          <li>• Submit fraud report form</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>What to include in your report:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1 space-y-1">
                        <li>Detailed description of the issue</li>
                        <li>Screenshots of suspicious messages/listings</li>
                        <li>Order numbers or transaction IDs</li>
                        <li>Username of the suspected fraudulent account</li>
                        <li>Timeline of events</li>
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">💚 <strong>We investigate all reports within 24 hours and will keep you updated on any actions taken.</strong></p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="communication-safety">
                <AccordionTrigger>How do you keep communications between buyers and sellers safe?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>All communications are monitored and protected:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">💬 Secure Messaging</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• All messages are encrypted in transit</li>
                          <li>• Personal contact information is protected</li>
                          <li>• Automated screening for prohibited content</li>
                          <li>• Message history is preserved for dispute resolution</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">🔍 Content Monitoring</h4>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          <li>• AI-powered detection of scam attempts</li>
                          <li>• Blocking of external links and contact sharing</li>
                          <li>• Warnings for suspicious language patterns</li>
                          <li>• Automatic escalation of concerning conversations</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm"><strong>⚠️ Safety Rules:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>Never share personal contact information</li>
                        <li>Don't conduct transactions outside our platform</li>
                        <li>Be suspicious of deals that seem too good to be true</li>
                        <li>Report any attempts to move communication off-platform</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-policy">
                <AccordionTrigger>Where can I read your privacy policy and terms of service?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>Our legal documents are always accessible and written in clear language:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold mb-2">📋 Privacy Policy</h4>
                        <p className="text-sm text-muted-foreground mb-2">Learn how we collect, use, and protect your personal information.</p>
                        <Link to="/privacy" className="text-primary hover:underline text-sm">Read Privacy Policy →</Link>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold mb-2">📜 Terms of Service</h4>
                        <p className="text-sm text-muted-foreground mb-2">Understand your rights and responsibilities when using our platform.</p>
                        <Link to="/terms" className="text-primary hover:underline text-sm">Read Terms of Service →</Link>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold mb-2">🍪 Cookie Policy</h4>
                        <p className="text-sm text-muted-foreground mb-2">Information about cookies and tracking technologies we use.</p>
                        <Link to="/cookies" className="text-primary hover:underline text-sm">Read Cookie Policy →</Link>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm">📧 <strong>Stay Informed:</strong> We'll notify you of any significant changes to these policies via email and platform notifications.</p>
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