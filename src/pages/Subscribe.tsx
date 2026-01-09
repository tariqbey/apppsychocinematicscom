import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap, Crown, Film, Brain, BarChart3, Users, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { AuthModal } from "@/components/auth/AuthModal";

const features = [
  { icon: Brain, text: "Director AI - Unlimited conversations" },
  { icon: Film, text: "Mind Movie Studio - Full access" },
  { icon: Zap, text: "1000 Monthly Production Credits ($10 value)" },
  { icon: BarChart3, text: "Daily Scorecard & Progress Tracking" },
  { icon: Crown, text: "Chief Aim Wizard & Identity System" },
  { icon: Users, text: "Director's Corner Community" },
];

const creditInfo = [
  { type: "5-second video", cost: "60 credits" },
  { type: "10-second video", cost: "110 credits" },
  { type: "2K image", cost: "15 credits" },
  { type: "4K image", cost: "18 credits" },
  { type: "Music generation", cost: "25 credits" },
];

const Subscribe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createSubscription, isSubscribed, loading: subLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isSubscribed) {
      navigate("/");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSubscription();
      if (!result.success && result.hasActiveSubscription) {
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Director's OS Membership</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Become the Director of Your Life
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The AI-powered identity transformation system that helps you script, visualize, and manifest your definite chief aim.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="border-primary/30 shadow-xl shadow-primary/5 mb-12">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm text-muted-foreground line-through">$49</span>
              <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-500 rounded-full">
                LAUNCH PRICE
              </span>
            </div>
            <CardTitle className="text-5xl font-bold">
              $29<span className="text-lg font-normal text-muted-foreground">/month</span>
            </CardTitle>
            <CardDescription className="text-base">
              3-day free trial with 200 credits • Cancel anytime
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Features */}
            <div className="grid md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Credits Breakdown */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Monthly Production Credits Include
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {creditInfo.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">{item.type}</span>
                    <span className="font-medium">{item.cost}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                <strong>Trial:</strong> 200 credits = 5 images + 2 videos to test the platform<br/>
                <strong>Paid:</strong> 1000 credits/month = ~16 videos OR ~66 images (or mix & match!)
              </p>
            </div>

            {/* CTA Button */}
            <Button 
              size="lg" 
              className="w-full text-lg h-14 gap-2"
              onClick={handleSubscribe}
              disabled={isLoading || subLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : isSubscribed ? (
                <>
                  <Check className="h-5 w-5" />
                  You're Already Subscribed
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Start 3-Day Free Trial
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Secure checkout powered by Stripe. Cancel anytime from your account.
            </p>
          </CardContent>
        </Card>

        {/* What's Included */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">What You'll Get Access To</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border bg-card">
              <Brain className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Director AI</h3>
              <p className="text-sm text-muted-foreground">
                Your personal AI coach trained in Psycho-Cinematics methodology
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Film className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Mind Movie Studio</h3>
              <p className="text-sm text-muted-foreground">
                Create powerful visualization videos with AI image & video generation
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Progress Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Daily scorecards, streak tracking, and identity shift visualization
              </p>
            </div>
          </div>
        </div>
      </main>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Subscribe;
