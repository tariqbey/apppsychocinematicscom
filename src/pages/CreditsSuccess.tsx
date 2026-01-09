import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Coins, Loader2, ArrowRight, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductionCredits, USAGE_PACKS } from "@/hooks/useProductionCredits";

const CreditsSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const packId = searchParams.get("pack");
  const { confirmPurchase, fetchCredits } = useProductionCredits();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [dollarAmount, setDollarAmount] = useState<number>(0);

  useEffect(() => {
    const confirm = async () => {
      if (!sessionId) {
        setStatus("error");
        return;
      }

      try {
        const result = await confirmPurchase(sessionId);
        if (result.success) {
          setDollarAmount(result.dollarAmount || 0);
          setStatus("success");
          await fetchCredits();
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error confirming purchase:", error);
        setStatus("error");
      }
    };

    confirm();
  }, [sessionId, confirmPurchase, fetchCredits]);

  const pack = USAGE_PACKS.find(p => p.id === packId);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "processing" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle>Processing Purchase...</CardTitle>
              <CardDescription>
                Please wait while we confirm your payment
              </CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-green-500">Purchase Successful!</CardTitle>
              <CardDescription>
                Your API usage balance has been updated
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Coins className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <CardDescription>
                There was an issue processing your purchase. Please contact support.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm text-muted-foreground mb-1">API Usage Added</p>
              <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                <DollarSign className="h-6 w-6" />
                +${dollarAmount || pack?.dollarAmount || 0}
              </p>
            </div>
          )}

          <Button 
            className="w-full gap-2" 
            onClick={() => navigate("/studio")}
          >
            Go to Studio
            <ArrowRight className="h-4 w-4" />
          </Button>

          {status === "error" && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/")}
            >
              Return Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditsSuccess;
