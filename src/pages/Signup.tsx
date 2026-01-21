import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Film, 
  Mail, 
  Lock, 
  Loader2, 
  Check, 
  Zap,
  ArrowLeft,
  Eye,
  EyeOff,
  CreditCard,
  Key,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import psychoCinematicsLogo from "@/assets/psycho-cinematics-logo.png";

type Step = "package" | "account" | "checkout";

export default function Signup() {
  const [currentStep, setCurrentStep] = useState<Step>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const packageFeatures = [
    "Unlimited Director AI Conversations",
    "1,000 Monthly Production Credits",
    "Full Mind Movie Studio Access",
    "Daily Scorecard & Streak Tracking",
    "Chief Aim Wizard & Planning Tools",
    "Mind Movie Theater Experience",
    "Gamification & Leaderboards",
    "Director's Corner Community Access"
  ];

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        variant: "destructive",
        title: "Terms Required",
        description: "Please agree to the terms of service.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create the account first
      await signUp(email, password);
      
      // If access code is provided, try to redeem it
      if (accessCode.trim()) {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data, error } = await supabase.rpc('redeem_access_code', {
          p_code: accessCode.trim()
        });

        if (error) {
          console.error("Error redeeming code:", error);
          // Code failed but account was created, redirect to checkout
          toast({
            variant: "destructive",
            title: "Invalid Access Code",
            description: "Account created, but the access code was invalid. Redirecting to payment...",
          });
          await redirectToCheckout();
          return;
        }

        const result = data as { success: boolean; error?: string; role?: string };

        if (result.success) {
          toast({
            title: "Welcome, Director!",
            description: `Full access granted with ${result.role} privileges!`,
          });
          // Navigate to dashboard instead of checkout
          navigate("/");
          return;
        } else {
          // Code was invalid, proceed to checkout
          toast({
            variant: "destructive",
            title: "Invalid Access Code",
            description: result.error || "Redirecting to payment...",
          });
          await redirectToCheckout();
          return;
        }
      }
      
      // No access code provided, proceed to checkout
      toast({
        title: "Account Created!",
        description: "Redirecting to payment...",
      });

      await redirectToCheckout();
    } catch (error: any) {
      // Check if user already exists
      if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
        toast({
          variant: "destructive",
          title: "Account Already Exists",
          description: "This email is already registered. Please sign in instead.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sign Up Error",
          description: error.message || "Something went wrong",
        });
      }
      setIsLoading(false);
    }
  };

  const redirectToCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription');
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error('Checkout redirect error:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error.message || "Unable to redirect to checkout. Please try again.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 spotlight opacity-30" />
      <div className="absolute inset-0 film-grain opacity-20" />
      
      {/* Navigation */}
      <nav className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src={psychoCinematicsLogo} 
              alt="Psycho-Cinematics" 
              className="h-10 w-auto"
            />
          </Link>
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display tracking-wide mb-4">
              Begin Your <span className="text-gold-gradient">Director's Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Create your account and unlock the full transformation suite
            </p>
          </div>

          {/* Main Content - Two Columns */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Package Details */}
            <div className="order-2 lg:order-1">
              <div className="glass-card p-8 cinematic-border border-gold/30 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-soft flex items-center justify-center">
                    <Film className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display">Director's OS</h2>
                    <p className="text-muted-foreground text-sm">Full Access Membership</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-display text-gold">$29</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <Zap className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">3-Day Free Trial</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h3 className="font-display text-lg mb-4">What's Included:</h3>
                  {packageFeatures.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-gold" />
                      </div>
                      <span className="text-sm text-foreground/90">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Trust Badges */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-4 h-4" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      <span>Cancel Anytime</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sign Up Form */}
            <div className="order-1 lg:order-2">
              <div className="glass-card p-8 cinematic-border">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-amber-soft mx-auto mb-4 flex items-center justify-center">
                    <Film className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-display">Create Your Account</h2>
                  <p className="text-muted-foreground mt-1">
                    Enter your details to get started
                  </p>
                </div>

                <form onSubmit={handleCreateAccount} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="director@example.com"
                        className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-secondary rounded-lg pl-11 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground uppercase tracking-wider">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Access Code (Collapsible) */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowAccessCode(!showAccessCode)}
                      className="flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
                    >
                      <Key className="w-4 h-4" />
                      {showAccessCode ? "Hide access code" : "Have an access code?"}
                    </button>
                    
                    {showAccessCode && (
                      <div className="relative animate-in slide-in-from-top-2 duration-200">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          placeholder="Enter access code (optional)"
                          className="w-full bg-secondary rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 placeholder:text-muted-foreground"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          <Shield className="w-3 h-3 inline mr-1" />
                          Access codes grant full membership without payment
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-border bg-secondary text-gold focus:ring-gold/50"
                      disabled={isLoading}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                      I agree to the{" "}
                      <a href="#" className="text-gold hover:underline">Terms of Service</a>
                      {" "}and{" "}
                      <a href="#" className="text-gold hover:underline">Privacy Policy</a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : accessCode.trim() ? (
                      <>
                        <Shield className="w-5 h-5 mr-2" />
                        Create Account with Access Code
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Continue to Payment
                      </>
                    )}
                  </Button>

                  {/* Note */}
                  <p className="text-xs text-center text-muted-foreground">
                    {accessCode.trim() 
                      ? "Your access code will grant full membership instantly."
                      : "You won't be charged during your 3-day free trial. Cancel anytime."
                    }
                  </p>

                  {/* Divider */}
                  <div className="relative my-6">
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

                {/* Login Link */}
                <div className="mt-8 pt-6 border-t border-border text-center">
                  <p className="text-muted-foreground text-sm">
                    Already have an account?{" "}
                    <Link to="/" className="text-gold hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
