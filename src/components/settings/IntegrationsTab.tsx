import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, Eye, EyeOff, Mic2, MessageSquare, FileText } from "lucide-react";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { IntegrationCard } from "./IntegrationCard";
import { TelegramIntegrationCard } from "./TelegramIntegrationCard";
import { ClickUpIntegrationCard } from "./ClickUpIntegrationCard";
import { SocialMediaConnections } from "./SocialMediaConnections";
import type { Json } from "@/integrations/supabase/types";

export function IntegrationsTab() {
  const { integrations, loading, saveIntegration, deleteIntegration, getIntegration } = useUserIntegrations();
  
  // ElevenLabs specific state (keeping existing functionality)
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

  // Generic save/delete handlers for other integrations
  const handleSaveIntegration = async (serviceName: string, apiKey: string, additionalSettings?: Record<string, string>) => {
    return await saveIntegration(serviceName, apiKey, additionalSettings as Json);
  };

  const handleDeleteIntegration = async (serviceName: string) => {
    return await deleteIntegration(serviceName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Productivity & Notifications Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Productivity & Notifications</h3>
          <p className="text-sm text-muted-foreground">Connect your favorite tools for seamless workflow integration</p>
        </div>

        {/* Slack Integration */}
        <IntegrationCard
          name="Slack"
          description="Send reminders and notifications to your Slack workspace"
          icon={MessageSquare}
          isConnected={!!getIntegration("slack")?.api_key}
          onSave={(key, settings) => handleSaveIntegration("slack", key, settings)}
          onDelete={() => handleDeleteIntegration("slack")}
          inputLabel="Bot Token"
          inputPlaceholder="xoxb-your-slack-bot-token..."
          additionalFields={[
            { key: "channel_id", label: "Channel ID", placeholder: "C0123456789" },
          ]}
          helpUrl="https://api.slack.com/apps"
          helpSteps={[
            "Create a new Slack app at api.slack.com/apps",
            "Add Bot Token Scopes: chat:write, channels:read",
            "Install the app to your workspace",
            "Copy the Bot User OAuth Token",
          ]}
          note="Daily reminders and achievement notifications will be sent to your specified Slack channel."
        />

        {/* Notion Integration */}
        <IntegrationCard
          name="Notion"
          description="Sync your journal entries and goals to Notion"
          icon={FileText}
          isConnected={!!getIntegration("notion")?.api_key}
          onSave={(key, settings) => handleSaveIntegration("notion", key, settings)}
          onDelete={() => handleDeleteIntegration("notion")}
          inputLabel="Integration Token"
          inputPlaceholder="secret_your-notion-token..."
          additionalFields={[
            { key: "database_id", label: "Database ID", placeholder: "Your Notion database ID..." },
            { key: "auto_sync_journal", label: "Auto-sync Journal Entries", placeholder: "", isToggle: true },
            { key: "auto_sync_scorecard", label: "Auto-sync Daily Scorecards", placeholder: "", isToggle: true },
          ]}
          helpUrl="https://www.notion.so/my-integrations"
          helpSteps={[
            "Go to notion.so/my-integrations",
            "Create a new integration",
            "Copy the Internal Integration Token",
            "Share your database with the integration",
          ]}
          note="Enable auto-sync to automatically send journal entries and scorecards to Notion when saved."
        />

        {/* Telegram Integration - Enhanced with two-way chat */}
        <TelegramIntegrationCard
          isConnected={!!getIntegration("telegram")?.api_key}
          onSave={(key, settings) => handleSaveIntegration("telegram", key, settings)}
          onDelete={() => handleDeleteIntegration("telegram")}
        />

        {/* ClickUp Integration */}
        <ClickUpIntegrationCard
          isConnected={!!getIntegration("clickup")?.api_key}
          settings={(getIntegration("clickup")?.settings as Record<string, any>) || null}
          onDelete={() => handleDeleteIntegration("clickup")}
        />
      </div>

      {/* Voice & Audio Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Voice & Audio</h3>
          <p className="text-sm text-muted-foreground">Advanced voice features and audio processing</p>
        </div>

        {/* ElevenLabs Integration (keeping existing) */}
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
                  <p className="text-sm font-medium text-muted-foreground">
                    How to get your API key:
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
      </div>

      {/* Social Media Connections Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Social Media</h3>
          <p className="text-sm text-muted-foreground">Connect accounts to share your manifestations with automatic branding</p>
        </div>
        
        <SocialMediaConnections />
      </div>
    </div>
  );
}
