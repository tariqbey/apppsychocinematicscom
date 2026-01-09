import { useState } from "react";
import { Coins, Zap, TrendingUp, Crown, Loader2, AlertTriangle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useProductionCredits, CREDIT_PACKS } from "@/hooks/useProductionCredits";
import { cn } from "@/lib/utils";

interface ProductionCreditsDisplayProps {
  compact?: boolean;
  showBuyButton?: boolean;
}

export const ProductionCreditsDisplay = ({ compact = false, showBuyButton = true }: ProductionCreditsDisplayProps) => {
  const { credits, loading, purchaseCredits } = useProductionCredits();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchasingPack, setPurchasingPack] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setPurchasingPack(packId);
    try {
      await purchaseCredits(packId);
    } finally {
      setPurchasingPack(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!credits) {
    return null;
  }

  // Determine usage status
  const usagePercentage = credits.usagePercentage || 0;
  const isWarning = usagePercentage >= 80 && usagePercentage < 95;
  const isCritical = usagePercentage >= 95;
  const isLimitReached = !credits.canGenerate;

  if (compact) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2 font-medium",
              credits.isAdmin && "text-primary",
              isCritical && !credits.isAdmin && "text-destructive",
              isWarning && !credits.isAdmin && "text-yellow-600"
            )}
          >
            <Coins className="h-4 w-4" />
            <span>
              {credits.isAdmin ? "∞" : `${credits.totalRemaining.toLocaleString()} credits`}
            </span>
            {isCritical && !credits.isAdmin && (
              <AlertTriangle className="h-3 w-3" />
            )}
          </Button>
        </DialogTrigger>
        <CreditsPurchaseDialog 
          credits={credits}
          onPurchase={handlePurchase}
          purchasingPack={purchasingPack}
        />
      </Dialog>
    );
  }

  return (
    <Card className={cn(
      "border-primary/20",
      isCritical && !credits.isAdmin && "border-destructive/50",
      isWarning && !credits.isAdmin && "border-yellow-500/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Credits</CardTitle>
          </div>
          {credits.isAdmin && (
            <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
        <CardDescription>
          1,000 credits/month included
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Progress Bar */}
        {!credits.isAdmin && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Usage</span>
              <span className={cn(
                "font-medium",
                isCritical && "text-destructive",
                isWarning && "text-yellow-600"
              )}>
                {credits.monthlyAllowanceUsed.toLocaleString()} / {credits.monthlyAllowanceLimit.toLocaleString()}
              </span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={cn(
                "h-2",
                isCritical && "[&>div]:bg-destructive",
                isWarning && "[&>div]:bg-yellow-500"
              )}
            />
            {isWarning && !isCritical && (
              <p className="text-xs text-yellow-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Approaching limit - {(100 - usagePercentage).toFixed(0)}% remaining
              </p>
            )}
            {isCritical && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {isLimitReached ? "Monthly credits used - purchase more to continue" : "Almost at limit"}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Monthly Left</p>
            <p className="text-xl font-bold">
              {credits.isAdmin ? "∞" : credits.remainingMonthlyAllowance.toLocaleString()}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="text-xl font-bold">
              {credits.isAdmin ? "∞" : credits.purchasedBalance.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Available</span>
            <span className={cn(
              "text-2xl font-bold",
              credits.isAdmin ? "text-primary" : isLimitReached ? "text-destructive" : "text-primary"
            )}>
              {credits.isAdmin ? "Unlimited" : `${credits.totalRemaining.toLocaleString()} credits`}
            </span>
          </div>
        </div>

        {!credits.isAdmin && showBuyButton && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className={cn(
                "w-full gap-2",
                isLimitReached && "bg-destructive hover:bg-destructive/90"
              )}>
                <Zap className="h-4 w-4" />
                {isLimitReached ? "Buy Credits to Continue" : "Buy More Credits"}
              </Button>
            </DialogTrigger>
            <CreditsPurchaseDialog 
              credits={credits}
              onPurchase={handlePurchase}
              purchasingPack={purchasingPack}
            />
          </Dialog>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Estimated costs:</strong></p>
          <p>• 5-sec video ≈ 60 credits</p>
          <p>• 10-sec video ≈ 110 credits</p>
          <p>• 2K image ≈ 15 credits</p>
          <p>• 4K image ≈ 18 credits</p>
          <p>• Music generation ≈ 25 credits</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface CreditsPurchaseDialogProps {
  credits: any;
  onPurchase: (packId: string) => void;
  purchasingPack: string | null;
}

const CreditsPurchaseDialog = ({ credits, onPurchase, purchasingPack }: CreditsPurchaseDialogProps) => {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Buy Credits
        </DialogTitle>
        <DialogDescription>
          Add more credits to your account. Current balance: {credits.totalRemaining.toLocaleString()} credits
        </DialogDescription>
      </DialogHeader>
      
      <div className="grid gap-3 py-4">
        {CREDIT_PACKS.map((pack) => (
          <button
            key={pack.id}
            onClick={() => onPurchase(pack.id)}
            disabled={!!purchasingPack}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              pack.bonus && "border-primary/30 bg-primary/5",
              purchasingPack === pack.id && "opacity-50 cursor-wait"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{pack.credits.toLocaleString()} Credits</p>
                {pack.bonus && (
                  <p className="text-xs text-primary flex items-center gap-1">
                    <Gift className="h-3 w-3" />
                    {pack.bonus}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              {purchasingPack === pack.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <p className="text-lg font-bold">${pack.price}</p>
                  {pack.id === "pack_30" && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Best Value
                    </span>
                  )}
                </>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Secure checkout powered by Stripe. Credits never expire.
      </p>
    </DialogContent>
  );
};

export default ProductionCreditsDisplay;
