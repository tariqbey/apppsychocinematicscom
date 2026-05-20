import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Trash2, ExternalLink, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClickUpIntegrationCardProps {
  isConnected: boolean;
  settings: Record<string, any> | null;
  onDelete: () => Promise<boolean>;
}

export function ClickUpIntegrationCard({ isConnected, settings, onDelete }: ClickUpIntegrationCardProps) {
  const [connecting, setConnecting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const { data, error } = await supabase.functions.invoke("clickup-oauth-initiate", {
        body: {
          redirectTo: `${window.location.origin}/settings?tab=integrations&clickup=connected`,
        },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("Missing authorize URL");
      window.location.href = data.url as string;
    } catch (err: any) {
      console.error("ClickUp connect error:", err);
      toast.error(err?.message || "Failed to start ClickUp connection");
      setConnecting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  const teams: Array<{ id: string; name: string }> = Array.isArray(settings?.teams) ? settings!.teams : [];
  const clickupUser = settings?.clickup_user;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListChecks className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">ClickUp</CardTitle>
              <CardDescription>
                Push your daily actions and Director AI tasks into your ClickUp workspace
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
              {clickupUser?.username && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Connected as:</span>{" "}
                  <span className="font-medium">{clickupUser.username}</span>
                  {clickupUser.email && (
                    <span className="text-muted-foreground"> ({clickupUser.email})</span>
                  )}
                </p>
              )}
              {teams.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Workspaces: {teams.map((t) => t.name).join(", ")}
                </p>
              )}
              <div className="pt-2 flex justify-end">
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks created by you or the Director AI can be synced into ClickUp.
            </p>
          </>
        ) : (
          <>
            <Button onClick={handleConnect} disabled={connecting} className="w-full">
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect ClickUp
                </>
              )}
            </Button>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground">What this does:</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Opens ClickUp to authorize Psycho-Cinematics Director's OS</li>
                <li>Stores your secure access token in your account</li>
                <li>Lets the Director AI push action items into your ClickUp tasks</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
