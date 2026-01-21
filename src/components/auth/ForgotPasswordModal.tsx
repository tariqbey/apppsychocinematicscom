import { useState } from "react";
import { X, Film, Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export const ForgotPasswordModal = ({ isOpen, onClose, onBack }: ForgotPasswordModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for the password reset link.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send reset email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-soft mx-auto mb-4 flex items-center justify-center">
            <Film className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-display tracking-wide">
            {isSuccess ? "Check Your Email" : "Reset Password"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {isSuccess
              ? "We've sent you a password reset link"
              : "Enter your email to receive a reset link"}
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-muted-foreground mb-6">
              Check your inbox for <span className="text-foreground font-medium">{email}</span> and click the reset link to set a new password.
            </p>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Back to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@studio.com"
                  className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                  required
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
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
