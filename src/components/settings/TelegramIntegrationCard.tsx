import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, Eye, EyeOff, Send, MessageCircle, Zap, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface TelegramIntegrationCardProps {
  isConnected: boolean;
  onSave: (key: string, settings?: Record<string, string>) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}

export function TelegramIntegrationCard({ isConnected, onSave, onDelete }: TelegramIntegrationCardProps) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settingUpWebhook, setSettingUpWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<"unknown" | "configured" | "not_configured">("unknown");
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (isConnected) {
      checkWebhookStatus();
    }
  }, [isConnected]);

  const checkWebhookStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke("telegram-test", {
        body: { action: "status" },
      });

      if (!error && data?.configured) {
        setWebhookStatus("configured");
      } else {
        setWebhookStatus("not_configured");
      }
    } catch (err) {
      console.error("Error checking webhook status:", err);
      setWebhookStatus("unknown");
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Both Bot Token and Chat ID are required");
      return;
    }

    setSaving(true);
    const success = await onSave(botToken.trim(), { chat_id: chatId.trim() });
    if (success) {
      setBotToken("");
      setChatId("");
      // Auto-setup webhook after saving
      setTimeout(() => handleSetupWebhook(), 500);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setWebhookStatus("unknown");
    setDeleting(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-test", {
        body: { action: "test" },
      });

      if (error) {
        toast.error("Test failed: " + error.message);
      } else if (data?.success) {
        toast.success(data.message || "Test message sent!");
      } else {
        toast.error(data?.error || "Failed to send test message");
      }
    } catch (err) {
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const handleSetupWebhook = async () => {
    setSettingUpWebhook(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-test", {
        body: { action: "setup_webhook" },
      });

      if (error) {
        toast.error("Webhook setup failed: " + error.message);
      } else if (data?.success) {
        toast.success("Two-way chat enabled! Message your bot to talk to Director AI.");
        setWebhookStatus("configured");
      } else {
        toast.error(data?.error || "Failed to setup webhook");
      }
    } catch (err) {
      toast.error("Webhook setup failed");
    } finally {
      setSettingUpWebhook(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Telegram</CardTitle>
              <CardDescription>Two-way chat with Director AI via Telegram</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected && webhookStatus === "configured" && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                <MessageCircle className="h-3 w-3 mr-1" />
                2-Way Chat
              </Badge>
            )}
            {isConnected && (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Integration Active</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your Telegram bot is connected to Psycho-Cinematics™
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
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

            {/* Two-Way Chat Status */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Two-Way Communication</span>
                </div>
                {checkingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : webhookStatus === "configured" ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs">Not Setup</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {webhookStatus === "configured" 
                  ? "You can message your bot to chat with Director AI anytime!"
                  : "Enable two-way chat to message Director AI directly through Telegram."
                }
              </p>
              {webhookStatus !== "configured" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetupWebhook}
                  disabled={settingUpWebhook}
                  className="w-full"
                >
                  {settingUpWebhook ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Enable Two-Way Chat
                </Button>
              )}
            </div>

            {/* Test Connection */}
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test Message
            </Button>

            {/* Features Info */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-2">What you'll receive:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Daily motivation and check-ins</li>
                <li>• Task and ritual reminders</li>
                <li>• Achievement celebrations</li>
                <li>• Director of the Month announcements</li>
                <li>• Two-way chat with Director AI</li>
              </ul>
            </div>

            {/* Commands Help */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-medium mb-2">Telegram Commands:</p>
              <div className="text-xs text-muted-foreground space-y-1 font-mono">
                <p>/status - Check your daily progress</p>
                <p>/motivate - Get a motivational boost</p>
                <p>/tasks - Review your Three Things</p>
                <p>/help - Show all commands</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bot Token Input */}
            <div className="space-y-2">
              <Label>Bot Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Chat ID Input */}
            <div className="space-y-2">
              <Label>Chat ID</Label>
              <Input
                type="text"
                placeholder="Your Telegram chat ID..."
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleSave}
              disabled={saving || !botToken.trim() || !chatId.trim()}
              className="w-full"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Connect Telegram"
              )}
            </Button>

            {/* Help Section */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground">How to set up:</p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>Message @BotFather on Telegram</li>
                <li>Send /newbot and follow the prompts</li>
                <li>Copy the bot token provided</li>
                <li>Start a chat with your bot</li>
                <li>Get your chat ID from @userinfobot</li>
              </ol>
              <a
                href="https://core.telegram.org/bots#creating-a-new-bot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" />
                Telegram Bot Guide
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Once connected, you'll receive motivational messages, reminders, and can chat directly with Director AI!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
