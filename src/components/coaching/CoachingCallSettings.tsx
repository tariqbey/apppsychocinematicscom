import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Clock, TestTube, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CoachingCallSettingsProps {
  userId: string;
  phoneNumber?: string | null;
  coachingCallEnabled?: boolean;
  coachingCallTime?: string | null;
  coachingCallTimezone?: string | null;
  onUpdate?: () => void;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona (MST)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export const CoachingCallSettings = ({
  userId,
  phoneNumber: initialPhone,
  coachingCallEnabled: initialEnabled = false,
  coachingCallTime: initialTime = "08:00",
  coachingCallTimezone: initialTimezone = "America/New_York",
  onUpdate,
}: CoachingCallSettingsProps) => {
  const { toast } = useToast();
  const [phone, setPhone] = useState(initialPhone || "");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [callTime, setCallTime] = useState(initialTime || "08:00");
  const [timezone, setTimezone] = useState(initialTimezone || "America/New_York");
  const [saving, setSaving] = useState(false);
  const [testingCall, setTestingCall] = useState(false);

  useEffect(() => {
    setPhone(initialPhone || "");
    setEnabled(initialEnabled);
    setCallTime(initialTime || "08:00");
    setTimezone(initialTimezone || "America/New_York");
  }, [initialPhone, initialEnabled, initialTime, initialTimezone]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format as US phone number
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const getE164Phone = (formatted: string) => {
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return `+${digits}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const e164Phone = phone ? getE164Phone(phone) : null;
      
      const { error } = await supabase
        .from("user_profiles")
        .update({
          phone_number: e164Phone,
          coaching_call_enabled: enabled,
          coaching_call_time: callTime,
          coaching_call_timezone: timezone,
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: enabled 
          ? `Your daily coaching call is set for ${callTime}` 
          : "Coaching calls are now disabled",
      });

      onUpdate?.();
    } catch (error) {
      console.error("Error saving coaching settings:", error);
      toast({
        title: "Error saving settings",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if phone number is saved (matches initial value from DB)
  const isPhoneSaved = initialPhone && initialPhone.length > 0;
  const hasUnsavedChanges = phone !== (initialPhone || "");

  const handleTestCall = async () => {
    if (!isPhoneSaved) {
      toast({
        title: "Save your phone number first",
        description: "Enter your phone number and click 'Save Settings' before testing",
        variant: "destructive",
      });
      return;
    }

    if (hasUnsavedChanges) {
      toast({
        title: "Save changes first",
        description: "Please save your settings before testing the call",
        variant: "destructive",
      });
      return;
    }

    setTestingCall(true);
    try {
      const { data, error } = await supabase.functions.invoke("initiate-coaching-call", {
        body: { user_id: userId },
      });

      if (error) throw error;

      toast({
        title: "Test call initiated!",
        description: "You should receive a call shortly",
      });
    } catch (error) {
      console.error("Error initiating test call:", error);
      toast({
        title: "Failed to initiate call",
        description: "Please check your phone number and try again",
        variant: "destructive",
      });
    } finally {
      setTestingCall(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Voice Coach Settings
        </CardTitle>
        <CardDescription>
          Get a daily AI coaching call to keep you accountable to your vision
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="coaching-enabled">Daily Coaching Calls</Label>
            <p className="text-sm text-muted-foreground">
              Receive a motivating check-in call each day
            </p>
          </div>
          <Switch
            id="coaching-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={14}
          />
          <p className="text-xs text-muted-foreground">
            US phone numbers only. Standard carrier rates may apply.
          </p>
        </div>

        {/* Call Time */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="call-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Preferred Time
            </Label>
            <Input
              id="call-time"
              type="time"
              value={callTime}
              onChange={(e) => setCallTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleTestCall}
            disabled={testingCall || !isPhoneSaved || hasUnsavedChanges}
            className="flex-1"
          >
            {testingCall ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calling...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                {!isPhoneSaved ? "Save phone first" : hasUnsavedChanges ? "Save changes first" : "Test Call Now"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
