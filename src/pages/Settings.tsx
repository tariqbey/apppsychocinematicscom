import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useSubscription } from "@/hooks/useSubscription";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, ArrowLeft, CreditCard, Crown, Zap, Calendar, ExternalLink, Loader2, Plug } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const { subscription, isSubscribed, isTrialing, openCustomerPortal, createSubscription, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Navigate to admin dashboard when admin tab is selected
  const handleTabChange = (value: string) => {
    if (value === "admin") {
      navigate("/admin");
    } else {
      setActiveTab(value);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      await openCustomerPortal();
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    try {
      await createSubscription();
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-display text-gold-gradient">Settings</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="account" className="data-[state=active]:bg-gold/20">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-gold/20">
              <CreditCard className="h-4 w-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gold/20">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="integrations" className="data-[state=active]:bg-gold/20">
              <Plug className="h-4 w-4 mr-2" />
              Integrations
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="admin" className="data-[state=active]:bg-red-500/20 text-red-400">
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="account">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-foreground">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">User ID</label>
                  <p className="text-foreground text-sm font-mono">{user?.id}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <div className="space-y-6">
              {/* Current Plan Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Current Plan
                      </CardTitle>
                      <CardDescription>Manage your subscription and billing</CardDescription>
                    </div>
                    {isSubscribed && (
                      <Badge 
                        variant={isTrialing ? "secondary" : "default"}
                        className={isTrialing ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-primary/20 text-primary border-primary/30"}
                      >
                        {isTrialing ? "Trial" : "Active"}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {subLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : isSubscribed ? (
                    <>
                      <div className="p-4 rounded-lg bg-muted/50 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">Director's OS</h3>
                            <p className="text-sm text-muted-foreground">
                              {isTrialing ? "3-day free trial" : "$29/month"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {isTrialing ? "250" : "1000"}
                            </p>
                            <p className="text-xs text-muted-foreground">credits</p>
                          </div>
                        </div>
                        
                        {subscription?.subscriptionEnd && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {isTrialing ? "Trial ends" : "Renews"}: {format(new Date(subscription.subscriptionEnd), "MMMM d, yyyy")}
                            </span>
                          </div>
                        )}
                      </div>

                      {isTrialing && (
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-start gap-3">
                            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-medium">Upgrade to Full Access</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Get 1000 monthly credits and unlock unlimited potential. Your trial credits will be upgraded automatically.
                              </p>
                              <Button 
                                className="mt-3" 
                                onClick={handleUpgrade}
                                disabled={upgradeLoading}
                              >
                                {upgradeLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Upgrade Now - $29/month
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          onClick={handleOpenPortal}
                          disabled={portalLoading}
                          className="gap-2"
                        >
                          {portalLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Opening...
                            </>
                          ) : (
                            <>
                              <ExternalLink className="h-4 w-4" />
                              Manage Subscription
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          Update payment method, view invoices, or cancel subscription
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Active Subscription</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Subscribe to unlock the full Director's OS experience
                      </p>
                      <Link to="/subscribe">
                        <Button className="gap-2">
                          <Zap className="h-4 w-4" />
                          Start 3-Day Free Trial
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Plan Features */}
              {isSubscribed && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-base">What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        "Unlimited Director AI conversations",
                        "Full Mind Movie Studio access",
                        `${isTrialing ? "200" : "1000"} monthly production credits`,
                        "Daily Scorecard & Progress Tracking",
                        "Chief Aim Wizard",
                        "Director's Corner Community",
                      ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage how you receive reminders</CardDescription>
                </CardHeader>
                <CardContent>
                  <NotificationSettings />
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">More preference settings coming soon.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}