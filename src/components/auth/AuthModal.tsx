import React, { useState, useEffect } from "react";
import { X, Film, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export const AuthModal = ({ isOpen, onClose, initialMode = "signup" }: AuthModalProps) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  // Update mode when initialMode prop changes (e.g., when modal reopens)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const redirectToCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout redirect error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: "Unable to redirect to checkout. Please try again from the dashboard.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        toast({
          title: "Welcome back, Director!",
          description: "The set is ready. Let's continue your production.",
        });
        onClose();
      } else {
        await signUp(email, password);
        toast({
          title: "Welcome to Psycho-Cinematics™",
          description: "Redirecting you to complete your subscription...",
        });
        // After signup, redirect to Stripe checkout
        await redirectToCheckout();
        onClose();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-cinematic-midnight/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md glass-card cinematic-border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-soft mx-auto mb-4 flex items-center justify-center">
            <Film className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display tracking-wide">
            {mode === "signin" ? "Welcome Back" : "Join the Production"}
          </h2>
          <p className="text-muted-foreground mt-1">
            {mode === "signin"
              ? "Enter the studio"
              : "Begin your Director journey"}
          </p>
        </div>

        {/* Form */}
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

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground uppercase tracking-wider">
              Password
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

          <Button
            type="submit"
            variant="gold"
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : mode === "signin" ? (
              "Enter Studio"
            ) : (
              "Begin Production"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border text-center">
          <p className="text-muted-foreground text-sm">
            {mode === "signin" ? "New to the production?" : "Already a Director?"}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-gold hover:underline ml-2"
            >
              {mode === "signin" ? "Join now" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
