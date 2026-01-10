import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Zap, TrendingUp, Gift, Loader2, Crown, Sparkles, Film, ImageIcon, Music, Bot } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useProductionCredits, CREDIT_PACKS } from "@/hooks/useProductionCredits";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const Credits = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { credits, loading, purchaseCredits } = useProductionCredits();
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setPurchasingPack(packId);
    try {
      await purchaseCredits(packId);
    } finally {
      setPurchasingPack(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const usagePercentage = credits?.usagePercentage || 0;
  const isWarning = usagePercentage >= 80 && usagePercentage < 95;
  const isCritical = usagePercentage >= 95;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Page Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-soft/20 border border-gold/30 mb-4">
              <Coins className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-4xl font-display tracking-wide mb-2">
              Production <span className="text-gold-gradient">Credits</span>
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Power your AI media generation with credits. Each credit equals $0.01 of creative power.
            </p>
          </div>

          {/* Current Balance Card */}
          <Card className="mb-8 border-gold/30 bg-gradient-to-br from-gold/5 to-amber-soft/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Your Balance</CardTitle>
                    <CardDescription>Credits available for generation</CardDescription>
                  </div>
                </div>
                {credits?.isAdmin && (
                  <span className="px-3 py-1.5 text-sm font-medium bg-primary/20 text-primary rounded-full flex items-center gap-1">
                    <Crown className="h-4 w-4" />
                    Admin
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Big Balance Display */}
              <div className="text-center py-6">
                <p className="text-6xl font-bold text-gold-gradient">
                  {credits?.isAdmin ? "∞" : credits?.totalRemaining.toLocaleString() || 0}
                </p>
                <p className="text-muted-foreground mt-2">Total Credits Available</p>
              </div>

              {/* Usage Progress */}
              {!credits?.isAdmin && (
                <div className="space-y-3 p-4 rounded-xl bg-background/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Usage</span>
                    <span className={cn(
                      "font-medium",
                      isCritical && "text-destructive",
                      isWarning && "text-yellow-500"
                    )}>
                      {credits?.monthlyAllowanceUsed.toLocaleString() || 0} / {credits?.monthlyAllowanceLimit.toLocaleString() || 1000}
                    </span>
                  </div>
                  <Progress 
                    value={usagePercentage} 
                    className={cn(
                      "h-3",
                      isCritical && "[&>div]:bg-destructive",
                      isWarning && "[&>div]:bg-yellow-500"
                    )}
                  />
                </div>
              )}

              {/* Balance Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Remaining</p>
                  <p className="text-2xl font-bold">
                    {credits?.isAdmin ? "∞" : credits?.remainingMonthlyAllowance.toLocaleString() || 0}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-1">Purchased Credits</p>
                  <p className="text-2xl font-bold">
                    {credits?.isAdmin ? "∞" : credits?.purchasedBalance.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Packs */}
          <div className="mb-8">
            <h2 className="text-2xl font-display tracking-wide mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-gold" />
              Top Up Credits
            </h2>
            <p className="text-muted-foreground mb-6">
              Purchase additional credits to keep creating. Larger packs include bonus credits!
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              {CREDIT_PACKS.map((pack) => (
                <Card 
                  key={pack.id}
                  className={cn(
                    "relative overflow-hidden transition-all hover:border-gold/50 cursor-pointer group",
                    pack.id === "pack_30" && "border-gold/40 bg-gradient-to-br from-gold/5 to-transparent"
                  )}
                  onClick={() => !purchasingPack && handlePurchase(pack.id)}
                >
                  {pack.id === "pack_30" && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 text-xs font-semibold bg-gold text-black rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Best Value
                      </span>
                    </div>
                  )}
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-soft/20 flex items-center justify-center group-hover:from-gold/30 group-hover:to-amber-soft/30 transition-colors">
                        <Coins className="w-8 h-8 text-gold" />
                      </div>
                      <p className="text-3xl font-bold mb-1">{pack.credits.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground mb-4">Credits</p>
                      
                      {pack.bonus && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                            <Gift className="w-3 h-3" />
                            {pack.bonus}
                          </span>
                        </div>
                      )}

                      <Button 
                        className="w-full gap-2" 
                        variant={pack.id === "pack_30" ? "gold" : "default"}
                        disabled={!!purchasingPack}
                      >
                        {purchasingPack === pack.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <span className="text-lg font-bold">${pack.price}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Guide */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                What Can You Create?
              </CardTitle>
              <CardDescription>
                Estimated credit costs for different generation types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Film className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="font-medium">5-sec Video</span>
                  </div>
                  <p className="text-2xl font-bold text-gold">~60</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Film className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-medium">10-sec Video</span>
                  </div>
                  <p className="text-2xl font-bold text-gold">~110</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="font-medium">HD Image</span>
                  </div>
                  <p className="text-2xl font-bold text-gold">~15</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                      <Music className="w-5 h-5 text-pink-400" />
                    </div>
                    <span className="font-medium">Music</span>
                  </div>
                  <p className="text-2xl font-bold text-gold">~25</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-gold/5 border border-gold/20">
                <div className="flex items-start gap-3">
                  <Bot className="w-5 h-5 text-gold mt-0.5" />
                  <div>
                    <p className="font-medium text-gold">AI Director Coaching</p>
                    <p className="text-sm text-muted-foreground">
                      Voice interactions and AI coaching use ~2-5 credits per message depending on length.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            All payments are secure and processed by Stripe. Credits never expire.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Credits;