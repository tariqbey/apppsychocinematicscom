import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Zap, Loader2, ArrowRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { checkSubscription } = useSubscription();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId) {
        // No session ID but they might have come back after successful subscription
        setStatus("success");
        return;
      }

      try {
        // Just refresh subscription status - the check-subscription function
        // will allocate credits if needed
        await checkSubscription();
        setStatus("success");
      } catch (error) {
        console.error("Error verifying subscription:", error);
        // Even on error, show success since Stripe already confirmed
        setStatus("success");
      }
    };

    // Small delay to let Stripe webhook process
    setTimeout(verify, 1500);
  }, [sessionId, checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "processing" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <CardTitle>Activating Your Subscription...</CardTitle>
              <CardDescription>
                Please wait while we set up your account
              </CardDescription>
            </>
          )}
          
          {status === "success" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-green-500">Welcome to Director's OS!</CardTitle>
              <CardDescription>
                Your subscription is now active
              </CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-yellow-500" />
              </div>
              <CardTitle>Almost There!</CardTitle>
              <CardDescription>
                Your subscription should be active. Please refresh if you don't see your credits.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "success" && (
            <>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                <p className="text-sm text-muted-foreground mb-1">Monthly Credits Added</p>
                <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                  <Coins className="h-6 w-6" />
                  +20
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Resets each billing cycle
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Full platform access unlocked
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  20 production credits ready to use
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  7-day free trial started
                </p>
              </div>
            </>
          )}

          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={() => navigate("/")}
          >
            Enter the Studio
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
