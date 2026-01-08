import { useState } from "react";
import { Coins, Zap, TrendingUp, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

  if (compact) {
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-2 font-medium",
              credits.isAdmin && "text-primary"
            )}
          >
            <Coins className="h-4 w-4" />
            <span>
              {credits.isAdmin ? "∞" : credits.totalCredits.toFixed(1)} Credits
            </span>
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
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Production Credits</CardTitle>
          </div>
          {credits.isAdmin && (
            <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full flex items-center gap-1">
              <Crown className="h-3 w-3" />
              Admin
            </span>
          )}
        </div>
        <CardDescription>
          Use credits to generate images and videos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-xl font-bold">
              {credits.isAdmin ? "∞" : credits.monthlyCredits.toFixed(1)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="text-xl font-bold">
              {credits.isAdmin ? "∞" : credits.purchasedCredits.toFixed(1)}
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Available</span>
            <span className="text-2xl font-bold text-primary">
              {credits.isAdmin ? "Unlimited" : credits.totalCredits.toFixed(1)}
            </span>
          </div>
        </div>

        {!credits.isAdmin && showBuyButton && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Buy More Credits
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
          <p><strong>Credit costs:</strong></p>
          <p>• 10-second video = 1 credit</p>
          <p>• 2K image = 0.18 credits</p>
          <p>• 4K image = 0.24 credits</p>
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
          Buy Production Credits
        </DialogTitle>
        <DialogDescription>
          Credits stack instantly. Current balance: {credits.totalCredits.toFixed(1)} credits
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
              pack.id === "pack_100" && "border-primary/30 bg-primary/5",
              purchasingPack === pack.id && "opacity-50 cursor-wait"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">{pack.credits} Credits</p>
                <p className="text-xs text-muted-foreground">
                  ${pack.pricePerCredit.toFixed(2)} per credit
                </p>
              </div>
            </div>
            <div className="text-right">
              {purchasingPack === pack.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <p className="text-lg font-bold">${pack.price}</p>
                  {pack.id === "pack_100" && (
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
