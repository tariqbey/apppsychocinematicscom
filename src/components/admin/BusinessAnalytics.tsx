import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Coins, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calculator,
  Percent,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Film,
  Image as ImageIcon,
  Music,
  Mic,
  Bot
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { API_COSTS, DISPLAY_MARKUP } from "@/hooks/useProductionCredits";

interface FinancialMetrics {
  totalRevenue: number;
  subscriptionRevenue: number;
  creditPurchaseRevenue: number;
  totalApiCosts: number;
  grossProfit: number;
  profitMargin: number;
  avgRevenuePerUser: number;
}

interface UsageMetrics {
  totalGenerations: number;
  videoGenerations: number;
  imageGenerations: number;
  musicGenerations: number;
  ttsGenerations: number;
  aiChatUsage: number;
  voiceChangeUsage: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  costs: number;
  profit: number;
}

interface MediaBreakdown {
  name: string;
  count: number;
  cost: number;
  revenue: number;
  profit: number;
}

const COLORS = ['hsl(var(--primary))', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const BusinessAnalytics = () => {
  const [financials, setFinancials] = useState<FinancialMetrics | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [dailyData, setDailyData] = useState<DailyRevenue[]>([]);
  const [mediaBreakdown, setMediaBreakdown] = useState<MediaBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    await Promise.all([
      fetchFinancialMetrics(),
      fetchUsageMetrics(),
      fetchDailyRevenue(),
      fetchMediaBreakdown()
    ]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllAnalytics();
    setRefreshing(false);
  };

  const fetchFinancialMetrics = async () => {
    try {
      // Get subscription count (estimated at $29/month each)
      const { count: subscriberCount } = await supabase
        .from("production_credits")
        .select("*", { count: "exact", head: true })
        .gt("monthly_allowance_limit", 0);

      // Get credit purchases from transactions
      const { data: purchases } = await supabase
        .from("credit_transactions")
        .select("amount, stripe_session_id")
        .eq("transaction_type", "purchase");

      // Get all usage transactions with API costs
      const { data: usageTransactions } = await supabase
        .from("credit_transactions")
        .select("amount, api_cost_usd, media_type")
        .lt("amount", 0);

      // Get total users
      const { count: userCount } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      const subscriptionRevenue = (subscriberCount || 0) * 29;
      
      // Calculate credit purchase revenue (credits / 100 = dollars)
      const creditPurchaseRevenue = purchases?.reduce((sum, p) => {
        return sum + (Number(p.amount) / 100);
      }, 0) || 0;

      // Calculate total API costs
      const totalApiCosts = usageTransactions?.reduce((sum, t) => {
        return sum + (Number(t.api_cost_usd) || 0);
      }, 0) || 0;

      const totalRevenue = subscriptionRevenue + creditPurchaseRevenue;
      const grossProfit = totalRevenue - totalApiCosts;
      const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const avgRevenuePerUser = (userCount || 0) > 0 ? totalRevenue / (userCount || 1) : 0;

      setFinancials({
        totalRevenue,
        subscriptionRevenue,
        creditPurchaseRevenue,
        totalApiCosts,
        grossProfit,
        profitMargin,
        avgRevenuePerUser
      });
    } catch (err) {
      console.error("Error fetching financial metrics:", err);
    }
  };

  const fetchUsageMetrics = async () => {
    try {
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("media_type, amount")
        .lt("amount", 0);

      const videoGenerations = transactions?.filter(t => t.media_type === "video").length || 0;
      const imageGenerations = transactions?.filter(t => t.media_type === "image").length || 0;
      const musicGenerations = transactions?.filter(t => t.media_type === "music").length || 0;
      const ttsGenerations = transactions?.filter(t => t.media_type === "tts").length || 0;
      const voiceChangeUsage = transactions?.filter(t => t.media_type === "voiceChange").length || 0;
      const aiChatUsage = transactions?.filter(t => t.media_type === "ai").length || 0;

      setUsage({
        totalGenerations: transactions?.length || 0,
        videoGenerations,
        imageGenerations,
        musicGenerations,
        ttsGenerations,
        aiChatUsage,
        voiceChangeUsage
      });
    } catch (err) {
      console.error("Error fetching usage metrics:", err);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      const days = 30;
      const startDate = subDays(new Date(), days);

      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("created_at, amount, api_cost_usd, transaction_type")
        .gte("created_at", startDate.toISOString());

      const dailyData: DailyRevenue[] = [];
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const displayDate = format(date, "MMM d");

        const dayTransactions = transactions?.filter(t =>
          format(new Date(t.created_at), "yyyy-MM-dd") === dateStr
        ) || [];

        // Revenue from credit usage (credits charged / 100 = dollars earned)
        const revenue = dayTransactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + (Math.abs(Number(t.amount)) / 100), 0);

        // Actual API costs
        const costs = dayTransactions
          .filter(t => Number(t.amount) < 0)
          .reduce((sum, t) => sum + (Number(t.api_cost_usd) || 0), 0);

        dailyData.push({
          date: displayDate,
          revenue: Number(revenue.toFixed(2)),
          costs: Number(costs.toFixed(2)),
          profit: Number((revenue - costs).toFixed(2))
        });
      }

      setDailyData(dailyData);
    } catch (err) {
      console.error("Error fetching daily revenue:", err);
    }
  };

  const fetchMediaBreakdown = async () => {
    try {
      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("media_type, amount, api_cost_usd")
        .lt("amount", 0);

      const mediaTypes = ["video", "image", "music", "tts", "voiceChange", "ai"];
      const breakdown: MediaBreakdown[] = mediaTypes.map(type => {
        const typeTransactions = transactions?.filter(t => t.media_type === type) || [];
        const count = typeTransactions.length;
        const cost = typeTransactions.reduce((sum, t) => sum + (Number(t.api_cost_usd) || 0), 0);
        const revenue = typeTransactions.reduce((sum, t) => sum + (Math.abs(Number(t.amount)) / 100), 0);
        
        return {
          name: type === "ai" ? "AI Chat" : 
                type === "tts" ? "Text-to-Speech" : 
                type === "voiceChange" ? "Voice Change" :
                type.charAt(0).toUpperCase() + type.slice(1),
          count,
          cost: Number(cost.toFixed(2)),
          revenue: Number(revenue.toFixed(2)),
          profit: Number((revenue - cost).toFixed(2))
        };
      }).filter(b => b.count > 0);

      setMediaBreakdown(breakdown);
    } catch (err) {
      console.error("Error fetching media breakdown:", err);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Business Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-gold/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-gold" />
              Business Analytics
            </CardTitle>
            <CardDescription>Revenue, costs, and profit tracking</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top-line KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-green-500/10 border-green-500/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ${financials?.totalRevenue.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Subs: ${financials?.subscriptionRevenue.toFixed(2)} • Credits: ${financials?.creditPurchaseRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-red-600">
                <TrendingDown className="h-4 w-4" />
                API Costs
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-red-600">
                  ${financials?.totalApiCosts.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Actual provider costs
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-primary">
                <TrendingUp className="h-4 w-4" />
                Gross Profit
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">
                  ${financials?.grossProfit.toFixed(2) || "0.00"}
                </span>
                {financials && financials.grossProfit > 0 && (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Revenue minus costs
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gold/10 border-gold/30">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-gold">
                <Percent className="h-4 w-4" />
                Profit Margin
              </div>
              <div className="mt-1">
                <span className="text-2xl font-bold text-gold">
                  {financials?.profitMargin.toFixed(1) || "0"}%
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                ARPU: ${financials?.avgRevenuePerUser.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <Film className="h-5 w-5 mx-auto text-blue-500" />
            <p className="text-lg font-bold mt-1">{usage?.videoGenerations || 0}</p>
            <p className="text-xs text-muted-foreground">Videos</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <ImageIcon className="h-5 w-5 mx-auto text-green-500" />
            <p className="text-lg font-bold mt-1">{usage?.imageGenerations || 0}</p>
            <p className="text-xs text-muted-foreground">Images</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <Music className="h-5 w-5 mx-auto text-pink-500" />
            <p className="text-lg font-bold mt-1">{usage?.musicGenerations || 0}</p>
            <p className="text-xs text-muted-foreground">Music</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <Mic className="h-5 w-5 mx-auto text-purple-500" />
            <p className="text-lg font-bold mt-1">{usage?.ttsGenerations || 0}</p>
            <p className="text-xs text-muted-foreground">TTS</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <Zap className="h-5 w-5 mx-auto text-orange-500" />
            <p className="text-lg font-bold mt-1">{usage?.voiceChangeUsage || 0}</p>
            <p className="text-xs text-muted-foreground">Voice</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-center">
            <Bot className="h-5 w-5 mx-auto text-primary" />
            <p className="text-lg font-bold mt-1">{usage?.aiChatUsage || 0}</p>
            <p className="text-xs text-muted-foreground">AI Chat</p>
          </div>
        </div>

        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
            <TabsTrigger value="breakdown">Media Breakdown</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Revenue vs Costs (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue"
                        stackId="1"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="costs"
                        name="API Costs"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        name="Profit"
                        stackId="3"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Usage by Media Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mediaBreakdown}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {mediaBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Revenue & Cost by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mediaBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                        />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="cost" name="API Cost" fill="#ef4444" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profitability" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Profit by Media Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mediaBreakdown.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No usage data yet. Profits will appear once users start generating content.
                    </p>
                  ) : (
                    mediaBreakdown.map((item, index) => {
                      const marginPercent = item.revenue > 0 ? ((item.profit / item.revenue) * 100) : 0;
                      const isProfit = item.profit >= 0;
                      
                      return (
                        <div key={item.name} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{item.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                  {item.count} generations
                                </span>
                                <Badge variant={isProfit ? "default" : "destructive"}>
                                  {isProfit ? "+" : ""}{item.profit.toFixed(2)} ({marginPercent.toFixed(0)}% margin)
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Revenue: ${item.revenue.toFixed(2)}</span>
                              <span>Cost: ${item.cost.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Summary Card */}
                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Profit Summary</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Generations</p>
                      <p className="text-lg font-bold">{usage?.totalGenerations || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Revenue/Gen</p>
                      <p className="text-lg font-bold">
                        ${usage && usage.totalGenerations > 0 
                          ? (mediaBreakdown.reduce((sum, m) => sum + m.revenue, 0) / usage.totalGenerations).toFixed(3)
                          : "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Cost/Gen</p>
                      <p className="text-lg font-bold">
                        ${usage && usage.totalGenerations > 0
                          ? (mediaBreakdown.reduce((sum, m) => sum + m.cost, 0) / usage.totalGenerations).toFixed(3)
                          : "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Profit/Gen</p>
                      <p className="text-lg font-bold text-primary">
                        ${usage && usage.totalGenerations > 0
                          ? (mediaBreakdown.reduce((sum, m) => sum + m.profit, 0) / usage.totalGenerations).toFixed(3)
                          : "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pricing Reference */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Current Pricing Structure (API Cost + $0.10 Markup)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground text-xs">Video (Wan 2.1)</p>
                <p className="font-medium">$0.02/sec + $0.10</p>
                <p className="text-xs text-muted-foreground">~30 credits/10s</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground text-xs">Video (Veo 3 Fast)</p>
                <p className="font-medium">$0.05/sec + $0.10</p>
                <p className="text-xs text-muted-foreground">~50 credits/8s</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground text-xs">HD Image</p>
                <p className="font-medium">$0.03 + $0.10</p>
                <p className="text-xs text-muted-foreground">~13 credits</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-muted-foreground text-xs">Music (Suno)</p>
                <p className="font-medium">$0.12 + $0.10</p>
                <p className="text-xs text-muted-foreground">~22 credits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default BusinessAnalytics;
