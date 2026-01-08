import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Bell, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

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

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="account" className="data-[state=active]:bg-gold/20">
              <User className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gold/20">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
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

          <TabsContent value="preferences">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Preference settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin">
              <Card className="bg-card border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Admin Dashboard
                  </CardTitle>
                  <CardDescription>Access system administration and usage tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to="/admin">
                    <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                      <Shield className="h-4 w-4 mr-2" />
                      Open Admin Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
