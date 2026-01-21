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
  const { signIn, signUp, signInWithGoogle } = useAuth();
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

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              try {
                await signInWithGoogle();
              } catch (error: any) {
                toast({
                  variant: "destructive",
                  title: "Google Sign-In Error",
                  description: error.message || "Unable to sign in with Google",
                });
                setIsLoading(false);
              }
            }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
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
