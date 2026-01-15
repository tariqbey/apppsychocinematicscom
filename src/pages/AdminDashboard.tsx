import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CreditCard, TrendingUp, DollarSign, Image, Video, Activity, Search, Shield, ArrowLeft } from "lucide-react";
import { FeaturedContentManager } from "@/components/admin/FeaturedContentManager";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";

interface PlatformStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalCreditsAllocated: number;
  totalCreditsUsed: number;
  totalImages: number;
  totalVideos: number;
  estimatedApiCost: number;
}

interface UserData {
  user_id: string;
  display_name: string | null;
  created_at: string;
  monthly_credits: number;
  purchased_credits: number;
  credits_used: number;
  image_count: number;
  video_count: number;
}

interface DailyStats {
  date: string;
  users: number;
  credits_used: number;
}

const IMAGE_COST = 0.01;
const VIDEO_COST = 0.20;

const AdminDashboard = () => {
  const { loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchPlatformStats(),
      fetchUserData(),
      fetchDailyStats()
    ]);
    setLoading(false);
  };

  const fetchPlatformStats = async () => {
    const oneWeekAgo = subDays(new Date(), 7).toISOString();

    const [
      { count: totalUsers },
      { count: newUsersThisWeek },
      { data: creditsData },
      { data: transactionsData },
      { data: mediaData }
    ] = await Promise.all([
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo),
      supabase.from("production_credits").select("monthly_credits, purchased_credits"),
      supabase.from("credit_transactions").select("amount").lt("amount", 0),
      supabase.from("generated_media").select("media_type")
    ]);

    const totalCreditsAllocated = creditsData?.reduce((sum, c) => sum + Number(c.monthly_credits) + Number(c.purchased_credits), 0) || 0;
    const totalCreditsUsed = transactionsData?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    const totalImages = mediaData?.filter(m => m.media_type === "image").length || 0;
    const totalVideos = mediaData?.filter(m => m.media_type === "video").length || 0;
    const estimatedApiCost = (totalImages * IMAGE_COST) + (totalVideos * VIDEO_COST);

    setStats({
      totalUsers: totalUsers || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      totalCreditsAllocated,
      totalCreditsUsed,
      totalImages,
      totalVideos,
      estimatedApiCost
    });
  };

  const fetchUserData = async () => {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, display_name, created_at")
      .order("created_at", { ascending: false });

    if (!profiles) return;

    const userStats = await Promise.all(
      profiles.map(async (profile) => {
        const [{ data: credits }, { data: transactions }, { data: media }] = await Promise.all([
          supabase.from("production_credits").select("monthly_credits, purchased_credits").eq("user_id", profile.user_id).single(),
          supabase.from("credit_transactions").select("amount").eq("user_id", profile.user_id).lt("amount", 0),
          supabase.from("generated_media").select("media_type").eq("user_id", profile.user_id)
        ]);

        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          created_at: profile.created_at,
          monthly_credits: credits?.monthly_credits || 0,
          purchased_credits: credits?.purchased_credits || 0,
          credits_used: transactions?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0,
          image_count: media?.filter(m => m.media_type === "image").length || 0,
          video_count: media?.filter(m => m.media_type === "video").length || 0
        };
      })
    );

    setUsers(userStats);
  };

  const fetchDailyStats = async () => {
    const days = 14;
    const startDate = subDays(new Date(), days);
    
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("created_at")
      .gte("created_at", startDate.toISOString());

    const { data: transactions } = await supabase
      .from("credit_transactions")
      .select("created_at, amount")
      .gte("created_at", startDate.toISOString())
      .lt("amount", 0);

    const dailyData: DailyStats[] = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const displayDate = format(date, "MMM d");
      
      const usersOnDay = profiles?.filter(p => 
        format(new Date(p.created_at), "yyyy-MM-dd") === dateStr
      ).length || 0;
      
      const creditsOnDay = transactions?.filter(t => 
        format(new Date(t.created_at), "yyyy-MM-dd") === dateStr
      ).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      dailyData.push({
        date: displayDate,
        users: usersOnDay,
        credits_used: creditsOnDay
      });
    }

    setDailyStats(dailyData);
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 border-b border-red-500/30 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-red-400">Back Office</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="border-border">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Studio
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Analytics</h2>
          <p className="text-muted-foreground">Overview of users, credits, and usage</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stats?.totalUsers || 0}</span>
                {stats?.newUsersThisWeek ? (
                  <span className="ml-2 text-xs text-green-500">+{stats.newUsersThisWeek} this week</span>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Credits Allocated</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stats?.totalCreditsAllocated.toLocaleString() || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Credits Used</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stats?.totalCreditsUsed.toLocaleString() || 0}</span>
                {stats && stats.totalCreditsAllocated > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {Math.round((stats.totalCreditsUsed / stats.totalCreditsAllocated) * 100)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Images</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stats?.totalImages.toLocaleString() || 0}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ~${((stats?.totalImages || 0) * IMAGE_COST).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Videos</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold">{stats?.totalVideos.toLocaleString() || 0}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ~${((stats?.totalVideos || 0) * VIDEO_COST).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary">Est. API Cost</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-primary">
                  ${stats?.estimatedApiCost.toFixed(2) || "0.00"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Signups (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Credit Usage (Last 14 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="credits_used" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary)/0.2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Content Manager */}
        <FeaturedContentManager />

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base font-medium">All Users</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Purchased</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Images</TableHead>
                    <TableHead className="text-right">Videos</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(7)].map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const totalCredits = Number(user.monthly_credits) + Number(user.purchased_credits);
                      const usagePercent = totalCredits > 0 ? Math.round((user.credits_used / totalCredits) * 100) : 0;
                      
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.display_name || "Unnamed"}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {user.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{user.monthly_credits}</TableCell>
                          <TableCell className="text-right">{user.purchased_credits}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span>{user.credits_used}</span>
                              {usagePercent > 0 && (
                                <Badge variant={usagePercent > 80 ? "destructive" : "secondary"} className="text-xs">
                                  {usagePercent}%
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{user.image_count}</TableCell>
                          <TableCell className="text-right">{user.video_count}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(user.created_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
