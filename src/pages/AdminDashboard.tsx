import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Image, Video, Zap, Users, TrendingUp, Calendar, DollarSign, Search, Wallet } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface UsageStats {
  totalImages: number;
  totalVideos: number;
  totalCreditsUsed: number;
  totalUsers: number;
  todayImages: number;
  todayVideos: number;
  todayCreditsUsed: number;
  totalCreditsAllocated: number;
  totalCreditsRemaining: number;
}

interface DailyUsage {
  date: string;
  images: number;
  videos: number;
  creditsUsed: number;
}

interface RecentGeneration {
  id: string;
  media_type: string;
  prompt: string;
  status: string;
  created_at: string;
  model_used: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  media_type: string | null;
  description: string | null;
  created_at: string;
}

interface UserStats {
  user_id: string;
  display_name: string | null;
  joined_at: string;
  monthly_credits: number;
  purchased_credits: number;
  total_available: number;
  credits_used: number;
  image_count: number;
  video_count: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<RecentGeneration[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }

    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }
  }, [authLoading, adminLoading, user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUsageStats(),
      fetchDailyUsage(),
      fetchRecentGenerations(),
      fetchCreditTransactions(),
      fetchUserStats(),
    ]);
    setLoading(false);
  };

  const fetchUsageStats = async () => {
    try {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      // Fetch all generated media
      const { data: allMedia } = await supabase
        .from('generated_media')
        .select('media_type, created_at');

      // Fetch all users
      const { data: allUsers } = await supabase
        .from('user_profiles')
        .select('id');

      // Fetch all credit transactions (deductions)
      const { data: allTransactions } = await supabase
        .from('credit_transactions')
        .select('amount, transaction_type, created_at')
        .eq('transaction_type', 'deduction');

      // Fetch all production credits for totals
      const { data: allCredits } = await supabase
        .from('production_credits')
        .select('monthly_credits, purchased_credits');

      const totalImages = allMedia?.filter(m => m.media_type === 'image').length || 0;
      const totalVideos = allMedia?.filter(m => m.media_type === 'video').length || 0;
      const totalCreditsUsed = allTransactions?.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;

      const totalCreditsAllocated = allCredits?.reduce((sum, c) => 
        sum + Number(c.monthly_credits) + Number(c.purchased_credits), 0) || 0;

      const todayMedia = allMedia?.filter(m => m.created_at >= startOfToday && m.created_at <= endOfToday) || [];
      const todayTransactions = allTransactions?.filter(t => t.created_at >= startOfToday && t.created_at <= endOfToday) || [];

      setStats({
        totalImages,
        totalVideos,
        totalCreditsUsed,
        totalUsers: allUsers?.length || 0,
        todayImages: todayMedia.filter(m => m.media_type === 'image').length,
        todayVideos: todayMedia.filter(m => m.media_type === 'video').length,
        todayCreditsUsed: todayTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
        totalCreditsAllocated,
        totalCreditsRemaining: totalCreditsAllocated - totalCreditsUsed,
      });
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const fetchDailyUsage = async () => {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), i);
        return {
          start: startOfDay(date).toISOString(),
          end: endOfDay(date).toISOString(),
          dateStr: format(date, 'MMM dd'),
        };
      }).reverse();

      const { data: allMedia } = await supabase
        .from('generated_media')
        .select('media_type, created_at')
        .gte('created_at', last7Days[0].start);

      const { data: allTransactions } = await supabase
        .from('credit_transactions')
        .select('amount, created_at')
        .eq('transaction_type', 'deduction')
        .gte('created_at', last7Days[0].start);

      const dailyData: DailyUsage[] = last7Days.map(day => {
        const dayMedia = allMedia?.filter(m => m.created_at >= day.start && m.created_at <= day.end) || [];
        const dayTransactions = allTransactions?.filter(t => t.created_at >= day.start && t.created_at <= day.end) || [];

        return {
          date: day.dateStr,
          images: dayMedia.filter(m => m.media_type === 'image').length,
          videos: dayMedia.filter(m => m.media_type === 'video').length,
          creditsUsed: dayTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
        };
      });

      setDailyUsage(dailyData);
    } catch (error) {
      console.error('Error fetching daily usage:', error);
    }
  };

  const fetchRecentGenerations = async () => {
    try {
      const { data } = await supabase
        .from('generated_media')
        .select('id, media_type, prompt, status, created_at, model_used')
        .order('created_at', { ascending: false })
        .limit(20);

      setRecentGenerations(data || []);
    } catch (error) {
      console.error('Error fetching recent generations:', error);
    }
  };

  const fetchCreditTransactions = async () => {
    try {
      const { data } = await supabase
        .from('credit_transactions')
        .select('id, amount, transaction_type, media_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      setCreditTransactions(data || []);
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch user profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, created_at')
        .order('created_at', { ascending: false });

      if (!profiles) return;

      // Fetch production credits
      const { data: credits } = await supabase
        .from('production_credits')
        .select('user_id, monthly_credits, purchased_credits');

      // Fetch credit transactions for usage
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('user_id, amount, transaction_type')
        .eq('transaction_type', 'deduction');

      // Fetch generated media counts
      const { data: media } = await supabase
        .from('generated_media')
        .select('user_id, media_type');

      // Build user stats
      const usersData: UserStats[] = profiles.map(profile => {
        const userCredits = credits?.find(c => c.user_id === profile.user_id);
        const userTransactions = transactions?.filter(t => t.user_id === profile.user_id) || [];
        const userMedia = media?.filter(m => m.user_id === profile.user_id) || [];

        const monthlyCredits = Number(userCredits?.monthly_credits || 0);
        const purchasedCredits = Number(userCredits?.purchased_credits || 0);
        const creditsUsed = userTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        return {
          user_id: profile.user_id,
          display_name: profile.display_name,
          joined_at: profile.created_at,
          monthly_credits: monthlyCredits,
          purchased_credits: purchasedCredits,
          total_available: monthlyCredits + purchasedCredits,
          credits_used: creditsUsed,
          image_count: userMedia.filter(m => m.media_type === 'image').length,
          video_count: userMedia.filter(m => m.media_type === 'video').length,
        };
      });

      setUserStats(usersData);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const filteredUsers = userStats.filter(user => 
    (user.display_name?.toLowerCase() || '').includes(userSearch.toLowerCase()) ||
    user.user_id.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-gold-gradient mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor users, credits, and system statistics</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Image className="w-4 h-4" />
                Total Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats?.totalImages || 0}</div>
              <p className="text-xs text-muted-foreground">Today: {stats?.todayImages || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Video className="w-4 h-4" />
                Total Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats?.totalVideos || 0}</div>
              <p className="text-xs text-muted-foreground">Today: {stats?.todayVideos || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Credits Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats?.totalCreditsUsed?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">Today: {stats?.todayCreditsUsed?.toFixed(1) || 0}</p>
            </CardContent>
          </Card>

          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Credits Allocated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{stats?.totalCreditsAllocated?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">All users combined</p>
            </CardContent>
          </Card>

          <Card className="glass-card cinematic-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Credits Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats?.totalCreditsRemaining?.toFixed(1) || 0}</div>
              <p className="text-xs text-muted-foreground">Available to use</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Usage Chart */}
        <Card className="glass-card cinematic-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              Last 7 Days Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dailyUsage.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="text-xs text-muted-foreground mb-2">{day.date}</div>
                  <div className="space-y-1">
                    <div className="h-16 bg-gold/20 rounded relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-gold/60 transition-all"
                        style={{ height: `${Math.min((day.images / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs">{day.images} img</div>
                    <div className="text-xs text-muted-foreground">{day.videos} vid</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="glass-card">
            <TabsTrigger value="users">Users & Credits</TabsTrigger>
            <TabsTrigger value="generations">Recent Generations</TabsTrigger>
            <TabsTrigger value="transactions">Credit Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="glass-card cinematic-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold" />
                    User Credits & Usage
                  </CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9 bg-background/50"
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
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Monthly</TableHead>
                        <TableHead className="text-right">Purchased</TableHead>
                        <TableHead className="text-right">Total Available</TableHead>
                        <TableHead className="text-right">Used</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                        <TableHead className="text-right">Images</TableHead>
                        <TableHead className="text-right">Videos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((userStat) => (
                        <TableRow key={userStat.user_id}>
                          <TableCell className="font-medium">
                            {userStat.display_name || 'Anonymous'}
                            <p className="text-xs text-muted-foreground truncate max-w-32">
                              {userStat.user_id.slice(0, 8)}...
                            </p>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(userStat.joined_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">{userStat.monthly_credits.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{userStat.purchased_credits.toFixed(1)}</TableCell>
                          <TableCell className="text-right font-medium text-gold">
                            {userStat.total_available.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-red-400">
                            {userStat.credits_used.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-green-400 font-medium">
                            {(userStat.total_available - userStat.credits_used).toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">{userStat.image_count}</TableCell>
                          <TableCell className="text-right">{userStat.video_count}</TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generations">
            <Card className="glass-card cinematic-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Recent Media Generations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentGenerations.map((gen) => (
                    <div key={gen.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {gen.media_type === 'image' ? (
                          <Image className="w-5 h-5 text-blue-400" />
                        ) : (
                          <Video className="w-5 h-5 text-purple-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium truncate max-w-md">{gen.prompt}</p>
                          <p className="text-xs text-muted-foreground">{gen.model_used}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded ${
                          gen.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          gen.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {gen.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(gen.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="glass-card cinematic-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-gold" />
                  Credit Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {creditTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-card/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.transaction_type === 'purchase' ? 'bg-green-500/20' :
                          tx.transaction_type === 'monthly_allocation' ? 'bg-blue-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {tx.transaction_type === 'purchase' ? '+' : 
                           tx.transaction_type === 'monthly_allocation' ? '+' : '-'}
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {tx.transaction_type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tx.media_type || tx.description || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${
                          Number(tx.amount) > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {Number(tx.amount) > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
