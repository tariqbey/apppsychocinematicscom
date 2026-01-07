import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Settings, PhoneCall } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CoachingCallSettings } from "./CoachingCallSettings";
import { CallHistory } from "./CallHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VoiceCoachCardProps {
  userId: string;
  phoneNumber?: string | null;
  coachingCallEnabled?: boolean;
  coachingCallTime?: string | null;
  coachingCallTimezone?: string | null;
  onUpdate?: () => void;
}

export const VoiceCoachCard = ({
  userId,
  phoneNumber,
  coachingCallEnabled = false,
  coachingCallTime = "08:00",
  coachingCallTimezone = "America/New_York",
  onUpdate,
}: VoiceCoachCardProps) => {
  const [open, setOpen] = useState(false);

  const handleUpdate = () => {
    onUpdate?.();
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <PhoneCall className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Voice Coach</h3>
              <p className="text-sm text-muted-foreground">
                {coachingCallEnabled 
                  ? `Daily call at ${coachingCallTime}` 
                  : "Get daily accountability calls"}
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {coachingCallEnabled ? "Manage" : "Set Up"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Voice Coach
                </DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="settings" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="history">Call History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="mt-4">
                  <CoachingCallSettings
                    userId={userId}
                    phoneNumber={phoneNumber}
                    coachingCallEnabled={coachingCallEnabled}
                    coachingCallTime={coachingCallTime}
                    coachingCallTimezone={coachingCallTimezone}
                    onUpdate={handleUpdate}
                  />
                </TabsContent>
                
                <TabsContent value="history" className="mt-4">
                  <CallHistory userId={userId} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {coachingCallEnabled && phoneNumber && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">
              Active • Next call scheduled
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
