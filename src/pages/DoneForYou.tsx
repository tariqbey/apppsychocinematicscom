import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check, Film, Music, Target, Sparkles, Clock, 
  Loader2, ArrowLeft, Star, Zap, Users, Gift,
  FileText, Image, Video, Headphones, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const dfyExclusives = [
  { icon: Target, title: "Definite Chief Aim Coaching", description: "Personal 1-on-1 guidance to craft your perfect vision statement" },
  { icon: FileText, title: "Professional Script Writing", description: "Expert-crafted affirmation script tailored to your goals" },
  { icon: Image, title: "AI-Generated Visuals", description: "12+ stunning scenes featuring you as the star" },
  { icon: Video, title: "3-Minute Mind Movie", description: "Fully edited, cinematic visualization video" },
  { icon: Music, title: "Custom Soundtrack", description: "Original AI-generated music matched to your vision" },
  { icon: Users, title: "Cameo Integration", description: "Your reference photos seamlessly integrated" },
  { icon: Headphones, title: "Priority Support", description: "Dedicated support throughout your creation" },
];

const softwareFeatures = [
  { title: "Director AI Voice Coach", description: "24/7 AI coaching for identity transformation" },
  { title: "Daily Scorecard & Tracking", description: "Track your transformation with detailed analytics" },
  { title: "Director's Journal", description: "AI-analyzed journaling with mood trends" },
  { title: "Three Things Task System", description: "Daily priority management with streak tracking" },
  { title: "Character Builder", description: "Discover your archetype and transformation path" },
  { title: "Episodes System", description: "Short-term sprints for focused goals" },
  { title: "Media Studio", description: "Create additional images and videos anytime" },
  { title: "Director Radio", description: "Motivational playlists and podcasts" },
  { title: "Community Access", description: "Connect with other Directors on their journey" },
];

const processSteps = [
  { step: "1", title: "Book Your Call", description: "Quick 15-min discovery call to understand your vision" },
  { step: "2", title: "We Create", description: "Our team crafts your complete Mind Movie package" },
  { step: "3", title: "You Review", description: "Preview and request any adjustments" },
  { step: "4", title: "Start Watching", description: "Begin your daily transformation ritual" },
];

const testimonials = [
  { name: "Marcus J.", role: "Entrepreneur", quote: "The DFY Mind Movie changed everything. Watching it daily, I manifested my first 6-figure month within 90 days." },
  { name: "Sarah K.", role: "Real Estate Investor", quote: "I was skeptical, but seeing myself in the visualization made it feel so real. Best investment I've made." },
  { name: "David R.", role: "Business Coach", quote: "The custom soundtrack alone is worth it. It triggers my peak state every single morning." },
];

const DoneForYou = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-dfy-checkout", {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Failed to start checkout. Please try again.");
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

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Done For You Package</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Get Your Complete Mind Movie<br />
            <span className="text-primary">Created For You</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Skip the learning curve. Our team will craft your personalized 3-minute Mind Movie 
            with custom visuals, soundtrack, and script—all you have to do is watch it daily.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Delivered in 7-10 days</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Unlimited revisions</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - What's Included */}
          <div className="space-y-8">
            {/* DFY Exclusives */}
            <div>
              <h2 className="text-2xl font-bold mb-2">Done For You Package</h2>
              <p className="text-muted-foreground mb-6">We create everything for you—just watch and transform</p>
              <div className="grid gap-4">
                {dfyExclusives.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Software Features */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">Plus Full Software Access</h2>
                <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-500 rounded-full">
                  1 Month FREE
                </span>
              </div>
              <p className="text-muted-foreground mb-6">Everything in the $29/month Director's OS plan included</p>
              <div className="grid gap-3">
                {softwareFeatures.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Steps */}
            <div>
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              <div className="grid grid-cols-2 gap-4">
                {processSteps.map((step, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mb-3">
                      {step.step}
                    </div>
                    <h3 className="font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Pricing & Form */}
          <div className="lg:sticky lg:top-8">
            <Card className="border-primary/30 shadow-xl shadow-primary/5">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground line-through">$997</span>
                  <span className="px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-500 rounded-full">
                    50% OFF LAUNCH
                  </span>
                </div>
                <CardTitle className="text-5xl font-bold">
                  $497
                </CardTitle>
                <CardDescription className="text-base">
                  One-time payment • Includes 1 month free software
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      Phone Number (optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <Button 
                    type="submit"
                    size="lg" 
                    className="w-full text-lg h-14 gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Get My Mind Movie - $497
                      </>
                    )}
                  </Button>
                </form>

                {/* What happens after */}
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    After Purchase
                  </h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Instant confirmation email</li>
                    <li>• Discovery call scheduled within 24hrs</li>
                    <li>• Mind Movie delivered in 7-10 days</li>
                    <li>• Free software access starts immediately</li>
                    <li>• After 1 month: $29/mo (cancel anytime)</li>
                  </ul>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Secure checkout powered by Stripe • 30-day money-back guarantee
                </p>
              </CardContent>
            </Card>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                <span>Money-Back Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">What Directors Are Saying</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">What if I'm not satisfied with my Mind Movie?</h3>
              <p className="text-sm text-muted-foreground">We offer unlimited revisions until you're 100% happy. Plus, there's a 30-day money-back guarantee if it's not for you.</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">How long is the Mind Movie?</h3>
              <p className="text-sm text-muted-foreground">Your finished Mind Movie is approximately 3 minutes—the perfect length for daily morning and evening viewing rituals.</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">What happens after the free month?</h3>
              <p className="text-sm text-muted-foreground">After your complimentary month, the Director's OS continues at $29/month. You can cancel anytime, but you'll still have your Mind Movie forever.</p>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Do I need to provide photos of myself?</h3>
              <p className="text-sm text-muted-foreground">Yes! We'll guide you through submitting a few reference photos so we can integrate your likeness into the visualization scenes.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoneForYou;
