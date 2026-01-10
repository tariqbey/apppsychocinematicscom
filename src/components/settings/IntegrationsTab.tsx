import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, Eye, EyeOff, Mic2 } from "lucide-react";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";

export function IntegrationsTab() {
  const { integrations, loading, saveIntegration, deleteIntegration, getIntegration } = useUserIntegrations();
  
  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const elevenLabsIntegration = getIntegration("elevenlabs");
  const hasElevenLabsKey = !!elevenLabsIntegration?.api_key;

  const handleSaveElevenLabs = async () => {
    if (!elevenLabsKey.trim()) return;
    
    setSaving(true);
    const success = await saveIntegration("elevenlabs", elevenLabsKey.trim());
    if (success) {
      setElevenLabsKey("");
    }
    setSaving(false);
  };

  const handleDeleteElevenLabs = async () => {
    setDeleting(true);
    await deleteIntegration("elevenlabs");
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ElevenLabs Integration */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mic2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">ElevenLabs</CardTitle>
                <CardDescription>Voice cloning and text-to-speech</CardDescription>
              </div>
            </div>
            {hasElevenLabsKey && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasElevenLabsKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">API Key Configured</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your ElevenLabs API key is securely stored
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteElevenLabs}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Your personal ElevenLabs API key will be used for voice changing and TTS features, 
                allowing you to access your cloned voices and custom voice library.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="elevenlabs-key">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="elevenlabs-key"
                      type={showKey ? "text" : "password"}
                      placeholder="Enter your ElevenLabs API key..."
                      value={elevenLabsKey}
                      onChange={(e) => setElevenLabsKey(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    onClick={handleSaveElevenLabs}
                    disabled={saving || !elevenLabsKey.trim()}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">
                  <strong>How to get your API key:</strong>
                </p>
                <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                  <li>Go to your ElevenLabs account settings</li>
                  <li>Navigate to the API section</li>
                  <li>Copy your API key and paste it above</li>
                </ol>
                <a
                  href="https://elevenlabs.io/app/settings/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Get your API key
                </a>
              </div>

              <p className="text-xs text-muted-foreground">
                Adding your own API key allows you to use your personal cloned voices and 
                access your full voice library. Your key is stored securely and only used 
                for voice-related features.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="bg-card border-border border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">More integrations coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
