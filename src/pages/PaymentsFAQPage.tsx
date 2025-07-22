import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CreditCard, Shield, Wallet, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentsFAQPage() {
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
            <CreditCard className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Payments & Escrow</h1>
            <p className="text-muted-foreground text-lg">Your money is protected every step of the way</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Secure Payment & Escrow Protection FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="payment-methods">
                <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We accept a wide variety of secure payment methods to make shopping convenient for everyone:</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">💳 Credit & Debit Cards</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Visa, MasterCard, American Express</li>
                          <li>• Discover, JCB, and other major cards</li>
                          <li>• Debit cards with Visa/MC logos</li>
                          <li>• Prepaid cards (where accepted)</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🏦 Bank Transfers</h4>
                        <ul className="text-sm space-y-1">
                          <li>• ACH bank transfers (US)</li>
                          <li>• SEPA transfers (Europe)</li>
                          <li>• Wire transfers for large orders</li>
                          <li>• Online banking integration</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">📱 Digital Wallets</h4>
                        <ul className="text-sm space-y-1">
                          <li>• PayPal and PayPal Credit</li>
                          <li>• Apple Pay and Google Pay</li>
                          <li>• Samsung Pay and other NFC</li>
                          <li>• Platform wallet (stored balance)</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🌍 Mobile Money & Local</h4>
                        <ul className="text-sm space-y-1">
                          <li>• M-Pesa, Airtel Money (Africa)</li>
                          <li>• GrabPay, GCash (Asia)</li>
                          <li>• Local banking solutions</li>
                          <li>• Buy Now, Pay Later options</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        🛡️ <strong>All payments are secured with 256-bit SSL encryption and PCI DSS compliance.</strong>
                        We never store your full credit card details on our servers.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="escrow-system">
                <AccordionTrigger>How does your escrow system work to protect my money?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Our escrow system acts as a trusted middleman to protect both buyers and sellers:</p>
                    
                    <div className="bg-muted p-4 rounded mb-4">
                      <h4 className="font-semibold mb-2">🔒 Simple Explanation:</h4>
                      <p className="text-sm">
                        Think of escrow like a safety deposit box. We hold your payment securely until you confirm 
                        you've received exactly what you ordered. Only then do we release the money to the seller.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">1. 💰 Payment Secured</h4>
                        <p className="text-sm text-muted-foreground">When you place an order, your payment is immediately secured in our escrow account. The seller can see that payment is guaranteed, but cannot access the funds yet.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">2. 📦 Order Processing</h4>
                        <p className="text-sm text-muted-foreground">The seller prepares and ships your order knowing that payment is secured. Your money remains safely held while the item is in transit.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">3. 📱 Delivery Verification</h4>
                        <p className="text-sm text-muted-foreground">When you receive your order, you scan the QR code to confirm everything is correct. This is your signal that you're satisfied with the purchase.</p>
                      </div>
                      
                      <div className="border-l-4 border-primary pl-4">
                        <h4 className="font-semibold">4. ✅ Payment Release</h4>
                        <p className="text-sm text-muted-foreground">Only after you confirm delivery does our system automatically release payment to the seller. This typically happens within 2-4 hours of confirmation.</p>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                      <p className="text-sm">
                        <strong>💡 Key Benefit:</strong> You never lose money on undelivered or incorrect orders. 
                        If there's a problem, your payment stays protected until we resolve the issue.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-release">
                <AccordionTrigger>When exactly is my payment released to the seller?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Payment release is triggered by specific verification steps designed to protect you:</p>
                    
                    <div className="space-y-3">
                      <div className="border rounded p-4 bg-green-50 dark:bg-green-900/20">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">✅ Automatic Release Triggers</h4>
                        <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                          <li>• You successfully scan the delivery QR code</li>
                          <li>• You manually mark the order as "Received" in your account</li>
                          <li>• You rate/review the seller (implies satisfaction)</li>
                          <li>• 7 days pass without any disputes or issues reported</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4 bg-amber-50 dark:bg-amber-900/20">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300 mb-2">⏳ Release Timeline</h4>
                        <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                          <li>• <strong>Immediate:</strong> QR code scan or manual confirmation</li>
                          <li>• <strong>2-4 hours:</strong> Processing time for automatic release</li>
                          <li>• <strong>7 days:</strong> Auto-release if no issues reported</li>
                          <li>• <strong>Extended:</strong> Held longer if dispute is active</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4 bg-red-50 dark:bg-red-900/20">
                        <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">🛑 Payment Hold Situations</h4>
                        <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                          <li>• You report the item as not received</li>
                          <li>• You open a dispute about the order</li>
                          <li>• The item doesn't match the description</li>
                          <li>• Quality or damage issues are reported</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>🔄 What happens during processing:</strong></p>
                      <ol className="text-sm list-decimal list-inside ml-2 mt-1 space-y-1">
                        <li>Your confirmation triggers our automated system</li>
                        <li>We verify the delivery was legitimate (location, timing, etc.)</li>
                        <li>Payment is transferred from escrow to seller's account</li>
                        <li>Both parties receive confirmation notifications</li>
                        <li>Transaction is marked as completed</li>
                      </ol>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="refund-process">
                <AccordionTrigger>How do refunds work if delivery fails or there are issues?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>We guarantee full refunds when delivery fails or doesn't meet expectations:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🔄 Automatic Refund Scenarios</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Package never delivered after 14 days</li>
                          <li>• Seller fails to ship within specified timeframe</li>
                          <li>• Item significantly different from description</li>
                          <li>• Damaged goods due to poor packaging</li>
                          <li>• Wrong item delivered and confirmed</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">⏱️ Refund Timeline</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>Immediate:</strong> Seller cancellation or failure to ship</li>
                          <li>• <strong>24-48 hours:</strong> Approved dispute resolution</li>
                          <li>• <strong>3-5 business days:</strong> Credit card refund processing</li>
                          <li>• <strong>1-2 business days:</strong> Wallet/digital refunds</li>
                          <li>• <strong>7-10 days:</strong> Bank transfer refunds</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-4 rounded">
                      <h4 className="font-semibold mb-2">📋 How to Request a Refund:</h4>
                      <ol className="list-decimal list-inside text-sm space-y-1">
                        <li>Go to "My Orders" in your account</li>
                        <li>Find the problematic order and click "Report Issue"</li>
                        <li>Select the reason (not delivered, wrong item, damaged, etc.)</li>
                        <li>Provide photos or evidence if applicable</li>
                        <li>Submit your refund request</li>
                        <li>We'll review and process within 24 hours</li>
                      </ol>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                        <p className="text-sm">
                          💚 <strong>Full Refund Guarantee:</strong> If we can't resolve your issue, 
                          you'll receive a 100% refund plus compensation for any inconvenience.
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
                        <p className="text-sm">
                          🔄 <strong>Refund Method:</strong> Refunds are processed to your original payment method. 
                          If that's not possible, we'll add the funds to your platform wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="wallet-system">
                <AccordionTrigger>How does the platform wallet work?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Our wallet system provides convenient, secure balance management:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          Adding Money to Your Wallet
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• Link your credit card, bank account, or PayPal</li>
                          <li>• Minimum add: $10, Maximum: $5,000 per transaction</li>
                          <li>• Instant availability for most payment methods</li>
                          <li>• Auto-reload options available</li>
                          <li>• Bonus credits for large deposits (occasional promotions)</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">💰 Using Wallet Balance</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Pay for orders instantly without entering card details</li>
                          <li>• Combine wallet balance with other payment methods</li>
                          <li>• Faster checkout process</li>
                          <li>• Automatic application of wallet balance first</li>
                          <li>• Track spending and balance history</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold text-primary mb-2">🏦 Withdrawing Funds</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Transfer to linked bank account</li>
                          <li>• Minimum withdrawal: $20</li>
                          <li>• Processing time: 1-3 business days</li>
                          <li>• No fees for standard withdrawals</li>
                          <li>• Instant withdrawal available (small fee applies)</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-sm">
                        <strong>💡 Pro Tip:</strong> Keep some money in your wallet for faster purchases. 
                        Your wallet balance is FDIC-insured and as secure as your bank account.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        🎁 <strong>Refund Credits:</strong> Refunds are often processed faster when added to your wallet. 
                        You can use these credits immediately for new purchases or withdraw them anytime.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-security">
                <AccordionTrigger>How secure are my payment details and financial information?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Your financial security is our highest priority. We use bank-level protection:</p>
                    
                    <div className="grid gap-4">
                      <div className="border rounded p-4 bg-green-50 dark:bg-green-900/20">
                        <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">🔐 Encryption & Security</h4>
                        <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
                          <li>• 256-bit SSL encryption for all transactions</li>
                          <li>• PCI DSS Level 1 compliance (highest security standard)</li>
                          <li>• Tokenization of credit card data</li>
                          <li>• We never store your full card numbers</li>
                          <li>• Regular security audits and penetration testing</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4 bg-blue-50 dark:bg-blue-900/20">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">🛡️ Fraud Protection</h4>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• Real-time fraud detection and monitoring</li>
                          <li>• Machine learning algorithms to detect suspicious activity</li>
                          <li>• 3D Secure verification for card payments</li>
                          <li>• Two-factor authentication for wallet access</li>
                          <li>• Automatic account lockdown if breach detected</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-4 bg-purple-50 dark:bg-purple-900/20">
                        <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🏦 Banking Partnerships</h4>
                        <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                          <li>• Partner with trusted financial institutions</li>
                          <li>• FDIC-insured wallet balances</li>
                          <li>• Segregated funds (your money is separate from ours)</li>
                          <li>• Regular financial audits</li>
                          <li>• Compliance with international banking regulations</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>🔒 What we DO store:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>Encrypted payment tokens (not actual card numbers)</li>
                        <li>Billing addresses for fraud prevention</li>
                        <li>Transaction history for your records</li>
                      </ul>
                      <p className="text-sm mt-2"><strong>❌ What we DON'T store:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>Full credit card numbers</li>
                        <li>CVV/security codes</li>
                        <li>Bank login credentials</li>
                        <li>Social security numbers</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="payment-issues">
                <AccordionTrigger>What should I do if my payment fails or is declined?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <p>Payment issues can usually be resolved quickly with these steps:</p>
                    
                    <div className="space-y-3">
                      <div className="border-l-4 border-amber-500 pl-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded">
                        <h4 className="font-semibold text-amber-700 dark:text-amber-300">⚠️ Common Causes of Payment Failures</h4>
                        <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1 mt-2">
                          <li>• Insufficient funds in account</li>
                          <li>• Expired or incorrect card details</li>
                          <li>• Bank fraud protection blocking the transaction</li>
                          <li>• Network or technical connectivity issues</li>
                          <li>• International transaction restrictions</li>
                        </ul>
                      </div>
                      
                      <div className="border-l-4 border-green-500 pl-4 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <h4 className="font-semibold text-green-700 dark:text-green-300">✅ Quick Fixes to Try</h4>
                        <ol className="text-sm text-green-600 dark:text-green-400 list-decimal list-inside space-y-1 mt-2">
                          <li>Double-check your card number, expiry date, and CVV</li>
                          <li>Ensure your billing address matches bank records</li>
                          <li>Try a different credit card or payment method</li>
                          <li>Contact your bank to authorize the transaction</li>
                          <li>Clear browser cache and try again</li>
                          <li>Use a different device or browser</li>
                        </ol>
                      </div>
                      
                      <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <h4 className="font-semibold text-blue-700 dark:text-blue-300">📞 When to Contact Support</h4>
                        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1 mt-2">
                          <li>• Multiple payment attempts fail with different cards</li>
                          <li>• You're charged but order wasn't processed</li>
                          <li>• Error messages you don't understand</li>
                          <li>• International payment restrictions</li>
                          <li>• Suspected fraudulent activity on your account</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">💬 Get Help Fast</h4>
                        <ul className="text-sm space-y-1">
                          <li>• <strong>Live Chat:</strong> Available 24/7</li>
                          <li>• <strong>Payment Hotline:</strong> +1-555-PAY-HELP</li>
                          <li>• <strong>Email:</strong> payments@marketplace.com</li>
                          <li>• <strong>Response time:</strong> Under 15 minutes</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded p-3">
                        <h4 className="font-semibold text-primary mb-2">🔄 Alternative Options</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Use PayPal or digital wallets</li>
                          <li>• Try bank transfer for large orders</li>
                          <li>• Use Buy Now, Pay Later services</li>
                          <li>• Contact seller for payment plan</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        🛡️ <strong>Protection Promise:</strong> If a payment issue causes you to miss a deal or limited offer, 
                        we'll honor the original price once the issue is resolved.
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