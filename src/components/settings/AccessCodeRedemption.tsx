import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { VoiceInput } from "@/components/ui/VoiceInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Key, Loader2, CheckCircle, Shield } from "lucide-react";

export const AccessCodeRedemption = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error("Please enter an access code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('redeem_access_code', {
        p_code: code.trim()
      });

      if (error) {
        console.error("Error redeeming code:", error);
        toast.error("Failed to redeem code");
        return;
      }

      const result = data as { success: boolean; error?: string; role?: string };

      if (result.success) {
        setRedeemed(true);
        setCode("");
        toast.success(`Access granted! You now have ${result.role} privileges.`, {
          icon: <Shield className="h-4 w-4 text-gold" />
        });
        // Refresh the page after a short delay to update admin status
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(result.error || "Invalid access code");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred while redeeming the code");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleRedeem();
    }
  };

  if (redeemed) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="font-semibold text-lg">Access Granted!</h3>
            <p className="text-sm text-muted-foreground">
              Refreshing to apply your new permissions...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-gold" />
          Access Code
        </CardTitle>
        <CardDescription>
          Enter a special access code to unlock additional features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <VoiceInput
            type="text"
            placeholder="Enter access code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleRedeem} 
            disabled={loading || !code.trim()}
            className="shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Redeem"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
