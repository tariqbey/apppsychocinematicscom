import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset.",
      });

      // Redirect to home after 2 seconds
      setTimeout(() => navigate("/"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to reset password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-card cinematic-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-display mb-2">Password Reset!</h2>
          <p className="text-muted-foreground">
            Redirecting you to the studio...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-soft mx-auto mb-4 flex items-center justify-center">
            <Film className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-display tracking-wide">Reset Password</h2>
          <p className="text-muted-foreground mt-1">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
