import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, User, Shield, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountFAQPage() {
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
            <User className="mx-auto mb-4 h-16 w-16 text-primary" />
            <h1 className="text-4xl font-bold text-foreground mb-2">Account & Profile</h1>
            <p className="text-muted-foreground text-lg">Everything you need to know about managing your account</p>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Management FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="register">
                <AccordionTrigger>How do I register for an account?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>Creating an account is simple and free:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Click "Register" or "Sign Up" on the homepage</li>
                      <li>Enter your email address and create a secure password</li>
                      <li>Fill in your basic information (name, phone number)</li>
                      <li>Check your email for a verification link</li>
                      <li>Click the verification link to activate your account</li>
                    </ol>
                    <p className="text-sm text-muted-foreground">Note: Email verification is required for account security and to access all platform features.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="verify-email">
                <AccordionTrigger>I didn't receive the verification email. What should I do?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>If you haven't received your verification email:</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Check your spam/junk folder</li>
                      <li>Wait 5-10 minutes as emails can be delayed</li>
                      <li>Request a new verification email from the login page</li>
                      <li>Make sure you entered the correct email address</li>
                      <li>Contact our support team if issues persist</li>
                    </ul>
                    <p className="text-sm bg-muted p-3 rounded">💡 Pro tip: Add our email domain to your contacts to ensure delivery</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="edit-profile">
                <AccordionTrigger>How do I edit my profile information?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>To update your profile:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Log in to your account</li>
                      <li>Click on your profile picture or name (top right)</li>
                      <li>Select "Profile Settings" or "Edit Profile"</li>
                      <li>Update any information you'd like to change:
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>Profile picture</li>
                          <li>Display name</li>
                          <li>Phone number</li>
                          <li>Address information</li>
                          <li>Language preferences</li>
                        </ul>
                      </li>
                      <li>Click "Save Changes" to update your profile</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="change-password">
                <AccordionTrigger>How do I change my password?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p><strong>If you remember your current password:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Go to Profile Settings</li>
                      <li>Click "Security" or "Password"</li>
                      <li>Enter your current password</li>
                      <li>Enter your new password (twice to confirm)</li>
                      <li>Click "Update Password"</li>
                    </ol>
                    
                    <p className="mt-4"><strong>If you forgot your password:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Click "Forgot Password" on the login page</li>
                      <li>Enter your email address</li>
                      <li>Check your email for a reset link</li>
                      <li>Follow the instructions to create a new password</li>
                    </ol>
                    
                    <div className="bg-muted p-3 rounded mt-3">
                      <p className="text-sm"><strong>Password Requirements:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>At least 8 characters long</li>
                        <li>Include uppercase and lowercase letters</li>
                        <li>Include at least one number</li>
                        <li>Include at least one special character</li>
                      </ul>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="language-location">
                <AccordionTrigger>How do I change my language and location settings?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>To update your preferences:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Go to Profile Settings</li>
                      <li>Click on "Preferences" or "Language & Region"</li>
                      <li>Select your preferred language from the dropdown</li>
                      <li>Set your country and region</li>
                      <li>Choose your currency preference</li>
                      <li>Save your changes</li>
                    </ol>
                    <p className="text-sm text-muted-foreground">Your language choice will affect the interface, while location settings help us show relevant products and shipping options.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="two-factor">
                <AccordionTrigger>How do I enable two-factor authentication (2FA)?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>Two-factor authentication adds an extra layer of security to your account:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Go to Profile Settings → Security</li>
                      <li>Find "Two-Factor Authentication" section</li>
                      <li>Click "Enable 2FA"</li>
                      <li>Choose your preferred method:
                        <ul className="list-disc list-inside ml-4 mt-2">
                          <li>SMS text messages to your phone</li>
                          <li>Authenticator app (Google Authenticator, Authy)</li>
                        </ul>
                      </li>
                      <li>Follow the setup instructions</li>
                      <li>Save your backup codes in a safe place</li>
                    </ol>
                    <p className="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
                      🔒 We strongly recommend enabling 2FA to protect your account and transactions.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="notification-settings">
                <AccordionTrigger>How do I manage my notification preferences?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>Control what notifications you receive:</p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Go to Profile Settings → Notifications</li>
                      <li>Choose your preferences for:
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>Order updates and delivery notifications</li>
                          <li>Special offers and promotions</li>
                          <li>New product recommendations</li>
                          <li>Account security alerts</li>
                          <li>Newsletter and marketing emails</li>
                        </ul>
                      </li>
                      <li>Select how you want to receive notifications:
                        <ul className="list-disc list-inside ml-4 mt-2">
                          <li>Email</li>
                          <li>SMS</li>
                          <li>Push notifications (mobile app)</li>
                        </ul>
                      </li>
                      <li>Save your preferences</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="delete-account">
                <AccordionTrigger>How do I delete my account?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>If you need to delete your account:</p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800 mb-3">
                      <p className="text-sm">⚠️ Account deletion is permanent and cannot be undone. Please consider the following:</p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-2">
                        <li>Complete any pending orders first</li>
                        <li>Withdraw any remaining wallet balance</li>
                        <li>Download your order history if needed</li>
                      </ul>
                    </div>
                    
                    <p><strong>To delete your account:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>Go to Profile Settings → Account</li>
                      <li>Scroll to "Delete Account" section</li>
                      <li>Click "Request Account Deletion"</li>
                      <li>Verify your identity (password + 2FA if enabled)</li>
                      <li>Confirm deletion by typing "DELETE" as instructed</li>
                      <li>Your account will be scheduled for deletion within 7 days</li>
                    </ol>
                    
                    <p className="text-sm text-muted-foreground mt-3">
                      During the 7-day period, you can still log in to cancel the deletion request. After 7 days, all your data will be permanently removed.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-support">
                <AccordionTrigger>I need help with my account. How do I contact support?</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p>We're here to help! Contact our support team:</p>
                    
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="border rounded p-4">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4" />
                          Email Support
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">support@marketplace.com</p>
                        <p className="text-xs">Response time: 24-48 hours</p>
                      </div>
                      
                      <div className="border rounded p-4">
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Phone className="h-4 w-4" />
                          Live Chat
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">Available 9 AM - 6 PM</p>
                        <p className="text-xs">Click the chat icon in the bottom right</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted p-3 rounded">
                      <p className="text-sm"><strong>When contacting support, please include:</strong></p>
                      <ul className="text-sm list-disc list-inside ml-2 mt-1">
                        <li>Your account email address</li>
                        <li>Description of the issue</li>
                        <li>Screenshots (if applicable)</li>
                        <li>Steps you've already tried</li>
                      </ul>
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