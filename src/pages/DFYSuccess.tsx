import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, PartyPopper, Mail, Calendar, Film, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DFYSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<{
    customerName: string;
    customerEmail: string;
    orderId: string;
  } | null>(null);

  useEffect(() => {
    const confirmPurchase = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("confirm-dfy-purchase", {
          body: { sessionId },
        });

        if (error) throw error;

        if (data?.success) {
          setOrderData({
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            orderId: data.orderId,
          });
          toast.success("Payment confirmed! Welcome aboard, Director!");
        }
      } catch (err) {
        console.error("Confirmation error:", err);
        toast.error("There was an issue confirming your order. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    confirmPurchase();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Confirming your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16 max-w-3xl">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <PartyPopper className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Welcome to the Director's Chair!
          </h1>
          <p className="text-xl text-muted-foreground">
            {orderData?.customerName 
              ? `Congratulations ${orderData.customerName.split(' ')[0]}! Your Done For You Mind Movie package is confirmed.`
              : "Your Done For You Mind Movie package is confirmed!"
            }
          </p>
        </div>

        {/* Next Steps Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Here's What Happens Next
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Check Your Email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a confirmation email to {orderData?.customerEmail || "your inbox"} with your receipt and next steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Discovery Call (Within 24 Hours)</h3>
                  <p className="text-sm text-muted-foreground">
                    Our team will reach out to schedule your 15-minute discovery call where we'll map out your vision and goals.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Film className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Your Mind Movie (7-10 Days)</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll create your complete Mind Movie with custom script, visuals, and soundtrack—delivered ready to watch.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Included Reminder */}
        <Card className="mb-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Your Package Includes:</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                3-Minute Mind Movie
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Custom Soundtrack
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Chief Aim Coaching
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                AI-Generated Visuals
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Professional Script
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                1 Month Free Software
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate("/signup")}
            className="gap-2"
          >
            Create Your Free Account
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate("/")}
          >
            Return to Home
          </Button>
        </div>

        {/* Support Note */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions? Reply to your confirmation email or reach out at support@psycho-cinematics.com
        </p>
      </main>
    </div>
  );
};

export default DFYSuccess;
